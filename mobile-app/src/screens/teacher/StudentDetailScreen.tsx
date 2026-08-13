import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { apiGet, getFileUrl } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  success: '#16a34a',
  error: '#ba1a1a',
};

function fmtDate(d?: string | Date) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StudentDetailScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { studentId } = (route.params || {}) as { studentId: string };

  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!token || !studentId) return;
    setError(null);
    try {
      const data = await apiGet(`/students/${studentId}`, token);
      setStudent(data);
    } catch (e: any) {
      console.error('Failed to fetch student', e);
      setError(e?.message === 'UNAUTHORIZED' ? 'Session expired.' : 'Could not load this student.');
    } finally {
      setLoading(false);
    }
  }, [token, studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStudent();
    setRefreshing(false);
  }, [fetchStudent]);

  const call = (phone?: string) => phone && Linking.openURL(`tel:${phone}`);

  const fullName = student
    ? [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')
    : '';
  const photo = getFileUrl(student?.studentPhoto);
  const initials = student
    ? `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <TeacherLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : !student ? (
          <View style={styles.emptyCard}>
            <Ionicons name="person-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>Student not found.</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          >
            {/* Header */}
            <View style={styles.headerCard}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.admission}>{student.admissionNo || student.admissionNumber || '—'}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.classBadge}>
                  {student.class?.name || 'No class'}
                  {student.section?.name ? ` • ${student.section.name}` : ''}
                </Text>
                <Text
                  style={[
                    styles.statusBadge,
                    student.isActive
                      ? { color: COLORS.success, backgroundColor: '#dcfce7' }
                      : { color: COLORS.error, backgroundColor: '#fee2e2' },
                  ]}
                >
                  {student.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {/* Personal */}
            <Section title="Personal Details">
              <Row label="Gender" value={student.gender} />
              <Row label="Date of Birth" value={fmtDate(student.dob)} />
              <Row label="Blood Group" value={student.bloodGroup} />
              <Row label="Religion" value={student.religion} />
              <Row label="Nationality" value={student.nationality} />
              <Row label="Admitted" value={fmtDate(student.admissionDate)} />
              <Row label="Category" value={student.category?.name} />
              <Row label="House" value={student.house?.name} last />
            </Section>

            {/* Contact */}
            <Section title="Contact">
              <Row label="Email" value={student.email} />
              <Row label="Current Address" value={student.currentAddress} />
              <Row label="Permanent Address" value={student.permanentAddress} last />
            </Section>

            {/* Guardian */}
            <Section title="Guardian / Parent">
              <Row label="Name" value={student.guardianName || (student.parent ? `${student.parent.firstName || ''} ${student.parent.lastName || ''}`.trim() : '')} />
              <Row label="Relationship" value={student.guardianRelation} />
              <Row
                label="Phone"
                value={student.guardianPhone}
                action={student.guardianPhone ? { icon: 'call', onPress: () => call(student.guardianPhone) } : undefined}
              />
              <Row label="Email" value={student.guardianEmail} />
              <Row label="Address" value={student.guardianAddress} last />
            </Section>
          </ScrollView>
        )}
      </View>
    </TeacherLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  last,
  action,
}: {
  label: string;
  value?: string;
  last?: boolean;
  action?: { icon: any; onPress: () => void };
}) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue}>{value || '—'}</Text>
        {action && value ? (
          <TouchableOpacity onPress={action.onPress} style={styles.rowAction}>
            <Ionicons name={action.icon} size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  headerCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.secondary },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center' },
  admission: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  classBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1.4, justifyContent: 'flex-end' },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, textAlign: 'right', flexShrink: 1 },
  rowAction: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
