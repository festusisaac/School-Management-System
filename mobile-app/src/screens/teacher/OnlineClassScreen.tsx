import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import DateTimeField from '../../components/DateTimeField';
import { useAuthStore } from '../../store/authStore';
import { apiGet, apiPost, apiDelete } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  error: '#ba1a1a',
  success: '#16a34a',
};

interface OnlineClass {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  platform: string;
  meetingUrl: string;
  status: string;
  classId: string;
  subjectId: string;
  class?: { name: string };
  subject?: { name: string };
}

function getStatus(item: OnlineClass): { label: string; color: string; bg: string } {
  const now = Date.now();
  const start = new Date(item.startTime).getTime();
  const end = new Date(item.endTime).getTime();
  if (item.status === 'CANCELLED') return { label: 'Cancelled', color: COLORS.error, bg: '#fee2e2' };
  if (now < start) return { label: 'Upcoming', color: COLORS.secondary, bg: '#eff6ff' };
  if (now >= start && now < end) return { label: 'Live Now', color: COLORS.success, bg: '#dcfce7' };
  return { label: 'Finished', color: '#64748b', bg: '#f1f5f9' };
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OnlineClassScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';

  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/online-classes', token);
      const list: OnlineClass[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setClasses(list);
    } catch (e) {
      console.error('Failed to fetch online classes', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  }, [fetchClasses]);

  const handleJoin = async (item: OnlineClass) => {
    try {
      const supported = await Linking.canOpenURL(item.meetingUrl);
      if (!supported) {
        Alert.alert('Invalid link', 'The meeting link could not be opened.');
        return;
      }
      await Linking.openURL(item.meetingUrl);
    } catch (e) {
      Alert.alert('Error', 'Failed to open meeting link.');
    }
  };

  const handleDelete = (item: OnlineClass) => {
    Alert.alert('Delete Class', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/online-classes/${item.id}`, token);
            setClasses((prev) => prev.filter((c) => c.id !== item.id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete class.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: OnlineClass }) => {
    const status = getStatus(item);
    const ended = Date.now() > new Date(item.endTime).getTime();
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {(item.class?.name || 'All Classes')} • {(item.subject?.name || 'General')}
            </Text>
          </View>
          <Text style={[styles.statusBadge, { color: status.color, backgroundColor: status.bg }]}>
            {status.label}
          </Text>
        </View>

        <View style={styles.timingRow}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text style={styles.timingText}>
            {formatWhen(item.startTime)} — {formatWhen(item.endTime)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {ended ? (
            <View style={[styles.joinBtn, styles.joinBtnDisabled]}>
              <Ionicons name="time-outline" size={16} color="#94a3b8" />
              <Text style={styles.joinBtnDisabledText}>Class Ended</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(item)}>
              <Ionicons name="videocam" size={16} color="#fff" />
              <Text style={styles.joinBtnText}>Join Meeting</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <TeacherLayout>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Online Classes</Text>
            <Text style={styles.subtitle}>Schedule and join virtual classrooms</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="videocam-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No classes scheduled</Text>
            <Text style={styles.emptyText}>Tap "Schedule" to create a virtual class.</Text>
          </View>
        ) : (
          <FlatList
            data={classes}
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

      <ScheduleForm
        visible={modalOpen}
        token={token}
        userEmail={user?.email || ''}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchClasses();
        }}
      />
    </TeacherLayout>
  );
}

interface FormProps {
  visible: boolean;
  token: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PLATFORMS = [
  { label: 'Google Meet', value: 'GOOGLE_MEET' },
  { label: 'Zoom', value: 'ZOOM' },
];

function ScheduleForm({ visible, token, userEmail, onClose, onSuccess }: FormProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [platform, setPlatform] = useState('GOOGLE_MEET');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!visible || !token) return;
    setTitle('');
    setDescription('');
    setClassId('');
    setSubjectId('');
    setPlatform('GOOGLE_MEET');
    setMeetingUrl('');
    setStartTime(null);
    setEndTime(null);

    Promise.all([
      apiGet('/academics/classes', token),
      apiGet('/academics/subjects', token),
      apiGet('/hr/staff?isTeachingStaff=true', token),
    ])
      .then(([c, s, staff]) => {
        setClasses(Array.isArray(c) ? c : []);
        setSubjects(Array.isArray(s) ? s : []);
        const teachers = Array.isArray(staff) ? staff : [];
        const me = teachers.find((t: any) => t.email === userEmail);
        if (me) setTeacherId(me.id);
      })
      .catch(() => {});
  }, [visible, token, userEmail]);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Missing title', 'Please enter a class title.');
    if (!classId) return Alert.alert('Missing class', 'Please select a class.');
    if (!subjectId) return Alert.alert('Missing subject', 'Please select a subject.');
    if (!meetingUrl.trim()) return Alert.alert('Missing link', 'Please paste the meeting URL.');
    if (!startTime) return Alert.alert('Missing start', 'Please pick a start date & time.');
    if (!endTime) return Alert.alert('Missing end', 'Please pick an end date & time.');
    if (endTime.getTime() <= startTime.getTime())
      return Alert.alert('Invalid time', 'End time must be after the start time.');
    if (!teacherId)
      return Alert.alert('No staff record', 'Your teaching-staff record could not be found.');

    try {
      setSaving(true);
      await apiPost('/online-classes', token, {
        title: title.trim(),
        description: description.trim(),
        classId,
        subjectId,
        teacherId,
        platform,
        meetingUrl: meetingUrl.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      Alert.alert('Success', 'Class scheduled successfully.');
      onSuccess();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to schedule class.');
    } finally {
      setSaving(false);
    }
  };

  const classOptions: DropdownOption[] = classes.map((c) => ({ label: c.name, value: c.id }));
  const subjectOptions: DropdownOption[] = subjects.map((s) => ({ label: s.name, value: s.id }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Online Class</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Class Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Algebra Fundamentals"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief summary of the session..."
              placeholderTextColor="#94a3b8"
              multiline
            />

            <Dropdown
              label="Class *"
              placeholder="Select class"
              value={classId}
              options={classOptions}
              onChange={setClassId}
            />
            <Dropdown
              label="Subject *"
              placeholder="Select subject"
              value={subjectId}
              options={subjectOptions}
              onChange={setSubjectId}
            />

            <Text style={styles.fieldLabel}>Platform *</Text>
            <View style={styles.segment}>
              {PLATFORMS.map((p) => {
                const active = platform === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                    onPress={() => setPlatform(p.value)}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Meeting URL *</Text>
            <TextInput
              style={styles.input}
              value={meetingUrl}
              onChangeText={setMeetingUrl}
              placeholder="https://meet.google.com/... or https://zoom.us/j/..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="url"
            />

            <DateTimeField
              label="Start Date & Time *"
              value={startTime}
              onChange={setStartTime}
              placeholder="Pick a start time"
              minimumDate={new Date()}
            />

            <DateTimeField
              label="End Date & Time *"
              value={endTime}
              onChange={setEndTime}
              placeholder="Pick an end time"
              minimumDate={startTime || new Date()}
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              )}
              <Text style={styles.submitBtnText}>{saving ? 'Scheduling...' : 'Confirm Schedule'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardMeta: { fontSize: 12, color: COLORS.secondary, fontWeight: '600', marginTop: 2 },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timingText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingVertical: 11,
    borderRadius: 10,
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  joinBtnDisabled: { backgroundColor: '#f1f5f9' },
  joinBtnDisabledText: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
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
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, marginTop: 4 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },

  /* Modal */
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 7 },
  segmentBtnActive: {
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: COLORS.primary },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
