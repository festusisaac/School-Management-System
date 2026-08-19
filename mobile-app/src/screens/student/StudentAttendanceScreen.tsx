import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { apiGet } from '../../services/api';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', present: '#16a34a', absent: '#dc2626', late: '#d97706' };

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  present: { color: C.present, bg: '#dcfce7', label: 'Present', icon: 'checkmark-circle' },
  absent: { color: C.absent, bg: '#fee2e2', label: 'Absent', icon: 'close-circle' },
  late: { color: C.late, bg: '#fef3c7', label: 'Late', icon: 'time' },
  excused: { color: C.secondary, bg: '#eff6ff', label: 'Excused', icon: 'shield-checkmark' },
};

function fmt(d: string) { const date = new Date(d); return isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }

export default function StudentAttendanceScreen() {
  const { user } = useAuthStore();
  const { profile } = useStudentStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !profile?.id) return;
    try {
      const end = new Date();
      const start = new Date(); start.setMonth(start.getMonth() - 6);
      const s = start.toISOString().slice(0, 10); const e = end.toISOString().slice(0, 10);
      const data = await apiGet(`/students/attendance/student/${profile.id}?startDate=${s}&endDate=${e}`, token);
      const list = Array.isArray(data) ? data : data?.records || data?.data || [];
      list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(list);
    } catch (err) { console.error('Failed to load attendance', err); } finally { setLoading(false); }
  }, [token, profile?.id]);

  useEffect(() => { if (profile?.id) load(); }, [load, profile?.id]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, total: records.length };
    records.forEach((r) => { const st = (r.status || '').toLowerCase(); if (st === 'present') counts.present++; else if (st === 'absent') counts.absent++; else if (st === 'late') counts.late++; });
    const pct = counts.total > 0 ? Math.round(((counts.present + counts.late) / counts.total) * 100) : 0;
    return { ...counts, pct };
  }, [records]);

  const renderItem = ({ item }: { item: any }) => {
    const meta = STATUS_META[(item.status || '').toLowerCase()] || STATUS_META.absent;
    return (
      <View style={styles.row}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
        <Text style={styles.rowDate}>{fmt(item.date)}</Text>
        <Text style={[styles.rowStatus, { color: meta.color, backgroundColor: meta.bg }]}>{meta.label}</Text>
      </View>
    );
  };

  return (
    <StudentLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Attendance</Text>
        <Text style={styles.subtitle}>Last 6 months</Text>

        <View style={styles.pctCard}>
          <Text style={styles.pctLabel}>Attendance Rate</Text>
          <Text style={styles.pctValue}>{summary.pct}%</Text>
          <View style={styles.pctChips}>
            <Text style={[styles.chip, { color: C.present, backgroundColor: '#dcfce7' }]}>{summary.present} Present</Text>
            <Text style={[styles.chip, { color: C.late, backgroundColor: '#fef3c7' }]}>{summary.late} Late</Text>
            <Text style={[styles.chip, { color: C.absent, backgroundColor: '#fee2e2' }]}>{summary.absent} Absent</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={styles.empty}><Ionicons name="calendar-outline" size={44} color={C.faint} /><Text style={styles.emptyText}>No attendance records yet.</Text></View>
        ) : (
          <FlatList data={records} keyExtractor={(i, idx) => i.id || `${idx}`} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24, gap: 8 }} showsVerticalScrollIndicator={false}
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
  pctCard: { backgroundColor: C.primary, borderRadius: 16, padding: 18, marginBottom: 16 },
  pctLabel: { fontSize: 12, color: '#8293b5', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  pctValue: { fontSize: 34, fontWeight: '900', color: '#fff', marginTop: 4 },
  pctChips: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  rowDate: { flex: 1, fontSize: 14, fontWeight: '600', color: C.onSurface },
  rowStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  empty: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
