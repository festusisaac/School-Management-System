import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { apiGet, apiPost } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  error: '#ba1a1a',
};

interface AssessmentType {
  id: string;
  name: string;
  maxMarks: number;
}

interface StudentRow {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  scores: { [assessmentTypeId: string]: string };
}

export default function EnterScoresScreen() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();

  const [groups, setGroups] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<AssessmentType[]>([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [currentExam, setCurrentExam] = useState<any | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const token = user?.token || '';

  // 1. Load exam groups + classes
  useEffect(() => {
    const init = async () => {
      if (!token) return;
      try {
        const [g, c] = await Promise.all([
          apiGet('/examination/setup/groups', token),
          apiGet('/academics/classes', token),
        ]);
        setGroups(Array.isArray(g) ? g : []);
        setClasses(Array.isArray(c) ? c : []);
      } catch (e) {
        console.error('Failed to load scoresheet metadata', e);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [token]);

  // Only show groups for the active session (mirrors web filter)
  const filteredGroups = groups.filter(
    (g) => !settings?.currentSessionName || g.academicYear === settings.currentSessionName
  );

  // 2. Load assessment types when group changes
  useEffect(() => {
    if (!selectedGroup || !token) {
      setAssessments([]);
      return;
    }
    apiGet(`/examination/setup/assessments?examGroupId=${selectedGroup}`, token)
      .then((data) => setAssessments(Array.isArray(data) ? data : []))
      .catch(() => setAssessments([]));
  }, [selectedGroup, token]);

  // 3. Load subjects when class changes
  useEffect(() => {
    setSelectedSubject('');
    if (!selectedClass || !token) {
      setSubjects([]);
      return;
    }
    apiGet(`/academics/assign-class-subjects/class/${selectedClass}`, token)
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
  }, [selectedClass, token]);

  // 4. Load scoresheet when group + class + subject all selected
  useEffect(() => {
    if (selectedGroup && selectedClass && selectedSubject) {
      fetchScoresheet();
    } else {
      setStudents([]);
      setCurrentExam(null);
    }
  }, [selectedGroup, selectedClass, selectedSubject, assessments.length]);

  const fetchScoresheet = async () => {
    setLoading(true);
    try {
      const exams = await apiGet(`/examination/setup/exams?examGroupId=${selectedGroup}`, token);
      const exam = (Array.isArray(exams) ? exams : []).find(
        (e: any) => e.classId === selectedClass && e.subjectId === selectedSubject
      );

      if (!exam) {
        setCurrentExam(null);
        setStudents([]);
        return;
      }
      setCurrentExam(exam);

      const [classStudents, existingMarks] = await Promise.all([
        apiGet(`/students?classId=${selectedClass}&limit=1000`, token),
        apiGet(`/examination/entry/marks/${exam.id}`, token),
      ]);

      const marks = Array.isArray(existingMarks) ? existingMarks : [];
      const rows: StudentRow[] = (Array.isArray(classStudents) ? classStudents : []).map((s: any) => {
        const studentMarks = marks.filter((m: any) => m.studentId === s.id);
        const scoresMap: { [key: string]: string } = {};
        assessments.forEach((ass) => {
          const mark = studentMarks.find((m: any) => m.assessmentTypeId === ass.id);
          scoresMap[ass.id] = mark ? mark.score.toString() : '';
        });
        return {
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          admissionNumber: s.admissionNumber || s.admissionNo || 'N/A',
          scores: scoresMap,
        };
      });

      rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
      setStudents(rows);
    } catch (e: any) {
      console.error('Scoresheet load error', e);
      Alert.alert('Error', 'Failed to load scoresheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentIndex: number, assessmentId: string, value: string) => {
    setStudents((prev) => {
      const next = [...prev];
      next[studentIndex] = {
        ...next[studentIndex],
        scores: { ...next[studentIndex].scores, [assessmentId]: value },
      };
      return next;
    });
  };

  const calculateTotal = (student: StudentRow) => {
    const total = assessments.reduce((sum, ass) => {
      const v = parseFloat(student.scores[ass.id]);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    return Math.round(total * 100) / 100;
  };

  const maxTotal = assessments.reduce((sum, ass) => sum + Number(ass.maxMarks), 0);

  const handleSave = async () => {
    if (!currentExam) return;

    const hasErrors = students.some((student) =>
      assessments.some((ass) => {
        const val = student.scores[ass.id];
        if (!val) return false;
        const score = parseFloat(val);
        return !isNaN(score) && score > ass.maxMarks;
      })
    );
    if (hasErrors) {
      Alert.alert('Invalid Scores', 'Some scores exceed the maximum allowed marks. Please fix them before saving.');
      return;
    }

    try {
      setIsSaving(true);
      for (const ass of assessments) {
        const marksToSave = students
          .filter((s) => s.scores[ass.id] !== '' && s.scores[ass.id] !== undefined)
          .map((s) => ({
            studentId: s.studentId,
            score: parseFloat(s.scores[ass.id]),
            status: 'PRESENT',
          }));
        if (marksToSave.length > 0) {
          await apiPost('/examination/entry/marks', token, {
            examId: currentExam.id,
            assessmentTypeId: ass.id,
            marks: marksToSave,
          });
        }
      }
      Alert.alert('Success', 'Scores saved successfully.');
      fetchScoresheet();
    } catch (e) {
      console.error('Save scores error', e);
      Alert.alert('Error', 'Failed to save scores.');
    } finally {
      setIsSaving(false);
    }
  };

  const groupOptions: DropdownOption[] = filteredGroups.map((g) => ({ label: g.name, value: g.id }));
  const classOptions: DropdownOption[] = classes.map((c) => ({ label: c.name, value: c.id }));
  const subjectOptions: DropdownOption[] = subjects.map((s) => ({ label: s.name, value: s.id }));

  const readyToShow = selectedGroup && selectedClass && selectedSubject;

  const renderBody = () => {
    if (!readyToShow) {
      return (
        <EmptyState
          icon="documents-outline"
          title="Select filters to begin"
          text="Choose an exam group, class and subject to load the scoresheet."
        />
      );
    }
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />;
    }
    if (!currentExam) {
      return (
        <EmptyState
          icon="alert-circle-outline"
          title="No Schedule Found"
          text="This subject hasn't been added to the examination calendar yet. Schedule it on the web portal before entering scores."
        />
      );
    }
    if (assessments.length === 0) {
      return (
        <EmptyState
          icon="information-circle-outline"
          title="No Assessment Types"
          text="Configure assessment types (e.g. CA1, Exam) in Setup first."
        />
      );
    }
    if (students.length === 0) {
      return (
        <EmptyState
          icon="people-outline"
          title="No Students Found"
          text="There are no students registered in this class."
        />
      );
    }

    return (
      <View style={{ marginTop: 8 }}>
        {students.map((student, index) => {
          const total = calculateTotal(student);
          return (
            <View key={student.studentId} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View style={styles.rowNumber}>
                  <Text style={styles.rowNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.studentName}</Text>
                  <Text style={styles.admissionNo}>{student.admissionNumber}</Text>
                </View>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalValue}>{total}</Text>
                  <Text style={styles.totalMax}>/{maxTotal}</Text>
                </View>
              </View>

              <View style={styles.scoresRow}>
                {assessments.map((ass) => {
                  const val = student.scores[ass.id] || '';
                  const num = parseFloat(val);
                  const invalid = !isNaN(num) && num > ass.maxMarks;
                  return (
                    <View key={ass.id} style={styles.scoreField}>
                      <Text style={styles.scoreLabel} numberOfLines={1}>
                        {ass.name}
                      </Text>
                      <Text style={styles.scoreMax}>Max {ass.maxMarks}</Text>
                      <TextInput
                        style={[styles.scoreInput, invalid && styles.scoreInputError]}
                        value={val}
                        onChangeText={(t) => handleScoreChange(index, ass.id, t)}
                        keyboardType="numeric"
                        placeholder="-"
                        placeholderTextColor="#cbd5e1"
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <TeacherLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Enter Scores</Text>
              <Text style={styles.subtitle}>Record academic marks for examinations</Text>
            </View>
            {currentExam && assessments.length > 0 && students.length > 0 && (
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="save-outline" size={16} color="#fff" />
                )}
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving' : 'Save'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {initializing ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={styles.filterCard}>
                <Dropdown
                  label="Exam Group"
                  placeholder="Select exam group"
                  value={selectedGroup}
                  options={groupOptions}
                  onChange={setSelectedGroup}
                />
                <Dropdown
                  label="Class"
                  placeholder="Select class"
                  value={selectedClass}
                  options={classOptions}
                  onChange={setSelectedClass}
                />
                <Dropdown
                  label="Subject"
                  placeholder={selectedClass ? 'Select subject' : 'Select a class first'}
                  value={selectedSubject}
                  options={subjectOptions}
                  onChange={setSelectedSubject}
                  disabled={!selectedClass}
                />
              </View>

              {renderBody()}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TeacherLayout>
  );
}

function EmptyState({ icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={44} color="#94a3b8" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  studentCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowNumberText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  studentName: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  admissionNo: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  totalMax: { fontSize: 11, color: '#94a3b8', marginLeft: 1 },
  scoresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scoreField: { width: '30%', minWidth: 90 },
  scoreLabel: { fontSize: 11, fontWeight: '700', color: COLORS.onSurface, textTransform: 'uppercase' },
  scoreMax: { fontSize: 10, color: '#94a3b8', marginBottom: 4 },
  scoreInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
    backgroundColor: '#f8fafc',
  },
  scoreInputError: { borderColor: '#fca5a5', backgroundColor: '#fef2f2', color: COLORS.error },
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
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19 },
});
