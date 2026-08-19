import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import Dropdown from '../../components/Dropdown';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useStudentStore } from '../../store/studentStore';
import { apiGet, apiPost } from '../../services/api';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', success: '#16a34a', error: '#dc2626', warn: '#d97706' };

export default function StudentResultsScreen() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { profile } = useStudentStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const currency = settings?.currencySymbol || '₦';

  const studentId = profile?.id;
  const [loadingInit, setLoadingInit] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [examGroups, setExamGroups] = useState<any[]>([]);
  const [feeBalance, setFeeBalance] = useState(0);
  const [examGroupId, setExamGroupId] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadDashboard = useCallback(async () => {
    if (!token || !studentId) return;
    try {
      const data = await apiGet(`/examination/student/${studentId}/dashboard`, token);
      setUnavailable(false);
      const groups = data?.examGroups || [];
      setExamGroups(groups);
      if (groups.length > 0) setExamGroupId(groups[0].id);
      if (data?.feeBalance !== undefined) setFeeBalance(Number(data.feeBalance) || 0);
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) { setUnavailable(true); setExamGroups([]); }
      else console.error('Failed to load exam dashboard', e);
    } finally { setLoadingInit(false); }
  }, [token, studentId]);

  useEffect(() => { if (studentId) loadDashboard(); }, [loadDashboard, studentId]);

  const verify = async () => {
    if (!examGroupId) return Alert.alert('Select exam group', 'Please choose an exam group.');
    if (!code.trim() || !pin.trim()) return Alert.alert('Missing details', 'Enter your scratch card serial number and PIN.');
    try {
      setChecking(true);
      const res = await apiPost(`/examination/student/${studentId}/verify-result`, token, { examGroupId, code: code.trim(), pin: pin.trim() });
      setResult(res);
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message || 'Invalid scratch card details or constraints not met.');
    } finally { setChecking(false); }
  };

  if (loadingInit) {
    return <StudentLayout><ActivityIndicator size="large" color={C.primary} style={{ marginTop: 80 }} /></StudentLayout>;
  }

  if (result) {
    return (
      <StudentLayout>
        <ResultView result={result} onBack={() => setResult(null)} />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Check Result</Text>
          <Text style={styles.subtitle}>Enter your scratch card to access your report</Text>

          {unavailable || examGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Ionicons name="book-outline" size={30} color={C.warn} /></View>
              <Text style={styles.emptyTitle}>Result Not Available Yet</Text>
              <Text style={styles.emptyText}>There is no published examination result for you right now. Once the school publishes results, you can check them here.</Text>
            </View>
          ) : (
            <View style={styles.formCard}>
              {feeBalance > 0.01 && (
                <View style={styles.feeWarn}>
                  <Ionicons name="shield-checkmark" size={18} color={C.error} />
                  <Text style={styles.feeWarnText}>You have an outstanding balance of {currency}{feeBalance.toLocaleString()}. Fees must be cleared before results can be accessed.</Text>
                </View>
              )}

              <Dropdown
                label="Exam Group"
                placeholder="Select exam group"
                value={examGroupId}
                options={examGroups.map((g) => ({ label: g.name, value: g.id }))}
                onChange={setExamGroupId}
              />

              <Text style={[styles.label, { marginTop: 6 }]}>Card Serial Number</Text>
              <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="Enter card serial number" placeholderTextColor={C.faint} autoCapitalize="characters" />

              <Text style={[styles.label, { marginTop: 14 }]}>PIN</Text>
              <View style={styles.pinRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={pin} onChangeText={setPin} placeholder="Enter card PIN" placeholderTextColor={C.faint} secureTextEntry={!showPin} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPin(!showPin)}><Ionicons name={showPin ? 'eye-off' : 'eye'} size={20} color={C.muted} /></TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.checkBtn, checking && { opacity: 0.7 }]} onPress={verify} disabled={checking}>
                {checking ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-forward" size={18} color="#fff" />}
                <Text style={styles.checkBtnText}>{checking ? 'Checking...' : 'Check Result'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </StudentLayout>
  );
}

function ResultView({ result, onBack }: { result: any; onBack: () => void }) {
  const { summary = {}, subjectScores = [], examGroup, student } = result || {};
  const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backRow} onPress={onBack}>
        <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Check another</Text>
      </TouchableOpacity>

      <View style={styles.resultHeader}>
        <Text style={styles.resultName}>{name}</Text>
        <Text style={styles.resultMeta}>{student?.class?.name || ''}{student?.admissionNo ? ` • ${student.admissionNo}` : ''}</Text>
        <Text style={styles.resultTerm}>{examGroup?.name || 'Result'}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryStat}><Text style={styles.summaryValue}>{summary.averageScore != null ? `${Number(summary.averageScore).toFixed(1)}%` : '—'}</Text><Text style={styles.summaryLabel}>Average</Text></View>
        <View style={styles.summaryStat}><Text style={styles.summaryValue}>{summary.position || '—'}</Text><Text style={styles.summaryLabel}>Position</Text></View>
        <View style={styles.summaryStat}><Text style={styles.summaryValue}>{summary.totalStudents || '—'}</Text><Text style={styles.summaryLabel}>Class Size</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Subjects</Text>
      <View style={styles.tableHead}>
        <Text style={[styles.thSubject]}>Subject</Text>
        <Text style={styles.thScore}>Score</Text>
        <Text style={styles.thGrade}>Grade</Text>
      </View>
      {subjectScores.map((s: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tdSubject} numberOfLines={1}>{s.subject?.name || 'Unknown'}</Text>
          <Text style={styles.tdScore}>{s.totalScore ?? s.totalSubjectScore ?? '-'}</Text>
          <Text style={[styles.tdGrade, { color: gradeColor(s.grade) }]}>{s.grade || '-'}</Text>
        </View>
      ))}
      {subjectScores.length === 0 && <Text style={styles.emptyText}>No subject scores recorded.</Text>}

      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={18} color={C.secondary} />
        <Text style={styles.noteText}>This is a summary. For the official printable report card with class stats, remarks and skills, please use the website.</Text>
      </View>
    </ScrollView>
  );
}

