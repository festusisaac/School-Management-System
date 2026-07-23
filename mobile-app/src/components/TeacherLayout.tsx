import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TeacherStackParamList } from '../navigation/RootNavigator';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');
import { useAuthStore } from '../store/authStore';
import { useAutoSync, useSyncStore } from '../hooks/useAutoSync';
import { useSettingsStore } from '../store/settingsStore';
import { apiGet } from '../services/api';

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

interface TeacherLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function TeacherLayout({ children, activeTab: activeTabProp = 'Home' }: TeacherLayoutProps) {
  const { user, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const { performSync } = useAutoSync();
  const { isSyncing } = useSyncStore();
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'T';

  const { settings, setSettings, loadFromStorage } = useSettingsStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, []);

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
        navigation.navigate('TeacherDashboard');
        break;
      case 'Classes':
        navigation.navigate('TeacherClasses');
        break;
      case 'Attendance':
        navigation.navigate('Attendance');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const tabs = [
    { key: 'Home', icon: 'home', label: 'Home' },
    { key: 'Classes', icon: 'book', label: 'Classes' },
    { key: 'Attendance', icon: 'checkmark-done-circle', label: 'Attendance' },
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
          <TouchableOpacity style={styles.headerProfileBtn} onPress={() => logout()}>
            <Text style={styles.headerProfileText}>{userInitials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Screen Content --- */}
      <View style={styles.content}>
        {children}
      </View>

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
  content: {
    flex: 1,
  },
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
