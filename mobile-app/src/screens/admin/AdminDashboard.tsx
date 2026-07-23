import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/RootNavigator';
import AdminLayout from '../../components/AdminLayout';

// @ts-ignore
const schoolLogo = require('../../../assets/school-logo.png');
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { apiGet } from '../../services/api';

/* --- Design System Colors --- */
const COLORS = {
  surface: '#f7f9fb',
  surfaceBright: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',          // Deep Navy
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48', // Lighter Navy
  onPrimaryContainer: '#8293b5',
  secondary: '#055db6',        // Educational Blue
  onSecondary: '#ffffff',
  tertiaryContainer: '#00330d',
  onTertiaryContainer: '#29a845', // Success Green
  error: '#ba1a1a',
  background: '#f7f9fb',
  surfaceVariant: '#e0e3e5',
  successLight: '#dcfce7',
  successText: '#166534',
};

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U';

  const [refreshing, setRefreshing] = useState(false);

  // Track connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  async function fetchData() {
    if (!user?.token) return;
    try {
      const query = settings?.currentSessionId ? `?sessionId=${settings.currentSessionId}` : '';
      const stats = await apiGet(`/reporting/dashboard/admin/stats${query}`, user!.token);
      setDashboardData(stats);

      const acts = await apiGet(`/reporting/dashboard/admin/activities${query}`, user!.token);
      const enrolls = (acts.recentEnrollments || []).map((s: any) => ({
        id: `stu_${s.id}`,
        type: 'enrollment',
        title: 'New admission:',
        boldText: `${s.firstName} ${s.lastName}`,
        subtitle: `Added • ${new Date(s.createdAt).toLocaleDateString()}`,
        date: new Date(s.createdAt)
      }));
      const payments = (acts.recentPayments || []).map((p: any) => ({
        id: `pay_${p.id}`,
        type: 'payment',
        title: 'Payment received:',
        boldText: `₦${p.amount?.toLocaleString() || '0'}`,
        subtitle: `Ref: ${p.reference || 'N/A'} • ${new Date(p.createdAt).toLocaleDateString()}`,
        date: new Date(p.createdAt)
      }));

      const combined = [...enrolls, ...payments]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 4); // show top 4

      setRecentActivities(combined);
    } catch (err: any) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('Failed to fetch dashboard data:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const onRefresh = React.useCallback(async () => {
    if (!user?.token) return;
    setRefreshing(true);
    try {
      // 1. Force refresh system settings (including currentSessionId)
      const data = await apiGet('/system/settings', user.token);
      if (data) {
        useSettingsStore.getState().setSettings({
          schoolName: data.schoolName,
          staffIdPrefix: data.staffIdPrefix || 'STF/',
          admissionNumberPrefix: data.admissionNumberPrefix || 'SCH/',
          currentSessionId: data.currentSessionId,
          currentTermId: data.currentTermId,
          currentSessionName: data.currentSessionName,
          currentTermName: data.currentTermName,
          currencySymbol: data.currencySymbol || '₦',
          dateFormat: data.dateFormat || 'DD/MM/YYYY',
        });
      }
      // 2. Fetch dashboard data (the useEffect will also trigger if sessionId changes, but we fetch here to be safe)
      await fetchData();
    } catch (e) {
      console.log('Refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [user, settings?.currentSessionId]);

  useEffect(() => {

    fetchData();
  }, [user, settings?.currentSessionId]);

  return (
    <AdminLayout activeTab="Home">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* --- Stat Cards --- */}
        <View style={styles.statCardsContainer}>
          {/* Card 1 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e2e8f0' }]}>Total Students</Text>
              <Ionicons name="people-outline" size={20} color="#8293b5" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onPrimary }]}>
              {isLoading ? <ActivityIndicator color={COLORS.onPrimary} size="small" /> : (dashboardData?.students?.total || '0').toLocaleString()}
            </Text>
            <View style={styles.statCardFooter}>
              <Ionicons name="trending-up" size={14} color="#4ade80" />
              <Text style={styles.statCardSubtitleSuccess}> +{(dashboardData?.students?.active || 0)} active</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryContainer }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#94a3b8' }]}>Active Staff</Text>
              <Ionicons name="id-card-outline" size={20} color="#64748b" />
            </View>
            <Text style={[styles.statCardValue, { color: '#cbd5e1' }]}>
              {isLoading ? <ActivityIndicator color="#cbd5e1" size="small" /> : (dashboardData?.staff?.total || '0').toLocaleString()}
            </Text>
            <Text style={styles.statCardSubtitleNeutral}>{(dashboardData?.staff?.teaching || 0)} teaching</Text>
          </View>

          {/* Card 3 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e0f2fe' }]}>Fees Collected</Text>
              <Ionicons name="cash-outline" size={20} color="#bae6fd" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onSecondary }]}>
              {isLoading ? <ActivityIndicator color={COLORS.onSecondary} size="small" /> : `₦${(dashboardData?.finance?.totalRevenue || 0).toLocaleString()}`}
            </Text>
            <Text style={styles.statCardSubtitleNeutralLight}>Outstanding: ₦{(dashboardData?.finance?.outstandingFees || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* --- Sync Status Banner --- */}
        <View style={styles.syncBanner}>
          <View style={styles.syncIconWrap}>
            <Ionicons name="checkmark-circle-outline" size={28} color="#10b981" />
          </View>
          <View style={styles.syncContent}>
            <Text style={styles.syncTitle}>Sync Status</Text>
            <Text style={styles.syncText}>
              All data is synchronized. Sync runs automatically when online.
            </Text>
          </View>
        </View>

        {/* --- Quick Administration --- */}
        <Text style={styles.sectionTitle}>QUICK ADMINISTRATION</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('StudentManagement')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="people-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>Manage Students</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('StaffManagement')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="id-card-outline" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridLabel}>Manage Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('RecordFee')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="receipt-outline" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridLabel}>Record Fee</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-done-outline" size={22} color="#16a34a" />
            </View>
            <Text style={styles.gridLabel}>Mark Attendance</Text>
          </TouchableOpacity>

        </View>

        {/* --- Recent Activity --- */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
          ) : recentActivities.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>No recent activity</Text>
          ) : (
            recentActivities.map((act, idx) => (
              <React.Fragment key={act.id}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIconWrap, { backgroundColor: act.type === 'enrollment' ? '#e2e8f0' : '#86efac' }]}>
                    <Ionicons name={act.type === 'enrollment' ? 'person-outline' : 'cash-outline'} size={18} color={act.type === 'enrollment' ? COLORS.primary : '#14532d'} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityMainText}>{act.title} <Text style={styles.activityBold}>{act.boldText}</Text></Text>
                    <Text style={styles.activitySubText}>{act.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
                {idx < recentActivities.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* --- System Health --- */}
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={styles.healthContainer}>
          <View style={styles.healthRow}>
            <View style={styles.healthLabelWrap}>
              <Ionicons name="server-outline" size={20} color="#16a34a" />
              <Text style={styles.healthLabel}>Server Connection</Text>
            </View>
            <View style={styles.healthBadge}>
              <Text style={styles.healthBadgeText}>EXCELLENT</Text>
            </View>
          </View>
          <View style={styles.healthRow}>
            <View style={styles.healthLabelWrap}>
              <Ionicons name="cube-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.healthLabel}>Local Storage</Text>
            </View>
            <View style={styles.healthProgressContainer}>
              <Text style={styles.healthProgressText}>2.4GB / 10GB</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '24%' }]} />
              </View>
            </View>
          </View>
        </View>



        <View style={{ height: 20 }} />
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  headerProfileText: {
    color: '#bae6fd',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.successText,
  },
  iconButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // Reduced padding since bottomNav is no longer absolute
  },

  /* --- Stat Cards --- */
  statCardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardSubtitleSuccess: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '500',
  },
  statCardSubtitleNeutral: {
    fontSize: 12,
    color: '#64748b',
  },
  statCardSubtitleNeutralLight: {
    fontSize: 12,
    color: '#bae6fd',
  },

  /* --- Sync Banner --- */
  syncBanner: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  syncIconWrap: {
    backgroundColor: '#cbd5e1',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  syncContent: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  syncText: {
    fontSize: 13,
    color: COLORS.onSurface,
    lineHeight: 18,
    marginBottom: 12,
    opacity: 0.8,
  },
  syncBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  syncBtnText: {
    color: COLORS.onSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  /* --- Sections --- */
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },

  /* --- Grid --- */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
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
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  /* --- Activity List --- */
  activityList: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    paddingVertical: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMainText: {
    fontSize: 14,
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  activityBold: {
    fontWeight: '700',
  },
  activitySubText: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },

  /* --- System Health --- */
  healthContainer: {
    marginBottom: 24,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  healthLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  healthBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.successText,
    letterSpacing: 0.5,
  },
  healthProgressContainer: {
    alignItems: 'flex-end',
  },
  healthProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  progressBarBg: {
    width: 100,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
  },

  /* --- Profile Footer --- */
  profileFooter: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 2,
  },
  profileInfo: {
    zIndex: 2,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimary,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#94a3b8',
  },
  profileBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    zIndex: 1,
    transform: [{ rotate: '-15deg' }],
  },
});
