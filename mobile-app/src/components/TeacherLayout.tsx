import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  Modal,
  ScrollView,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TeacherStackParamList } from '../navigation/RootNavigator';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');
import { useAuthStore } from '../store/authStore';
import { useAutoSync, useSyncStore } from '../hooks/useAutoSync';
import { useSettingsStore } from '../store/settingsStore';
import { apiGet, getFileUrl } from '../services/api';
import { fetchStaffNotices, stripHtml, isNoticeSeen, isNoticePopped, markNoticePopped, Notice } from '../utils/notices';

// Cache the fetched notices so the unread badge can recompute cheaply on focus.
let cachedNotices: Notice[] = [];
// Throttle network fetches (focus/mount can fire often); the interval forces refreshes.
let lastNoticeFetch = 0;
const FETCH_THROTTLE_MS = 30000; // don't refetch on focus more often than this
const POLL_INTERVAL_MS = 60000; // background poll cadence while a screen is open

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
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const { performSync } = useAutoSync();
  const { isSyncing } = useSyncStore();
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const [popupNotice, setPopupNotice] = useState<Notice | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Count notices not yet marked seen (cheap: cached notices + AsyncStorage reads).
  const recomputeUnread = useCallback(async () => {
    if (!user?.id) return;
    let count = 0;
    for (const n of cachedNotices) {
      if (!(await isNoticeSeen(user.id, n.id))) count++;
    }
    setUnreadCount(count);
  }, [user?.id]);

  // Fetch notices, pop up the newest unseen one, refresh the badge.
  // force=true bypasses the focus throttle (used by the poll + foreground events).
  const checkNotices = useCallback(
    async (force: boolean) => {
      if (!user?.token || !user?.id || !isOnline) return;
      const now = Date.now();
      if (!force && now - lastNoticeFetch < FETCH_THROTTLE_MS) {
        await recomputeUnread(); // cheap refresh from cache, no network
        return;
      }
      lastNoticeFetch = now;
      const notices = await fetchStaffNotices(user.token);
      notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      cachedNotices = notices;
      const latest = notices[0];
      if (latest && !(await isNoticePopped(user.id, latest.id))) {
        await markNoticePopped(user.id, latest.id);
        setPopupNotice(latest);
      }
      await recomputeUnread();
    },
    [user?.token, user?.id, isOnline, recomputeUnread]
  );

  // Poll while a screen is open, and refresh when the app returns to foreground.
  useEffect(() => {
    checkNotices(false);
    const interval = setInterval(() => checkNotices(true), POLL_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkNotices(true);
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [checkNotices]);

  // Recompute the badge whenever a screen regains focus (e.g. after returning
  // from the Notices list, which marks everything seen).
  useFocusEffect(
    useCallback(() => {
      checkNotices(false);
    }, [checkNotices])
  );

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'T';
  const [photo, setPhoto] = useState<string | null>(null);

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
      apiGet('/hr/staff/profile/me', user.token)
        .then((data: any) => setPhoto(getFileUrl(data?.photo) || null))
        .catch((e) => console.log('Failed to load profile photo', e));
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
          <TouchableOpacity style={styles.headerProfileBtn} onPress={() => navigation.navigate('Profile')}>
            {photo || user?.photo ? (
              <Image source={{ uri: photo || getFileUrl(user?.photo) }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <Text style={styles.headerProfileText}>{userInitials}</Text>
            )}
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

      {/* --- Floating notice bell (only when there are unread notices) --- */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.floatingBell}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Notices')}
        >
          <Ionicons name="notifications" size={24} color="#fff" />
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* --- New Notice Popup --- */}
      <Modal
        visible={!!popupNotice}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupNotice(null)}
      >
        <View style={styles.noticeBackdrop}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeIconWrap}>
              <Ionicons name="notifications" size={26} color={COLORS.secondary} />
            </View>
            <Text style={styles.noticeHeading}>New School Notice</Text>
            <Text style={styles.noticeTitle} numberOfLines={2}>
              {popupNotice?.title}
            </Text>
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.noticeBody}>{stripHtml(popupNotice?.content)}</Text>
            </ScrollView>
            <View style={styles.noticeActions}>
              <TouchableOpacity style={styles.noticeDismiss} onPress={() => setPopupNotice(null)}>
                <Text style={styles.noticeDismissText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noticeRead}
                onPress={() => {
                  setPopupNotice(null);
                  navigation.navigate('Notices');
                }}
              >
                <Text style={styles.noticeReadText}>Read all</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  floatingBell: {
    position: 'absolute',
    right: 16,
    top: '45%',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 50,
  },
  floatingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  floatingBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
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

  /* --- Notice popup --- */
  noticeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noticeCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  noticeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noticeHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  noticeBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
  },
  noticeActions: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  noticeDismiss: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  noticeDismissText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  noticeRead: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  noticeReadText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
