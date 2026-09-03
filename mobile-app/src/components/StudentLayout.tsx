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
import type { StudentStackParamList } from '../navigation/RootNavigator';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useStudentStore } from '../store/studentStore';
import { apiGet, getFileUrl } from '../services/api';
import { fetchNotices, stripHtml, isNoticeSeen, isNoticePopped, markNoticePopped, Notice } from '../utils/notices';

// Check for new notices only once per app launch cycle (layout remounts per screen).
let cachedNotices: Notice[] = [];
let lastNoticeFetch = 0;
const FETCH_THROTTLE_MS = 30000;
const POLL_INTERVAL_MS = 60000;

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  secondary: '#055db6',
  error: '#ba1a1a',
  successLight: '#dcfce7',
  successText: '#166534',
};

interface StudentLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function StudentLayout({ children, activeTab: activeTabProp = 'Home' }: StudentLayoutProps) {
  const { user } = useAuthStore();
  const { settings, loadFromStorage } = useSettingsStore();
  const { profile, fetchProfile } = useStudentStore();
  const [isOnline, setIsOnline] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();

  const userInitials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'S';

  const [popupNotice, setPopupNotice] = useState<Notice | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setIsOnline(!!s.isConnected));
    return () => unsub();
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Load the student's own profile once (studentId, class, etc.) + settings.
  useEffect(() => {
    if (!user?.token) return;
    fetchProfile(user.token);
    apiGet('/system/settings', user.token)
      .then((data: any) => {
        if (data) {
          useSettingsStore.getState().setSettings({
            schoolName: data.schoolName,
            currentSessionName: data.currentSessionName,
            currentTermName: data.currentTermName,
            currencySymbol: data.currencySymbol || '₦',
            schoolAddress: data.schoolAddress,
            schoolMotto: data.schoolMotto,
            primaryLogo: data.primaryLogo,
            printLogo: data.printLogo,
            principalSignature: data.principalSignature,
            bursarSignature: data.bursarSignature,
            reportCardConfig: data.reportCardConfig,
          } as any);
        }
      })
      .catch(() => {});
  }, [user?.token]);

  const recomputeUnread = useCallback(async () => {
    if (!user?.id) return;
    let count = 0;
    for (const n of cachedNotices) {
      if (!(await isNoticeSeen(user.id, n.id))) count++;
    }
    setUnreadCount(count);
  }, [user?.id]);

  const checkNotices = useCallback(
    async (force: boolean) => {
      if (!user?.token || !user?.id || !isOnline) return;
      const now = Date.now();
      if (!force && now - lastNoticeFetch < FETCH_THROTTLE_MS) {
        await recomputeUnread();
        return;
      }
      lastNoticeFetch = now;
      const notices = await fetchNotices(user.token, 'Students');
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

  useEffect(() => {
    checkNotices(false);
    const interval = setInterval(() => checkNotices(true), POLL_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') checkNotices(true);
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [checkNotices]);

  useFocusEffect(
    useCallback(() => {
      checkNotices(false);
    }, [checkNotices])
  );

  const handleTab = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('StudentDashboard');
        break;
      case 'Results':
        navigation.navigate('Results');
        break;
      case 'Homework':
        navigation.navigate('Homework');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const tabs = [
    { key: 'Home', icon: 'home', label: 'Home' },
    { key: 'Results', icon: 'ribbon', label: 'Results' },
    { key: 'Homework', icon: 'document-text', label: 'Homework' },
    { key: 'Profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
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
            <Ionicons name={isOnline ? 'cloud-done' : 'cloud-offline'} size={12} color={isOnline ? COLORS.successText : COLORS.error} />
            <Text style={[styles.onlineText, !isOnline && { color: COLORS.error }]}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.headerProfileBtn} onPress={() => navigation.navigate('Profile')}>
            {profile?.studentPhoto ? (
              <Image source={{ uri: getFileUrl(profile.studentPhoto) }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <Text style={styles.headerProfileText}>{userInitials}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Floating notice bell */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.floatingBell} activeOpacity={0.85} onPress={() => navigation.navigate('Notices')}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTabProp === tab.key;
          const iconName = isActive ? tab.icon : `${tab.icon}-outline`;
          return (
            <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => handleTab(tab.key)}>
              {/* @ts-ignore */}
              <Ionicons name={iconName as any} size={22} color={isActive ? COLORS.secondary : '#64748b'} />
              <Text style={[styles.navText, isActive && styles.navTextActive]} numberOfLines={1}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* New notice popup */}
      <Modal visible={!!popupNotice} transparent animationType="fade" onRequestClose={() => setPopupNotice(null)}>
        <View style={styles.noticeBackdrop}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeIconWrap}>
              <Ionicons name="notifications" size={26} color={COLORS.secondary} />
            </View>
            <Text style={styles.noticeHeading}>New School Notice</Text>
            <Text style={styles.noticeTitle} numberOfLines={2}>{popupNotice?.title}</Text>
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
  headerProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerProfileText: { color: '#bae6fd', fontWeight: 'bold', fontSize: 12 },
  content: { flex: 1 },
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
  noticeBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  noticeCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' },
  noticeIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  noticeHeading: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  noticeTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center', marginTop: 6, marginBottom: 12 },
  noticeBody: { fontSize: 14, color: '#475569', lineHeight: 20, textAlign: 'center' },
  noticeActions: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  noticeDismiss: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  noticeDismissText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  noticeRead: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.secondary, alignItems: 'center' },
  noticeReadText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
