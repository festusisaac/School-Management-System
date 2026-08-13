import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import DateTimeField from '../../components/DateTimeField';
import { useAuthStore } from '../../store/authStore';
import { apiGet, apiPostForm } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  error: '#ba1a1a',
  success: '#16a34a',
  warning: '#d97706',
};

interface LeaveType {
  id: string;
  name: string;
  maxDaysPerYear: number;
  requiresDocument: boolean;
}

interface LeaveRequest {
  id: string;
  leaveType?: { name: string };
  startDate: string;
  endDate: string;
  numberOfDays: number;
  status: string;
  reason: string;
}

interface Balance {
  totalAvailable: number;
  details: { leaveType: string; available: number; maxDays: number }[];
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmt(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'approved') return { color: COLORS.success, bg: '#dcfce7' };
  if (s === 'rejected') return { color: COLORS.error, bg: '#fee2e2' };
  return { color: COLORS.warning, bg: '#fef3c7' };
}

export default function ApplyLeaveScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';

  const [types, setTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [typeId, setTypeId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [t, r, b] = await Promise.all([
        apiGet('/hr/leaves/types', token).catch(() => []),
        apiGet('/hr/leaves/my-requests', token).catch(() => []),
        apiGet('/hr/leaves/balance', token).catch(() => null),
      ]);
      setTypes(Array.isArray(t) ? t : []);
      setRequests(Array.isArray(r) ? r : []);
      setBalance(b || null);
    } catch (e) {
      console.error('Failed to load leave data', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const selectedType = types.find((t) => t.id === typeId);
  // Inclusive whole-day count. Normalize to midnight so a same-day pick = 1 day
  // (the date picker can carry a time-of-day, which would otherwise skew the math).
  const days = (() => {
    if (!startDate || !endDate) return 0;
    const a = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const b = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (b.getTime() < a.getTime()) return 0;
    return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  })();
  const requiresDoc = !!selectedType?.requiresDocument;

  const handleSubmit = async () => {
    if (!typeId) return Alert.alert('Missing category', 'Please select a leave category.');
    if (!startDate) return Alert.alert('Missing date', 'Please pick a start date.');
    if (!endDate) return Alert.alert('Missing date', 'Please pick an end date.');
    if (endDate.getTime() < startDate.getTime())
      return Alert.alert('Invalid dates', 'End date must be on or after the start date.');
    if (!reason.trim()) return Alert.alert('Missing reason', 'Please enter a reason for your leave.');
    if (requiresDoc)
      return Alert.alert(
        'Document required',
        'This leave category requires a supporting document. Please apply for this type on the website.'
      );

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('leaveTypeId', typeId);
      form.append('startDate', toYMD(startDate));
      form.append('endDate', toYMD(endDate));
      form.append('reason', reason.trim());
      await apiPostForm('/hr/leaves/apply', token, form);
      Alert.alert('Submitted', 'Your leave application was submitted.');
      setTypeId('');
      setStartDate(null);
      setEndDate(null);
      setReason('');
      await fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: DropdownOption[] = types.map((t) => ({
    label: `${t.name} (max ${t.maxDaysPerYear} days)`,
    value: t.id,
  }));

  return (
    <TeacherLayout>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          <Text style={styles.title}>Apply for Leave</Text>
          <Text style={styles.subtitle}>Submit and track your leave applications</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Balance */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Leave Balance</Text>
                <Text style={styles.balanceValue}>{balance?.totalAvailable ?? 0} days available</Text>
                {balance?.details && balance.details.length > 0 && (
                  <View style={styles.chipRow}>
                    {balance.details.map((d) => (
                      <View key={d.leaveType} style={styles.chip}>
                        <Text style={styles.chipText}>
                          {d.leaveType}: <Text style={{ color: COLORS.secondary }}>{d.available}</Text>/{d.maxDays}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Form */}
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>New Application</Text>
                <Dropdown
                  label="Leave Category"
                  placeholder="Select category"
                  value={typeId}
                  options={typeOptions}
                  onChange={setTypeId}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <DateTimeField
                      label="Start Date"
                      mode="date"
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Start"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DateTimeField
                      label="End Date"
                      mode="date"
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="End"
                      minimumDate={startDate || undefined}
                    />
                  </View>
                </View>

                {days > 0 && (
                  <View style={styles.daysBadge}>
                    <Ionicons name="time-outline" size={14} color={COLORS.secondary} />
                    <Text style={styles.daysText}>Total: {days} day{days === 1 ? '' : 's'}</Text>
                  </View>
                )}

                {requiresDoc && (
                  <View style={styles.docWarning}>
                    <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.docWarningText}>
                      This category requires a supporting document — please apply for it on the website.
                    </Text>
                  </View>
                )}

                <Text style={styles.fieldLabel}>Reason</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Briefly explain your reason..."
                  placeholderTextColor="#94a3b8"
                  multiline
                />

                <TouchableOpacity
                  style={[styles.submitBtn, (submitting || requiresDoc) && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={submitting || requiresDoc}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="send" size={16} color="#fff" />
                  )}
                  <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Application'}</Text>
                </TouchableOpacity>
              </View>

              {/* History */}
              <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>Application History</Text>
              {requests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="documents-outline" size={40} color="#94a3b8" />
                  <Text style={styles.emptyText}>No applications yet.</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {requests.map((req) => {
                    const sc = statusColor(req.status);
                    return (
                      <View key={req.id} style={styles.reqCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reqType}>{req.leaveType?.name || 'Leave'}</Text>
                          <Text style={styles.reqDates}>
                            {fmt(req.startDate)} → {fmt(req.endDate)} • {req.numberOfDays} day{req.numberOfDays === 1 ? '' : 's'}
                          </Text>
                        </View>
                        <Text style={[styles.reqStatus, { color: sc.color, backgroundColor: sc.bg }]}>
                          {req.status}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: '#8293b5', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#e2e8f0' },
  formCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, marginBottom: 12 },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  daysText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  docWarning: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  docWarningText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 17 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reqType: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  reqDates: { fontSize: 12, color: '#64748b', marginTop: 2 },
  reqStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
