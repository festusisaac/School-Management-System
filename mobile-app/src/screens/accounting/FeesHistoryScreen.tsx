import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccountingLayout from '../../components/AccountingLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSectionStore } from '../../store/sectionStore';
import { database } from '../../database';
import FeeRecord from '../../database/models/FeeRecord';
import Student from '../../database/models/Student';
import { performGlobalSync } from '../../hooks/useAutoSync';

const PAYMENT_TYPES = ['payment', 'payment_received', 'FEE_PAYMENT', 'WAIVER'];

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  money: '#16a34a',
};

interface Tx {
  id: string;
  amount: string | number;
  paymentMethod?: string;
  reference?: string;
  receiptNumber?: string;
  createdAt: string;
  type?: string;
  student?: { firstName?: string; lastName?: string; admissionNo?: string };
}

export default function FeesHistoryScreen() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const activeSectionId = useSectionStore((s) => s.activeSectionId);
  const token = user?.token || '';
  const currency = settings?.currencySymbol || '₦';
  const money = (n: any) => `${currency}${Number(n || 0).toLocaleString()}`;

  const [txns, setTxns] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Tx | null>(null);

  // Offline-first: read payments and student names from the local database.
  const load = useCallback(async () => {
    try {
      const [records, students] = await Promise.all([
        database.collections.get<FeeRecord>('fee_records').query().fetch(),
        database.collections.get<Student>('students').query().fetch(),
      ]);
      const studentMap = new Map(students.map((s) => [s.id, s]));

      const list: Tx[] = records
        .filter((r) => PAYMENT_TYPES.includes(r.type) && (!activeSectionId || r.schoolSectionId === activeSectionId))
        .map((r) => {
          const s = studentMap.get(r.studentId || '');
          return {
            id: r.id,
            amount: r.amount,
            paymentMethod: r.paymentMethod,
            reference: r.reference,
            createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
            type: r.type,
            student: s ? { firstName: s.firstName, lastName: s.lastName, admissionNo: s.admissionNo } : undefined,
          };
        });

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTxns(list);
    } catch (e) {
      console.error('Failed to load payments', e);
    } finally {
      setLoading(false);
    }
  }, [activeSectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await performGlobalSync().catch(() => {}); // pull latest when online, then re-read
    await load();
    setRefreshing(false);
  }, [load]);

  const name = (t: Tx) => `${t.student?.firstName || ''} ${t.student?.lastName || ''}`.trim() || 'Unknown';

  const filtered = txns.filter((t) => {
    const q = search.toLowerCase();
    return (
      name(t).toLowerCase().includes(q) ||
      (t.student?.admissionNo || '').toLowerCase().includes(q) ||
      (t.reference || t.receiptNumber || '').toLowerCase().includes(q)
    );
  });

  const fmtDateTime = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: Tx }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => setSelected(item)}>
      <View style={styles.avatar}>
        <Ionicons name="receipt" size={20} color={COLORS.money} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>{name(item)}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {(item.student?.admissionNo || '—')} • {fmtDateTime(item.createdAt)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.cardAmount}>{money(item.amount)}</Text>
        <Text style={styles.cardMethod}>{(item.paymentMethod || '').replace(/_/g, ' ')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <AccountingLayout activeTab="Payments">
      <View style={styles.container}>
        <Text style={styles.title}>Fees History</Text>
        <Text style={styles.subtitle}>Recorded payments & receipts</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, adm. no or reference..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>{search ? 'No matching payments.' : 'No payments recorded yet.'}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          />
        )}
      </View>

      {/* Receipt detail */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalRoot}>
          <View style={styles.receipt}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptIcon}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.money} />
              </View>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.receiptAmount}>{money(selected?.amount)}</Text>
            <Text style={styles.receiptLabel}>Payment received</Text>

            <View style={styles.receiptRows}>
              <RRow label="Student" value={selected ? name(selected) : ''} />
              <RRow label="Admission No" value={selected?.student?.admissionNo || '—'} />
              <RRow label="Method" value={(selected?.paymentMethod || '—').replace(/_/g, ' ')} />
              <RRow label="Reference" value={selected?.reference || selected?.receiptNumber || '—'} />
              <RRow label="Date" value={selected ? fmtDateTime(selected.createdAt) : ''} last />
            </View>
          </View>
        </View>
      </Modal>
    </AccountingLayout>
  );
}

function RRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.rRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rLabel}>{label}</Text>
      <Text style={styles.rValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.onSurface, padding: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: '800', color: COLORS.money },
  cardMethod: { fontSize: 10, color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 8,
    gap: 10,
  },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },

  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  receipt: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  receiptAmount: { fontSize: 32, fontWeight: '900', color: COLORS.onSurface, marginTop: 12 },
  receiptLabel: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  receiptRows: { marginTop: 8 },
  rRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rLabel: { fontSize: 13, color: '#64748b' },
  rValue: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, maxWidth: '60%', textAlign: 'right' },
});
