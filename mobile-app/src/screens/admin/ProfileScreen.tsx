import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AdminLayout from '../../components/AdminLayout';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSyncStore } from '../../hooks/useAutoSync';
import { syncData } from '../../database/sync';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  secondary: '#055db6',
  onSecondary: '#ffffff',
  error: '#ba1a1a',
  successLight: '#dcfce7',
  successText: '#166534',
  errorLight: '#fee2e2',
  errorText: '#991b1b',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const { lastSyncedAt } = useSyncStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => setIsOnline(!!state.isConnected));
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
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U';
  const roleLabel =
    user?.displayRole ||
    (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Staff');
  const lastSynced = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

  const Layout = user?.role === 'teacher' ? TeacherLayout : AdminLayout;

  return (
    <Layout activeTab="Profile">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- Identity header card --- */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.roleBadge}>{roleLabel}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email || 'No email'}</Text>
          </View>
        </View>

        {/* --- School context --- */}
        <Text style={styles.sectionTitle}>School Context</Text>
        <View style={styles.card}>
          <Row icon="school-outline" label="School" value={settings.schoolName || 'Not set'} />
          <Divider />
          <Row icon="calendar-outline" label="Active Session" value={settings.currentSessionName || 'N/A'} />
          <Divider />
          <Row icon="time-outline" label="Active Term" value={settings.currentTermName || 'N/A'} last />
        </View>

        {/* --- Account --- */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Row icon="person-outline" label="Role" value={roleLabel} last />
        </View>

        {/* --- Data & Sync --- */}
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        <View style={styles.card}>
          <View style={styles.syncRow}>
            <View style={styles.rowLeft}>
              <Ionicons name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'} size={20} color={isOnline ? COLORS.successText : COLORS.errorText} />
              <Text style={styles.rowLabel}>Network</Text>
            </View>
            <View style={[styles.badge, isOnline ? styles.badgeSuccess : styles.badgeError]}>
              <Text style={[styles.badgeText, { color: isOnline ? COLORS.successText : COLORS.errorText }]}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          {lastSynced && (
            <>
              <Divider />
              <View style={styles.syncRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="sync-outline" size={20} color="#64748b" />
                  <Text style={styles.rowLabel}>Last synced</Text>
                </View>
                <Text style={styles.rowValueMuted}>{lastSynced}</Text>
              </View>
            </>
          )}
          <TouchableOpacity style={[styles.syncButton, isSyncing && { opacity: 0.7 }]} onPress={handleForceSync} disabled={isSyncing}>
            {isSyncing ? (
              <ActivityIndicator color={COLORS.onSecondary} size="small" />
            ) : (
              <Ionicons name="sync" size={18} color={COLORS.onSecondary} />
            )}
            <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* --- Logout --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

function Row({ icon, label, value, last, mono }: { icon: any; label: string; value: string; last?: boolean; mono?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color="#64748b" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#bae6fd' },
  name: { fontSize: 19, fontWeight: '800', color: COLORS.onSurface },
  roleBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 5,
  },
  email: { fontSize: 13, color: '#64748b', marginTop: 6 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, flexShrink: 1, textAlign: 'right' },
  rowValueMuted: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  mono: { fontSize: 12, fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: COLORS.successLight },
  badgeError: { backgroundColor: COLORS.errorLight },
  badgeText: { fontSize: 11, fontWeight: '800' },
  syncButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    marginVertical: 14,
    gap: 8,
  },
  syncButtonText: { color: COLORS.onSecondary, fontSize: 15, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  logoutButtonText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
});
