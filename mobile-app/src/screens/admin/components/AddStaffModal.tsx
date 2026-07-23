import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiPost, apiGet } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#031632',
  primaryContainer: '#1a3a6e',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainerHigh: '#e6e8ea',
  onSurface: '#191c1e',
  onSurfaceVariant: '#44474d',
  outline: '#b0b3b8',
  outlineVariant: '#c5c6ce',
  error: '#ba1a1a',
  secondary: '#055db6',
};

const TYPOGRAPHY = {
  headlineSm: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PickerOption {
  id: string;
  name: string;
}

// ─── Reusable Date Picker ─────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  minYear?: number;
  maxYear?: number;
}

function DatePickerField({ label, value, onChange, minYear, maxYear }: DatePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const parsed = value ? new Date(value) : null;
  const currentYear = new Date().getFullYear();
  const yearMin = minYear ?? currentYear - 80;
  const yearMax = maxYear ?? currentYear + 5;

  const [selDay, setSelDay] = useState(parsed ? parsed.getDate() : 1);
  const [selMonth, setSelMonth] = useState(parsed ? parsed.getMonth() : 0);
  const [selYear, setSelYear] = useState(parsed ? parsed.getFullYear() : 1990);

  const years = Array.from({ length: yearMax - yearMin + 1 }, (_, i) => yearMax - i);
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const openModal = () => {
    if (parsed && !isNaN(parsed.getTime())) {
      setSelDay(parsed.getDate());
      setSelMonth(parsed.getMonth());
      setSelYear(parsed.getFullYear());
    }
    setModalVisible(true);
  };

  const handleConfirm = () => {
    const m = (selMonth + 1).toString().padStart(2, '0');
    const d = selDay.toString().padStart(2, '0');
    onChange(`${selYear}-${m}-${d}`);
    setModalVisible(false);
  };

  const displayVal = value
    ? (() => {
        const d = new Date(value);
        return !isNaN(d.getTime())
          ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
          : value;
      })()
    : '';

  return (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectInput} onPress={openModal}>
        <Text style={[styles.selectText, !displayVal && styles.selectPlaceholder]}>
          {displayVal || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={COLORS.outline} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
          <View style={styles.pickerContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>{label}</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {/* Day */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 6 }]}>Day</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {days.map(d => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setSelDay(d)}
                      style={[styles.dateOption, selDay === d && styles.dateOptionActive]}
                    >
                      <Text style={[styles.dateOptionText, selDay === d && styles.dateOptionTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month */}
              <View style={{ flex: 1.4 }}>
                <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 6 }]}>Month</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((m, i) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSelMonth(i)}
                      style={[styles.dateOption, selMonth === i && styles.dateOptionActive]}
                    >
                      <Text style={[styles.dateOptionText, selMonth === i && styles.dateOptionTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year */}
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 6 }]}>Year</Text>
                <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                  {years.map(y => (
                    <TouchableOpacity
                      key={y}
                      onPress={() => setSelYear(y)}
                      style={[styles.dateOption, selYear === y && styles.dateOptionActive]}
                    >
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
}

// ─── Dropdown picker (option list) ────────────────────────────────────────────
interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption[];
  onSelect: (item: PickerOption) => void;
}

function PickerModal({ visible, onClose, title, options, onSelect }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.pickerContent}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.pickerItem}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles.pickerItemText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddStaffModal({ visible, onClose, onSuccess }: AddStaffModalProps) {
  const { user } = useAuthStore();
  const token = user?.token;
  const { settings } = useSettingsStore();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  // Remote data
  const [roles, setRoles] = useState<PickerOption[]>([]);
  const [departments, setDepartments] = useState<PickerOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Dropdown visibility
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showMaritalPicker, setShowMaritalPicker] = useState(false);
  const [showEmploymentTypePicker, setShowEmploymentTypePicker] = useState(false);

  // ── Step 1 fields ────────────────────────────────────────────────────────
  const [employeeId, setEmployeeId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [isTeachingStaff, setIsTeachingStaff] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [address, setAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // ── Step 2 fields ────────────────────────────────────────────────────────
  const [accountTitle, setAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [biometricId, setBiometricId] = useState('');

  // ── Step 3 fields ────────────────────────────────────────────────────────
  const [qualifications, setQualifications] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [note, setNote] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      resetForm();
      fetchInitialData();
    }
  }, [visible]);

  const fetchInitialData = async () => {
    if (!token) return;
    setIsLoadingData(true);
    try {
      const [fetchedRoles, fetchedDepts, nextIdRes] = await Promise.all([
        apiGet('/system/roles', token).catch(() => []),
        apiGet('/hr/departments', token).catch(() => []),
        apiGet('/hr/staff/next-id', token).catch(() => null),
      ]);
      setRoles(
        (fetchedRoles || []).filter(
          (r: any) => !['Super Administrator', 'Parent', 'Student'].includes(r.name)
        )
      );
      setDepartments(fetchedDepts || []);
      
      if (nextIdRes && nextIdRes.nextId && !employeeId) {
        setEmployeeId(`${settings.staffIdPrefix}${nextIdRes.nextId}`);
      }
    } catch (e) {
      console.log('Staff modal: failed to fetch initial data', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !dateOfJoining) {
        Alert.alert('Required Fields', 'Please fill in First Name, Last Name, Email, and Date of Joining.');
        return;
      }
    }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setStep(1);
    setEmployeeId(''); setRoleId(''); setRoleName(''); setIsTeachingStaff(false);
    setDepartmentId(''); setDepartmentName('');
    setFirstName(''); setLastName(''); setFatherName(''); setMotherName('');
    setEmail(''); setGender(''); setDateOfBirth(''); setDateOfJoining('');
    setPhone(''); setEmergencyContactPhone(''); setMaritalStatus('');
    setAddress(''); setPermanentAddress('');
    setAccountTitle(''); setBankName(''); setAccountNumber('');
    setBasicSalary(''); setEmploymentType('Full-Time'); setBiometricId('');
    setQualifications(''); setWorkExperience(''); setNote('');
    setFacebookUrl(''); setTwitterUrl(''); setLinkedinUrl(''); setInstagramUrl('');
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !dateOfJoining) {
      Alert.alert('Error', 'Required fields are missing. Please go back and fill them in.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        employeeId: employeeId.trim() || undefined,
        roleId: roleId || undefined,
        isTeachingStaff,
        departmentId: departmentId || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fatherName: fatherName.trim() || undefined,
        motherName: motherName.trim() || undefined,
        email: email.trim(),
        gender: gender || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        dateOfJoining: new Date(dateOfJoining).toISOString(),
        phone: phone.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        maritalStatus: maritalStatus || undefined,
        address: address.trim() || undefined,
        permanentAddress: permanentAddress.trim() || undefined,
        accountTitle: accountTitle.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        basicSalary: basicSalary ? Number(basicSalary) : 0,
        employmentType,
        biometricId: biometricId.trim() || undefined,
        qualifications: qualifications.trim() || undefined,
        workExperience: workExperience.trim() || undefined,
        note: note.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
      };

      await apiPost('/hr/staff', token || '', payload);
      Alert.alert('Success', 'Staff member added successfully');
      resetForm();
      onSuccess();
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step renderers ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <Field label="Staff ID">
        <TextInput style={styles.input} value={employeeId} onChangeText={setEmployeeId} placeholder="e.g. 001" editable={!isSubmitting} />
      </Field>

      <Field label="Role">
        <TouchableOpacity style={styles.selectInput} onPress={() => !isSubmitting && setShowRolePicker(true)}>
          <Text style={[styles.selectText, !roleId && styles.selectPlaceholder]}>{roleName || 'Select Role'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.outline} />
        </TouchableOpacity>
      </Field>

      <Field label="Department">
        <TouchableOpacity style={styles.selectInput} onPress={() => !isSubmitting && setShowDeptPicker(true)}>
          <Text style={[styles.selectText, !departmentId && styles.selectPlaceholder]}>{departmentName || 'Select Department (Optional)'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.outline} />
        </TouchableOpacity>
      </Field>

      <Field label="First Name *">
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="e.g. John" editable={!isSubmitting} />
      </Field>

      <Field label="Last Name *">
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="e.g. Doe" editable={!isSubmitting} />
      </Field>

      <Field label="Father Name">
        <TextInput style={styles.input} value={fatherName} onChangeText={setFatherName} editable={!isSubmitting} />
      </Field>

      <Field label="Mother Name">
        <TextInput style={styles.input} value={motherName} onChangeText={setMotherName} editable={!isSubmitting} />
      </Field>

      <Field label="Email *">
        <TextInput
          style={styles.input} value={email} onChangeText={setEmail}
          placeholder="john.doe@example.com" keyboardType="email-address"
          autoCapitalize="none" editable={!isSubmitting}
        />
      </Field>

      <Field label="Gender">
        <TouchableOpacity style={styles.selectInput} onPress={() => !isSubmitting && setShowGenderPicker(true)}>
          <Text style={[styles.selectText, !gender && styles.selectPlaceholder]}>{gender || 'Select Gender'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.outline} />
        </TouchableOpacity>
      </Field>

      <DatePickerField
        label="Date of Birth"
        value={dateOfBirth}
        onChange={setDateOfBirth}
        maxYear={new Date().getFullYear() - 18}
      />

      <DatePickerField
        label="Date of Joining *"
        value={dateOfJoining}
        onChange={setDateOfJoining}
        minYear={2000}
        maxYear={new Date().getFullYear() + 1}
      />

      <Field label="Phone">
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1234567890" keyboardType="phone-pad" editable={!isSubmitting} />
      </Field>

      <Field label="Emergency Contact Phone">
        <TextInput style={styles.input} value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} keyboardType="phone-pad" editable={!isSubmitting} />
      </Field>

      <Field label="Marital Status">
        <TouchableOpacity style={styles.selectInput} onPress={() => !isSubmitting && setShowMaritalPicker(true)}>
          <Text style={[styles.selectText, !maritalStatus && styles.selectPlaceholder]}>{maritalStatus || 'Select Status'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.outline} />
        </TouchableOpacity>
      </Field>

      <Field label="Current Address">
        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={address} onChangeText={setAddress} editable={!isSubmitting} />
      </Field>

      <Field label="Permanent Address">
        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={permanentAddress} onChangeText={setPermanentAddress} editable={!isSubmitting} />
      </Field>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>Bank & Payroll Details</Text>

      <Text style={styles.subTitle}>Bank Details</Text>
      <Field label="Account Name">
        <TextInput style={styles.input} value={accountTitle} onChangeText={setAccountTitle} editable={!isSubmitting} />
      </Field>
      <Field label="Bank Name">
        <TextInput style={styles.input} value={bankName} onChangeText={setBankName} editable={!isSubmitting} />
      </Field>
      <Field label="Account Number">
        <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" editable={!isSubmitting} />
      </Field>

      <Text style={[styles.subTitle, { marginTop: 20 }]}>Payroll Details</Text>
      <Field label={`Basic Salary (${settings.currencySymbol})`}>
        <TextInput style={styles.input} value={basicSalary} onChangeText={setBasicSalary} keyboardType="numeric" placeholder="0" editable={!isSubmitting} />
      </Field>
      <Field label="Employment Type">
        <TouchableOpacity style={styles.selectInput} onPress={() => !isSubmitting && setShowEmploymentTypePicker(true)}>
          <Text style={styles.selectText}>{employmentType}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.outline} />
        </TouchableOpacity>
      </Field>
      <Field label="Biometric ID">
        <TextInput style={styles.input} value={biometricId} onChangeText={setBiometricId} editable={!isSubmitting} />
      </Field>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionTitle}>Qualification & Social Links</Text>

      <Field label="Qualification">
        <TextInput style={styles.input} value={qualifications} onChangeText={setQualifications} editable={!isSubmitting} />
      </Field>
      <Field label="Work Experience">
        <TextInput style={styles.input} value={workExperience} onChangeText={setWorkExperience} editable={!isSubmitting} />
      </Field>
      <Field label="Note">
        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={note} onChangeText={setNote} editable={!isSubmitting} />
      </Field>

      <Text style={[styles.subTitle, { marginTop: 20 }]}>Social Media Links</Text>
      <Field label="Facebook URL">
        <TextInput style={styles.input} value={facebookUrl} onChangeText={setFacebookUrl} editable={!isSubmitting} autoCapitalize="none" />
      </Field>
      <Field label="Twitter URL">
        <TextInput style={styles.input} value={twitterUrl} onChangeText={setTwitterUrl} editable={!isSubmitting} autoCapitalize="none" />
      </Field>
      <Field label="LinkedIn URL">
        <TextInput style={styles.input} value={linkedinUrl} onChangeText={setLinkedinUrl} editable={!isSubmitting} autoCapitalize="none" />
      </Field>
      <Field label="Instagram URL">
        <TextInput style={styles.input} value={instagramUrl} onChangeText={setInstagramUrl} editable={!isSubmitting} autoCapitalize="none" />
      </Field>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="person-add-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Add Staff Member</Text>
              <Text style={styles.subtitle}>Step {step} of {TOTAL_STEPS}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicatorContainer}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                <Text style={[styles.stepDotLabel, step >= s && styles.stepDotLabelActive]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Body */}
          {isLoadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 10, color: COLORS.onSurfaceVariant }}>Loading data...</Text>
            </View>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              {/* Footer navigation */}
              <View style={styles.footerButtons}>
                {step > 1 && (
                  <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isSubmitting}>
                    <Ionicons name="arrow-back" size={16} color={COLORS.onSurface} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                {step < TOTAL_STEPS ? (
                  <TouchableOpacity style={[styles.nextButton, step === 1 && { flex: 1 }]} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.onPrimary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? <ActivityIndicator color={COLORS.onPrimary} size="small" />
                      : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.onPrimary} />
                          <Text style={styles.submitButtonText}>Submit</Text>
                        </>
                      )}
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>

      {/* ── Dropdown pickers ── */}
      <PickerModal
        visible={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        title="Select Role"
        options={roles}
        onSelect={r => {
          setRoleId(r.id);
          setRoleName(r.name);
          setIsTeachingStaff(r.name.toLowerCase() === 'teacher');
        }}
      />
      <PickerModal
        visible={showDeptPicker}
        onClose={() => setShowDeptPicker(false)}
        title="Select Department"
        options={departments}
        onSelect={d => { setDepartmentId(d.id); setDepartmentName(d.name); }}
      />
      <PickerModal
        visible={showGenderPicker}
        onClose={() => setShowGenderPicker(false)}
        title="Select Gender"
        options={[{ id: 'Male', name: 'Male' }, { id: 'Female', name: 'Female' }, { id: 'Other', name: 'Other' }]}
        onSelect={g => setGender(g.id)}
      />
      <PickerModal
        visible={showMaritalPicker}
        onClose={() => setShowMaritalPicker(false)}
        title="Select Marital Status"
        options={[
          { id: 'Single', name: 'Single' },
          { id: 'Married', name: 'Married' },
          { id: 'Divorced', name: 'Divorced' },
          { id: 'Widowed', name: 'Widowed' },
        ]}
        onSelect={m => setMaritalStatus(m.id)}
      />
      <PickerModal
        visible={showEmploymentTypePicker}
        onClose={() => setShowEmploymentTypePicker(false)}
        title="Select Employment Type"
        options={[
          { id: 'Full-Time', name: 'Full-Time' },
          { id: 'Part-Time', name: 'Part-Time' },
          { id: 'Contract', name: 'Contract' },
          { id: 'Temporary', name: 'Temporary' },
        ]}
        onSelect={e => setEmploymentType(e.id)}
      />
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: { ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface },
  subtitle: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant },
  closeBtn: { padding: 8 },

  // Step indicator
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotLabel: { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant },
  stepDotLabelActive: { color: COLORS.onPrimary },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  body: { paddingHorizontal: 20, paddingTop: 20 },

  sectionTitle: { ...TYPOGRAPHY.headlineSm, color: COLORS.primary, marginBottom: 16 },
  subTitle: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface, marginBottom: 12 },

  formGroup: { marginBottom: 16 },
  inputLabel: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurfaceVariant, marginBottom: 6 },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  selectInput: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontSize: 14, color: COLORS.onSurface, flex: 1 },
  selectPlaceholder: { color: COLORS.outline },

  footerButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  backButton: {
    flex: 1, height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  backButtonText: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface },
  nextButton: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  nextButtonText: { ...TYPOGRAPHY.labelLg, color: COLORS.onPrimary },
  submitButton: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: COLORS.secondary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  submitButtonText: { ...TYPOGRAPHY.labelLg, color: COLORS.onPrimary, textTransform: 'uppercase' },

  // Picker modal (shared by both PickerModal and DatePickerField)
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pickerContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  pickerTitle: { ...TYPOGRAPHY.headlineSm, color: COLORS.primary, marginBottom: 12 },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  pickerItemText: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface },

  // Date picker scrollable columns
  dateOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  dateOptionActive: { backgroundColor: COLORS.primaryContainer },
  dateOptionText: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, fontSize: 14 },
  dateOptionTextActive: { color: COLORS.onPrimary, fontWeight: '700' },
  dateConfirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  dateConfirmText: { ...TYPOGRAPHY.labelLg, color: COLORS.onPrimary, fontSize: 16 },
});
