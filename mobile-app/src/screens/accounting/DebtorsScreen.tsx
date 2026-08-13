import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccountingLayout from '../../components/AccountingLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSectionStore } from '../../store/sectionStore';
import { apiGet } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  danger: '#dc2626',
  warn: '#d97706',
};

interface Debtor {
  id: string;
  student: { firstName?: string; lastName?: string; admissionNo?: string; class?: { name?: string } };
  totalDue: string | number;
  balance: string | number;
}

export default function DebtorsScreen() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const activeSectionId = useSectionStore((s) => s.activeSectionId);
  const token = user?.token || '';
  const currency = settings?.currencySymbol || '₦';
  const money = (n: any) => `${currency}${Number(n || 0).toLocaleString()}`;

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [stats, setStats] = useState<any>({ totalOutstanding: 0, debtorCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const cacheKey = `debtors_cache_${activeSectionId || 'all'}`;

  // Debtor balances are computed server-side, so we fetch live and cache the
  // result. Offline, we fall back to the last-synced snapshot.
  const load = useCallback(async () => {
    if (!token) return;
    try {
      const sectionParam = activeSectionId ? `&sectionId=${activeSectionId}` : '';
      const res = await apiGet(`/finance/debtors?limit=200${sectionParam}`, token);
      const list = res?.items || res?.data || (Array.isArray(res) ? res : []);
      const st = res?.stats || { totalOutstanding: 0, debtorCount: list.length };
      setDebtors(list);
      setStats(st);
      setFromCache(false);
      AsyncStorage.setItem(cacheKey, JSON.stringify({ list, stats: st, at: Date.now() })).catch(() => {});
    } catch (e) {
      // Offline or request failed → show the last-synced snapshot if we have one.
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDebtors(parsed.list || []);
          setStats(parsed.stats || { totalOutstanding: 0, debtorCount: 0 });
          setCachedAt(parsed.at || null);
          setFromCache(true);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [token, activeSectionId, cacheKey]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const name = (d: Debtor) => `${d.student?.firstName || ''} ${d.student?.lastName || ''}`.trim() || 'Unknown';
  const filtered = debtors.filter((d) => {
    const q = search.toLowerCase();
    return name(d).toLowerCase().includes(q) || (d.student?.admissionNo || '').toLowerCase().includes(q);
  });

  const renderItem = ({ item }: { item: Debtor }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.student?.firstName?.[0] || '') + (item.student?.lastName?.[0] || '')}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>{name(item)}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {(item.student?.admissionNo || '—')}
          {item.student?.class?.name ? ` • ${item.student.class.name}` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.balance}>{money(item.balance)}</Text>
        <Text style={styles.balanceLabel}>owing</Text>
      </View>
    </View>
  );

  return (
    <AccountingLayout activeTab="Home">
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Fee Defaulters</Text>
        <Text style={styles.subtitle}>Students with outstanding balances</Text>

        {fromCache && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={14} color={COLORS.warn} />
            <Text style={styles.offlineText}>
              Offline — showing last synced{cachedAt ? ` (${new Date(cachedAt).toLocaleDateString()})` : ''}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: COLORS.danger }]}>
            <Text style={styles.statValue}>{money(stats.totalOutstanding)}</Text>
            <Text style={styles.statLabel}>Total Outstanding</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.warn }]}>
            <Text style={styles.statValue}>{stats.debtorCount ?? filtered.length}</Text>
            <Text style={styles.statLabel}>Defaulters</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or adm. no..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="happy-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>{search ? 'No matching students.' : 'No defaulters — all clear!'}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          />
        )}
      </View>
    </AccountingLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  offlineText: { fontSize: 12, color: '#92400e', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderTopWidth: 3,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: COLORS.danger },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  balance: { fontSize: 15, fontWeight: '800', color: COLORS.danger },
  balanceLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 8,
    gap: 10,
  },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
