import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AccountingLayout from '../../components/AccountingLayout';
import { useSettingsStore } from '../../store/settingsStore';
import { useSectionStore } from '../../store/sectionStore';
import { database } from '../../database';
import FeeRecord from '../../database/models/FeeRecord';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  primary: '#031632',
  secondary: '#055db6',
  money: '#16a34a',
};

const PAYMENT_TYPES = ['payment', 'payment_received', 'FEE_PAYMENT', 'WAIVER'];
type Period = 'today' | 'week' | 'month' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

function periodStart(period: Period): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'today') return d.getTime();
  if (period === 'week') {
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d.getTime();
  }
  if (period === 'month') {
    d.setDate(1);
    return d.getTime();
  }
  return 0;
}

export default function CollectionSummaryScreen() {
  const { settings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const currency = settings?.currencySymbol || '₦';
  const money = (n: number) => `${currency}${(n || 0).toLocaleString()}`;

  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('today');

  const activeSectionId = useSectionStore((s) => s.activeSectionId);

  const load = useCallback(async () => {
    try {
      const all = await database.collections.get<FeeRecord>('fee_records').query().fetch();
      setRecords(
        all.filter((r) => PAYMENT_TYPES.includes(r.type) && (!activeSectionId || r.schoolSectionId === activeSectionId))
      );
    } catch (e) {
      console.error('Failed to load fee records', e);
    } finally {
      setLoading(false);
    }
  }, [activeSectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const start = periodStart(period);
  const inPeriod = records.filter((r) => {
    const t = (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).getTime();
    return t >= start;
  });
  const total = inPeriod.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const byMethod = inPeriod.reduce((acc: Record<string, { amount: number; count: number }>, r) => {
    const m = (r.paymentMethod || 'OTHER').toUpperCase();
    if (!acc[m]) acc[m] = { amount: 0, count: 0 };
    acc[m].amount += Number(r.amount) || 0;
    acc[m].count += 1;
    return acc;
  }, {});
  const methods = Object.entries(byMethod).sort((a, b) => b[1].amount - a[1].amount);

  const methodIcon = (m: string): any => {
    if (m.includes('CASH')) return 'cash-outline';
    if (m.includes('POS') || m.includes('CARD')) return 'card-outline';
    if (m.includes('TRANSFER') || m.includes('BANK')) return 'swap-horizontal-outline';
    if (m.includes('WAIVER')) return 'pricetag-outline';
    return 'ellipse-outline';
  };

  return (
    <AccountingLayout activeTab="Home">
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          >
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
              <Text style={styles.backText}>Home</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Collection Summary</Text>
            <Text style={styles.subtitle}>From locally recorded payments</Text>

            <View style={styles.segment}>
              {PERIODS.map((p) => {
                const active = p.key === period;
                return (
                  <TouchableOpacity key={p.key} style={[styles.segBtn, active && styles.segBtnActive]} onPress={() => setPeriod(p.key)}>
                    <Text style={[styles.segText, active && styles.segTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Total */}
            <View style={styles.totalCard}>
              <View style={styles.totalHeader}>
                <Text style={styles.totalLabel}>Total Collected</Text>
                <Ionicons name="wallet-outline" size={20} color="#8293b5" />
              </View>
              <Text style={styles.totalValue}>{money(total)}</Text>
              <View style={styles.totalMeta}>
                <Ionicons name="receipt-outline" size={13} color="#8293b5" />
                <Text style={styles.totalMetaText}>{inPeriod.length} transactions</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>BY PAYMENT METHOD</Text>
            {methods.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cash-outline" size={40} color="#94a3b8" />
                <Text style={styles.emptyText}>No collections for this period.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {methods.map(([m, v]) => {
                  const pct = total > 0 ? Math.round((v.amount / total) * 100) : 0;
                  return (
                    <View key={m} style={styles.methodCard}>
                      <View style={styles.methodIconWrap}>
                        <Ionicons name={methodIcon(m)} size={18} color={COLORS.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.methodTop}>
                          <Text style={styles.methodName}>{m.replace(/_/g, ' ')}</Text>
                          <Text style={styles.methodAmount}>{money(v.amount)}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.methodMeta}>{v.count} txn • {pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </AccountingLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  segment: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 4, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
  segBtnActive: {
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  segTextActive: { color: COLORS.primary },
  totalCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 24 },
  totalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 8 },
  totalMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  totalMetaText: { fontSize: 12, color: '#8293b5', fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  methodCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  methodIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  methodTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  methodName: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, textTransform: 'capitalize' },
  methodAmount: { fontSize: 14, fontWeight: '800', color: COLORS.money },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', marginTop: 8, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.secondary },
  methodMeta: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
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
