import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Q } from '@nozbe/watermelondb';
import AdminLayout from '../../components/AdminLayout';
import TeacherLayout from '../../components/TeacherLayout';
import { database } from '../../database';
import Student from '../../database/models/Student';
import Class from '../../database/models/Class';
import Section from '../../database/models/Section';
import Attendance from '../../database/models/Attendance';
import { useAuthStore } from '../../store/authStore';
import { useSectionStore } from '../../store/sectionStore';
import { apiGet, apiPost, getSyncBaseUrl } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainerHigh: '#e6e8ea',
  onSurface: '#191c1e',
  onSurfaceVariant: '#44474d',
  outline: '#75777e',
  outlineVariant: '#c5c6ce',
  primary: '#031632',
  onPrimary: '#ffffff',
  secondary: '#055db6',
  present:   '#16a34a', presentBg: '#dcfce7',
  absent:    '#dc2626', absentBg:  '#fee2e2',
  late:      '#d97706', lateBg:    '#fef3c7',
  medical:   '#7c3aed', medicalBg: '#ede9fe',
  holiday:   '#0891b2', holidayBg: '#cffafe',
  errorBg: '#fee2e2', errorText: '#991b1b',
};

const TYPOGRAPHY = {
  headlineSm: { fontFamily: 'Inter', fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  titleMd: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  labelMd: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  labelSm: { fontFamily: 'Inter', fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

type AttendanceStatus = 'present' | 'absent' | 'late' | 'medical' | 'holiday';

const STATUSES: { key: AttendanceStatus; label: string; icon: string }[] = [
  { key: 'present', label: 'Present',  icon: 'checkmark-circle' },
  { key: 'absent',  label: 'Absent',   icon: 'close-circle' },
  { key: 'late',    label: 'Late',     icon: 'time' },
  { key: 'medical', label: 'Medical',  icon: 'medkit' },
  { key: 'holiday', label: 'Holiday',  icon: 'sunny-outline' },
];

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: COLORS.present, absent: COLORS.absent, late: COLORS.late,
  medical: COLORS.medical, holiday: COLORS.holiday,
};
const STATUS_BG: Record<AttendanceStatus, string> = {
  present: COLORS.presentBg, absent: COLORS.absentBg, late: COLORS.lateBg,
  medical: COLORS.medicalBg, holiday: COLORS.holidayBg,
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function todayISO() { return new Date().toISOString().split('T')[0]; }
function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function getSyncBase() { return getSyncBaseUrl().replace('/api/v1',''); }

// ─── Date Picker ─────────────────────────────────────────────────────────────
function DatePickerModal({ value, onConfirm, onClose }: { value: string; onConfirm: (d: string) => void; onClose: () => void }) {
  const parsed = value ? new Date(value) : new Date();
  const [selDay,   setSelDay]   = useState(parsed.getDate());
  const [selMonth, setSelMonth] = useState(parsed.getMonth());
  const [selYear,  setSelYear]  = useState(parsed.getFullYear());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const days  = Array.from({ length: new Date(selYear, selMonth + 1, 0).getDate() }, (_, i) => i + 1);
  const confirm = () => {
    const m = (selMonth + 1).toString().padStart(2,'0');
    const d = selDay.toString().padStart(2,'0');
    onConfirm(`${selYear}-${m}-${d}`);
    onClose();
  };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableOpacity style={pS.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pS.card} onStartShouldSetResponder={() => true}>
          <Text style={pS.title}>Select Date</Text>
          <View style={pS.row}>
            {[{label:'Day',items:days,sel:selDay,set:setSelDay},{label:'Month',items:MONTHS,sel:selMonth,set:setSelMonth},{label:'Year',items:years,sel:selYear,set:setSelYear}].map(col => (
              <View key={col.label} style={pS.col}>
                <Text style={pS.colLabel}>{col.label}</Text>
                <ScrollView style={pS.list}>
                  {col.items.map((item: any, i: number) => {
                    const val = col.label === 'Year' ? item : (col.label === 'Month' ? i : item);
                    const active = col.sel === val;
                    return (
                      <TouchableOpacity key={String(item)} style={[pS.opt, active && pS.optSel]} onPress={() => col.set(val)}>
                        <Text style={[pS.optTxt, active && pS.optTxtSel]}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>
          <View style={pS.actions}>
            <TouchableOpacity style={pS.cancel} onPress={onClose}><Text style={pS.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={pS.confirm} onPress={confirm}><Text style={pS.confirmTxt}>Confirm</Text></TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const pS = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  card: { backgroundColor:'#fff', borderRadius:20, padding:24, width:'85%' },
  title: { ...TYPOGRAPHY.titleMd, color:COLORS.onSurface, marginBottom:16 },
  row: { flexDirection:'row', gap:10, marginBottom:20 },
  col: { flex:1 },
  colLabel: { ...TYPOGRAPHY.labelMd, color:COLORS.onSurfaceVariant, marginBottom:6, textAlign:'center' },
  list: { height:160, backgroundColor:COLORS.surfaceContainerLow, borderRadius:10 },
  opt: { paddingVertical:9, alignItems:'center', borderRadius:8, marginHorizontal:2 },
  optSel: { backgroundColor:COLORS.primary },
  optTxt: { ...TYPOGRAPHY.bodyMd, color:COLORS.onSurface },
  optTxtSel: { color:'#fff', fontWeight:'600' },
  actions: { flexDirection:'row', gap:12 },
  cancel: { flex:1, paddingVertical:12, borderRadius:10, borderWidth:1, borderColor:COLORS.outlineVariant, alignItems:'center' },
  cancelTxt: { ...TYPOGRAPHY.labelLg, color:COLORS.onSurface },
  confirm: { flex:1, paddingVertical:12, borderRadius:10, backgroundColor:COLORS.primary, alignItems:'center' },
  confirmTxt: { ...TYPOGRAPHY.labelLg, color:'#fff' },
});

// ─── Dropdown Modal ───────────────────────────────────────────────────────────
function DropdownModal({ title, items, onSelect, onClose }: { title:string; items:{id:string;name:string}[]; onSelect:(id:string)=>void; onClose:()=>void }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableOpacity style={pS.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[pS.card, { maxHeight:'70%' }]} onStartShouldSetResponder={() => true}>
          <Text style={pS.title}>{title}</Text>
          <FlatList data={items} keyExtractor={i=>i.id}
            renderItem={({item}) => (
              <TouchableOpacity style={s.dropItem} onPress={()=>{onSelect(item.id);onClose();}}>
                <Text style={s.dropItemText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.outline}/>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={()=><View style={{height:1,backgroundColor:COLORS.surfaceContainerHigh}}/>}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────
const StudentRow = React.memo(({ student, status, onStatusChange }: { student:Student; status:AttendanceStatus; onStatusChange:(id:string,s:AttendanceStatus)=>void }) => {
  const initials = `${student.firstName?.charAt(0)||''}${student.lastName?.charAt(0)||''}`.toUpperCase();
  return (
    <View style={s.studentRow}>
      <View style={[s.avatar, { backgroundColor: STATUS_BG[status] }]}>
        <Text style={[s.avatarTxt, { color: STATUS_COLOR[status] }]}>{initials}</Text>
      </View>
      <View style={s.studentInfo}>
        <Text style={s.studentName} numberOfLines={1}>{student.firstName} {student.lastName}</Text>
        <Text style={s.studentAdm}>{student.admissionNo}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statusScroll} contentContainerStyle={s.statusScrollContent}>
        {STATUSES.map(st => (
          <TouchableOpacity key={st.key} style={[s.chip, status===st.key && {backgroundColor:STATUS_COLOR[st.key], borderColor:STATUS_COLOR[st.key]}]}
            onPress={()=>onStatusChange(student.id, st.key)}>
            <Ionicons name={st.icon as any} size={13} color={status===st.key?'#fff':STATUS_COLOR[st.key]}/>
            {status===st.key && <Text style={s.chipTxt}>{st.label}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AttendanceScreen() {
  const { user } = useAuthStore();
  const activeSectionId = useSectionStore((s) => s.activeSectionId);
  const [isOnline, setIsOnline] = useState(true);
  const [classes,  setClasses]  = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass,   setSelectedClass]   = useState<Class|null>(null);
  const [selectedSection, setSelectedSection] = useState<Section|null>(null);
  const [selectedDate,    setSelectedDate]    = useState(todayISO());
  const [showClassModal,   setShowClassModal]   = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showDateModal,    setShowDateModal]    = useState(false);
  const [students,      setStudents]      = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string,AttendanceStatus>>({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const [sessionId,   setSessionId]   = useState<string|null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setIsOnline(!!s.isConnected));
    return () => unsub();
  }, []);

  // Load academic session
  useEffect(() => {
    if (!user?.token) return;
    apiGet('/system-settings', user.token).then((s:any) => setSessionId(s?.currentSessionId||null)).catch(()=>{});
  }, [user?.token]);

  // Load classes (scoped to the active school section when one is selected)
  useEffect(() => {
    const localClauses = [Q.where('is_active', true)];
    if (activeSectionId) localClauses.push(Q.where('school_section_id', activeSectionId));
    const load = async () => {
      try {
        if (isOnline && user?.token) {
          // Teacher: fetch from API — backend scopes to managed classes automatically
          if (user.role === 'teacher') {
            const data = await apiGet('/academics/classes', user.token);
            if (Array.isArray(data) && data.length > 0) {
              const scoped = activeSectionId ? data.filter((c: any) => c.schoolSectionId === activeSectionId) : data;
              setClasses(scoped as any);
              return;
            }
          }
        }
        const local = await database.collections.get<Class>('classes').query(...localClauses).fetch();
        setClasses(local);
      } catch {
        const local = await database.collections.get<Class>('classes').query(...localClauses).fetch();
        setClasses(local);
      }
    };
    load();
  }, [isOnline, user?.token, user?.role, activeSectionId]);

  // Sections when class changes
  useEffect(() => {
    if (!selectedClass) { setSections([]); return; }
    database.collections.get<Section>('sections')
      .query(Q.where('class_id', selectedClass.id), Q.where('is_active', true)).fetch()
      .then(setSections).catch(()=>setSections([]));
    setSelectedSection(null);
    setSheetLoaded(false);
    setStudents([]);
    setAttendanceMap({});
  }, [selectedClass]);

  // Load sheet
  const loadSheet = useCallback(async () => {
    if (!selectedClass) { Alert.alert('Select Class','Please choose a class first.'); return; }
    setIsLoading(true);
    setSheetLoaded(false);
    try {
      const clauses: Q.Clause[] = [Q.where('class_id', selectedClass.id), Q.where('is_active', true)];
      if (selectedSection) clauses.push(Q.where('section_id', selectedSection.id));
      const studs = await database.collections.get<Student>('students').query(...clauses).fetch();
      setStudents(studs);

      const map: Record<string,AttendanceStatus> = {};
      studs.forEach(s => { map[s.id] = 'present'; });

      // Check local DB first
      const localAtt = await database.collections.get<Attendance>('attendance')
        .query(Q.where('class_id', selectedClass.id), Q.where('date', selectedDate)).fetch();
      localAtt.forEach(a => { if (map[a.studentId] !== undefined) map[a.studentId] = a.status as AttendanceStatus; });

      // Fallback to API if no local records
      if (localAtt.length === 0 && isOnline && user?.token) {
        try {
          const sp = selectedSection ? `&sectionId=${selectedSection.id}` : '';
          const remote: any[] = await apiGet(`/students/attendance/class/${selectedClass.id}?date=${selectedDate}${sp}`, user.token);
          if (Array.isArray(remote)) remote.forEach(a => { if (map[a.studentId] !== undefined) map[a.studentId] = a.status; });
        } catch {}
      }

      setAttendanceMap(map);
      setSheetLoaded(true);
    } catch(err:any) {
      Alert.alert('Error', err.message||'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, selectedSection, selectedDate, isOnline, user?.token]);

  const handleStatusChange = useCallback((id: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
  }, []);

  const handleMarkAll = (status: AttendanceStatus) => {
    const m: Record<string,AttendanceStatus> = {};
    students.forEach(st => { m[st.id] = status; });
    setAttendanceMap(m);
  };

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setIsSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        classId:   selectedClass.id,
        sectionId: selectedSection?.id || '',
        date:      selectedDate,
        status:    attendanceMap[s.id] || 'present',
        sessionId: sessionId || '',
        tenantId:  user!.tenantId,
      }));

      // Write to local DB
      await database.write(async () => {
        for (const rec of records) {
          const existing = await database.collections.get<Attendance>('attendance')
            .query(Q.where('student_id', rec.studentId), Q.where('date', rec.date)).fetch();
          if (existing.length > 0) {
            await existing[0].update(r => {
              r.status  = rec.status;
              r.classId = rec.classId;
              if (rec.sectionId) r.sectionId = rec.sectionId;
              if (rec.sessionId) r.sessionId = rec.sessionId;
            });
          } else {
            await database.collections.get<Attendance>('attendance').create(r => {
              r.studentId = rec.studentId;
              r.classId   = rec.classId;
              r.date      = rec.date;
              r.status    = rec.status;
              r.tenantId  = rec.tenantId;
              if (rec.sectionId) r.sectionId = rec.sectionId;
              if (rec.sessionId) r.sessionId = rec.sessionId;
            });
          }
        }
      });

      // Also POST to API if online for immediate website visibility
      if (isOnline && user?.token) {
        try {
          await apiPost('/students/attendance/bulk', user.token, {
            records: records.map(r=>({ studentId:r.studentId, classId:r.classId, sectionId:r.sectionId||undefined, date:r.date, status:r.status }))
          });
        } catch {}
      }

      Alert.alert('Saved!', `Attendance for ${students.length} students saved.`);
    } catch(err:any) {
      Alert.alert('Error', err.message||'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const summary = STATUSES.map(st => ({ ...st, count: Object.values(attendanceMap).filter(v=>v===st.key).length }));

  const Layout = user?.role === 'teacher' ? TeacherLayout : AdminLayout;

  return (
    <Layout activeTab="Attendance">
      <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.pageTitle}>Attendance</Text>
            <Text style={s.pageSub}>Mark daily student attendance</Text>
          </View>
          {!isOnline && (
            <View style={s.offlineBadge}>
              <Ionicons name="cloud-offline-outline" size={13} color={COLORS.errorText}/>
              <Text style={s.offlineTxt}>Offline</Text>
            </View>
          )}
        </View>

        {/* Selection Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Step 1 — Select Class & Date</Text>

          <Text style={s.fieldLabel}>Class *</Text>
          <TouchableOpacity style={s.selectInput} onPress={()=>setShowClassModal(true)}>
            <Text style={[s.selectTxt, !selectedClass && {color:COLORS.outline}]}>
              {selectedClass ? selectedClass.name : 'Select a class...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.outline}/>
          </TouchableOpacity>

          {sections.length > 0 && <>
            <Text style={[s.fieldLabel,{marginTop:14}]}>Section (optional)</Text>
            <TouchableOpacity style={s.selectInput} onPress={()=>setShowSectionModal(true)}>
              <Text style={[s.selectTxt, !selectedSection && {color:COLORS.outline}]}>
                {selectedSection ? selectedSection.name : 'All sections'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.outline}/>
            </TouchableOpacity>
          </>}

          <Text style={[s.fieldLabel,{marginTop:14}]}>Date *</Text>
          <TouchableOpacity style={s.selectInput} onPress={()=>setShowDateModal(true)}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.secondary} style={{marginRight:8}}/>
            <Text style={s.selectTxt}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.outline}/>
          </TouchableOpacity>

          <TouchableOpacity style={[s.loadBtn, (!selectedClass||isLoading) && {opacity:0.5}]} onPress={loadSheet} disabled={!selectedClass||isLoading}>
            {isLoading ? <ActivityIndicator size="small" color="#fff"/> : <Ionicons name="people-outline" size={18} color="#fff" style={{marginRight:8}}/>}
            <Text style={s.loadBtnTxt}>{isLoading ? 'Loading...' : 'Load Students'}</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Sheet */}
        {sheetLoaded && students.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Step 2 — Mark Attendance</Text>
            <Text style={s.cardSub}>{selectedClass?.name}{selectedSection ? ` · ${selectedSection.name}` : ''} · {formatDate(selectedDate)}</Text>

            {/* Summary */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:4,marginBottom:14}}>
              {summary.map(st=>(
                <View key={st.key} style={[s.summaryChip, {backgroundColor:STATUS_BG[st.key]}]}>
                  <Text style={[s.summaryCount, {color:STATUS_COLOR[st.key]}]}>{st.count}</Text>
                  <Text style={[s.summaryLabel, {color:STATUS_COLOR[st.key]}]}>{st.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Bulk actions */}
            <View style={s.bulkRow}>
              <Text style={s.bulkLabel}>Quick Mark:</Text>
              <TouchableOpacity style={[s.bulkBtn,{backgroundColor:COLORS.presentBg}]} onPress={()=>handleMarkAll('present')}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.present}/><Text style={[s.bulkBtnTxt,{color:COLORS.present}]}>All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bulkBtn,{backgroundColor:COLORS.absentBg}]} onPress={()=>handleMarkAll('absent')}>
                <Ionicons name="close-circle" size={14} color={COLORS.absent}/><Text style={[s.bulkBtnTxt,{color:COLORS.absent}]}>All Absent</Text>
              </TouchableOpacity>
            </View>

            {/* Student list */}
            {students.map(student => (
              <StudentRow
                key={student.id}
                student={student}
                status={attendanceMap[student.id]||'present'}
                onStatusChange={handleStatusChange}
              />
            ))}

            {/* Save */}
            <TouchableOpacity style={[s.saveBtn, isSaving && {opacity:0.6}]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#fff"/> : <Ionicons name="save-outline" size={18} color="#fff" style={{marginRight:8}}/>}
              <Text style={s.saveBtnTxt}>{isSaving ? 'Saving...' : `Save Attendance (${students.length} students)`}</Text>
            </TouchableOpacity>
          </View>
        )}

        {sheetLoaded && students.length === 0 && (
          <View style={s.emptyCard}>
            <Ionicons name="people-outline" size={40} color={COLORS.outlineVariant}/>
            <Text style={s.emptyTxt}>No students found for this class/section.</Text>
          </View>
        )}

      </ScrollView>

      {showClassModal && <DropdownModal title="Select Class" items={classes.map(c=>({id:c.id,name:c.name}))} onSelect={id=>{setSelectedClass(classes.find(c=>c.id===id)||null);}} onClose={()=>setShowClassModal(false)}/>}
      {showSectionModal && <DropdownModal title="Select Section" items={[{id:'',name:'All Sections'},...sections.map(sec=>({id:sec.id,name:sec.name}))]} onSelect={id=>{setSelectedSection(id?(sections.find(sec=>sec.id===id)||null):null);}} onClose={()=>setShowSectionModal(false)}/>}
      {showDateModal && <DatePickerModal value={selectedDate} onConfirm={setSelectedDate} onClose={()=>setShowDateModal(false)}/>}
    </Layout>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:COLORS.surface },
  content: { padding:20, paddingBottom:48 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  pageTitle: { ...TYPOGRAPHY.headlineSm, color:COLORS.onSurface },
  pageSub: { ...TYPOGRAPHY.bodyMd, color:COLORS.onSurfaceVariant, marginTop:2 },
  offlineBadge: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:COLORS.errorBg, paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  offlineTxt: { ...TYPOGRAPHY.labelMd, color:COLORS.errorText },
  card: { backgroundColor:COLORS.surfaceContainerLowest, borderRadius:16, padding:20, marginBottom:16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2 },
  cardTitle: { ...TYPOGRAPHY.titleMd, color:COLORS.onSurface, marginBottom:4 },
  cardSub: { ...TYPOGRAPHY.labelMd, color:COLORS.onSurfaceVariant, marginBottom:16 },
  fieldLabel: { ...TYPOGRAPHY.labelMd, color:COLORS.onSurfaceVariant, marginBottom:6 },
  selectInput: { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surfaceContainerLow, borderRadius:10, paddingHorizontal:14, paddingVertical:13, borderWidth:1, borderColor:COLORS.outlineVariant },
  selectTxt: { flex:1, ...TYPOGRAPHY.bodyMd, color:COLORS.onSurface },
  loadBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:14, marginTop:18 },
  loadBtnTxt: { ...TYPOGRAPHY.labelLg, color:'#fff' },
  summaryChip: { paddingHorizontal:14, paddingVertical:8, borderRadius:20, alignItems:'center', minWidth:72 },
  summaryCount: { fontSize:20, fontWeight:'700', lineHeight:24 },
  summaryLabel: { ...TYPOGRAPHY.labelSm, marginTop:2 },
  bulkRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' },
  bulkLabel: { ...TYPOGRAPHY.labelMd, color:COLORS.onSurfaceVariant },
  bulkBtn: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:20 },
  bulkBtnTxt: { ...TYPOGRAPHY.labelMd },
  studentRow: { flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:COLORS.surfaceContainerHigh },
  avatar: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', marginRight:10 },
  avatarTxt: { ...TYPOGRAPHY.labelLg },
  studentInfo: { width:100, marginRight:8 },
  studentName: { ...TYPOGRAPHY.labelLg, color:COLORS.onSurface },
  studentAdm: { ...TYPOGRAPHY.labelSm, color:COLORS.onSurfaceVariant },
  statusScroll: { flex:1 },
  statusScrollContent: { gap:6 },
  chip: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:6, borderRadius:20, borderWidth:1.5, borderColor:COLORS.outlineVariant, backgroundColor:COLORS.surfaceContainerLowest },
  chipTxt: { ...TYPOGRAPHY.labelSm, color:'#fff' },
  saveBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:COLORS.secondary, borderRadius:12, paddingVertical:15, marginTop:20 },
  saveBtnTxt: { ...TYPOGRAPHY.labelLg, color:'#fff' },
  emptyCard: { backgroundColor:COLORS.surfaceContainerLowest, borderRadius:16, padding:40, alignItems:'center', gap:12 },
  emptyTxt: { ...TYPOGRAPHY.bodyMd, color:COLORS.onSurfaceVariant, textAlign:'center' },
  dropItem: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:14, paddingHorizontal:4 },
  dropItemText: { ...TYPOGRAPHY.bodyMd, color:COLORS.onSurface },
});
