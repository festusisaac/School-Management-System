import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AdminLayout from '../../components/AdminLayout';
import withObservables from '@nozbe/with-observables';

import { database } from '../../database';
import Student from '../../database/models/Student';
import Class from '../../database/models/Class';
import Section from '../../database/models/Section';
import FeeGroup from '../../database/models/FeeGroup';
import { Q } from '@nozbe/watermelondb';

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
};

const TYPOGRAPHY = {
  headlineMd: { fontFamily: 'Inter', fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.22 },
  headlineSm: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.14 },
  labelMd: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.48 },
  labelSm: { fontFamily: 'Inter', fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

// ─── Tab Config (mirrors internal StudentAdmission.tsx sidebar) ──────────────

const tabList = [
  { key: 'personal', label: 'Personal Details', icon: 'person-outline' },
  { key: 'parent', label: 'Parent / Guardian', icon: 'people-outline' },
  { key: 'address', label: 'Address Details', icon: 'location-outline' },
  { key: 'academic', label: 'Academic Details', icon: 'school-outline' },
  { key: 'medical', label: 'Medical Records', icon: 'medkit-outline' },
  { key: 'faith', label: 'Faith & Religion', icon: 'heart-outline' },
  { key: 'legal', label: 'Legal', icon: 'document-text-outline' },
  { key: 'transport', label: 'Transport Details', icon: 'bus-outline' },
  { key: 'hostel', label: 'Hostel Details', icon: 'home-outline' },
  { key: 'fees', label: 'Fee Allocation', icon: 'cash-outline' },
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
        <Text style={styles.pageTitle}>Edit Student</Text>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbMuted}>Students</Text>
          <Text style={styles.breadcrumbSlash}>/</Text>
          <Text style={styles.breadcrumbMuted}>Profile</Text>
          <Text style={styles.breadcrumbSlash}>/</Text>
          <Text style={styles.breadcrumbCurrent}>Edit</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={onSave} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator size="small" color={COLORS.onPrimary} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="save-outline" size={16} color={COLORS.onPrimary} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const FeeAllocationTab = ({ form, set }: { form: any, set: (field: any, val: any) => void }) => {
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

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={COLORS.onSurface} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

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

// ─── Form State (every field from internal StudentAdmission.tsx) ─────────────

interface EditFormState {
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
  asOnDate: string;
  medicalConditions: string;

  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherOccupation: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  emergencyContact: string;

  currentAddress: string;
  permanentAddress: string;

  // Academic — matches web portal: Class, Section, Category, House, Previous School, Last Class
  classId: string;
  sectionId: string;
  categoryId: string;
  houseId: string;
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

// ─── Main Component ──────────────────────────────────────────────────────────

function StudentEditInner({ student }: { student: Student }) {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [isSaving, setIsSaving] = useState(false);

  // Load class & section names for display
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');

  useEffect(() => {
    if (student.classId) {
      database.collections.get<Class>('classes').find(student.classId)
        .then(c => setClassName(c.name || ''))
        .catch(() => setClassName(''));
    }
    if (student.sectionId) {
      database.collections.get<Section>('sections').find(student.sectionId)
        .then(s => setSectionName(s.name || ''))
        .catch(() => setSectionName(''));
    }
  }, [student.classId, student.sectionId]);

  const fmtDate = (d?: Date | number | string | null) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const [form, setForm] = useState<EditFormState>({
    admissionNo: student.admissionNo || '',
    rollNo: student.rollNo || '',
    firstName: student.firstName || '',
    middleName: student.middleName || '',
    lastName: student.lastName || '',
    gender: student.gender || '',
    dob: fmtDate(student.dob),
    religion: student.religion || '',
    caste: student.caste || '',
    mobileNumber: student.mobileNumber || '',
    email: student.email || '',
    admissionDate: fmtDate(student.admissionDate),
    nationality: student.nationality || '',
    stateOfOrigin: student.stateOfOrigin || '',
    genotype: student.genotype || '',
    bloodGroup: student.bloodGroup || '',
    height: student.height || '',
    weight: student.weight || '',
    asOnDate: fmtDate((student as any).asOnDate),
    medicalConditions: student.medicalConditions || '',

    fatherName: student.fatherName || '',
    fatherPhone: student.fatherPhone || '',
    fatherEmail: student.fatherEmail || '',
    fatherOccupation: student.fatherOccupation || '',
    motherName: student.motherName || '',
    motherPhone: student.motherPhone || '',
    motherEmail: student.motherEmail || '',
    motherOccupation: student.motherOccupation || '',
    guardianName: student.guardianName || '',
    guardianRelation: student.guardianRelation || '',
    guardianPhone: student.guardianPhone || '',
    guardianEmail: student.guardianEmail || '',
    guardianAddress: student.guardianAddress || '',
    emergencyContact: student.emergencyContact || '',

    currentAddress: student.currentAddress || '',
    permanentAddress: student.permanentAddress || '',

    classId: student.classId || '',
    sectionId: student.sectionId || '',
    categoryId: (student as any).categoryId || '',
    houseId: (student as any).houseId || '',
    previousSchoolName: student.previousSchoolName || '',
    lastClassPassed: student.lastClassPassed || '',

    specialPhysicalHealthProblems: student.specialPhysicalHealthProblems || '',
    hasDisability: !!student.hasDisability,
    hasAllergies: !!student.hasAllergies,
    allergyDetails: student.allergyDetails || '',
    familyDoctorName: student.familyDoctorName || '',
    familyDoctorPhone: student.familyDoctorPhone || '',
    familyDoctorClinicAddress: student.familyDoctorClinicAddress || '',
    firstAidConsent: !!student.firstAidConsent,

    catholicFaithConsent: !!student.catholicFaithConsent,
    isBaptized: !!student.isBaptized,
    isCommunicant: !!student.isCommunicant,

    applicationFeeReference: student.applicationFeeReference || '',
    undertakingAccepted: !!student.undertakingAccepted,
    parentSignature: !!student.parentSignature,

    transportRoute: student.transportRoute || '',
    vehicleNumber: student.vehicleNumber || '',
    pickupPoint: student.pickupPoint || '',

    hostelName: student.hostelName || '',
    roomNumber: student.roomNumber || '',

    selectedFeeGroups: (() => {
      try { return student.selectedFeeGroups ? JSON.parse(student.selectedFeeGroups) : []; } catch { return []; }
    })(),
    feeExclusions: (() => {
      try { return student.feeExclusions ? JSON.parse(student.feeExclusions) : {}; } catch { return {}; }
    })(),
  });

  // ─── Save Handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.firstName) { Alert.alert('Validation Error', 'First Name is required'); return; }
    setIsSaving(true);
    try {
      await database.write(async () => {
        await student.update((r: Student) => {
          r.admissionNo = form.admissionNo;
          r.rollNo = form.rollNo;
          r.firstName = form.firstName;
          r.middleName = form.middleName;
          r.lastName = form.lastName;
          r.gender = form.gender;
          if (form.dob) { const d = new Date(form.dob); if (!isNaN(d.getTime())) r.dob = d; }
          r.religion = form.religion;
          r.caste = form.caste;
          r.mobileNumber = form.mobileNumber;
          r.email = form.email;
          if (form.admissionDate) { const d = new Date(form.admissionDate); if (!isNaN(d.getTime())) r.admissionDate = d; }
          r.nationality = form.nationality;
          r.stateOfOrigin = form.stateOfOrigin;
          r.genotype = form.genotype;
          r.bloodGroup = form.bloodGroup;
          r.height = form.height;
          r.weight = form.weight;
          r.medicalConditions = form.medicalConditions;

          r.fatherName = form.fatherName;
          r.fatherPhone = form.fatherPhone;
          r.fatherEmail = form.fatherEmail;
          r.fatherOccupation = form.fatherOccupation;
          r.motherName = form.motherName;
          r.motherPhone = form.motherPhone;
          r.motherEmail = form.motherEmail;
          r.motherOccupation = form.motherOccupation;
          r.guardianName = form.guardianName;
          r.guardianRelation = form.guardianRelation;
          r.guardianPhone = form.guardianPhone;
          r.guardianEmail = form.guardianEmail;
          r.guardianAddress = form.guardianAddress;
          r.emergencyContact = form.emergencyContact;

          r.currentAddress = form.currentAddress;
          r.permanentAddress = form.permanentAddress;

          r.previousSchoolName = form.previousSchoolName;
          r.lastClassPassed = form.lastClassPassed;

          r.specialPhysicalHealthProblems = form.specialPhysicalHealthProblems;
          r.hasDisability = form.hasDisability;
          r.hasAllergies = form.hasAllergies;
          r.allergyDetails = form.allergyDetails;
          r.familyDoctorName = form.familyDoctorName;
          r.familyDoctorPhone = form.familyDoctorPhone;
          r.familyDoctorClinicAddress = form.familyDoctorClinicAddress;
          r.firstAidConsent = form.firstAidConsent;

          r.catholicFaithConsent = form.catholicFaithConsent;
          r.isBaptized = form.isBaptized;
          r.isCommunicant = form.isCommunicant;

          r.applicationFeeReference = form.applicationFeeReference;
          r.undertakingAccepted = form.undertakingAccepted;
          r.parentSignature = form.parentSignature;

          r.transportRoute = form.transportRoute;
          r.vehicleNumber = form.vehicleNumber;
          r.pickupPoint = form.pickupPoint;

          r.hostelName = form.hostelName;
          r.roomNumber = form.roomNumber;

          r.selectedFeeGroups = JSON.stringify(form.selectedFeeGroups);
          r.feeExclusions = JSON.stringify(form.feeExclusions);
        });
      });
      Alert.alert('Success', 'Student updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const set = (field: keyof EditFormState, val: any) => setForm(f => ({ ...f, [field]: val }));

  /** Single text field — full width by default */
  const Field = ({ label, field, placeholder, multiline }: { label: string; field: keyof EditFormState; placeholder?: string; multiline?: boolean }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={form[field] as string}
        onChangeText={(t) => set(field, t)}
        placeholder={placeholder || label}
        placeholderTextColor={COLORS.outline}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  /** Read-only info field (for class/section names resolved from IDs) */
  const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldInput, { backgroundColor: COLORS.surfaceContainerHigh }]}>
        <Text style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface }}>{value || '—'}</Text>
      </View>
    </View>
  );

  /** Toggle switch with label and optional description */
  const Toggle = ({ label, desc, field }: { label: string; desc?: string; field: keyof EditFormState }) => (
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

  /** Section header with icon */
  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={COLORS.onSurface} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  /** Divider with centered label */
  const Divider = ({ label }: { label: string }) => (
    <View style={styles.dividerWrap}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );

  /** 2-column row helper */
  const Row2 = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.row2}>{children}</View>
  );
  const Col = ({ children }: { children?: React.ReactNode }) => (
    <View style={styles.col}>{children}</View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
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
                <Row2>
                  <Col><Field label="Admission No *" field="admissionNo" /></Col>
                  <Col><Field label="Roll No" field="rollNo" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="First Name *" field="firstName" /></Col>
                  <Col><Field label="Last Name" field="lastName" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Middle Name" field="middleName" /></Col>
                  <Col><Field label="Gender *" field="gender" placeholder="Male / Female / Other" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Date of Birth *" field="dob" placeholder="YYYY-MM-DD" /></Col>
                  <Col><Field label="Religion" field="religion" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Caste" field="caste" /></Col>
                  <Col><Field label="Mobile Number" field="mobileNumber" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Email" field="email" /></Col>
                  <Col><Field label="Admission Date *" field="admissionDate" placeholder="YYYY-MM-DD" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Nationality" field="nationality" /></Col>
                  <Col><Field label="State of Origin" field="stateOfOrigin" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Genotype" field="genotype" placeholder="AA / AS / SS / AC" /></Col>
                  <Col><Field label="Blood Group" field="bloodGroup" placeholder="A+ / O- / ..." /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Height (cm)" field="height" /></Col>
                  <Col><Field label="Weight (kg)" field="weight" /></Col>
                </Row2>
                <Field label="Measurement Date" field="asOnDate" placeholder="YYYY-MM-DD" />
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
                  <Col><Field label="Father Phone" field="fatherPhone" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Father Email" field="fatherEmail" /></Col>
                  <Col><Field label="Father Occupation" field="fatherOccupation" /></Col>
                </Row2>

                <Divider label="Mother Details" />
                <Row2>
                  <Col><Field label="Mother Name" field="motherName" /></Col>
                  <Col><Field label="Mother Phone" field="motherPhone" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Mother Email" field="motherEmail" /></Col>
                  <Col><Field label="Mother Occupation" field="motherOccupation" /></Col>
                </Row2>

                <Divider label="Primary Guardian Record" />
                <Row2>
                  <Col><Field label="Guardian Name *" field="guardianName" /></Col>
                  <Col><Field label="Guardian Relation *" field="guardianRelation" /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Guardian Phone *" field="guardianPhone" /></Col>
                  <Col><Field label="Guardian Email *" field="guardianEmail" /></Col>
                </Row2>
                <Field label="Guardian Address" field="guardianAddress" multiline />
                <Field label="Emergency Contact" field="emergencyContact" placeholder="Name & Phone Number" />
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
                <Row2>
                  <Col><ReadonlyField label="Class *" value={className} /></Col>
                  <Col><ReadonlyField label="Section" value={sectionName} /></Col>
                </Row2>
                <Row2>
                  <Col><Field label="Category" field="categoryId" placeholder="Category ID" /></Col>
                  <Col><Field label="House" field="houseId" placeholder="House ID" /></Col>
                </Row2>
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
                  <Col><Field label="Emergency Contact Number" field="familyDoctorPhone" /></Col>
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

            {/* ═══════════ FEE ALLOCATION ═══════════ */}
            {activeTab === 'fees' && (
              <FeeAllocationTab form={form} set={(f: any, v: any) => set(f as keyof EditFormState, v)} />
            )}
          </View>
        </ScrollView>
      </View>
    </AdminLayout>
  );
}

// ─── WatermelonDB Wiring ─────────────────────────────────────────────────────

const ConnectedEditScreen = withObservables(['studentId'], ({ studentId }: { studentId: string }) => ({
  student: database.collections.get<Student>('students').findAndObserve(studentId),
}))(StudentEditInner);

export default function StudentEditScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { studentId } = route.params as { studentId: string };
  const [studentExists, setStudentExists] = useState<boolean | null>(null);

  useEffect(() => {
    database.collections.get<Student>('students').find(studentId)
      .then(() => setStudentExists(true))
      .catch(() => setStudentExists(false));
  }, [studentId]);

  if (studentExists === null) {
    return (
      <AdminLayout activeTab="Students">
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={20} color={COLORS.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, marginTop: 12 }}>Loading student...</Text>
        </View>
      </AdminLayout>
    );
  }

  if (studentExists === false) {
    return (
      <AdminLayout activeTab="Students">
        <View style={styles.loader}>
          <Text style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant }}>Student not found</Text>
        </View>
      </AdminLayout>
    );
  }

  return <ConnectedEditScreen studentId={studentId} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: COLORS.surface },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  // 2-column grid (NEVER 3 — each field gets proper breathing room)
  row2: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 0,
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },

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
