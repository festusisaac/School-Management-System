import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

const quickActions = [
  { label: "My Child's Results", icon: '📊', color: '#6366f1' },
  { label: 'Attendance Record', icon: '✅', color: '#10b981' },
  { label: 'Fee Payment', icon: '💳', color: '#f59e0b' },
  { label: 'School Notices', icon: '📢', color: '#3b82f6' },
  { label: 'Behaviour Report', icon: '🧾', color: '#8b5cf6' },
  { label: 'Message Teacher', icon: '💬', color: '#ec4899' },
];

export default function ParentDashboard() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Parent 👨‍👩‍👧</Text>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Parent Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>School Announcements</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No announcements yet.{'\n'}Check back soon.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    marginTop: 12,
  },
  greeting: { color: '#94a3b8', fontSize: 14 },
  name: { color: '#f1f5f9', fontSize: 22, fontWeight: '800', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  badge: {
    backgroundColor: '#ec4899',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: { color: '#475569', textAlign: 'center', lineHeight: 22, fontSize: 14 },
});
