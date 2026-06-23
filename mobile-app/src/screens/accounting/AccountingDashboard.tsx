import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import withObservables from '@nozbe/with-observables';
import { useAuthStore } from '../../store/authStore';
import { database } from '../../database';
import FeeRecord from '../../database/models/FeeRecord';
import { NetworkListener } from '../../components/NetworkListener';
import RecordFeeScreen from './RecordFeeScreen';
import { performGlobalSync } from '../../hooks/useAutoSync';

const quickActions = [
  { label: 'Record Payment', icon: '💳', color: '#10b981' },
  { label: 'Issue Receipt', icon: '🧾', color: '#6366f1' },
  { label: 'Fee Defaulters', icon: '⚠️', color: '#ef4444' },
  { label: 'Fee Structure', icon: '📋', color: '#3b82f6' },
  { label: 'Daily Summary', icon: '📊', color: '#8b5cf6' },
  { label: 'Expense Entry', icon: '🏦', color: '#f59e0b' },
];

interface Props {
  feeRecords: FeeRecord[];
}

function AccountingDashboardScreen({ feeRecords }: Props) {
  const { user, logout } = useAuthStore();
  const [screen, setScreen] = useState<'dashboard' | 'record_fee'>('dashboard');

  if (screen === 'record_fee') {
    return <RecordFeeScreen onBack={() => { setScreen('dashboard'); performGlobalSync(); }} />;
  }

  // Calculate stats from fee records
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paymentTypes = ['payment', 'payment_received', 'FEE_PAYMENT', 'WAIVER'];

    const totalCollected = feeRecords
      .filter(f => paymentTypes.includes(f.type))
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const todayReceipts = feeRecords
      .filter(f => {
        const feeDate = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
        feeDate.setHours(0, 0, 0, 0);
        return paymentTypes.includes(f.type) && feeDate.getTime() === today.getTime();
      })
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    return [
      { label: 'Total Collected', value: `₦${(totalCollected || 0).toLocaleString()}`, color: '#10b981', icon: '💰' },
      { label: 'Pending Fees', value: '—', color: '#ef4444', icon: '⏳' },
      { label: "Today's Receipts", value: `₦${(todayReceipts || 0).toLocaleString()}`, color: '#6366f1', icon: '🧾' },
      { label: 'Defaulters', value: '—', color: '#f59e0b', icon: '🚨' },
    ];
  }, [feeRecords]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <NetworkListener />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Accounting Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Offline Indicator Banner */}
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerIcon}>🛡️</Text>
          <Text style={styles.offlineBannerText}>
            Offline-ready: All payments are saved locally and synced automatically when online.
          </Text>
        </View>

        {/* Stat Cards */}
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { borderTopColor: stat.color }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              activeOpacity={0.8}
              onPress={action.label === 'Record Payment' ? () => setScreen('record_fee') : undefined}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Sync Queue */}
        <Text style={styles.sectionTitle}>Pending Sync</Text>
        <View style={styles.syncCard}>
          <Text style={styles.syncEmpty}>
            ✅ All records are synced.{'\n'}Offline transactions will appear here when you're not connected.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Enhanced version with observables
const EnhancedAccountingDashboard = withObservables([], () => ({
  feeRecords: database.collections.get<FeeRecord>('fee_records').query().observe(),
}))(AccountingDashboardScreen);

export default EnhancedAccountingDashboard;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 12,
  },
  greeting: { color: '#94a3b8', fontSize: 14 },
  name: { color: '#f1f5f9', fontSize: 22, fontWeight: '800', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  badge: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  offlineBanner: {
    backgroundColor: '#0c1a2e',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  offlineBannerIcon: { fontSize: 20 },
  offlineBannerText: { color: '#60a5fa', fontSize: 12, flex: 1, lineHeight: 18 },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statValue: { color: '#f1f5f9', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: '500' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  syncCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  syncEmpty: { color: '#475569', textAlign: 'center', lineHeight: 22, fontSize: 14 },
});
