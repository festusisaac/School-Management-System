import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { performGlobalSync } from '../../hooks/useAutoSync';
import { syncData } from '../../database/sync';
import AdminLayout from '../../components/AdminLayout';
import { database } from '../../database';
import FeeRecord from '../../database/models/FeeRecord';
import Student from '../../database/models/Student';
import { Q } from '@nozbe/watermelondb';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#f4f6f9',
  card: '#ffffff',
  border: '#e4e7eb',
  borderFocus: '#055db6',
  primary: '#031632',
  primaryLight: '#1a2b48',
  accent: '#055db6',
  accentLight: '#e8f0fd',
  accentText: '#003670',
  success: '#16a34a',
  successLight: '#dcfce7',
  successText: '#166534',
  warning: '#d97706',
  warningLight: '#fef3c7',
  warningText: '#92400e',
  error: '#dc2626',
  errorLight: '#fee2e2',
  errorText: '#991b1b',
  text: '#111827',
  textSub: '#6b7280',
  textMuted: '#9ca3af',
  outline: '#d1d5db',
};

const T = {
  h1: { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.text },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.text },
  h3: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.textSub, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  small: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub },
  money: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
};

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash', icon: 'cash-outline' as const },
  { key: 'BANK_TRANSFER', label: 'Transfer', icon: 'swap-horizontal-outline' as const },
  { key: 'POS', label: 'POS', icon: 'card-outline' as const },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeHead {
  id: string;          // The charge record's ID (fee assignment ID)
  feeGroupId: string;
  name: string;        // from meta or fallback
  totalDue: number;    // original charge amount
  alreadyPaid: number; // sum of payments already made for this head
  outstanding: number; // totalDue - alreadyPaid
  payingNow: string;   // user-typed amount for this head
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function searchStudentsLocal(query: string): Promise<any[]> {
  const db = database.collections.get<Student>('students');
  const pat = Q.sanitizeLikeString(query);
  return db.query(
    Q.take(10),
    Q.or(
      Q.where('first_name', Q.like(`%${pat}%`)),
      Q.where('last_name', Q.like(`%${pat}%`)),
      Q.where('admission_no', Q.like(`%${pat}%`))
    )
  ).fetch();
}

/**
 * Loads fee heads for a student from local WatermelonDB.
 * "charge" records = synthetic fee assignments pushed from backend.
 * "FEE_PAYMENT" records = actual payments to subtract.
 */
async function loadStudentFeeHeads(studentId: string, sessionId?: string | null): Promise<FeeHead[]> {
  const col = database.collections.get<FeeRecord>('fee_records');

  // 1. All charge (assignment) records for this student in the current session
  const chargeQueries: Q.Clause[] = [
    Q.where('student_id', studentId),
    Q.where('type', 'charge'),
  ];
  if (sessionId) {
    // WatermelonDB may store null session_id as '' (empty string) for text fields received via sync,
    // even when the schema column is isOptional: true. Match both null and '' to be safe.
    chargeQueries.push(
      Q.or(
        Q.where('session_id', sessionId),
        Q.where('session_id', null),
        Q.where('session_id', '')
      )
    );
  }

  const charges = await col.query(...chargeQueries).fetch();



  console.log(`[RecordFee] charges in local DB for ${studentId} (sessionId=${sessionId}):`, charges.length);
  charges.forEach(c => {
    let m: any = {};
    try { m = JSON.parse(c.meta || '{}'); } catch {}
    console.log(`[RecordFee]   charge id=${c.id} amount=${c.amount} isFeeHead=${m?.isFeeHead} name=${m?.name}`);
  });

  if (charges.length === 0) {
    console.log('[RecordFee] No charge records found in local DB — did sync complete?');
    return [];
  }

  // 2. All payment records for this student in the current session
  const paymentQueries: Q.Clause[] = [
    Q.where('student_id', studentId),
    Q.where('type', 'FEE_PAYMENT'),
  ];
  if (sessionId) paymentQueries.push(Q.where('session_id', sessionId));

  const payments = await col.query(...paymentQueries).fetch();
  console.log(`[RecordFee] payments in local DB for ${studentId}:`, payments.length);

  // 2b. Carry-forward records — these resolve outstanding for the current session
  //     (the fee was deferred to next term, so it should not show as outstanding here)
  const cfQueries: Q.Clause[] = [
    Q.where('student_id', studentId),
    Q.where('type', 'CARRY_FORWARD'),
  ];
  if (sessionId) cfQueries.push(Q.where('session_id', sessionId));
  const carryForwards = await col.query(...cfQueries).fetch();
  console.log(`[RecordFee] carry-forwards in local DB for ${studentId}:`, carryForwards.length);

  // 3. Build a map of amount already paid per fee-head ID.
  //    Payments store their allocations as JSON in the meta field.
  const paidByHeadId: Record<string, number> = {};
  for (const p of payments) {
    let meta: any = {};
    if (p.meta) {
      try { meta = JSON.parse(p.meta); } catch { /* ignore */ }
    }
    const allocs = meta?.allocations || [];
    if (Array.isArray(allocs) && allocs.length > 0) {
      for (const alloc of allocs) {
        if (alloc.id) {
          paidByHeadId[alloc.id] = (paidByHeadId[alloc.id] || 0) + parseFloat(alloc.amount || '0');
        }
      }
    }
  }
  console.log('[RecordFee] paidByHeadId:', JSON.stringify(paidByHeadId));

  // 4. Build final fee head list — keep ONE charge record per feeHeadId.
  //    The sync sends ALL active fee assignments for the tenant (across sessions),
  //    so a student may have two charge records for the same fee head:
  //    one from a legacy assignment (sessionId=null) and one from the current session.
  //    Summing them causes the 2× outstanding bug.
  //    Strategy: prefer the session-scoped record; fall back to the null-session one.
  const withFeeHeadFlag = charges.filter(charge => {
    let metaObj: any = {};
    if (charge.meta) { try { metaObj = JSON.parse(charge.meta); } catch {} }
    const passes = metaObj?.isFeeHead === true;
    if (!passes) console.log(`[RecordFee]   FILTERED OUT (no isFeeHead): id=${charge.id}`);
    return passes;
  });
  console.log(`[RecordFee] charges after isFeeHead filter: ${withFeeHeadFlag.length}`);

  // Deduplicate: one record per feeHeadId, preferring session-scoped records.
  const bestChargeByHeadId: Record<string, any> = {};
  withFeeHeadFlag.forEach(charge => {
    let metaObj: any = {};
    if (charge.meta) { try { metaObj = JSON.parse(charge.meta); } catch {} }
    const realFeeHeadId = metaObj?.feeHeadId || charge.id;
    const hasSession = !!charge.sessionId;

    const existing = bestChargeByHeadId[realFeeHeadId];
    if (!existing) {
      bestChargeByHeadId[realFeeHeadId] = charge;
    } else {
      const existingHasSession = !!existing.sessionId;
      // Prefer session-scoped over null-session; if both same, keep the later updatedAt
      if (hasSession && !existingHasSession) {
        bestChargeByHeadId[realFeeHeadId] = charge;
      } else if (hasSession === existingHasSession) {
        const existingTime = new Date(existing.updatedAt || 0).getTime();
        const chargeTime = new Date(charge.updatedAt || 0).getTime();
        if (chargeTime >= existingTime) bestChargeByHeadId[realFeeHeadId] = charge;
      }
    }
  });

  const chargesMap: Record<string, FeeHead> = {};
  Object.values(bestChargeByHeadId).forEach(charge => {
    const amountDue = Number(charge.amount) || 0;
    let metaObj: any = {};
    if (charge.meta) { try { metaObj = JSON.parse(charge.meta); } catch {} }
    const name = metaObj?.name || metaObj?.feeGroupName || charge.feeGroupId || 'Fee';
    const realFeeHeadId = metaObj?.feeHeadId || charge.id;
    const feeGroupId = charge.feeGroupId || '';

    chargesMap[realFeeHeadId] = {
      id: realFeeHeadId,
      feeGroupId,
      name,
      totalDue: amountDue,
      alreadyPaid: 0,
      outstanding: 0,
      payingNow: ''
    };
  });

  // 3b. Build a map of carry-forwarded amount per fee-head ID.
  //     A carry-forward record signals that this fee head's outstanding was
  //     deferred to the next term — treat it as fully resolved for this session.
  const carryForwardByHeadId: Record<string, number> = {};
  for (const cf of carryForwards) {
    let cfMeta: any = {};
    if (cf.meta) { try { cfMeta = JSON.parse(cf.meta); } catch {} }
    const headId = cfMeta?.feeHeadId;
    if (headId) {
      carryForwardByHeadId[headId] = (carryForwardByHeadId[headId] || 0) + Number(cf.amount || 0);
    } else {
      // No specific head — mark whole student's session as cleared (generic CF)
      // We'll handle this below by zeroing all heads if a blanket CF exists
    }
  }
  const hasBlankCF = carryForwards.some(cf => {
    let cfMeta: any = {};
    if (cf.meta) { try { cfMeta = JSON.parse(cf.meta); } catch {} }
    return !cfMeta?.feeHeadId;
  });
  console.log('[RecordFee] carryForwardByHeadId:', JSON.stringify(carryForwardByHeadId), 'hasBlankCF:', hasBlankCF);

  // Apply payments + carry-forwards and calculate outstanding
  const result = Object.values(chargesMap).map(h => {
    const alreadyPaid = paidByHeadId[h.id] || 0;
    const carriedForward = carryForwardByHeadId[h.id] || 0;
    // If a blanket (no-head) carry-forward exists, treat the whole session as cleared
    const effectivePaid = hasBlankCF ? h.totalDue : alreadyPaid + carriedForward;
    const outstanding = Math.max(0, h.totalDue - effectivePaid);
    console.log(`[RecordFee]   head=${h.name} totalDue=${h.totalDue} alreadyPaid=${alreadyPaid} carriedForward=${carriedForward} outstanding=${outstanding}`);
    return { ...h, alreadyPaid, outstanding };
  }).filter(h => h.outstanding > 0);

  console.log(`[RecordFee] Final fee heads with outstanding > 0: ${result.length}`);
  return result;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecordFeeScreen({ onBack }: { onBack?: () => void }) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();

  // Step 1 – Student search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Step 2 – Fee heads
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(false);

  // Step 3 – Payment details
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Student search effect ──
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      setSearchResults(await searchStudentsLocal(searchQuery));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Load fee heads when student selected ──
  const handleSelectStudent = useCallback(async (student: any) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setSearchResults([]);
    setFeeHeads([]);
    setReference('');
    setNote('');
    setLoadingHeads(true);
    // Force a FULL re-sync so carry-forward records and new fee heads are always pulled fresh.
    // We clear the first_sync_complete flag so WatermelonDB does a pull-all instead of
    // incremental — this ensures carry-forward records missed by previous syncs are inserted.
    try {
      const tenantId = user?.tenantId;
      if (tenantId) {
        await AsyncStorage.removeItem(`first_sync_complete_${tenantId}`);
      }
      await syncData();
    } catch (e) { console.warn('[RecordFee] Sync before load failed:', e); }
    const heads = await loadStudentFeeHeads(student.id, settings.currentSessionId);
    setFeeHeads(heads);
    setLoadingHeads(false);
  }, [user?.tenantId, settings.currentSessionId]);

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setFeeHeads([]);
    setReference('');
    setNote('');
  };

  // ── Per-head amount change ──
  const updateHeadAmount = (id: string, value: string) => {
    setFeeHeads(prev => prev.map(h => {
      if (h.id !== id) return h;
      // Cap at outstanding
      const num = parseFloat(value || '0');
      const capped = isNaN(num) ? value : (num > h.outstanding ? h.outstanding.toFixed(2) : value);
      return { ...h, payingNow: capped.toString() };
    }));
  };

  const fillHead = (id: string) => {
    setFeeHeads(prev => prev.map(h =>
      h.id === id ? { ...h, payingNow: h.outstanding.toFixed(2) } : h
    ));
  };

  const fillAll = () => {
    setFeeHeads(prev => prev.map(h => ({ ...h, payingNow: h.outstanding.toFixed(2) })));
  };

  const clearAll = () => {
    setFeeHeads(prev => prev.map(h => ({ ...h, payingNow: '' })));
  };

  // ── Derived totals ──
  const totalOutstanding = feeHeads.reduce((s, h) => s + h.outstanding, 0);
  const totalPayingNow = feeHeads.reduce((s, h) => s + (parseFloat(h.payingNow || '0') || 0), 0);
  const hasAnyPayment = totalPayingNow > 0;

  // ── Submit ──
  const handleSubmit = async () => {
    if (!selectedStudent) return Alert.alert('Error', 'Please select a student.');
    if (!hasAnyPayment) return Alert.alert('Error', 'Please enter an amount for at least one fee head.');
    if (!user?.tenantId) return Alert.alert('Error', 'Missing tenant info.');

    // Build allocations
    const allocations = feeHeads
      .filter(h => parseFloat(h.payingNow || '0') > 0)
      .map(h => {
        const amount = parseFloat(h.payingNow);
        const totalDue = h.outstanding;
        const balance = Math.max(0, totalDue - amount);
        return {
          id: h.id,
          name: h.name,
          amount: amount.toFixed(2),
          totalDue: totalDue.toFixed(2),
          balance: balance.toFixed(2),
          status: amount >= totalDue ? 'PAID' : 'PARTIAL',
        };
      });

    const metaPayload = JSON.stringify({
      allocations,
      ...(note ? { note } : {}),
    });

    setSubmitting(true);
    try {
      await database.write(async () => {
        await database.collections.get<FeeRecord>('fee_records').create(record => {
          record.tenantId = user.tenantId;
          record.studentId = selectedStudent.id;
          record.amount = totalPayingNow;
          record.type = 'FEE_PAYMENT';
          record.paymentMethod = paymentMethod;
          record.reference = reference || undefined;
          record.meta = metaPayload;
          record.sessionId = settings.currentSessionId || undefined;
        });
      });

      performGlobalSync();

      Alert.alert(
        'Payment Recorded ✅',
        `₦${totalPayingNow.toLocaleString()} recorded for ${selectedStudent.firstName} ${selectedStudent.lastName}.\n\n${allocations.length} fee head(s) allocated.`,
        [
          { text: 'Record Another', onPress: handleClearStudent },
          { text: 'Done', onPress: onBack },
        ]
      );
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Could not record payment locally.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout activeTab="Finance">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={s.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={s.backBtn}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={s.headerTitle}>Record Fee Payment</Text>
            <Text style={s.headerSub}>Offline · Syncs automatically</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: C.bg }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Student ── */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.headIcon, { backgroundColor: C.accentLight }]}>
                <Ionicons name="person-outline" size={16} color={C.accent} />
              </View>
              <Text style={s.cardTitle}>Student</Text>
            </View>

            {selectedStudent ? (
              <View style={s.studentRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{selectedStudent.firstName} {selectedStudent.lastName}</Text>
                  <Text style={s.studentSub}>{selectedStudent.admissionNo}</Text>
                </View>
                <TouchableOpacity onPress={handleClearStudent} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={22} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.searchWrap}>
                <View style={s.searchBar}>
                  <Ionicons name="search" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search by name or admission no…"
                    placeholderTextColor={C.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  {searching && <ActivityIndicator size="small" color={C.accent} />}
                </View>

                {searchResults.length > 0 && (
                  <View style={s.dropdown}>
                    {searchResults.map(st => (
                      <TouchableOpacity
                        key={st.id}
                        style={s.dropdownRow}
                        onPress={() => handleSelectStudent(st)}
                      >
                        <View style={s.dropdownAvatar}>
                          <Text style={s.dropdownAvatarText}>{st.firstName?.[0]}{st.lastName?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.dropdownName}>{st.firstName} {st.lastName}</Text>
                          <Text style={s.dropdownSub}>{st.admissionNo}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={C.outline} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Step 2: Fee Heads ── */}
          {selectedStudent && (
            <View style={s.card}>
              <View style={[s.cardHead, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[s.headIcon, { backgroundColor: '#fef9c3' }]}>
                    <Ionicons name="list-outline" size={16} color="#b45309" />
                  </View>
                  <Text style={s.cardTitle}>Fee Heads</Text>
                </View>
                {feeHeads.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={fillAll} style={s.chipBtn}>
                      <Text style={s.chipBtnText}>Pay All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearAll} style={[s.chipBtn, { backgroundColor: C.border }]}>
                      <Text style={[s.chipBtnText, { color: C.textSub }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {loadingHeads ? (
                <View style={s.loadingRow}>
                  <ActivityIndicator color={C.accent} />
                  <Text style={s.loadingText}>Loading fee structure…</Text>
                </View>
              ) : feeHeads.length === 0 ? (
                <View style={s.emptyRow}>
                  <Ionicons name="checkmark-circle-outline" size={32} color={C.success} />
                  <Text style={s.emptyTitle}>No Outstanding Fees</Text>
                  <Text style={s.emptySub}>This student has no outstanding balance in the current session.</Text>
                </View>
              ) : (
                <View style={s.headsContainer}>
                  {feeHeads.map((head, idx) => {
                    const paying = parseFloat(head.payingNow || '0') || 0;
                    const isPartial = paying > 0 && paying < head.outstanding;
                    const isPaid = paying >= head.outstanding;
                    return (
                      <View key={head.id} style={[s.headRow, idx < feeHeads.length - 1 && s.headRowBorder]}>
                        {/* Head info */}
                        <View style={s.headInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <View style={[
                              s.statusDot,
                              { backgroundColor: isPaid ? C.success : isPartial ? C.warning : C.outline }
                            ]} />
                            <Text style={s.headName} numberOfLines={1}>{head.name}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Text style={s.headMeta}>Due: <Text style={{ color: C.text, fontFamily: 'Inter_600SemiBold' }}>₦{head.outstanding.toLocaleString()}</Text></Text>
                            {head.alreadyPaid > 0 && (
                              <Text style={s.headMeta}>Paid: <Text style={{ color: C.success }}>₦{head.alreadyPaid.toLocaleString()}</Text></Text>
                            )}
                          </View>
                        </View>

                        {/* Amount input */}
                        <View style={s.headInputWrap}>
                          <Text style={s.currencyPfx}>₦</Text>
                          <TextInput
                            style={s.headInput}
                            placeholder="0"
                            placeholderTextColor={C.textMuted}
                            keyboardType="decimal-pad"
                            value={head.payingNow}
                            onChangeText={v => updateHeadAmount(head.id, v)}
                          />
                          <TouchableOpacity onPress={() => fillHead(head.id)} style={s.fillBtn}>
                            <Text style={s.fillBtnText}>Max</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Status badge */}
                        {paying > 0 && (
                          <View style={[
                            s.badge,
                            isPaid
                              ? { backgroundColor: C.successLight }
                              : { backgroundColor: C.warningLight }
                          ]}>
                            <Text style={[
                              s.badgeText,
                              { color: isPaid ? C.successText : C.warningText }
                            ]}>
                              {isPaid ? 'PAID' : 'PARTIAL'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Summary Row */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryItem}>
                      <Text style={s.summaryLabel}>Total Outstanding</Text>
                      <Text style={[s.summaryValue, { color: C.error }]}>₦{totalOutstanding.toLocaleString()}</Text>
                    </View>
                    <View style={[s.summaryItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
                      <Text style={s.summaryLabel}>Paying Now</Text>
                      <Text style={[s.summaryValue, { color: hasAnyPayment ? C.success : C.textMuted }]}>
                        ₦{totalPayingNow.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[s.summaryItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
                      <Text style={s.summaryLabel}>Remaining</Text>
                      <Text style={[s.summaryValue, { color: C.warning }]}>
                        ₦{Math.max(0, totalOutstanding - totalPayingNow).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ── Step 3: Payment Details ── */}
          {selectedStudent && feeHeads.length > 0 && (
            <View style={s.card}>
              <View style={s.cardHead}>
                <View style={[s.headIcon, { backgroundColor: C.accentLight }]}>
                  <Ionicons name="cash-outline" size={16} color={C.accent} />
                </View>
                <Text style={s.cardTitle}>Payment Details</Text>
              </View>

              <View style={s.formBody}>
                {/* Payment Method */}
                <Text style={s.fieldLabel}>Payment Method *</Text>
                <View style={s.methodRow}>
                  {PAYMENT_METHODS.map(m => (
                    <TouchableOpacity
                      key={m.key}
                      style={[s.methodChip, paymentMethod === m.key && s.methodChipActive]}
                      onPress={() => setPaymentMethod(m.key)}
                    >
                      <Ionicons
                        name={m.icon}
                        size={15}
                        color={paymentMethod === m.key ? '#fff' : C.textSub}
                      />
                      <Text style={[s.methodChipText, paymentMethod === m.key && s.methodChipTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reference */}
                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Reference / Receipt No.</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="document-text-outline" size={16} color={C.textMuted} style={{ marginHorizontal: 12 }} />
                  <TextInput
                    style={s.input}
                    placeholder="e.g. Teller / Bank ref number"
                    placeholderTextColor={C.textMuted}
                    value={reference}
                    onChangeText={setReference}
                  />
                </View>

                {/* Note */}
                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Internal Note</Text>
                <TextInput
                  style={s.textArea}
                  placeholder="Optional note…"
                  placeholderTextColor={C.textMuted}
                  multiline
                  numberOfLines={3}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </View>
          )}

          {/* ── Submit ── */}
          {selectedStudent && hasAnyPayment && (
            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={s.submitText}>
                    Confirm ₦{totalPayingNow.toLocaleString()} Payment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...T.h2, fontSize: 18 },
  headerSub: { ...T.small, marginTop: 1 },

  scroll: { padding: 16, gap: 12, paddingBottom: 60 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: '#fafbfc',
  },
  headIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { ...T.h3 },

  // Student
  studentRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.accent },
  studentName: { ...T.h3, fontSize: 15 },
  studentSub: { ...T.small, marginTop: 2 },
  clearBtn: { padding: 4 },

  // Search
  searchWrap: { padding: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text },
  dropdown: {
    marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  dropdownAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  dropdownAvatarText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.textSub },
  dropdownName: { ...T.h3, fontSize: 14 },
  dropdownSub: { ...T.small },

  // Fee heads
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: C.accentLight,
  },
  chipBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.accentText },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 24, justifyContent: 'center' },
  loadingText: { ...T.small },
  emptyRow: { alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle: { ...T.h3, color: C.success },
  emptySub: { ...T.small, textAlign: 'center' },
  headsContainer: { gap: 0 },
  headRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headRowBorder: { borderBottomWidth: 1, borderBottomColor: C.bg },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headInfo: { flex: 1, minWidth: 120 },
  headName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
  headMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textSub },
  headInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    height: 40, overflow: 'hidden', minWidth: 130,
  },
  currencyPfx: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.textSub, marginLeft: 10 },
  headInput: {
    flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, color: C.text,
    paddingHorizontal: 6, paddingVertical: 0,
  },
  fillBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: C.accentLight, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center',
  },
  fillBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: C.accentText },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: '#fafbfc',
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  summaryLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 2 },

  // Payment details form
  formBody: { padding: 16, gap: 4 },
  fieldLabel: { ...T.label, marginBottom: 8 },
  methodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  methodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card,
  },
  methodChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  methodChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.textSub },
  methodChipTextActive: { color: '#fff' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, height: 48,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, paddingRight: 12 },
  textArea: {
    backgroundColor: C.bg, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    padding: 12, fontFamily: 'Inter_400Regular', fontSize: 14,
    color: C.text, height: 90, textAlignVertical: 'top',
    marginTop: 4,
  },

  // Submit
  submitBtn: {
    backgroundColor: C.primary, borderRadius: 16, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    elevation: 4,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  submitText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
