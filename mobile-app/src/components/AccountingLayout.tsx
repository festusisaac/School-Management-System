import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountingStackParamList } from '../navigation/RootNavigator';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');
import { useAuthStore } from '../store/authStore';
import { useAutoSync, useSyncStore } from '../hooks/useAutoSync';
import { useSettingsStore } from '../store/settingsStore';
import { useSectionStore } from '../store/sectionStore';
import { apiGet, getFileUrl } from '../services/api';

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
};

interface AccountingLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function AccountingLayout({ children, activeTab: activeTabProp = 'Home' }: AccountingLayoutProps) {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const { performSync } = useAutoSync();
  const { isSyncing } = useSyncStore();
  const navigation = useNavigation<NativeStackNavigationProp<AccountingStackParamList>>();

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'A';

  const { settings, setSettings, loadFromStorage } = useSettingsStore();
  const { availableSections, activeSectionId, setSections, setActiveSectionId, loadFromStorage: loadSection } = useSectionStore();
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const activeSection = availableSections.find((s) => s.id === activeSectionId);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadFromStorage();
    loadSection();
  }, []);

  // Load the accountant's assigned sections (they may only work within these).
  useEffect(() => {
    if (!isOnline || !user?.token) return;
    apiGet('/hr/staff/profile/me', user.token)
      .then((data: any) => {
        const sections = Array.isArray(data?.sections) ? data.sections.map((s: any) => ({ id: s.id, name: s.name })) : [];
        setSections(sections);
        setPhoto(getFileUrl(data?.photo) || null);
      })
      .catch((e) => console.log('Failed to load assigned sections', e));
  }, [isOnline, user?.token]);

  useEffect(() => {
    if (isOnline && user?.token) {
      apiGet('/system/settings', user.token)
        .then((data: any) => {
          if (data) {
            setSettings({
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
        })
        .catch((e) => console.log('Failed to fetch system settings', e));
    }
  }, [isOnline, user?.token]);

  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('AccountingDashboard');
        break;
      case 'Payments':
        navigation.navigate('FeesHistory');
        break;
      case 'Expenses':
        navigation.navigate('Expenses');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const tabs = [
    { key: 'Home', icon: 'home', label: 'Home' },
    { key: 'Payments', icon: 'receipt', label: 'Payments' },
    { key: 'Expenses', icon: 'wallet', label: 'Expenses' },
    { key: 'Profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* --- Shared App Header --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={schoolLogo} style={{ width: 28, height: 28, marginRight: 8, borderRadius: 4 }} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>PHJC School</Text>
            {(settings.currentSessionName || settings.currentTermName) && (
              <Text style={{ fontSize: 10, color: COLORS.outline, marginTop: -2 }}>
                {settings.currentSessionName}{settings.currentTermName ? ` • ${settings.currentTermName}` : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.onlineBadge, !isOnline && { backgroundColor: '#fef2f2' }]}>
            <Ionicons
              name={isSyncing ? 'sync' : isOnline ? 'swap-vertical' : 'cloud-offline'}
              size={12}
              color={isSyncing ? COLORS.secondary : isOnline ? COLORS.successText : COLORS.error}
            />
            <Text style={[styles.onlineText, !isOnline && { color: COLORS.error }]}>
              {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={performSync} disabled={isSyncing}>
            <Ionicons name="refresh" size={22} color={isSyncing ? COLORS.outline : COLORS.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerProfileBtn} onPress={() => navigation.navigate('Profile')}>
            {photo || user?.photo ? (
              <Image source={{ uri: photo || getFileUrl(user?.photo) }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <Text style={styles.headerProfileText}>{userInitials}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Section Context Bar --- */}
      {availableSections.length > 0 && (
        <TouchableOpacity
          style={styles.sectionBar}
          activeOpacity={availableSections.length > 1 ? 0.7 : 1}
          onPress={() => availableSections.length > 1 && setSectionPickerOpen(true)}
        >
          <Ionicons name="git-branch-outline" size={14} color={COLORS.secondary} />
          <Text style={styles.sectionBarLabel}>Section:</Text>
          <Text style={styles.sectionBarValue}>{activeSection?.name || 'Select'}</Text>
          {availableSections.length > 1 && <Ionicons name="chevron-down" size={14} color={COLORS.secondary} />}
        </TouchableOpacity>
      )}

      {/* --- Screen Content --- */}
      <View style={styles.content}>{children}</View>

      {/* --- Section Picker --- */}
      <Modal visible={sectionPickerOpen} transparent animationType="fade" onRequestClose={() => setSectionPickerOpen(false)}>
        <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setSectionPickerOpen(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Switch Section</Text>
              <TouchableOpacity onPress={() => setSectionPickerOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isActive = item.id === activeSectionId;
                return (
                  <TouchableOpacity
                    style={[styles.pickerOption, isActive && styles.pickerOptionActive]}
                    onPress={() => {
                      setActiveSectionId(item.id);
                      setSectionPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, isActive && styles.pickerOptionTextActive]}>{item.name}</Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={COLORS.secondary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- Shared Bottom Navigation --- */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTabProp === tab.key;
          const iconName = isActive ? tab.icon : `${tab.icon}-outline`;
          return (
            // @ts-ignore
            <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => handleTabPress(tab.key)}>
              {/* @ts-ignore */}
              <Ionicons name={iconName as any} size={22} color={isActive ? COLORS.secondary : '#64748b'} />
              <Text style={[styles.navText, isActive && styles.navTextActive]} numberOfLines={1}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onlineText: { fontSize: 11, fontWeight: '600', color: COLORS.successText },
  iconButton: { padding: 4 },
  headerProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    overflow: 'hidden',
  },
  headerProfileText: { color: '#bae6fd', fontWeight: 'bold', fontSize: 12 },
  content: { flex: 1 },
  sectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  sectionBarLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  sectionBarValue: { fontSize: 12, color: COLORS.secondary, fontWeight: '800' },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10 },
  pickerOptionActive: { backgroundColor: '#eff6ff' },
  pickerOptionText: { fontSize: 15, color: COLORS.onSurface },
  pickerOptionTextActive: { color: COLORS.secondary, fontWeight: '700' },
  bottomNav: {
    height: 64,
    backgroundColor: COLORS.surfaceContainerLowest,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  navText: { fontSize: 10, fontWeight: '500', color: '#64748b', marginTop: 4 },
  navTextActive: { color: COLORS.secondary, fontWeight: '600' },
});
