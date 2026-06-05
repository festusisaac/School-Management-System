import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

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
      >
        {/* --- Stat Cards --- */}
        <View style={styles.statCardsContainer}>
          {/* Card 1 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e2e8f0' }]}>Total Students</Text>
              <Ionicons name="people-outline" size={20} color="#8293b5" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onPrimary }]}>1,284</Text>
            <View style={styles.statCardFooter}>
              <Ionicons name="trending-up" size={14} color="#4ade80" />
              <Text style={styles.statCardSubtitleSuccess}> +12 today</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryContainer }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#94a3b8' }]}>Active Staff</Text>
              <Ionicons name="id-card-outline" size={20} color="#64748b" />
            </View>
            <Text style={[styles.statCardValue, { color: '#cbd5e1' }]}>86</Text>
            <Text style={styles.statCardSubtitleNeutral}>12 on leave</Text>
          </View>

          {/* Card 3 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e0f2fe' }]}>Fees Collected</Text>
              <Ionicons name="cash-outline" size={20} color="#bae6fd" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onSecondary }]}>$42,850</Text>
            <Text style={styles.statCardSubtitleNeutralLight}>Term 2 Progress: 68%</Text>
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
          {/* Activity 1 */}
          <View style={styles.activityItem}>
            <View style={[styles.activityIconWrap, { backgroundColor: '#e2e8f0' }]}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityMainText}>New admission: <Text style={styles.activityBold}>Marcus Thorne</Text></Text>
              <Text style={styles.activitySubText}>Grade 10-A • 2 mins ago</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </View>
          <View style={styles.divider} />

          {/* Activity 2 */}
          <View style={styles.activityItem}>
            <View style={[styles.activityIconWrap, { backgroundColor: '#86efac' }]}>
              <Ionicons name="cash-outline" size={18} color="#14532d" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityMainText}>Payment received: <Text style={styles.activityBold}>$1,200</Text></Text>
              <Text style={styles.activitySubText}>Sarah Jenkins • Tuition Fee • 15 mins ago</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </View>
          <View style={styles.divider} />

          {/* Activity 3 */}
          <View style={styles.activityItem}>
            <View style={[styles.activityIconWrap, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.secondary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityMainText}>Report generated: <Text style={styles.activityBold}>Q3 Attendance Summary</Text></Text>
              <Text style={styles.activitySubText}>Admin Office • 1 hour ago</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </View>
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
            <Text style={styles.profileName}>
              {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Principal Anderson'}
            </Text>
            <Text style={styles.profileRole}>Lead Administrator</Text>
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
          <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Records')}>
          <Ionicons name={activeTab === 'Records' ? "layers" : "layers-outline"} size={22} color={activeTab === 'Records' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Records' && styles.navTextActive]}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Sync')}>
          <Ionicons name={activeTab === 'Sync' ? "sync-circle" : "sync-circle-outline"} size={24} color={activeTab === 'Sync' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Sync' && styles.navTextActive]}>Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profile')}>
          <Ionicons name={activeTab === 'Profile' ? "person" : "person-outline"} size={22} color={activeTab === 'Profile' ? COLORS.secondary : '#64748b'} />
          <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]}>Profile</Text>
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
    paddingBottom: 80, // Space for bottom nav
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
