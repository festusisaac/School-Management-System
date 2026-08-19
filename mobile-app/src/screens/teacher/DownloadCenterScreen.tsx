import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { apiGet, apiPost } from '../../services/api';
import { downloadSecure } from '../../utils/files';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  error: '#ba1a1a',
};

interface DownloadResource {
  id: string;
  title: string;
  description?: string;
  resourceType: string;
  category?: string;
  fileUrl?: string;
  externalUrl?: string;
  mimeType?: string;
  fileSize?: number;
  downloadCount: number;
  viewCount: number;
  subject?: { name: string };
  class?: { name: string };
}

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

export default function DownloadCenterScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';

  const [resources, setResources] = useState<DownloadResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchResources = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/download-center', token);
      setResources(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch resources', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchResources();
    setRefreshing(false);
  }, [fetchResources]);

  const handleOpen = async (item: DownloadResource) => {
    try {
      // Video / external link resources
      if (item.externalUrl) {
        await Linking.openURL(item.externalUrl);
        apiPost(`/download-center/${item.id}/view`, token, {}).catch(() => {});
        return;
      }
      // Uploaded files: download in-app (authenticated) and open in a viewer.
      // ?native=1 makes the server send the real file type + name instead of the
      // web-only text/plain response (which rendered as raw text in a browser).
      await downloadSecure(`/download-center/${item.id}/file?native=1`, token, item.title);
      apiPost(`/download-center/${item.id}/download`, token, {}).catch(() => {});
    } catch (e) {
      Alert.alert('Error', 'Failed to open resource.');
    }
  };

  const filtered = resources.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: DownloadResource }) => {
    const meta = TYPE_META[item.resourceType] || TYPE_META.other;
    const isLink = !!item.externalUrl;
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleOpen(item)} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.typeBadge, { color: meta.color, backgroundColor: meta.bg }]}>
              {meta.label}
            </Text>
            {item.subject?.name ? <Text style={styles.metaText}>{item.subject.name}</Text> : null}
            {item.fileSize ? <Text style={styles.metaText}>{formatSize(item.fileSize)}</Text> : null}
          </View>
        </View>
        <Ionicons
          name={isLink ? 'open-outline' : 'download-outline'}
          size={22}
          color={COLORS.secondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <TeacherLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Download Center</Text>
        <Text style={styles.subtitle}>Materials, syllabi and shared resources</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search resources..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cloud-download-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No resources found</Text>
            <Text style={styles.emptyText}>
              {search ? 'Try a different search term.' : 'No files have been shared yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          />
        )}
      </View>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.onSurface, padding: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  metaText: { fontSize: 12, color: '#64748b' },
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
