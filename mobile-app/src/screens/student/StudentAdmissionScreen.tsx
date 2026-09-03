import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Q } from '@nozbe/watermelondb';

import AdminLayout from '../../components/AdminLayout';
import { database } from '../../database';
import Student from '../../database/models/Student';
import Class from '../../database/models/Class';
import Section from '../../database/models/Section';
import FeeGroup from '../../database/models/FeeGroup';
import { useAuthStore } from '../../store/authStore';

export const FormContext = createContext<any>(null);

// ─── Render Helpers (Moved outside to prevent focus loss) ───────────────────

const Field = ({ label, field, placeholder, multiline, editable = true, keyboardType }: {
  label: string; field: string; placeholder?: string; multiline?: boolean; editable?: boolean; keyboardType?: any;
}) => {
  const { form, set } = useContext(FormContext);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && { minHeight: 80, textAlignVertical: 'top' },
          !editable && { backgroundColor: COLORS.surfaceContainerHigh },
        ]}
        value={form[field] as string}
        keyboardType={keyboardType}
        onChangeText={(t) => {
          let sanitizedText = t;
          if (keyboardType === 'numeric') {
            sanitizedText = t.replace(/[^0-9.]/g, '');
          } else if (keyboardType === 'phone-pad') {
            sanitizedText = t.replace(/[^0-9+\-() ]/g, '');
          }

          set(field, sanitizedText);
          // Sync logic
          if (form.primaryGuardian === 'Father') {
            if (field === 'fatherName') set('guardianName', sanitizedText);
            if (field === 'fatherPhone') set('guardianPhone', sanitizedText);
            if (field === 'fatherEmail') set('guardianEmail', sanitizedText);
          } else if (form.primaryGuardian === 'Mother') {
            if (field === 'motherName') set('guardianName', sanitizedText);
            if (field === 'motherPhone') set('guardianPhone', sanitizedText);
            if (field === 'motherEmail') set('guardianEmail', sanitizedText);
          }
        }}
        placeholder={placeholder || label}
        placeholderTextColor={COLORS.outline}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
      />
    </View>
  );
};

const Toggle = ({ label, desc, field }: { label: string; desc?: string; field: string }) => {
  const { form, set } = useContext(FormContext);
  return (
    <View style={styles.toggleCard}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={form[field] as boolean}
        onValueChange={(v) => set(field, v)}
        trackColor={{ false: COLORS.surfaceContainerHighest, true: COLORS.primaryContainer }}
        thumbColor={form[field] ? COLORS.primary : COLORS.outlineVariant}
      />
    </View>
  );
};

const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={18} color={COLORS.onSurface} />
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Divider = ({ label }: { label: string }) => (
  <View style={styles.dividerWrap}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerLabel}>{label}</Text>
    <View style={styles.dividerLine} />
  </View>
);

const Row2 = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.row2}>{children}</View>
);

const Col = ({ children }: { children?: React.ReactNode }) => (
  <View style={styles.col}>{children}</View>
);

