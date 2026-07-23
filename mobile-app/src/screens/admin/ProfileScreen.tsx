import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AdminLayout from '../../components/AdminLayout';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { syncData } from '../../database/sync';

const COLORS = {
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  secondary: '#055db6',
  onSecondary: '#ffffff',
  error: '#ba1a1a',
  onError: '#ffffff',
  successLight: '#dcfce7',
  successText: '#166534',
  errorLight: '#fee2e2',
  errorText: '#991b1b',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You must be online to sync data.');
      return;
    }
    setIsSyncing(true);
    try {
      await syncData();
      Alert.alert('Success', 'Data synchronized successfully.');
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'An error occurred during synchronization.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U';

  const Layout = user?.role === 'teacher' ? TeacherLayout : AdminLayout;

  return (
    <Layout activeTab="Profile">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header / Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userRole}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Staff'}
          </Text>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="business-outline" size={20} color="#64748b" />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Tenant ID</Text>
                <Text style={styles.rowValue}>{user?.tenantId || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="school-outline" size={20} color="#64748b" />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>School Name</Text>
                <Text style={styles.rowValue}>{settings.schoolName || 'Not Set'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Active Session</Text>
                <Text style={styles.rowValue}>{settings.currentSessionName || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="time-outline" size={20} color="#64748b" />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Active Term</Text>
                <Text style={styles.rowValue}>{settings.currentTermName || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronization</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'} size={20} color={isOnline ? COLORS.successText : COLORS.errorText} />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Network Status</Text>
                <View style={[styles.badge, isOnline ? styles.badgeSuccess : styles.badgeError]}>
                  <Text style={[styles.badgeText, isOnline ? styles.badgeTextSuccess : styles.badgeTextError]}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.syncButton} 
              onPress={handleForceSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color={COLORS.onSecondary} size="small" />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={20} color={COLORS.onSecondary} />
                  <Text style={styles.syncButtonText}>Force Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#bae6fd',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowContent: {
    marginLeft: 16,
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
  },
  badgeError: {
    backgroundColor: COLORS.errorLight,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: COLORS.successText,
  },
  badgeTextError: {
    color: COLORS.errorText,
  },
  syncButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  syncButtonText: {
    color: COLORS.onSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
