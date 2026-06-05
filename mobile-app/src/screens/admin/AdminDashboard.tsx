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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
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
  const [activeTab, setActiveTab] = useState('Home');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    
    async function fetchData() {
      try {
        const stats = await apiGet('/reporting/dashboard/admin/stats', user!.token);
        setDashboardData(stats);
        
        const acts = await apiGet('/reporting/dashboard/admin/activities', user!.token);
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
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* --- App Header --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school-outline" size={24} color={COLORS.onSurface} />
          <Text style={styles.headerTitle}>EduManage</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.onlineBadge}>
            <Ionicons name="swap-vertical" size={12} color={COLORS.successText} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color={COLORS.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
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

        {/* --- Sync Banner --- */}
        <View style={styles.syncBanner}>
          <View style={styles.syncIconWrap}>
            <Ionicons name="cloud-upload-outline" size={28} color={COLORS.secondary} />
          </View>
          <View style={styles.syncContent}>
            <Text style={styles.syncTitle}>Local Storage Sync</Text>
            <Text style={styles.syncText}>
              14 Records awaiting institutional database sync. Your offline changes are safe.
            </Text>
            <TouchableOpacity style={styles.syncBtn}>
              <Ionicons name="sync" size={16} color={COLORS.onSecondary} />
              <Text style={styles.syncBtnText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Quick Administration --- */}
        <Text style={styles.sectionTitle}>QUICK ADMINISTRATION</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="person-add-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>Enroll Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="receipt-outline" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridLabel}>Record Fee</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-done-outline" size={22} color="#16a34a" />
            </View>
            <Text style={styles.gridLabel}>Mark Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="document-text-outline" size={22} color="#475569" />
            </View>
            <Text style={styles.gridLabel}>Generate Report</Text>
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

        {/* --- Profile Footer --- */}
        <View style={styles.profileFooter}>
          <View style={styles.profileAvatar}>
             <Ionicons name="person" size={24} color="#cbd5e1" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { textTransform: 'capitalize' }]}>
              {user?.firstName && user.firstName.trim() !== '' ? `${user.firstName} ${user.lastName || ''}` : 'System Administrator'}
            </Text>
            <Text style={[styles.profileRole, { textTransform: 'capitalize' }]}>
              {user?.displayRole || user?.role || 'Administrator'}
            </Text>
          </View>
          <Ionicons name="school" size={60} color="rgba(255,255,255,0.05)" style={styles.profileBgIcon} />
        </View>
        
        {/* Spacer for bottom tab */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* --- Bottom Navigation (Fake for mockup mapping) --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
          <Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={22} color={activeTab === 'Home' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]} numberOfLines={1}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Students')}>
          <Ionicons name={activeTab === 'Students' ? "people" : "people-outline"} size={22} color={activeTab === 'Students' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Students' && styles.navTextActive]} numberOfLines={1}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Attendance')}>
          <Ionicons name={activeTab === 'Attendance' ? "calendar" : "calendar-outline"} size={22} color={activeTab === 'Attendance' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Attendance' && styles.navTextActive]} numberOfLines={1}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Records')}>
          <Ionicons name={activeTab === 'Records' ? "layers" : "layers-outline"} size={22} color={activeTab === 'Records' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Records' && styles.navTextActive]} numberOfLines={1}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Sync')}>
          <Ionicons name={activeTab === 'Sync' ? "sync-circle" : "sync-circle-outline"} size={24} color={activeTab === 'Sync' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Sync' && styles.navTextActive]} numberOfLines={1}>Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profile')}>
          <Ionicons name={activeTab === 'Profile' ? "person" : "person-outline"} size={22} color={activeTab === 'Profile' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]} numberOfLines={1}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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

  /* --- Bottom Navigation --- */
  bottomNav: {
    height: 64,
    backgroundColor: COLORS.surfaceContainerLowest,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
  },
  navTextActive: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