function gradeColor(g?: string) {
  const grade = (g || '').toUpperCase();
  if (grade.startsWith('A')) return C.success;
  if (grade.startsWith('B') || grade.startsWith('C')) return C.secondary;
  if (grade.startsWith('D') || grade.startsWith('E')) return C.warn;
  if (grade.startsWith('F')) return C.error;
  return C.muted;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  title: { fontSize: 22, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 20 },
  emptyCard: { backgroundColor: C.card, borderRadius: 18, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.onSurface, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  formCard: { backgroundColor: C.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  feeWarn: { flexDirection: 'row', gap: 10, backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginBottom: 18 },
  feeWarnText: { flex: 1, fontSize: 12, color: '#991b1b', lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  termChip: { backgroundColor: C.surface, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  termChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  termChipText: { fontSize: 13, fontWeight: '700', color: C.muted },
  termChipTextActive: { color: '#fff' },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.onSurface, marginBottom: 4 },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.secondary, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  checkBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12 },
  actionPrimary: { backgroundColor: C.secondary },
  actionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionSecondary: { backgroundColor: C.card, borderWidth: 1, borderColor: '#dbeafe' },
  actionSecondaryText: { color: C.secondary, fontWeight: '700', fontSize: 14 },
  resultHeader: { backgroundColor: C.primary, borderRadius: 18, padding: 20, marginBottom: 14 },
  resultName: { fontSize: 20, fontWeight: '900', color: '#fff' },
  resultMeta: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  resultTerm: { fontSize: 12, color: '#8293b5', marginTop: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  summaryStat: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  summaryValue: { fontSize: 18, fontWeight: '900', color: C.onSurface },
  summaryLabel: { fontSize: 11, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  tableHead: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 8 },
  thSubject: { flex: 1, fontSize: 11, fontWeight: '700', color: C.faint, textTransform: 'uppercase' },
  thScore: { width: 60, fontSize: 11, fontWeight: '700', color: C.faint, textAlign: 'center', textTransform: 'uppercase' },
  thGrade: { width: 54, fontSize: 11, fontWeight: '700', color: C.faint, textAlign: 'center', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  tdSubject: { flex: 1, fontSize: 14, fontWeight: '600', color: C.onSurface },
  tdScore: { width: 60, fontSize: 14, fontWeight: '700', color: C.onSurface, textAlign: 'center' },
  tdGrade: { width: 54, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  noteCard: { flexDirection: 'row', gap: 10, backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginTop: 18, borderWidth: 1, borderColor: '#dbeafe' },
  noteText: { flex: 1, fontSize: 12, color: C.secondary, lineHeight: 18, fontWeight: '500' },
});
