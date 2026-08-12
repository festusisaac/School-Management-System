import React, { useState, useEffect } from 'react';
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
import type { TeacherStackParamList } from '../../navigation/RootNavigator';
import TeacherLayout from '../../components/TeacherLayout';

import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { apiGet } from '../../services/api';

/* --- Design System Colors --- */
const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',          // Deep Navy
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48', // Lighter Navy
  secondary: '#055db6',        // Educational Blue
  onSecondary: '#ffffff',
  error: '#ba1a1a',
  successLight: '#dcfce7',
  successText: '#166534',
};

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();

  async function fetchData() {
    if (!user?.token) return;
    try {
      const stats = await apiGet(`/hr/staff/dashboard/stats?sessionId=${settings?.currentSessionId || ''}&termId=${settings?.currentTermId || ''}`, user.token);
      
      setDashboardData({
        assignedClasses: stats?.totalClasses || 0,
        pendingAssignments: stats?.pendingHomework || 0,
        upcomingClasses: stats?.classesToday || 0,
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <TeacherLayout activeTab="Home">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* --- Welcome Area --- */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>Teacher Portal</Text>
          </View>
        </View>

        {/* --- Stat Cards --- */}
        <View style={styles.statCardsContainer}>
          {/* Card 1 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#e2e8f0' }]}>Assigned Classes</Text>
              <Ionicons name="book-outline" size={20} color="#8293b5" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.onPrimary }]}>
              {isLoading ? <ActivityIndicator color={COLORS.onPrimary} size="small" /> : dashboardData?.assignedClasses || '0'}
            </Text>
          </View>

          {/* Card 2 */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryContainer }]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.statCardTitle, { color: '#94a3b8' }]}>Pending Assignments</Text>
              <Ionicons name="document-text-outline" size={20} color="#64748b" />
            </View>
            <Text style={[styles.statCardValue, { color: '#cbd5e1' }]}>
              {isLoading ? <ActivityIndicator color="#cbd5e1" size="small" /> : dashboardData?.pendingAssignments || '0'}
            </Text>
          </View>
        </View>

        {/* --- Quick Actions --- */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-done-outline" size={22} color="#16a34a" />
            </View>
            <Text style={styles.gridLabel}>Attendance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('EnterScores')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="create-outline" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridLabel}>Enter Scores</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Assignments')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="document-text-outline" size={22} color="#d97706" />
            </View>
            <Text style={styles.gridLabel}>Assignments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('DownloadCenter')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="cloud-download-outline" size={22} color="#9333ea" />
            </View>
            <Text style={styles.gridLabel}>Downloads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('OnlineClass')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="videocam-outline" size={22} color="#dc2626" />
            </View>
            <Text style={styles.gridLabel}>Online Class</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('TeacherClasses')}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="library-outline" size={22} color="#4f46e5" />
            </View>
            <Text style={styles.gridLabel}>My Subjects</Text>
          </TouchableOpacity>
        </View>

        {/* --- Today's Schedule --- */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>TODAY'S SCHEDULE</Text>
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={40} color="#94a3b8" />
          <Text style={styles.emptyText}>No classes scheduled for today.</Text>
        </View>

      </ScrollView>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  welcomeContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  name: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
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
  },

  /* --- Stat Cards --- */
  statCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  /* --- Sections --- */
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
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

  /* --- Empty State --- */
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
