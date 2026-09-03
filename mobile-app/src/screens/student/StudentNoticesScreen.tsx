import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { fetchNotices, stripHtml, markNoticeSeen, Notice } from '../../utils/notices';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', error: '#ba1a1a', warn: '#d97706' };

function fmt(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StudentNoticesScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!token) return;
    const data = await fetchNotices(token, 'Students');
    data.sort((a, b) => {
      if (!!a.isSticky !== !!b.isSticky) return a.isSticky ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setNotices(data);
    if (user?.id) data.forEach((n) => markNoticeSeen(user.id, n.id));
    setLoading(false);
  }, [token, user?.id]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const renderItem = ({ item }: { item: Notice }) => {
    const body = stripHtml(item.content);
    const isOpen = expanded[item.id];
    const author = item.author ? `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim() : '';
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}><Ionicons name="megaphone-outline" size={20} color={C.secondary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardDate}>{author ? `${author} • ` : ''}{fmt(item.createdAt)}</Text>
          </View>
          {item.isSticky ? <Ionicons name="pin" size={14} color={C.warn} /> : null}
        </View>
        <Text style={styles.cardBody} numberOfLines={isOpen ? undefined : 3}>{body}</Text>
        {body.length > 140 && <Text style={styles.readMore}>{isOpen ? 'Show less' : 'Read more'}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <StudentLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notices</Text>
        <Text style={styles.subtitle}>Announcements from your school</Text>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : notices.length === 0 ? (
          <View style={styles.empty}><Ionicons name="megaphone-outline" size={44} color={C.faint} /><Text style={styles.emptyText}>No notices yet.</Text></View>
        ) : (
          <FlatList data={notices} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />} />
        )}
      </View>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  title: { fontSize: 22, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  cardDate: { fontSize: 12, color: C.faint, marginTop: 2 },
  cardBody: { fontSize: 13, color: '#475569', lineHeight: 19 },
  readMore: { fontSize: 12, fontWeight: '700', color: C.secondary, marginTop: 6 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
