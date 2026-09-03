import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import AdminLayout from '../../components/AdminLayout';
import AddStaffModal from './components/AddStaffModal';
import { apiGet } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSectionStore } from '../../store/sectionStore';

const COLORS = {
  primary: '#031632',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  onSurface: '#191c1e',
  onSurfaceVariant: '#44474d',
  outlineVariant: '#c5c6ce',
  error: '#ba1a1a',
  secondary: '#055db6',
};

const TYPOGRAPHY = {
  headlineSm: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  labelMd: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyLg: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
};

function PageTitle({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.titleRow}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={20} color={COLORS.onSurface} />
      </TouchableOpacity>
      <View>
        <Text style={styles.pageTitle}>Staff Management</Text>
        <Text style={styles.subtitle}>Active Online Session</Text>
      </View>
    </View>
  );
}

export default function StaffManagementScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const activeSectionId = useSectionStore((s) => s.activeSectionId);
  const token = user?.token;
  const [isOnline, setIsOnline] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return unsubscribe;
  }, []);

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    try {
      // The backend uses /hr/staff — scope to the selected section when one is active.
      const sectionParam = activeSectionId ? `&sectionId=${activeSectionId}` : '';
      const response = await apiGet(`/hr/staff?limit=100${sectionParam}`, token);
      // The response structure might have data as array or inside items depending on pagination
      if (Array.isArray(response)) {
        setStaffList(response);
      } else if (response && response.items) {
        setStaffList(response.items);
      } else if (response && response.data) {
        setStaffList(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, activeSectionId]);

  useEffect(() => {
    if (isOnline) {
      fetchStaff();
    } else {
      setIsLoading(false);
    }
  }, [isOnline, fetchStaff]);

  const onRefresh = () => {
    if (isOnline) {
      setIsRefreshing(true);
      fetchStaff();
    }
  };

  const handleStaffAdded = () => {
    setIsAddModalOpen(false);
    setIsLoading(true);
    fetchStaff();
  };

  if (!isOnline && staffList.length === 0) {
    return (
      <AdminLayout activeTab="Dashboard">
        <PageTitle onBack={() => navigation.goBack()} />
        <View style={styles.offlineState}>
          <Ionicons name="cloud-offline-outline" size={64} color={COLORS.outlineVariant} />
          <Text style={styles.offlineTitle}>Offline Mode</Text>
          <Text style={styles.offlineDesc}>Staff management requires an active internet connection as it syncs directly with the central server.</Text>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="Dashboard">
      <View style={styles.main}>
        <PageTitle onBack={() => navigation.goBack()} />

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentInner}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.headerActions}>
            <View style={styles.statsCard}>
              <View style={styles.statsIcon}>
                <Ionicons name="people-outline" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statsLabel}>Total Staff</Text>
                <Text style={styles.statsValue}>{staffList.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>All Staff Members</Text>
            
            {isLoading && !isRefreshing ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Fetching staff records...</Text>
              </View>
            ) : staffList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color={COLORS.outlineVariant} />
                <Text style={styles.emptyText}>No staff members found.</Text>
              </View>
            ) : (
              staffList.map((staff) => {
                const name = `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
                const initials = (staff.firstName?.[0] || '') + (staff.lastName?.[0] || '');
                return (
                  <View key={staff.id} style={styles.staffCard}>
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffInitial}>{initials || 'S'}</Text>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{name || 'Unknown Staff'}</Text>
                      <Text style={styles.staffRole}>{staff.jobTitle || staff.role || 'Staff Member'}</Text>
                      {!!staff.email && (
                        <View style={styles.contactRow}>
                          <Ionicons name="mail-outline" size={12} color={COLORS.onSurfaceVariant} />
                          <Text style={styles.contactText}>{staff.email}</Text>
                        </View>
                      )}
                      {!!staff.phone && (
                        <View style={styles.contactRow}>
                          <Ionicons name="call-outline" size={12} color={COLORS.onSurfaceVariant} />
                          <Text style={styles.contactText}>{staff.phone}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, staff.isActive === false && styles.statusInactive]}>
                      <Text style={[styles.statusText, staff.isActive === false && styles.statusTextInactive]}>
                        {staff.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setIsAddModalOpen(true)}
          disabled={!isOnline}
        >
          <Ionicons name="add" size={24} color={COLORS.onPrimary} />
        </TouchableOpacity>

        <AddStaffModal 
          visible={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={handleStaffAdded} 
        />
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: COLORS.surfaceContainerLowest },
  titleRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh },
  backButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: COLORS.surfaceContainerLowest },
  pageTitle: { ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface },
  subtitle: { ...TYPOGRAPHY.labelMd, color: '#059669' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 80 },
  offlineState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  offlineTitle: { ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface, marginTop: 16, marginBottom: 8 },
  offlineDesc: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  headerActions: { marginBottom: 24 },
  statsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.surfaceContainerHigh },
  statsIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statsLabel: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  statsValue: { ...TYPOGRAPHY.headlineSm, fontSize: 24, color: COLORS.primary },
  listContainer: { gap: 12 },
  listTitle: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface, marginBottom: 8 },
  loader: { padding: 32, alignItems: 'center' },
  loadingText: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, marginTop: 12 },
  emptyState: { padding: 32, alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16 },
  emptyText: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, marginTop: 12 },
  staffCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: COLORS.surfaceContainerHigh, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  staffAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  staffInitial: { ...TYPOGRAPHY.headlineSm, color: COLORS.onPrimary },
  staffInfo: { flex: 1 },
  staffName: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface },
  staffRole: { ...TYPOGRAPHY.labelMd, color: COLORS.secondary, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  contactText: { fontSize: 11, color: COLORS.onSurfaceVariant },
  statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  statusInactive: { backgroundColor: '#fee2e2' },
  statusTextInactive: { color: '#991b1b' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});
