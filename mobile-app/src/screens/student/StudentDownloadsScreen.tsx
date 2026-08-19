import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { apiGet, apiPost } from '../../services/api';
import { downloadSecure } from '../../utils/files';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6' };

const TYPE_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  material: { icon: 'document-text', color: '#2563eb', bg: '#eff6ff', label: 'Material' },
  syllabus: { icon: 'list', color: '#7c3aed', bg: '#f5f3ff', label: 'Syllabus' },
  video: { icon: 'videocam', color: '#dc2626', bg: '#fee2e2', label: 'Video' },
  academic_program: { icon: 'school', color: '#059669', bg: '#ecfdf5', label: 'Program' },
  other: { icon: 'folder', color: '#d97706', bg: '#fef3c7', label: 'Other' },
};

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function StudentDownloadsScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/download-center', token);
      setResources(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Failed to load resources', e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const openItem = async (item: any) => {
    try {
      // External links (e.g. YouTube) open in the browser as usual.
      if (item.externalUrl) { await Linking.openURL(item.externalUrl); apiPost(`/download-center/${item.id}/view`, token, {}).catch(() => {}); return; }
      // Uploaded files: download in-app (authenticated) and open in a viewer —
      // ?native=1 makes the server send the real file type + name instead of the
      // web-only text/plain response (which was showing as raw text in a browser).
      await downloadSecure(`/download-center/${item.id}/file?native=1`, token, item.title);
      apiPost(`/download-center/${item.id}/download`, token, {}).catch(() => {});
    } catch { Alert.alert('Error', 'Failed to open resource.'); }
  };

  const filtered = resources.filter((r) => r.title?.toLowerCase().includes(search.toLowerCase()) || r.subject?.name?.toLowerCase().includes(search.toLowerCase()));

  const renderItem = ({ item }: { item: any }) => {
    const meta = TYPE_META[item.resourceType] || TYPE_META.other;
    return (
      <TouchableOpacity style={styles.card} onPress={() => openItem(item)} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}><Ionicons name={meta.icon} size={22} color={meta.color} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.typeBadge, { color: meta.color, backgroundColor: meta.bg }]}>{meta.label}</Text>
            {item.subject?.name ? <Text style={styles.metaText}>{item.subject.name}</Text> : null}
            {item.fileSize ? <Text style={styles.metaText}>{formatSize(item.fileSize)}</Text> : null}
          </View>
        </View>
        <Ionicons name={item.externalUrl ? 'open-outline' : 'download-outline'} size={22} color={C.secondary} />
      </TouchableOpacity>
    );
  };

  return (
    <StudentLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.subtitle}>Materials shared with you</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={C.faint} />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search resources..." placeholderTextColor={C.faint} />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="cloud-download-outline" size={44} color={C.faint} /><Text style={styles.emptyText}>{search ? 'No matches.' : 'No resources yet.'}</Text></View>
        ) : (
          <FlatList data={filtered} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: C.onSurface, padding: 0 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  typeBadge: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  metaText: { fontSize: 12, color: C.muted },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
