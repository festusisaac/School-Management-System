import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { apiGet } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
};

// JS getDay(): 0 = Sunday
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

interface Slot {
  id: string;
  dayOfWeek: number;
  period?: { startTime?: string; endTime?: string; name?: string; periodOrder?: number };
  subject?: { name?: string };
  class?: { name?: string };
  section?: { name?: string };
}

export default function MyTimetableScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const t = new Date().getDay();
    return t === 0 || t === 6 ? 1 : t; // default to Monday on weekends
  });

  const fetchTimetable = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      // Resolve this teacher's staff id (timetable is keyed by staff, not user)
      const staff = await apiGet('/hr/staff?isTeachingStaff=true', token);
      const me = (Array.isArray(staff) ? staff : []).find((s: any) => s.email === user?.email);
      if (!me) {
        setError('Your teaching-staff record could not be found.');
        setSlots([]);
        return;
      }
      const data = await apiGet(`/academics/timetable/slots/teacher/${me.id}`, token);
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch timetable', e);
      setError('Failed to load your timetable.');
    } finally {
      setLoading(false);
    }
  }, [token, user?.email]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  }, [fetchTimetable]);

  const daySlots = slots
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => (a.period?.periodOrder || 0) - (b.period?.periodOrder || 0));

  const countForDay = (day: number) => slots.filter((s) => s.dayOfWeek === day).length;

  return (
    <TeacherLayout>
      <View style={styles.container}>
        <Text style={styles.title}>My Timetable</Text>
        <Text style={styles.subtitle}>Your weekly class schedule</Text>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayBar}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {WEEK_ORDER.map((day) => {
            const active = day === selectedDay;
            const count = countForDay(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                  {DAY_NAMES[day].slice(0, 3)}
                </Text>
                {count > 0 && (
                  <View style={[styles.dayCount, active && styles.dayCountActive]}>
                    <Text style={[styles.dayCountText, active && styles.dayCountTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          >
            <Text style={styles.dayHeading}>{DAY_NAMES[selectedDay]}</Text>
            {daySlots.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cafe-outline" size={44} color="#94a3b8" />
                <Text style={styles.emptyText}>No classes scheduled for {DAY_NAMES[selectedDay]}.</Text>
              </View>
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
                    <Text style={styles.periodClass}>
                      <Ionicons name="people-outline" size={12} color="#64748b" />{' '}
                      {slot.class?.name || ''}
                      {slot.section?.name ? ` - ${slot.section.name}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 16 },
  dayBar: { flexGrow: 0, marginBottom: 16 },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  dayChipTextActive: { color: '#fff' },
  dayCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayCountActive: { backgroundColor: COLORS.secondary },
  dayCountText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  dayCountTextActive: { color: '#fff' },
  dayHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  periodTime: { width: 56 },
  periodStart: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  periodEnd: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  periodDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e2e8f0', marginHorizontal: 14 },
  periodSubject: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  periodClass: { fontSize: 12, color: '#64748b', marginTop: 2 },
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
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
