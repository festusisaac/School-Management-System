import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import withObservables from '@nozbe/with-observables';
import type { AccountingStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSectionStore } from '../../store/sectionStore';
import { database } from '../../database';
import FeeRecord from '../../database/models/FeeRecord';
import AccountingLayout from '../../components/AccountingLayout';
import { apiGet } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  secondary: '#055db6',
};

const PAYMENT_TYPES = ['payment', 'payment_received', 'FEE_PAYMENT', 'WAIVER'];

interface Props {
  feeRecords: FeeRecord[];
}

function AccountingDashboardScreen({ feeRecords }: Props) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const activeSectionId = useSectionStore((s) => s.activeSectionId);
  const navigation = useNavigation<NativeStackNavigationProp<AccountingStackParamList>>();
  const currency = settings?.currencySymbol || '₦';
  const money = (n: number) => `${currency}${(n || 0).toLocaleString()}`;

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    const payments = feeRecords.filter(
      (f) => PAYMENT_TYPES.includes(f.type) && (!activeSectionId || f.schoolSectionId === activeSectionId)
    );
    const totalCollected = payments.reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const todayTotal = payments
      .filter((f) => {
        const d = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      })
      .reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const monthTotal = payments
      .filter((f) => (f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt)).getTime() >= monthStart)
      .reduce((s, f) => s + (Number(f.amount) || 0), 0);

    return { totalCollected, todayTotal, monthTotal, count: payments.length };
  }, [feeRecords, activeSectionId]);

  // Authoritative section total from the server (matches the website). The
  // backend also attributes records to a section via the student's class, so
  // this is more accurate than the strict local sum; fall back to local offline.
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!user?.token) return;
    const sectionParam = activeSectionId ? `&sectionId=${activeSectionId}` : '';
    apiGet(`/finance/payments?limit=1${sectionParam}`, user.token)
      .then((res: any) => {
        if (cancelled) return;
        const t = res?.totalAmount;
        setServerTotal(t != null && !isNaN(Number(t)) ? Number(t) : null);
      })
      .catch(() => {
        if (!cancelled) setServerTotal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.token, activeSectionId]);

  const totalCollectedDisplay = serverTotal != null ? serverTotal : stats.totalCollected;

  const actions: { label: string; icon: any; bg: string; color: string; screen: keyof AccountingStackParamList }[] = [
    { label: 'Record Payment', icon: 'card-outline', bg: '#dcfce7', color: '#16a34a', screen: 'RecordFee' },
    { label: 'Fees History', icon: 'receipt-outline', bg: '#eff6ff', color: COLORS.secondary, screen: 'FeesHistory' },
    { label: 'Fee Defaulters', icon: 'alert-circle-outline', bg: '#fee2e2', color: '#dc2626', screen: 'Debtors' },
    { label: 'Daily Summary', icon: 'bar-chart-outline', bg: '#f3e8ff', color: '#9333ea', screen: 'CollectionSummary' },
    { label: 'Expenses', icon: 'wallet-outline', bg: '#fef3c7', color: '#d97706', screen: 'Expenses' },
    { label: 'My Profile', icon: 'person-outline', bg: '#e0e7ff', color: '#4f46e5', screen: 'Profile' },
  ];

  return (
    <AccountingLayout activeTab="Home">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} style={{ flex: 1 }}>
        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>Accounting Portal</Text>
          </View>
        </View>

        {/* Primary stat cards */}
        <View style={styles.statCardsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e2e8f0' }]}>Total Collected</Text>
              <Ionicons name="wallet-outline" size={20} color="#8293b5" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onPrimary }]}>{money(totalCollectedDisplay)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryContainer }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#94a3b8' }]}>Today's Receipts</Text>
              <Ionicons name="today-outline" size={20} color="#64748b" />
            </View>
            <Text style={[styles.statCardValue, { color: '#cbd5e1' }]}>{money(stats.todayTotal)}</Text>
          </View>
        </View>

        {/* Secondary stats */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{money(stats.monthTotal)}</Text>
            <Text style={styles.miniStatLabel}>This Month</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{stats.count}</Text>
            <Text style={styles.miniStatLabel}>Transactions</Text>
          </View>
        </View>

        {/* Offline note */}
        <View style={styles.offlineBanner}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.offlineText}>
            Offline-ready: payments save locally and sync automatically when online.
          </Text>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.gridContainer}>
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={styles.gridItem} onPress={() => navigation.navigate(a.screen as any)}>
              <View style={[styles.gridIconWrap, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.gridLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AccountingLayout>
  );
}

const EnhancedAccountingDashboard = withObservables([], () => ({
  feeRecords: database.collections.get<FeeRecord>('fee_records').query().observe(),
}))(AccountingDashboardScreen);

export default EnhancedAccountingDashboard;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 20 },
  welcome: { marginBottom: 20, marginTop: 8 },
  greeting: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  name: { color: COLORS.onSurface, fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  badgeRow: { marginTop: 6 },
  badge: {
    backgroundColor: '#fef08a',
    color: '#854d0e',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  statCardsContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statCardTitle: { fontSize: 13, fontWeight: '500' },
  statCardValue: { fontSize: 22, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  miniStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  miniStat: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  miniStatValue: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  miniStatLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  offlineText: { color: COLORS.secondary, fontSize: 12, flex: 1, lineHeight: 18, fontWeight: '500' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  gridItem: {
    backgroundColor: COLORS.surfaceContainerLowest,
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gridIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface },
});
