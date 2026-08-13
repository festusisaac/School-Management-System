import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { fetchStaffNotices, stripHtml, markNoticeSeen, Notice } from '../../utils/notices';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  error: '#ba1a1a',
  warning: '#d97706',
};

function priorityMeta(p?: string) {
  const v = (p || '').toLowerCase();
  if (v === 'high' || v === 'urgent') return { color: COLORS.error, bg: '#fee2e2', label: p! };
  if (v === 'medium') return { color: COLORS.warning, bg: '#fef3c7', label: p! };
  return null;
}

function fmt(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime())
    ? d
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NoticesScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!token) return;
    const data = await fetchStaffNotices(token);
    // Sticky first, then newest
    data.sort((a, b) => {
      if (!!a.isSticky !== !!b.isSticky) return a.isSticky ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setNotices(data);
    // Mark all as seen so the popup won't re-fire for these
    if (user?.id) data.forEach((n) => markNoticeSeen(user.id, n.id));
    setLoading(false);
  }, [token, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }: { item: Notice }) => {
    const pm = priorityMeta(item.priority);
    const body = stripHtml(item.content);
    const isOpen = expanded[item.id];
    const author = item.author ? `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim() : '';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="megaphone-outline" size={20} color={COLORS.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardDate}>
              {author ? `${author} • ` : ''}
              {fmt(item.createdAt)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {item.isSticky ? <Ionicons name="pin" size={14} color={COLORS.warning} /> : null}
            {pm ? <Text style={[styles.priority, { color: pm.color, backgroundColor: pm.bg }]}>{pm.label}</Text> : null}
          </View>
        </View>
        <Text style={styles.cardBody} numberOfLines={isOpen ? undefined : 3}>
          {body}
        </Text>
        {body.length > 140 && (
          <Text style={styles.readMore}>{isOpen ? 'Show less' : 'Read more'}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <TeacherLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Notices</Text>
        <Text style={styles.subtitle}>Announcements from the school</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : notices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="megaphone-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No notices</Text>
            <Text style={styles.emptyText}>You're all caught up. New announcements will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={notices}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          />
        )}
      </View>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  priority: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  cardBody: { fontSize: 13, color: '#475569', lineHeight: 19 },
  readMore: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, marginTop: 6 },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 8,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, marginTop: 4 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
});
