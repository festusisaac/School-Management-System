import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { apiGet, apiPostForm } from '../../services/api';
import { pickFiles, toFormFile, downloadSecure, PickedFile } from '../../utils/files';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', success: '#16a34a', warn: '#d97706' };

function fmtDate(iso?: string) { if (!iso) return 'No due date'; const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

interface HW { id: string; title: string; description?: string; dueDate: string; attachmentUrl?: string; class?: { name: string }; subject?: { name: string }; teacher?: { firstName: string; lastName: string }; submission?: { status?: string; grade?: string; feedback?: string; content?: string }; }

export default function StudentHomeworkScreen() {
  const { user } = useAuthStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<HW[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<HW | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/homework', token);
      const list: HW[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      setItems(list);
    } catch (e) { console.error('Failed to load homework', e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const statusMeta = (hw: HW) => {
    const s = (hw.submission?.status || '').toUpperCase();
    if (s === 'GRADED') return { label: `Graded${hw.submission?.grade ? ` • ${hw.submission.grade}` : ''}`, color: C.success, bg: '#dcfce7' };
    if (s === 'SUBMITTED' || s === 'RETURNED') return { label: 'Submitted', color: C.secondary, bg: '#eff6ff' };
    const overdue = new Date(hw.dueDate).getTime() < Date.now();
    return overdue ? { label: 'Overdue', color: '#dc2626', bg: '#fee2e2' } : { label: 'Pending', color: C.warn, bg: '#fef3c7' };
  };

  const renderItem = ({ item }: { item: HW }) => {
    const meta = statusMeta(item);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => setDetail(item)}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}><Ionicons name="document-text" size={22} color={C.warn} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardMeta}>{(item.subject?.name || 'Subject')} • Due {fmtDate(item.dueDate)}</Text>
          </View>
          <Text style={[styles.statusBadge, { color: meta.color, backgroundColor: meta.bg }]}>{meta.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <StudentLayout activeTab="Homework">
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Homework</Text>
        <Text style={styles.subtitle}>Assignments for your class</Text>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}><Ionicons name="document-text-outline" size={44} color={C.faint} /><Text style={styles.emptyText}>No homework yet.</Text></View>
        ) : (
          <FlatList data={items} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24, gap: 12 }} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />} />
        )}
      </View>

      <HomeworkDetail homework={detail} token={token} onClose={() => setDetail(null)} onSubmitted={() => { setDetail(null); load(); }} />
    </StudentLayout>
  );
}

function HomeworkDetail({ homework, token, onClose, onSubmitted }: { homework: HW | null; token: string; onClose: () => void; onSubmitted: () => void }) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const visible = !!homework;
  useEffect(() => { if (visible) { setContent(homework?.submission?.content || ''); setFiles([]); } }, [visible]);

  const attach = async () => {
    try {
      const picked = await pickFiles(true);
      if (picked.length) setFiles((prev) => [...prev, ...picked]);
    } catch { Alert.alert('Error', 'Could not open the file picker.'); }
  };

  const submit = async () => {
    if (!homework) return;
    if (!content.trim() && files.length === 0) return Alert.alert('Empty', 'Type an answer or attach a file before submitting.');
    try {
      setSaving(true);
      const form = new FormData();
      form.append('homeworkId', homework.id);
      form.append('content', content.trim());
      files.forEach((f) => form.append('attachments', toFormFile(f)));
      await apiPostForm('/homework/student-submit', token, form);
      Alert.alert('Submitted', 'Your work was submitted.');
      onSubmitted();
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed to submit.'); } finally { setSaving(false); }
  };

  const submission = homework?.submission;
  const graded = (submission?.status || '').toUpperCase() === 'GRADED';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={1}>{homework?.title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.onSurface} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.metaLine}>{homework?.subject?.name} • Due {fmtDate(homework?.dueDate)}</Text>
            <Text style={styles.blockLabel}>Instructions</Text>
            <Text style={styles.instructions}>{homework?.description || 'No instructions provided.'}</Text>
            {homework?.attachmentUrl ? (
              <TouchableOpacity style={styles.attachBtn} onPress={() => downloadSecure(`/homework/${homework.id}/attachment`, token)}>
                <Ionicons name="document-attach-outline" size={18} color={C.secondary} /><Text style={styles.attachText}>Download material</Text>
              </TouchableOpacity>
            ) : null}

            {graded ? (
              <View style={styles.gradedBox}>
                <Text style={styles.gradedLabel}>Grade: <Text style={{ color: C.secondary }}>{submission?.grade}</Text></Text>
                {submission?.feedback ? <Text style={styles.feedback}>{submission.feedback}</Text> : null}
                {submission?.content ? <Text style={styles.yourAnswer}>Your answer: "{submission.content}"</Text> : null}
              </View>
            ) : (
              <>
                <Text style={styles.blockLabel}>{submission ? 'Update your submission' : 'Your Answer'}</Text>
                <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} placeholder="Type your answer or response..." placeholderTextColor={C.faint} multiline />

                <TouchableOpacity style={styles.attachPickBtn} onPress={attach}>
                  <Ionicons name="attach" size={18} color={C.secondary} /><Text style={styles.attachPickText}>Attach files</Text>
                </TouchableOpacity>
                {files.map((f, i) => (
                  <View key={i} style={styles.fileChip}>
                    <Ionicons name="document-outline" size={15} color={C.muted} />
                    <Text style={styles.fileChipName} numberOfLines={1}>{f.name}</Text>
                    <TouchableOpacity onPress={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}><Ionicons name="close-circle" size={18} color={C.faint} /></TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
                  <Text style={styles.submitText}>{saving ? 'Submitting...' : submission ? 'Resubmit' : 'Submit'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  title: { fontSize: 22, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  cardMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  statusBadge: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center' },
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.onSurface, flex: 1, marginRight: 8 },
  metaLine: { fontSize: 12, color: C.secondary, fontWeight: '600', marginBottom: 12 },
  blockLabel: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  instructions: { fontSize: 14, color: '#475569', lineHeight: 20, backgroundColor: C.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, marginTop: 12 },
  attachText: { fontSize: 13, fontWeight: '700', color: C.secondary },
  gradedBox: { backgroundColor: '#dcfce7', borderRadius: 12, padding: 14, marginTop: 12, marginBottom: 24 },
  gradedLabel: { fontSize: 15, fontWeight: '800', color: C.onSurface },
  feedback: { fontSize: 13, color: '#166534', marginTop: 6 },
  yourAnswer: { fontSize: 13, color: C.muted, fontStyle: 'italic', marginTop: 8 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.onSurface },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.secondary, paddingVertical: 14, borderRadius: 12, marginTop: 12, marginBottom: 24 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  attachPickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderStyle: 'dashed', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  attachPickText: { fontSize: 13, fontWeight: '700', color: C.secondary },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  fileChipName: { flex: 1, fontSize: 13, color: C.onSurface, fontWeight: '500' },
});