const ClassPicker = () => {
  const { form, set, classes } = useContext(FormContext);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>Class *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={styles.chipRow}>
          {classes.map((cls: any) => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.chip, form.classId === cls.id && styles.chipActive]}
              onPress={() => set('classId', cls.id)}
            >
              <Text style={[styles.chipText, form.classId === cls.id && styles.chipTextActive]}>{cls.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const SectionPicker = () => {
  const { form, set, sections } = useContext(FormContext);
  if (sections.length === 0) return null;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>Section</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={styles.chipRow}>
          {sections.map((sec: any) => (
            <TouchableOpacity
              key={sec.id}
              style={[styles.chip, form.sectionId === sec.id && styles.chipActive]}
              onPress={() => set('sectionId', sec.id)}
            >
              <Text style={[styles.chipText, form.sectionId === sec.id && styles.chipTextActive]}>{sec.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const GenderDropdown = () => {
  const { form, set } = useContext(FormContext);
  const [modalVisible, setModalVisible] = useState(false);
  const options = ['Male', 'Female', 'Other'];

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>Gender *</Text>
      <TouchableOpacity 
        style={[styles.fieldInput, { justifyContent: 'center' }]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: form.gender ? COLORS.onSurface : COLORS.outline }}>
          {form.gender || 'Select Gender'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.outline} style={{ position: 'absolute', right: 12 }} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  set('gender', opt);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, form.gender === opt && { color: COLORS.primary, fontWeight: 'bold' }]}>
                  {opt}
                </Text>
                {form.gender === opt && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const DatePickerField = ({ label, field }: { label: string; field: string }) => {
  const { form, set } = useContext(FormContext);
  const [modalVisible, setModalVisible] = useState(false);

  // Parse existing value or use defaults
  const currentVal = form[field] as string;
  const parsed = currentVal ? new Date(currentVal) : null;
  const [selDay, setSelDay] = useState(parsed ? parsed.getDate() : 1);
  const [selMonth, setSelMonth] = useState(parsed ? parsed.getMonth() : 0);
  const [selYear, setSelYear] = useState(parsed ? parsed.getFullYear() : 2015);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const m = (selMonth + 1).toString().padStart(2, '0');
    const d = selDay.toString().padStart(2, '0');
    set(field, `${selYear}-${m}-${d}`);
    setModalVisible(false);
  };

  const openModal = () => {
    if (parsed && !isNaN(parsed.getTime())) {
      setSelDay(parsed.getDate());
      setSelMonth(parsed.getMonth());
      setSelYear(parsed.getFullYear());
    }
    setModalVisible(true);
  };

  // Format the display value
  const displayVal = currentVal
    ? (() => { const d = new Date(currentVal); return !isNaN(d.getTime()) ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` : currentVal; })()
    : '';

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.fieldInput, { justifyContent: 'center' }]}
        onPress={openModal}
      >
        <Text style={{ color: displayVal ? COLORS.onSurface : COLORS.outline }}>
          {displayVal || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={COLORS.outline} style={{ position: 'absolute', right: 12 }} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{label}</Text>

            {/* Day / Month / Year selectors */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {/* Day */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 6 }]}>Day</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {days.map((d) => (
                    <TouchableOpacity key={d} onPress={() => setSelDay(d)} style={[styles.dateOption, selDay === d && styles.dateOptionActive]}>
                      <Text style={[styles.dateOptionText, selDay === d && styles.dateOptionTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Month */}
              <View style={{ flex: 1.4 }}>
                <Text style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 6 }]}>Month</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {months.map((m, i) => (
                    <TouchableOpacity key={m} onPress={() => setSelMonth(i)} style={[styles.dateOption, selMonth === i && styles.dateOptionActive]}>
                      <Text style={[styles.dateOptionText, selMonth === i && styles.dateOptionTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Year */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 6 }]}>Year</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <TouchableOpacity key={y} onPress={() => setSelYear(y)} style={[styles.dateOption, selYear === y && styles.dateOptionActive]}>
                      <Text style={[styles.dateOptionText, selYear === y && styles.dateOptionTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.dateConfirmBtn} onPress={handleConfirm}>
              <Text style={styles.dateConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const FeeAllocationTab = () => {
  const { form, set } = useContext(FormContext);
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);

  useEffect(() => {
    database.collections.get<FeeGroup>('fee_groups').query(Q.where('is_active', true)).fetch()
      .then(setFeeGroups);
  }, []);


  const handleToggleGroup = (groupId: string) => {
    const isSelected = form.selectedFeeGroups.includes(groupId);
    let newGroups = [...form.selectedFeeGroups];
    const newExclusions = { ...form.feeExclusions };

    if (isSelected) {
      newGroups = newGroups.filter(id => id !== groupId);
      delete newExclusions[groupId];
    } else {
      newGroups.push(groupId);
    }
    set('selectedFeeGroups', newGroups);
    set('feeExclusions', newExclusions);
  };

  const handleToggleExclusion = (groupId: string, headId: string) => {
    const groupExclusions = form.feeExclusions[groupId] || [];
    const isExcluded = groupExclusions.includes(headId);
    let newExclusions = [...groupExclusions];
    if (isExcluded) {
      newExclusions = newExclusions.filter(id => id !== headId);
    } else {
      newExclusions.push(headId);
    }
    set('feeExclusions', { ...form.feeExclusions, [groupId]: newExclusions });
  };

  return (
    <>
      <SectionHeader icon="cash-outline" title="Fee Allocation" />
      <View style={{ gap: 16 }}>
        {feeGroups.map(group => {
          const isSelected = form.selectedFeeGroups.includes(group.id);
          const heads = group.heads.filter(h => h.isActive);
          const exclusions = form.feeExclusions[group.id] || [];
          const includedHeads = heads.filter(h => !exclusions.includes(h.id));
          const subtotal = includedHeads.reduce((sum, h) => sum + parseFloat(h.defaultAmount || '0'), 0);
          
          return (
            <View key={group.id} style={styles.feeGroupCard}>
              <TouchableOpacity
                style={[styles.feeGroupHeader, isSelected && styles.feeGroupHeaderSelected]}
                onPress={() => handleToggleGroup(group.id)}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.onPrimary} />}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeGroupName}>{group.name}</Text>
                  {group.description ? <Text style={styles.feeGroupDesc}>{group.description}</Text> : null}
                </View>
                <Text style={styles.feeGroupTotal}>₦{subtotal.toFixed(2)}</Text>
              </TouchableOpacity>
              
              {isSelected && heads.length > 0 && (
                <View style={styles.feeHeadsContainer}>
                  {heads.map(head => {
                    const isExcluded = exclusions.includes(head.id);
                    return (
                      <View key={head.id} style={styles.feeHeadRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.feeHeadName, isExcluded && styles.feeHeadExcluded]}>{head.name}</Text>
                          {head.isOptional && <Text style={styles.feeHeadOptional}>Optional</Text>}
                        </View>
                        <Text style={[styles.feeHeadAmount, isExcluded && styles.feeHeadExcluded]}>₦{parseFloat(head.defaultAmount).toFixed(2)}</Text>
                        {head.isOptional && (
                          <TouchableOpacity
                            style={styles.excludeBtn}
                            onPress={() => handleToggleExclusion(group.id, head.id)}
                          >
                            <Text style={styles.excludeBtnText}>{isExcluded ? 'Include' : 'Exclude'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        {feeGroups.length === 0 && (
          <Text style={{ textAlign: 'center', color: COLORS.onSurfaceVariant, padding: 20 }}>
            No fee groups available.
          </Text>
        )}
      </View>
    </>
  );
};

// ─── Design Tokens ───────────────────────────────────────────────────────────

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#44474d',
  outline: '#75777e',
  outlineVariant: '#c5c6ce',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  secondary: '#055db6',
  successBg: '#dcfce7',
  successText: '#166534',
};

const TYPOGRAPHY = {
  headlineMd: { fontFamily: 'Inter', fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.22 },
  headlineSm: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.14 },
  labelMd: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.48 },
  labelSm: { fontFamily: 'Inter', fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

// ─── Tab Config ──────────────────────────────────────────────────────────────

const tabList = [
  { key: 'personal', label: 'Personal Details', icon: 'person-outline' },
  { key: 'parent', label: 'Parent / Guardian', icon: 'people-outline' },
  { key: 'address', label: 'Address Details', icon: 'location-outline' },
  { key: 'academic', label: 'Academic Details', icon: 'school-outline' },
  { key: 'medical', label: 'Medical Records', icon: 'medkit-outline' },
  { key: 'faith', label: 'Faith & Religion', icon: 'heart-outline' },
  { key: 'legal', label: 'Legal', icon: 'document-text-outline' },
  { key: 'fees', label: 'Fee Allocation', icon: 'cash-outline' },
  { key: 'transport', label: 'Transport Details', icon: 'bus-outline' },
  { key: 'hostel', label: 'Hostel Details', icon: 'home-outline' },
] as const;

// ─── Shared UI Components ────────────────────────────────────────────────────

function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) {
  return (
    <View style={styles.tabsShell}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
        {tabList.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => onTabChange(tab.key)} style={[styles.tab, active && styles.tabActive]}>
              <Ionicons name={tab.icon as any} size={16} color={active ? COLORS.onSurface : COLORS.onSurfaceVariant} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PageTitle({ onBack, onSave, isSaving }: { onBack: () => void; onSave: () => void; isSaving: boolean }) {
  return (
    <View style={styles.titleRow}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={20} color={COLORS.onSurface} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>New Admission</Text>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbMuted}>Students</Text>
          <Text style={styles.breadcrumbSlash}>/</Text>
          <Text style={styles.breadcrumbCurrent}>New Admission</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={onSave} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator size="small" color={COLORS.onPrimary} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.onPrimary} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Admit Student'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Admission Number Generator ──────────────────────────────────────────────

async function generateAdmissionNo(): Promise<string> {
  const year = new Date().getFullYear().toString();
  const prefix = `SCH/${year}/`;

  const count = await database.collections
    .get<Student>('students')
    .query(Q.where('admission_no', Q.like(`${Q.sanitizeLikeString(prefix)}%`)))
    .fetchCount();

  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}${sequence}`;
}

// ─── Form State ──────────────────────────────────────────────────────────────

interface AdmissionFormState {
  admissionNo: string;
  rollNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dob: string;
  religion: string;
  caste: string;
  mobileNumber: string;
  email: string;
  admissionDate: string;
  nationality: string;
  stateOfOrigin: string;
  genotype: string;
  bloodGroup: string;
  height: string;
  weight: string;
  medicalConditions: string;

  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherOccupation: string;
  primaryGuardian: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  emergencyContact: string;

  currentAddress: string;
  permanentAddress: string;

  classId: string;
  sectionId: string;
  previousSchoolName: string;
  lastClassPassed: string;

  specialPhysicalHealthProblems: string;
  hasDisability: boolean;
  hasAllergies: boolean;
  allergyDetails: string;
  familyDoctorName: string;
  familyDoctorPhone: string;
  familyDoctorClinicAddress: string;
  firstAidConsent: boolean;

  catholicFaithConsent: boolean;
  isBaptized: boolean;
  isCommunicant: boolean;

  applicationFeeReference: string;
  undertakingAccepted: boolean;
  parentSignature: boolean;

  transportRoute: string;
  vehicleNumber: string;
  pickupPoint: string;

  hostelName: string;
  roomNumber: string;

  selectedFeeGroups: string[];
  feeExclusions: Record<string, string[]>;
}

const initialFormState: AdmissionFormState = {
  admissionNo: '',
  rollNo: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  dob: '',
  religion: '',
  caste: '',
  mobileNumber: '',
  email: '',
  admissionDate: new Date().toISOString().split('T')[0],
  nationality: '',
  stateOfOrigin: '',
  genotype: '',
  bloodGroup: '',
  height: '',
  weight: '',
  medicalConditions: '',

  fatherName: '',
  fatherPhone: '',
  fatherEmail: '',
  fatherOccupation: '',
  motherName: '',
  motherPhone: '',
  motherEmail: '',
  motherOccupation: '',
  primaryGuardian: 'Other',
  guardianName: '',
  guardianRelation: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianAddress: '',
  emergencyContact: '',

  currentAddress: '',
  permanentAddress: '',

  classId: '',
  sectionId: '',
  previousSchoolName: '',
  lastClassPassed: '',

  specialPhysicalHealthProblems: '',
  hasDisability: false,
  hasAllergies: false,
  allergyDetails: '',
  familyDoctorName: '',
  familyDoctorPhone: '',
  familyDoctorClinicAddress: '',
  firstAidConsent: false,

  catholicFaithConsent: false,
  isBaptized: false,
  isCommunicant: false,

  applicationFeeReference: '',
  undertakingAccepted: false,
  parentSignature: false,

  transportRoute: '',
  vehicleNumber: '',
  pickupPoint: '',

  hostelName: '',
  roomNumber: '',

  selectedFeeGroups: [],
  feeExclusions: {},
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudentAdmissionScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<AdmissionFormState>(initialFormState);

  // Class / Section picker data
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Auto-generate admission number on mount
  useEffect(() => {
    generateAdmissionNo().then((no) => {
      setForm((f) => ({ ...f, admissionNo: no }));
    });
  }, []);

  // Load classes
  useEffect(() => {
    database.collections
      .get<Class>('classes')
      .query()
      .fetch()
      .then(setClasses);
  }, []);

  // Load sections when classId changes
  useEffect(() => {
    if (form.classId) {
      database.collections
        .get<Section>('sections')
        .query(Q.where('class_id', form.classId))
        .fetch()
        .then(setSections);
    } else {
      setSections([]);
    }
  }, [form.classId]);

  // ─── Save Handler ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    // Validation
    if (!form.firstName.trim()) {
      Alert.alert('Validation Error', 'First Name is required');
      return;
    }
    if (!form.admissionNo.trim()) {
      Alert.alert('Validation Error', 'Admission Number is required');
      return;
    }
    if (!form.gender.trim()) {
      Alert.alert('Validation Error', 'Gender is required');
      return;
    }
    if (!form.dob.trim()) {
      Alert.alert('Validation Error', 'Date of Birth is required');
      return;
    }
    if (!form.admissionDate.trim()) {
      Alert.alert('Validation Error', 'Admission Date is required');
      return;
    }
    if (!form.classId) {
      Alert.alert('Validation Error', 'Class is required');
      return;
    }
    if (!form.guardianName.trim()) {
      Alert.alert('Validation Error', 'Guardian Name is required');
      return;
    }
    if (!form.guardianRelation.trim()) {
      Alert.alert('Validation Error', 'Guardian Relation is required');
      return;
    }
    if (!form.guardianPhone.trim()) {
      Alert.alert('Validation Error', 'Guardian Phone is required');
      return;
    }
    if (!form.guardianEmail.trim()) {
      Alert.alert('Validation Error', 'Guardian Email is required');
      return;
    }

    const dobDate = new Date(form.dob);
    if (isNaN(dobDate.getTime())) {
      Alert.alert('Validation Error', 'Invalid Date of Birth format. Use YYYY-MM-DD');
      return;
    }
    const admissionDateValue = new Date(form.admissionDate);
    if (isNaN(admissionDateValue.getTime())) {
      Alert.alert('Validation Error', 'Invalid Admission Date format. Use YYYY-MM-DD');
      return;
    }

    setIsSaving(true);
    try {
      await database.write(async () => {
        await database.collections.get<Student>('students').create((r: any) => {
          r.tenantId = user?.tenantId || '';
          r.admissionNo = form.admissionNo.trim();
          r.rollNo = form.rollNo || undefined;
          r.firstName = form.firstName.trim();
          r.middleName = form.middleName || undefined;
          r.lastName = form.lastName || undefined;
          r.gender = form.gender.trim();
          r.dob = dobDate;
          r.admissionDate = admissionDateValue;
          r.isActive = true;

          // Personal
          r.religion = form.religion || undefined;
          r.caste = form.caste || undefined;
          r.mobileNumber = form.mobileNumber || undefined;
          r.email = form.email || undefined;
          r.nationality = form.nationality || undefined;
          r.stateOfOrigin = form.stateOfOrigin || undefined;
          r.genotype = form.genotype || undefined;
          r.bloodGroup = form.bloodGroup || undefined;
          r.height = form.height || undefined;
          r.weight = form.weight || undefined;
          r.medicalConditions = form.medicalConditions || undefined;

          // Parent / Guardian
          r.fatherName = form.fatherName || undefined;
          r.fatherPhone = form.fatherPhone || undefined;
          r.fatherEmail = form.fatherEmail || undefined;
          r.fatherOccupation = form.fatherOccupation || undefined;
          r.motherName = form.motherName || undefined;
          r.motherPhone = form.motherPhone || undefined;
          r.motherEmail = form.motherEmail || undefined;
          r.motherOccupation = form.motherOccupation || undefined;
          r.guardianName = form.guardianName || undefined;
          r.guardianRelation = form.guardianRelation || undefined;
          r.guardianPhone = form.guardianPhone || undefined;
          r.guardianEmail = form.guardianEmail || undefined;
          r.guardianAddress = form.guardianAddress || undefined;
          r.emergencyContact = form.emergencyContact || undefined;

          // Address
          r.currentAddress = form.currentAddress || undefined;
          r.permanentAddress = form.permanentAddress || undefined;

          // Academic
          r.classId = form.classId || undefined;
          r.sectionId = form.sectionId || undefined;
          r.previousSchoolName = form.previousSchoolName || undefined;
          r.lastClassPassed = form.lastClassPassed || undefined;

          // Medical
          r.specialPhysicalHealthProblems = form.specialPhysicalHealthProblems || undefined;
          r.hasDisability = form.hasDisability;
          r.hasAllergies = form.hasAllergies;
          r.allergyDetails = form.allergyDetails || undefined;
          r.familyDoctorName = form.familyDoctorName || undefined;
          r.familyDoctorPhone = form.familyDoctorPhone || undefined;
          r.familyDoctorClinicAddress = form.familyDoctorClinicAddress || undefined;
          r.firstAidConsent = form.firstAidConsent;

          // Faith
          r.catholicFaithConsent = form.catholicFaithConsent;
          r.isBaptized = form.isBaptized;
          r.isCommunicant = form.isCommunicant;

          // Legal
          r.applicationFeeReference = form.applicationFeeReference || undefined;
          r.undertakingAccepted = form.undertakingAccepted;
          r.parentSignature = form.parentSignature;

          // Transport
          r.transportRoute = form.transportRoute || undefined;
          r.vehicleNumber = form.vehicleNumber || undefined;
          r.pickupPoint = form.pickupPoint || undefined;

          // Hostel
          r.hostelName = form.hostelName || undefined;
          r.roomNumber = form.roomNumber || undefined;

          // Fees
          r.selectedFeeGroups = JSON.stringify(form.selectedFeeGroups);
          r.feeExclusions = JSON.stringify(form.feeExclusions);
        });
      });

      Alert.alert('Success', 'Student admitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create student record');
    } finally {
      setIsSaving(false);
    }
  }, [form, user, navigation]);

  // ─── Render helpers ────────────────────────────────────────────────────────
  const set = (field: keyof AdmissionFormState, val: any) => setForm((f) => ({ ...f, [field]: val }));

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <FormContext.Provider value={{ form, set, classes, sections }}>
    <AdminLayout activeTab="Students">
      <View style={styles.main}>
        <PageTitle onBack={() => navigation.goBack()} onSave={handleSave} isSaving={isSaving} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            {/* ═══════════ PERSONAL DETAILS ═══════════ */}
            {activeTab === 'personal' && (
              <>
                <SectionHeader icon="person-outline" title="Personal Details" />

                {/* Auto-generated admission badge (now editable) */}
                <View style={styles.admissionBadge}>
                  <Ionicons name="ribbon-outline" size={18} color={COLORS.successText} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.admissionBadgeLabel}>Admission No</Text>
                    <TextInput
                      style={styles.admissionBadgeInput}
                      value={form.admissionNo}
                      onChangeText={(t) => set('admissionNo', t)}
                      placeholder="Generating..."
                      placeholderTextColor={COLORS.successText}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.regenerateBtn}
                    onPress={() => generateAdmissionNo().then((no) => set('admissionNo', no))}
                  >
                    <Ionicons name="refresh-outline" size={16} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>

                <Row2>
                  <Col><Field label="Roll No" field="rollNo" /></Col>
                  <Col><GenderDropdown /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="First Name *" field="firstName" /></Col>
                  <Col><Field label="Last Name" field="lastName" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Middle Name" field="middleName" /></Col>
                  <Col><DatePickerField label="Date of Birth *" field="dob" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Religion" field="religion" /></Col>
                  <Col><Field label="Caste" field="caste" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Mobile Number" field="mobileNumber" keyboardType="phone-pad" /></Col>
                  <Col><Field label="Email" field="email" keyboardType="email-address" /></Col>
                </Row2>
                <Row2>
                  <Col><DatePickerField label="Admission Date *" field="admissionDate" /></Col>
                  <Col><Field label="Nationality" field="nationality" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="State of Origin" field="stateOfOrigin" /></Col>
                  <Col><Field label="Genotype" field="genotype" placeholder="AA / AS / SS / AC" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Blood Group" field="bloodGroup" placeholder="A+ / O- / ..." /></Col>
                  <Col><Field label="Height (cm)" field="height" keyboardType="numeric" /></Col>
                </Row2>
                <Field label="Weight (kg)" field="weight" keyboardType="numeric" />
                <Field label="Medical Conditions / Allergies" field="medicalConditions" multiline />
              </>
            )}

            {/* ═══════════ PARENT / GUARDIAN ═══════════ */}
            {activeTab === 'parent' && (
              <>
                <SectionHeader icon="people-outline" title="Parent / Guardian Details" />

                <Divider label="Father Details" />
                <Row2>
                  <Col><Field label="Father Name" field="fatherName" /></Col>
                  <Col><Field label="Father Phone" field="fatherPhone" keyboardType="phone-pad" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Father Email" field="fatherEmail" keyboardType="email-address" /></Col>
                  <Col><Field label="Father Occupation" field="fatherOccupation" /></Col>
                </Row2>

                <Divider label="Mother Details" />
                <Row2>
                  <Col><Field label="Mother Name" field="motherName" /></Col>
                  <Col><Field label="Mother Phone" field="motherPhone" keyboardType="phone-pad" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Mother Email" field="motherEmail" keyboardType="email-address" /></Col>
                  <Col><Field label="Mother Occupation" field="motherOccupation" /></Col>
                </Row2>

                <Divider label="Primary Guardian Record" />
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Who is the Primary Guardian?</Text>
                  <View style={styles.chipRow}>
                    {['Father', 'Mother', 'Other'].map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, form.primaryGuardian === opt && styles.chipActive]}
                        onPress={() => {
                          set('primaryGuardian', opt);
                          if (opt === 'Father') {
                            set('guardianName', form.fatherName);
                            set('guardianRelation', 'Father');
                            set('guardianPhone', form.fatherPhone);
                            set('guardianEmail', form.fatherEmail);
                          } else if (opt === 'Mother') {
                            set('guardianName', form.motherName);
                            set('guardianRelation', 'Mother');
                            set('guardianPhone', form.motherPhone);
                            set('guardianEmail', form.motherEmail);
                          } else {
                            set('guardianName', '');
                            set('guardianRelation', 'Other');
                            set('guardianPhone', '');
                            set('guardianEmail', '');
                          }
                        }}
                      >
                        <Text style={[styles.chipText, form.primaryGuardian === opt && styles.chipTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <Row2>
                  <Col><Field label="Guardian Name *" field="guardianName" editable={form.primaryGuardian === 'Other'} /></Col>
                  <Col><Field label="Guardian Relation *" field="guardianRelation" editable={form.primaryGuardian === 'Other'} /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Guardian Phone *" field="guardianPhone" editable={form.primaryGuardian === 'Other'} keyboardType="phone-pad" /></Col>
                  <Col><Field label="Guardian Email *" field="guardianEmail" editable={form.primaryGuardian === 'Other'} keyboardType="email-address" /></Col>
                </Row2>
                <Field label="Guardian Address" field="guardianAddress" multiline />
                <Field label="Emergency Contact" field="emergencyContact" placeholder="Name & Phone Number" keyboardType="phone-pad" />
              </>
            )}

            {/* ═══════════ ADDRESS DETAILS ═══════════ */}
            {activeTab === 'address' && (
              <>
                <SectionHeader icon="location-outline" title="Address Details" />
                <Field label="Current Address" field="currentAddress" multiline />
                <Field label="Permanent Address" field="permanentAddress" multiline />
              </>
            )}

            {/* ═══════════ ACADEMIC DETAILS ═══════════ */}
            {activeTab === 'academic' && (
              <>
                <SectionHeader icon="school-outline" title="Academic Details" />
                <ClassPicker />
                <SectionPicker />
                <Field label="Previous School Name" field="previousSchoolName" />
                <Field label="Last Class Passed" field="lastClassPassed" />
              </>
            )}

            {/* ═══════════ MEDICAL RECORDS ═══════════ */}
            {activeTab === 'medical' && (
              <>
                <SectionHeader icon="medkit-outline" title="Medical & Health Records" />
                <Field label="Special Physical or Health Problems" field="specialPhysicalHealthProblems" multiline />
                <View style={{ marginTop: 4, gap: 12 }}>
                  <Toggle label="Disability Status" desc="Does the student have any disability?" field="hasDisability" />
                  <Toggle label="Allergy Status" desc="Food, flowers, insects, animals, etc." field="hasAllergies" />
                </View>
                {form.hasAllergies && (
                  <View style={{ marginTop: 12 }}>
                    <Field label="Specific Allergy Details" field="allergyDetails" multiline />
                  </View>
                )}

                <Divider label="Family Doctor Details" />
                <Row2>
                  <Col><Field label="Doctor Name" field="familyDoctorName" /></Col>
                  <Col><Field label="Emergency Contact Number" field="familyDoctorPhone" keyboardType="phone-pad" /></Col>
                </Row2>
                <Field label="Clinic/Hospital Address" field="familyDoctorClinicAddress" multiline />
                <View style={{ marginTop: 8 }}>
                  <Toggle label="First Aid Consent" desc="Do you give consent for first aid treatment?" field="firstAidConsent" />
                </View>
              </>
            )}

            {/* ═══════════ FAITH & RELIGION ═══════════ */}
            {activeTab === 'faith' && (
              <>
                <SectionHeader icon="heart-outline" title="Faith & Religious Participation" />
                <View style={{ gap: 12 }}>
                  <Toggle label="Consent for Catholic Faith Practice" desc="I accept that the child will participate in Catholic faith practices" field="catholicFaithConsent" />
                  <Toggle label="Baptism Status" desc="Has the student been baptized?" field="isBaptized" />
                  <Toggle label="Communicant Status" desc="Is the student a communicant?" field="isCommunicant" />
                </View>
              </>
            )}

            {/* ═══════════ LEGAL ═══════════ */}
            {activeTab === 'legal' && (
              <>
                <SectionHeader icon="document-text-outline" title="Legal & Finalization" />
                <Field label="Application Fee Reference/Status" field="applicationFeeReference" placeholder="e.g. Paid via Bank Transfer (Ref: 12345)" />

                <Divider label="Undertaking / Declaration" />
                <View style={styles.declarationBox}>
                  <Text style={styles.declarationText}>
                    {`"I ${form.guardianName || '[Parent Name]'} Parent/Guardian of ${form.firstName ? `${form.firstName} ${form.lastName || ''}`.trim() : '[Student Name]'} hereby accept to abide by the conditions set to help the child and will assist the school where possible in furtherance of the child's holistic education if the child is admitted."`}
                  </Text>
                </View>
                <View style={{ gap: 12, marginTop: 16 }}>
                  <Toggle label="I accept the undertaking/declaration" field="undertakingAccepted" />
                  <Toggle label="I agree and digitally sign this document" field="parentSignature" />
                </View>
              </>
            )}

            {/* ═══════════ FEE ALLOCATION ═══════════ */}
            {activeTab === 'fees' && (
              <FeeAllocationTab />
            )}

            {/* ═══════════ TRANSPORT DETAILS ═══════════ */}
            {activeTab === 'transport' && (
              <>
                <SectionHeader icon="bus-outline" title="Transport Details" />
                <Row2>
                  <Col><Field label="Route List" field="transportRoute" placeholder="Route Name" /></Col>
                  <Col><Field label="Vehicle Number" field="vehicleNumber" /></Col>
                </Row2>
                <Field label="Pickup Point" field="pickupPoint" />
              </>
            )}

            {/* ═══════════ HOSTEL DETAILS ═══════════ */}
            {activeTab === 'hostel' && (
              <>
                <SectionHeader icon="home-outline" title="Hostel Details" />
                <Row2>
                  <Col><Field label="Hostel Name" field="hostelName" /></Col>
                  <Col><Field label="Room Number" field="roomNumber" /></Col>
                </Row2>
              </>
            )}

          </View>
        </ScrollView>
      </View>
    </AdminLayout>
    </FormContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: COLORS.surface },

  // Title bar
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 20,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  pageTitle: { ...TYPOGRAPHY.headlineMd, color: COLORS.onSurface },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  breadcrumbMuted: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant },
  breadcrumbSlash: { ...TYPOGRAPHY.labelMd, color: COLORS.outlineVariant, marginHorizontal: 6 },
  breadcrumbCurrent: { ...TYPOGRAPHY.labelMd, color: COLORS.primary },
  saveButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { ...TYPOGRAPHY.labelLg, color: COLORS.onPrimary },

  // Tab bar
  tabsShell: {
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  tabsContent: { paddingHorizontal: 24, gap: 24 },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 8,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.onSurface },
  tabText: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.onSurface },

  // Content
  content: { flex: 1 },
  contentInner: {
    padding: 24, paddingBottom: 48,
    maxWidth: 900, alignSelf: 'center', width: '100%',
  },

  // Card
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.surfaceContainerHigh,
    padding: 24, overflow: 'hidden',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh,
    marginBottom: 24,
  },
  sectionHeaderText: { ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface, fontSize: 17 },

  // 2-column grid
  row2: { flexDirection: 'row', marginHorizontal: -8 },
  col: { flex: 1, paddingHorizontal: 8 },

  // Field
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant, marginBottom: 6 },
  fieldInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 11,
    ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface,
  },

  // Toggle
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleLabel: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface, marginBottom: 2 },
  toggleDesc: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 2 },

  // Divider
  dividerWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 8, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surfaceContainerHigh },
  dividerLabel: {
    ...TYPOGRAPHY.labelLg, color: COLORS.primary,
    textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11,
  },

  // Declaration
  declarationBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 12,
    padding: 18, marginTop: 8,
  },
  declarationText: {
    ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant,
    fontStyle: 'italic', lineHeight: 22,
  },

  // Admission Number Badge
  admissionBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20,
  },
  admissionBadgeLabel: {
    ...TYPOGRAPHY.labelSm, color: COLORS.successText, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  admissionBadgeValue: {
    ...TYPOGRAPHY.labelLg, color: COLORS.successText, fontSize: 16, marginTop: 2,
  },
  admissionBadgeInput: {
    ...TYPOGRAPHY.labelLg, color: COLORS.successText, fontSize: 16, marginTop: 2, padding: 0,
  },
  regenerateBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#bbf7d0',
  },

  // Class/Section Chip Picker
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
  },
  chipActive: {
    backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary,
  },
  chipText: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant },
  chipTextActive: { color: COLORS.onPrimary },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, paddingBottom: 40,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface, marginBottom: 16, textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh,
  },
  modalOptionText: {
    ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, fontSize: 16,
  },
  dateOption: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', marginBottom: 4,
  },
  dateOptionActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  dateOptionText: {
    ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, fontSize: 14,
  },
  dateOptionTextActive: {
    color: COLORS.onPrimary, fontWeight: '600',
  },
  dateConfirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  dateConfirmText: {
    ...TYPOGRAPHY.labelLg, color: COLORS.onPrimary, fontSize: 16,
  },

  feeGroupCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  feeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    gap: 12,
  },
  feeGroupHeaderSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  checkboxContainer: {
    justifyContent: 'center',
  },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  feeGroupName: {
    ...TYPOGRAPHY.labelLg, color: COLORS.onSurface,
  },
  feeGroupDesc: {
    ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 2,
  },
  feeGroupTotal: {
    ...TYPOGRAPHY.headlineSm, color: COLORS.primary,
  },
  feeHeadsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHigh,
  },
  feeHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  feeHeadName: {
    ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface,
  },
  feeHeadExcluded: {
    color: COLORS.outline,
    textDecorationLine: 'line-through',
  },
  feeHeadOptional: {
    ...TYPOGRAPHY.labelSm, color: COLORS.secondary, marginTop: 2,
  },
  feeHeadAmount: {
    ...TYPOGRAPHY.labelLg, color: COLORS.onSurface,
  },
  excludeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  excludeBtnText: {
    ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant,
  }
});
