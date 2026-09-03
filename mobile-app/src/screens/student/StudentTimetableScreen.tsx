import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { apiGet } from '../../services/api';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6' };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface Slot { id: string; dayOfWeek: number; period?: { startTime?: string; endTime?: string; name?: string; periodOrder?: number }; subject?: { name?: string }; teacher?: { firstName?: string; lastName?: string }; }

export default function StudentTimetableScreen() {
  const { user } = useAuthStore();
  const { profile } = useStudentStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(() => { const t = new Date().getDay(); return t === 0 || t === 6 ? 1 : t; });

  const load = useCallback(async () => {
    if (!token || !profile?.classId) return;
    try {
      const sectionParam = profile.sectionId ? `&sectionId=${profile.sectionId}` : '';
      const data = await apiGet(`/academics/timetable/slots?classId=${profile.classId}${sectionParam}`, token);
      setSlots(Array.isArray(data) ? data : data?.data || []);
    } catch (e) { console.error('Failed to load timetable', e); } finally { setLoading(false); }
  }, [token, profile?.classId, profile?.sectionId]);

  useEffect(() => { if (profile?.classId) load(); }, [load, profile?.classId]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const daySlots = slots.filter((s) => s.dayOfWeek === selectedDay).sort((a, b) => (a.period?.periodOrder || 0) - (b.period?.periodOrder || 0));
  const countForDay = (d: number) => slots.filter((s) => s.dayOfWeek === d).length;

  return (
    <StudentLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Timetable</Text>
        <Text style={styles.subtitle}>{profile?.class?.name || 'Your class'} weekly schedule</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayBar} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {WEEK_ORDER.map((day) => {
            const active = day === selectedDay; const count = countForDay(day);
            return (
              <TouchableOpacity key={day} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => setSelectedDay(day)}>
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{DAY_NAMES[day].slice(0, 3)}</Text>
                {count > 0 && <View style={[styles.dayCount, active && styles.dayCountActive]}><Text style={[styles.dayCountText, active && styles.dayCountTextActive]}>{count}</Text></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>
            <Text style={styles.dayHeading}>{DAY_NAMES[selectedDay]}</Text>
            {daySlots.length === 0 ? (
              <View style={styles.empty}><Ionicons name="cafe-outline" size={44} color={C.faint} /><Text style={styles.emptyText}>No classes on {DAY_NAMES[selectedDay]}.</Text></View>
            ) : (
              daySlots.map((slot) => (
                <View key={slot.id} style={styles.periodCard}>
                  <View style={styles.periodTime}>
                    <Text style={styles.periodStart}>{slot.period?.startTime || '--'}</Text>
                    <Text style={styles.periodEnd}>{slot.period?.endTime || ''}</Text>
                  </View>
                  <View style={styles.periodDivider} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.periodSubject}>{slot.subject?.name || slot.period?.name || 'N/A'}</Text>
                    {slot.teacher && <Text style={styles.periodTeacher}><Ionicons name="person-outline" size={12} color={C.muted} /> {slot.teacher.firstName} {slot.teacher.lastName}</Text>}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
  dayBar: { flexGrow: 0, marginBottom: 16 },
  dayChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  dayChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  dayChipText: { fontSize: 13, fontWeight: '700', color: C.muted },
  dayChipTextActive: { color: '#fff' },
  dayCount: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dayCountActive: { backgroundColor: C.secondary },
  dayCountText: { fontSize: 10, fontWeight: '800', color: C.muted },
  dayCountTextActive: { color: '#fff' },
  dayHeading: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  periodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  periodTime: { width: 56 },
  periodStart: { fontSize: 14, fontWeight: '800', color: C.secondary },
  periodEnd: { fontSize: 11, color: C.faint, marginTop: 2 },
  periodDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e2e8f0', marginHorizontal: 14 },
  periodSubject: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  periodTeacher: { fontSize: 12, color: C.muted, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 20, gap: 10, backgroundColor: C.card, borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
