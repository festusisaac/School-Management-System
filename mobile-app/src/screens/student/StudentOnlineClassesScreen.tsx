import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { apiGet } from '../../services/api';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', success: '#16a34a', error: '#ba1a1a', warn: '#d97706' };

function getStatus(item: any) {
  const now = Date.now(); const start = new Date(item.startTime).getTime(); const end = new Date(item.endTime).getTime();
  if (item.status === 'CANCELLED') return { label: 'Cancelled', color: C.error, bg: '#fee2e2' };
  if (now < start) return { label: 'Upcoming', color: C.secondary, bg: '#eff6ff' };
  if (now >= start && now < end) return { label: 'Live Now', color: C.success, bg: '#dcfce7' };
  return { label: 'Finished', color: '#64748b', bg: '#f1f5f9' };
}
function fmtWhen(iso: string) { const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

export default function StudentOnlineClassesScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/online-classes', token);
      const list = Array.isArray(data) ? data : [];
      list.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setClasses(list.filter((c: any) => c.status !== 'CANCELLED'));
    } catch (e) { console.error('Failed to load online classes', e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const join = async (item: any) => {
    try { await Linking.openURL(item.meetingUrl); } catch { Alert.alert('Error', 'Could not open the meeting link.'); }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = getStatus(item); const ended = Date.now() > new Date(item.endTime).getTime();
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardMeta}>{(item.class?.name || 'Class')} • {(item.subject?.name || 'General')}</Text>
          </View>
          <Text style={[styles.statusBadge, { color: status.color, backgroundColor: status.bg }]}>{status.label}</Text>
        </View>
        <View style={styles.timingRow}>
          <Ionicons name="time-outline" size={14} color={C.muted} />
          <Text style={styles.timingText}>{fmtWhen(item.startTime)} — {fmtWhen(item.endTime)}</Text>
        </View>
        {ended ? (
          <View style={[styles.joinBtn, styles.joinBtnDisabled]}><Ionicons name="time-outline" size={16} color={C.faint} /><Text style={styles.joinBtnDisabledText}>Class Ended</Text></View>
        ) : (
          <TouchableOpacity style={styles.joinBtn} onPress={() => join(item)}><Ionicons name="videocam" size={16} color="#fff" /><Text style={styles.joinBtnText}>Join Meeting</Text></TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <StudentLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Online Classes</Text>
        <Text style={styles.subtitle}>Join your virtual lessons</Text>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : classes.length === 0 ? (
          <View style={styles.empty}><Ionicons name="videocam-outline" size={44} color={C.faint} /><Text style={styles.emptyText}>No online classes scheduled.</Text></View>
        ) : (
          <FlatList data={classes} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  cardMeta: { fontSize: 12, color: C.secondary, fontWeight: '600', marginTop: 2 },
  statusBadge: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginBottom: 12 },
  timingText: { fontSize: 12, color: C.muted, fontWeight: '500' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.secondary, paddingVertical: 11, borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  joinBtnDisabled: { backgroundColor: '#f1f5f9' },
  joinBtnDisabledText: { color: C.faint, fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
