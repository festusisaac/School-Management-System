import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudentStackParamList } from '../../navigation/RootNavigator';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useStudentStore } from '../../store/studentStore';
import { apiGet } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  secondary: '#055db6',
};

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { profile } = useStudentStore();
  const token = user?.token || '';
  const currency = settings?.currencySymbol || '₦';
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !profile?.id) return;
    try {
      // Scope to the active academic session/term so numbers (attendance %,
      // fees) match the website, which always passes the current session.
      const params = new URLSearchParams();
      if (settings?.currentSessionId) params.append('sessionId', settings.currentSessionId);
      if (settings?.currentTermId) params.append('termId', settings.currentTermId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await apiGet(`/reporting/dashboard/student/${profile.id}${qs}`, token);
      setStats(data);
    } catch (e) {
      console.error('Failed to load student dashboard', e);
    } finally {
      setLoading(false);
    }
  }, [token, profile?.id, settings?.currentSessionId, settings?.currentTermId]);

  useEffect(() => {
    if (profile?.id) load();
    else if (profile === null) setLoading(true);
  }, [load, profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const money = (n: any) => `${currency}${Number(n || 0).toLocaleString()}`;
  // Backend (reporting/dashboard/student/:id) returns { stats: { attendance, feesBalance, ... }, ... }
  const s = stats?.stats ?? stats;
  const attendancePct = s?.attendance ?? null;
  const feesBalance = s?.feesBalance ?? s?.finance?.outstanding ?? s?.outstandingFees;

  const actions: { label: string; icon: any; bg: string; color: string; screen: keyof StudentStackParamList }[] = [
    { label: 'My Results', icon: 'ribbon-outline', bg: '#f3e8ff', color: '#9333ea', screen: 'Results' },
    { label: 'Fee Status', icon: 'wallet-outline', bg: '#fef3c7', color: '#d97706', screen: 'FeeStatus' },
    { label: 'Homework', icon: 'document-text-outline', bg: '#fef9c3', color: '#ca8a04', screen: 'Homework' },
    { label: 'Attendance', icon: 'checkmark-done-outline', bg: '#dcfce7', color: '#16a34a', screen: 'Attendance' },
    { label: 'Timetable', icon: 'calendar-outline', bg: '#cffafe', color: '#0891b2', screen: 'Timetable' },
    { label: 'Online Class', icon: 'videocam-outline', bg: '#fee2e2', color: '#dc2626', screen: 'OnlineClasses' },
    { label: 'Downloads', icon: 'cloud-download-outline', bg: '#e0e7ff', color: '#4f46e5', screen: 'Downloads' },
    { label: 'Notices', icon: 'megaphone-outline', bg: '#eff6ff', color: COLORS.secondary, screen: 'Notices' },
  ];

  return (
    <StudentLayout activeTab="Home">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile ? `${profile.firstName} ${profile.lastName || ''}` : `${user?.firstName} ${user?.lastName}`}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>
              {profile?.class?.name ? profile.class.name : 'Student'}
              {profile?.admissionNo ? ` • ${profile.admissionNo}` : ''}
            </Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statCardsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e2e8f0' }]}>Fee Balance</Text>
              <Ionicons name="wallet-outline" size={20} color="#8293b5" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onPrimary }]}>
              {loading ? <ActivityIndicator color={COLORS.onPrimary} size="small" /> : money(feesBalance)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryContainer }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#94a3b8' }]}>Attendance</Text>
              <Ionicons name="checkmark-done-outline" size={20} color="#64748b" />
            </View>
            <Text style={[styles.statCardValue, { color: '#cbd5e1' }]}>
              {loading ? <ActivityIndicator color="#cbd5e1" size="small" /> : attendancePct != null ? `${Math.round(attendancePct)}%` : '—'}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>MY PORTAL</Text>
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
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 24 },
  welcome: { marginBottom: 20, marginTop: 8 },
  greeting: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  name: { color: COLORS.onSurface, fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  badgeRow: { marginTop: 6 },
  badge: {
    backgroundColor: '#dbeafe',
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    letterSpacing: 0.3,
    overflow: 'hidden',
  },
  statCardsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
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
  statCardValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
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
