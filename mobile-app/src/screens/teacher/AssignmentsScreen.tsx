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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import DateTimeField from '../../components/DateTimeField';
import { useAuthStore } from '../../store/authStore';
import { apiGet, apiDelete, apiPostForm } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  error: '#ba1a1a',
};

interface Homework {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  class?: { name: string };
  subject?: { name: string };
  submissions?: any[];
}

function formatDate(iso?: string) {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AssignmentsScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';

  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHomework = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/homework', token);
      const list: Homework[] = Array.isArray(data) ? data : [];
      // Scope to the logged-in teacher (mirrors teacher context on web)
      const mine = user?.id ? list.filter((h) => !h.teacherId || h.teacherId === user.id) : list;
      mine.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      setHomework(mine);
    } catch (e) {
      console.error('Failed to fetch homework', e);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomework();
    setRefreshing(false);
  }, [fetchHomework]);

  const handleDelete = (item: Homework) => {
    Alert.alert('Delete Assignment', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/homework/${item.id}`, token);
            setHomework((prev) => prev.filter((h) => h.id !== item.id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete assignment.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Homework }) => {
    const overdue = new Date(item.dueDate).getTime() < Date.now();
    const submissionCount = item.submissions?.length || 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="document-text" size={22} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {(item.class?.name || 'Class')} • {(item.subject?.name || 'Subject')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={overdue ? COLORS.error : '#64748b'}
            />
            <Text style={[styles.footerText, overdue && { color: COLORS.error }]}>
              Due {formatDate(item.dueDate)}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="people-outline" size={14} color="#64748b" />
            <Text style={styles.footerText}>{submissionCount} submitted</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <TeacherLayout>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Assignments</Text>
            <Text style={styles.subtitle}>Homework you've assigned</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : homework.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No assignments yet</Text>
            <Text style={styles.emptyText}>Tap "New" to assign homework to a class.</Text>
          </View>
        ) : (
          <FlatList
            data={homework}
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

      <AssignmentForm
        visible={modalOpen}
        token={token}
        teacherId={user?.id || ''}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchHomework();
        }}
      />
    </TeacherLayout>
  );
}

interface FormProps {
  visible: boolean;
  token: string;
  teacherId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignmentForm({ visible, token, teacherId, onClose, onSuccess }: FormProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => {
    if (!visible || !token) return;
    // reset
    setTitle('');
    setDescription('');
    setDueDate(null);
    setClassId('');
    setSubjectId('');
    apiGet('/academics/classes', token)
      .then((c) => setClasses(Array.isArray(c) ? c : []))
      .catch(() => setClasses([]));
  }, [visible, token]);

  useEffect(() => {
    setSubjectId('');
    if (!classId || !token) {
      setSubjects([]);
      return;
    }
    apiGet(`/academics/assign-class-subjects/class/${classId}`, token)
      .then((res: any[]) => {
        const mapped = (Array.isArray(res) ? res : [])
          .map((cs) => ({ id: cs.subjectId || cs.subject?.id, name: cs.subject?.name }))
          .filter(
            (s: any, i: number, self: any[]) =>
              s.id && s.name && self.findIndex((t) => t.id === s.id) === i
          );
        setSubjects(mapped);
      })
      .catch(() => setSubjects([]));
  }, [classId, token]);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Missing title', 'Please enter an assignment title.');
    if (!classId) return Alert.alert('Missing class', 'Please select a class.');
    if (!subjectId) return Alert.alert('Missing subject', 'Please select a subject.');
    if (!dueDate) return Alert.alert('Missing due date', 'Please pick a due date.');

    try {
      setSaving(true);
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      form.append('dueDate', dueDate.toISOString());
      form.append('classId', classId);
      form.append('subjectId', subjectId);
      form.append('teacherId', teacherId);
      await apiPostForm('/homework', token, form);
      Alert.alert('Success', 'Homework assigned successfully.');
      onSuccess();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to assign homework.');
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
            <Text style={styles.modalTitle}>New Assignment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Fractions & Decimals Quiz"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide detailed instructions..."
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
              placeholder={classId ? 'Select subject' : 'Select a class first'}
              value={subjectId}
              options={subjectOptions}
              onChange={setSubjectId}
              disabled={!classId}
            />

            <DateTimeField
              label="Due Date *"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Pick a due date"
              minimumDate={new Date()}
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
              <Text style={styles.submitBtnText}>{saving ? 'Assigning...' : 'Assign Homework'}</Text>
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardMeta: { fontSize: 12, color: COLORS.secondary, fontWeight: '600', marginTop: 2 },
  deleteBtn: { padding: 4 },
  cardDesc: { fontSize: 13, color: '#64748b', marginTop: 10, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },
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
