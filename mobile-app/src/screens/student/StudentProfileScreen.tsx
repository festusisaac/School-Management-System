import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AdminLayout from '../../components/AdminLayout';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

import { database } from '../../database';
import { getSyncBaseUrl } from '../../services/api';
import Student from '../../database/models/Student';
import Class from '../../database/models/Class';
import Section from '../../database/models/Section';
import FeeRecord from '../../database/models/FeeRecord';
import Attendance from '../../database/models/Attendance';
import CommunicationLog from '../../database/models/CommunicationLog';
import StudentDocument from '../../database/models/StudentDocument';

const COLORS = {
  surface: '#f7f9fb',
  surfaceDim: '#d8dadc',
  surfaceBright: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#44474d',
  inverseSurface: '#2d3133',
  inverseOnSurface: '#eff1f3',
  outline: '#75777e',
  outlineVariant: '#c5c6ce',
  surfaceTint: '#4e5f7e',
  primary: '#031632',
  onPrimary: '#ffffff',
  primaryContainer: '#1a2b48',
  onPrimaryContainer: '#8293b5',
  inversePrimary: '#b6c7eb',
  secondary: '#055db6',
  onSecondary: '#ffffff',
  secondaryContainer: '#65a1fe',
  onSecondaryContainer: '#003670',
  tertiary: '#001c04',
  onTertiary: '#ffffff',
  tertiaryContainer: '#00330d',
  onTertiaryContainer: '#29a845',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#d7e2ff',
  primaryFixedDim: '#b6c7eb',
  onPrimaryFixed: '#081b38',
  onPrimaryFixedVariant: '#374765',
  secondaryFixed: '#d6e3ff',
  secondaryFixedDim: '#a9c7ff',
  onSecondaryFixed: '#001b3d',
  onSecondaryFixedVariant: '#00468c',
  tertiaryFixed: '#83fc8e',
  tertiaryFixedDim: '#66df75',
  onTertiaryFixed: '#002106',
  onTertiaryFixedVariant: '#00531a',
  background: '#f7f9fb',
  onBackground: '#191c1e',
  surfaceVariant: '#e0e3e5',
};

const TYPOGRAPHY = {
  headlineLg: { fontFamily: 'Inter', fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.56 },
  headlineMd: { fontFamily: 'Inter', fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.22 },
  headlineSm: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLg: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.14 },
  labelMd: { fontFamily: 'Inter', fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.48 },
  labelSm: { fontFamily: 'Inter', fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

const tabList = [
  { key: 'Profile', icon: 'person-outline' },
  { key: 'Fees', icon: 'cash-outline' },
  { key: 'Attendance', icon: 'calendar-outline' },
  { key: 'Communication', icon: 'chatbubbles-outline' },
  { key: 'Documents', icon: 'document-text-outline' },
] as const;

function getPhotoUrl(photoPath?: string): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) return photoPath;
  const baseUrl = getSyncBaseUrl().replace('/api/v1', '');
  return `${baseUrl}/${photoPath}`;
}

function formatDate(date?: Date | number | string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date?: Date | number | string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function studentFullName(student: Student) {
  return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
}

// ─── Reusable UI helpers ─────────────────────────────────────────────────────

function PageTitle({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.titleRow}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={20} color={COLORS.onSurface} />
      </TouchableOpacity>
      <View>
        <Text style={styles.pageTitle}>Student Profile</Text>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbMuted}>Students</Text>
          <Text style={styles.breadcrumbSlash}>/</Text>
          <Text style={styles.breadcrumbCurrent}>Profile</Text>
        </View>
      </View>
    </View>
  );
}

function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) {
  return (
    <View style={styles.tabsShell}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
        {tabList.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons name={tab.icon} size={16} color={active ? COLORS.onSurface : COLORS.onSurfaceVariant} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.key}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SummaryRow({ icon, label, value, strong }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLabelWrap}>
        <Ionicons name={icon} size={16} color={COLORS.onSurfaceVariant} />
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPair}>
      <Text style={styles.infoPairLabel}>{label}</Text>
      <Text style={styles.infoPairValue}>{value}</Text>
    </View>
  );
}

function EmptyState({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={40} color={COLORS.outlineVariant} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileCard({ student, studentClass }: { student: Student; studentClass?: Class | null }) {
  const navigation = useNavigation<any>();
  const initials = `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`.toUpperCase();
  const photoUrl = getPhotoUrl(student.studentPhoto);
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials || 'S'}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera-outline" size={14} color={COLORS.surfaceContainerLowest} />
          </View>
        </View>
      </View>
      <Text style={styles.studentName}>{studentFullName(student)}</Text>
      <View style={styles.badgeRow}>
        <View style={styles.classPill}>
          <Text style={styles.classPillText}>{studentClass?.name || 'No Class'}</Text>
        </View>
        <View style={styles.genderPill}>
          <Text style={styles.genderPillText}>{student.gender || '-'}</Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.summaryRows}>
        <SummaryRow icon="finger-print-outline" label="Admission No" value={student.admissionNo || '-'} strong />
        <SummaryRow icon="list-outline" label="Roll Number" value={student.rollNo || '-'} />
        <SummaryRow icon="shapes-outline" label="Status" value={student.isActive ? 'Active' : 'Inactive'} />
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.outlineAction} onPress={() => navigation.navigate('StudentEdit', { studentId: student.id })}>
          <Ionicons name="pencil-outline" size={16} color={COLORS.onSurface} />
          <Text style={styles.outlineActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineAction}>
          <Ionicons name="print-outline" size={16} color={COLORS.onSurface} />
          <Text style={styles.outlineActionText}>Print</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.credentialsButton}>
        <Ionicons name="key-outline" size={16} color={COLORS.onPrimary} />
        <Text style={styles.credentialsText}>ACCESS CREDENTIALS</Text>
      </TouchableOpacity>
    </View>
  );
}

function CoreProfileSection({ student }: { student: Student }) {
  const fields = [
    { label: 'Full Legal Name', value: studentFullName(student) },
    { label: 'Date Of Admission', value: formatDate(student.admissionDate) },
    { label: 'Date Of Birth', value: formatDate(student.dob) },
    { label: 'Mobile Number', value: student.mobileNumber || '-' },
    { label: 'Personal Email', value: student.email || '-' },
    { label: 'Blood Group', value: student.bloodGroup || '-' },
    { label: 'Genotype', value: student.genotype || '-' },
    { label: 'Religion / Caste', value: `${student.religion || '-'} / ${student.caste || '-'}` },
    { label: 'State of Origin', value: student.stateOfOrigin || '-' },
    { label: 'Nationality', value: student.nationality || '-' },
    { label: 'Medical Records', value: student.medicalConditions || 'No history reported' },
  ];
  return (
    <View style={styles.sectionCard}>
      <View style={styles.tableHeader}>
        <View style={styles.headerTitleWrap}>
          <Ionicons name="id-card-outline" size={18} color={COLORS.onSurface} />
          <Text style={styles.sectionTitle}>Core Student Profile</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.tertiaryContainer} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>
      {fields.map((f, i) => (
        <InfoRow key={f.label} label={f.label} value={f.value} isLast={i === fields.length - 1} />
      ))}
    </View>
  );
}

function FamilySection({ student }: { student: Student }) {
  const guardians = [
    { initial: 'F', name: student.fatherName || '-', role: 'Father', phone: student.fatherPhone || '-', occupation: student.fatherOccupation || '-', dark: true },
    { initial: 'M', name: student.motherName || '-', role: 'Mother', phone: student.motherPhone || '-', occupation: student.motherOccupation || '-', dark: false },
  ];
  if (student.guardianName) {
    guardians.push({ initial: 'G', name: student.guardianName, role: student.guardianRelation || 'Guardian', phone: student.guardianPhone || '-', occupation: '-', dark: true });
  }
  return (
    <View style={styles.sectionCard}>
      <View style={styles.tableHeader}>
        <View style={styles.headerTitleWrap}>
          <Ionicons name="people-outline" size={18} color={COLORS.onSurface} />
          <Text style={styles.sectionTitle}>Family & Guardianship</Text>
        </View>
      </View>
      <View style={styles.guardianList}>
        {guardians.map((g) => (
          <View key={`${g.initial}-${g.name}`} style={styles.guardianCard}>
            <View style={styles.guardianTop}>
              <View style={[styles.guardianAvatar, g.dark ? styles.guardianAvatarDark : styles.guardianAvatarLight]}>
                <Text style={[styles.guardianInitial, g.dark ? styles.guardianInitialDark : styles.guardianInitialLight]}>{g.initial}</Text>
              </View>
              <View>
                <Text style={styles.guardianName}>{g.name}</Text>
                <Text style={styles.guardianRole}>{g.role}</Text>
              </View>
            </View>
            <InfoPair label="Phone:" value={g.phone} />
            <InfoPair label="Occupation:" value={g.occupation} />
          </View>
        ))}
      </View>
    </View>
  );
}

function AddressSection({ student }: { student: Student }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.tableHeader}>
        <View style={styles.headerTitleWrap}>
          <Ionicons name="location-outline" size={18} color={COLORS.onSurface} />
          <Text style={styles.sectionTitle}>Address & Logistics</Text>
        </View>
      </View>
      <InfoRow label="Current Address" value={student.currentAddress || '-'} />
      <InfoRow label="Permanent Address" value={student.permanentAddress || student.currentAddress || '-'} />
      <InfoRow label="Transport Route" value={student.transportRoute || '-'} />
      <InfoRow label="Pickup Point" value={student.pickupPoint || '-'} />
      <InfoRow label="Vehicle" value={student.vehicleNumber || '-'} />
      <InfoRow label="Hostel / Room" value={`${student.hostelName || '-'} / ${student.roomNumber || '-'}`} isLast />
    </View>
  );
}

// ─── Fees Tab ────────────────────────────────────────────────────────────────

function FeesTab({ feeRecords }: { feeRecords: FeeRecord[] }) {
  const paymentTypes = ['payment', 'payment_received', 'FEE_PAYMENT', 'WAIVER'];
  const payments = feeRecords.filter(r => paymentTypes.includes(r.type));
  // Only sum fee-head charge records (isFeeHead=true) — ignore legacy group-level charges
  const charges = feeRecords.filter(r => {
    if (r.type !== 'charge' && r.type !== 'fee') return false;
    try {
      const m = JSON.parse(r.meta || '{}');
      return m?.isFeeHead === true;
    } catch { return false; }
  });

  const totalCharged = charges.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalPaid = payments.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const outstanding = Math.max(0, totalCharged - totalPaid);

  return (
    <View style={{ gap: 16 }}>
      {/* Summary cards */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.sectionCard, { flex: 1, padding: 16, marginBottom: 0, borderLeftWidth: 4, borderLeftColor: COLORS.primary }]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4 }}>Total Charged</Text>
          <Text style={{ ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface, fontSize: 20 }}>₦{totalCharged.toLocaleString()}</Text>
        </View>
        <View style={[styles.sectionCard, { flex: 1, padding: 16, marginBottom: 0, borderLeftWidth: 4, borderLeftColor: '#059669' }]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4 }}>Total Paid</Text>
          <Text style={{ ...TYPOGRAPHY.headlineSm, color: '#059669', fontSize: 20 }}>₦{totalPaid.toLocaleString()}</Text>
        </View>
      </View>
      <View style={[styles.sectionCard, { padding: 16, backgroundColor: COLORS.primary, marginBottom: 0 }]}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.inversePrimary, textTransform: 'uppercase', marginBottom: 4 }}>Outstanding Balance</Text>
        <Text style={{ ...TYPOGRAPHY.headlineSm, color: COLORS.onPrimary }}>₦{outstanding.toLocaleString()}</Text>
      </View>

      {/* Fee Schedule — what the student owes */}
      <View style={styles.sectionCard}>
        <View style={styles.simpleHeader}>
          <Ionicons name="list-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Fee Schedule</Text>
        </View>
        {charges.length === 0 ? (
          <EmptyState icon="cash-outline" message="No fees assigned" />
        ) : (
          charges.map((rec, idx) => {
            let metaObj: any = {};
            try { metaObj = JSON.parse(rec.meta || '{}'); } catch {}
            const headName = metaObj?.name || metaObj?.feeGroupName || 'Fee';
            const groupName = metaObj?.feeGroupName || '';
            return (
              <View key={rec.id} style={[styles.infoRow, idx === charges.length - 1 && styles.infoRowLast]}>
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="pricetag-outline" size={18} color={COLORS.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.labelLg, color: COLORS.onSurface }}>{headName}</Text>
                  {!!groupName && groupName !== headName && (
                    <Text style={{ fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 }}>{groupName}</Text>
                  )}
                </View>
                <Text style={{ ...TYPOGRAPHY.headlineSm, color: COLORS.primary, fontSize: 15 }}>
                  ₦{(Number(rec.amount) || 0).toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Payment History — only actual payments */}
      <View style={styles.sectionCard}>
        <View style={styles.simpleHeader}>
          <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Payment History</Text>
        </View>
        {payments.length === 0 ? (
          <EmptyState icon="cash-outline" message="No payments recorded yet" />
        ) : (
          payments.slice(0, 15).map((rec, idx) => {
            const isWaiver = rec.type === 'WAIVER';
            return (
              <View key={rec.id} style={[styles.infoRow, idx === Math.min(14, payments.length - 1) && styles.infoRowLast]}>
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: isWaiver ? '#fef3c7' : '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={isWaiver ? 'gift-outline' : 'arrow-down-outline'} size={20} color={isWaiver ? '#b45309' : '#166534'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.labelLg, color: COLORS.onSurface }}>
                    {rec.reference || (isWaiver ? 'Waiver' : 'Payment')}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4 }}>
                    {formatDate(rec.createdAt)} • {rec.paymentMethod || '-'}
                  </Text>
                </View>
                <Text style={{ ...TYPOGRAPHY.headlineSm, color: '#059669', fontSize: 16 }}>
                  + ₦{(Number(rec.amount) || 0).toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Exam Tab ─────────────────────────────────────────────────────────────────

function ExamTab({ termResults, examGroups }: { termResults: StudentTermResult[]; examGroups: ExamGroup[] }) {
  const groupMap = new Map(examGroups.map(g => [g.id, g]));
  const published = termResults.filter(r => r.status === 'PUBLISHED');

  return (
    <View style={{ gap: 16 }}>
      {/* Status pill */}
      <View style={styles.sectionCard}>
        <View style={styles.simpleHeader}>
          <Ionicons name="bar-chart-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Academic Results</Text>
        </View>
        <View style={{ padding: 16, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant }}>Published Results</Text>
            <View style={{ backgroundColor: published.length > 0 ? '#dcfce7' : '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 }}>
              <Text style={{ ...TYPOGRAPHY.labelSm, color: published.length > 0 ? '#166534' : '#b45309', fontWeight: '600' }}>
                {published.length > 0 ? `${published.length} AVAILABLE` : 'NONE YET'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Results list */}
      {termResults.length === 0 ? (
        <View style={styles.sectionCard}>
          <EmptyState icon="school-outline" message="No exam results synced yet" />
        </View>
      ) : (
        termResults.map((result) => {
          const group = groupMap.get(result.examGroupId || '');
          const pct = result.daysOpened > 0 ? Math.round((result.daysPresent / result.daysOpened) * 100) : 0;
          return (
            <View key={result.id} style={styles.sectionCard}>
              <View style={styles.tableHeader}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="trophy-outline" size={18} color={COLORS.onSurface} />
                  <Text style={styles.sectionTitle}>{group?.name || 'Exam Result'}</Text>
                </View>
                <View style={[styles.verifiedBadge, result.status !== 'PUBLISHED' && { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.verifiedText, result.status !== 'PUBLISHED' && { color: '#b45309' }]}>{result.status}</Text>
                </View>
              </View>
              {group && (
                <InfoRow label="Term" value={`${group.term || '-'} • ${group.academicYear || '-'}`} />
              )}
              <InfoRow label="Total Score" value={`${result.totalScore?.toFixed(1) || '0'}`} />
              <InfoRow label="Average Score" value={`${result.averageScore?.toFixed(1) || '0'}%`} />
              {result.position != null && (
                <InfoRow label="Class Position" value={`${result.position} of ${result.totalStudents || '-'}`} />
              )}
              <InfoRow label="Attendance" value={`${result.daysPresent}/${result.daysOpened} days (${pct}%)`} />
              {result.teacherComment && (
                <InfoRow label="Teacher's Comment" value={result.teacherComment} />
              )}
              {result.principalComment && (
                <InfoRow label="Principal's Comment" value={result.principalComment} isLast />
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

function AttendanceTab({ attendanceRecords }: { attendanceRecords: Attendance[] }) {
  const sorted = [...attendanceRecords].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  const total = sorted.length;
  const present = sorted.filter(r => r.status?.toLowerCase() === 'present').length;
  const absent = sorted.filter(r => r.status?.toLowerCase() === 'absent').length;
  const late = sorted.filter(r => r.status?.toLowerCase() === 'late').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <View style={{ gap: 16 }}>
      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.sectionCard, { flex: 1, padding: 16, marginBottom: 0, alignItems: 'center' }]}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primary }}>{pct}%</Text>
          <Text style={{ ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 4 }}>ATTENDANCE</Text>
        </View>
        <View style={{ flex: 2, gap: 8 }}>
          {[
            { label: 'Present', count: present, color: '#059669' },
            { label: 'Absent', count: absent, color: COLORS.error },
            { label: 'Late', count: late, color: '#d97706' },
          ].map(s => (
            <View key={s.label} style={[styles.sectionCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, marginBottom: 0 }]}>
              <Text style={{ ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant }}>{s.label}</Text>
              <Text style={{ ...TYPOGRAPHY.labelLg, color: s.color }}>{s.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* History list */}
      <View style={styles.sectionCard}>
        <View style={styles.simpleHeader}>
          <Ionicons name="time-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Attendance History</Text>
          <Text style={{ ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginLeft: 'auto' }}>Last 3 months</Text>
        </View>
        {sorted.length === 0 ? (
          <EmptyState icon="calendar-outline" message="No attendance records synced yet" />
        ) : (
          sorted.slice(0, 30).map((rec, idx) => {
            const isPresent = rec.status?.toLowerCase() === 'present';
            const isLate = rec.status?.toLowerCase() === 'late';
            const bgColor = isPresent ? '#dcfce7' : isLate ? '#fef3c7' : '#fee2e2';
            const textColor = isPresent ? '#166534' : isLate ? '#b45309' : '#991b1b';
            const d = new Date(rec.date);
            const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const day = d.getDate();
            return (
              <View key={rec.id} style={[styles.infoRow, idx === Math.min(29, sorted.length - 1) && styles.infoRowLast]}>
                <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: textColor }}>{mon}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>{day}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.labelLg, color: textColor }}>{rec.status}</Text>
                  <Text style={{ ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant, marginTop: 4 }}>
                    {d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  {rec.remarks ? <Text style={{ ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 2 }}>{rec.remarks}</Text> : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Communication Tab ────────────────────────────────────────────────────────

function CommunicationTab({ commLogs }: { commLogs: CommunicationLog[] }) {
  const sorted = [...commLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionCard}>
        <View style={styles.simpleHeader}>
          <Ionicons name="chatbubbles-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Recent Communications</Text>
          <Text style={{ ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginLeft: 'auto' }}>{sorted.length} total</Text>
        </View>
        {sorted.length === 0 ? (
          <EmptyState icon="mail-outline" message="No communication logs synced yet" />
        ) : (
          sorted.slice(0, 20).map((log, idx) => {
            const isEmail = log.type === 'EMAIL';
            const statusColors: Record<string, { bg: string; text: string }> = {
              SENT: { bg: '#dcfce7', text: '#166534' },
              DELIVERED: { bg: '#d1fae5', text: '#065f46' },
              OPENED: { bg: '#dbeafe', text: '#1e40af' },
              FAILED: { bg: '#fee2e2', text: '#991b1b' },
              PENDING: { bg: '#fef3c7', text: '#b45309' },
            };
            const sc = statusColors[log.status] || { bg: COLORS.surfaceContainerHigh, text: COLORS.onSurfaceVariant };
            return (
              <View key={log.id} style={[styles.infoRow, { alignItems: 'flex-start' }, idx === Math.min(19, sorted.length - 1) && styles.infoRowLast]}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: 16, marginTop: 2 }}>
                  <Ionicons name={isEmail ? 'mail-outline' : 'chatbubble-outline'} size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ ...TYPOGRAPHY.labelLg, color: COLORS.onSurface, flex: 1 }} numberOfLines={1}>{log.subject || log.type}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant, marginLeft: 8 }}>{formatDate(log.createdAt)}</Text>
                  </View>
                  <Text style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant }} numberOfLines={2}>{log.body}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <View style={{ backgroundColor: sc.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: sc.text }}>{log.status}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant }}>{log.recipient}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ documents }: { documents: StudentDocument[] }) {
  const sorted = [...documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const baseUrl = getSyncBaseUrl().replace('/api/v1', '');

  const getFileIcon = (fileType?: string): keyof typeof Ionicons.glyphMap => {
    if (!fileType) return 'document-outline';
    if (fileType.includes('pdf')) return 'document-text-outline';
    if (fileType.includes('image')) return 'image-outline';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document-outline';
    return 'attach-outline';
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionCard}>
        <View style={styles.simpleHeader}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Stored Documents</Text>
          <Text style={{ ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginLeft: 'auto' }}>{sorted.length} files</Text>
        </View>
        {sorted.length === 0 ? (
          <EmptyState icon="folder-open-outline" message="No documents uploaded yet" />
        ) : (
          sorted.map((doc, idx) => {
            const fileUrl = doc.filePath?.startsWith('http') ? doc.filePath : `${baseUrl}/${doc.filePath}`;
            const ext = doc.fileType?.split('/').pop()?.toUpperCase() || doc.filePath?.split('.').pop()?.toUpperCase() || 'FILE';
            return (
              <View key={doc.id} style={[styles.infoRow, idx === sorted.length - 1 && styles.infoRowLast]}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Ionicons name={getFileIcon(doc.fileType)} size={24} color={COLORS.outline} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.labelLg, color: COLORS.onSurface }}>{doc.title}</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.onSurfaceVariant, marginTop: 4, letterSpacing: 1 }}>{ext} • {formatDate(doc.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  style={{ padding: 8, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 8 }}
                  onPress={() => Linking.openURL(fileUrl)}
                >
                  <Ionicons name="download-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface InnerProps {
  student: Student;
  studentClass: Class | null;
  studentSection: Section | null;
  feeRecords: FeeRecord[];
  attendanceRecords: Attendance[];
  commLogs: CommunicationLog[];
  documents: StudentDocument[];
}

function StudentProfileInner({
  student,
  studentClass,
  feeRecords,
  attendanceRecords,
  commLogs,
  documents,
}: InnerProps) {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Profile');

  return (
    <AdminLayout activeTab="Students">
      <View style={styles.main}>
        <PageTitle onBack={() => navigation.goBack()} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          {activeTab === 'Profile' && (
            <>
              <ProfileCard student={student} studentClass={studentClass} />
              <CoreProfileSection student={student} />
              <FamilySection student={student} />
              <AddressSection student={student} />
            </>
          )}
          {activeTab === 'Fees' && <FeesTab feeRecords={feeRecords} />}

          {activeTab === 'Attendance' && <AttendanceTab attendanceRecords={attendanceRecords} />}
          {activeTab === 'Communication' && <CommunicationTab commLogs={commLogs} />}
          {activeTab === 'Documents' && <DocumentsTab documents={documents} />}
        </ScrollView>
      </View>
    </AdminLayout>
  );
}

// ─── withObservables wrapper ──────────────────────────────────────────────────

// We need a separate component that resolves class from the synced student
function StudentProfileWithClass({ student, ...rest }: Omit<InnerProps, 'studentClass' | 'studentSection'> & { student: Student }) {
  const [studentClass, setStudentClass] = React.useState<Class | null>(null);

  React.useEffect(() => {
    if (!student?.classId) return;
    database.collections.get<Class>('classes').find(student.classId)
      .then(setStudentClass)
      .catch(() => setStudentClass(null));
  }, [student?.classId]);

  return <StudentProfileInner {...rest} student={student} studentClass={studentClass} studentSection={null} />;
}

// Connect StudentProfileWithClass via withObservables to load ALL list data at this level
// This prevents intermediate pure components from blocking updates when only list props change.
const ConnectedProfile = withObservables(
  ['studentId'],
  ({ studentId }: { studentId: string }) => ({
    student: database.collections.get<Student>('students').findAndObserve(studentId),
    feeRecords: database.collections.get<FeeRecord>('fee_records').query(Q.where('student_id', studentId)).observeWithColumns(['amount', 'type']),
    attendanceRecords: database.collections.get<Attendance>('attendance').query(Q.where('student_id', studentId)).observeWithColumns(['status']),
    commLogs: database.collections.get<CommunicationLog>('communication_logs').query(Q.where('recipient', studentId)).observeWithColumns(['status']),
    documents: database.collections.get<StudentDocument>('student_documents').query(Q.where('student_id', studentId)).observe(),

  })
)(StudentProfileWithClass);

// Final screen entry point
export default function StudentProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { studentId } = route.params as { studentId: string };

  const [studentExists, setStudentExists] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    database.collections.get<Student>('students').find(studentId)
      .then(() => setStudentExists(true))
      .catch(() => setStudentExists(false));
  }, [studentId]);

  if (studentExists === null) {
    return (
      <AdminLayout activeTab="Students">
        <PageTitle onBack={() => navigation.goBack()} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, marginTop: 12 }}>Loading student data...</Text>
        </View>
      </AdminLayout>
    );
  }

  if (studentExists === false) {
    return (
      <AdminLayout activeTab="Students">
        <PageTitle onBack={() => navigation.goBack()} />
        <View style={styles.loader}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Student not found</Text>
        </View>
      </AdminLayout>
    );
  }

  return <ConnectedProfile studentId={studentId} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  main: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: COLORS.surfaceContainerLowest },
  pageTitle: { ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  breadcrumbMuted: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant },
  breadcrumbSlash: { ...TYPOGRAPHY.labelSm, color: COLORS.outlineVariant },
  breadcrumbCurrent: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurface, fontWeight: '700' },
  tabsShell: { marginHorizontal: 16, height: 40, backgroundColor: COLORS.surfaceContainer, borderRadius: 8, padding: 4, marginBottom: 16 },
  tabsContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tab: { height: 32, paddingHorizontal: 16, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabActive: { backgroundColor: COLORS.surfaceContainerLowest, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.onSurface, fontWeight: '600' },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 80 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: COLORS.surfaceContainerHigh },
  avatarContainer: { marginBottom: 16 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.onPrimary, fontSize: 32, fontWeight: '700' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surfaceContainerLowest },
  studentName: { ...TYPOGRAPHY.headlineSm, color: COLORS.onSurface, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  classPill: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#65a1fe' },
  classPillText: { ...TYPOGRAPHY.labelMd, color: '#003670' },
  genderPill: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.surfaceContainerHigh },
  genderPillText: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant },
  cardDivider: { width: '100%', height: 1, backgroundColor: COLORS.surfaceContainerHigh, marginBottom: 16 },
  summaryRows: { width: '100%', gap: 16, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  summaryLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant },
  summaryValue: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, textAlign: 'right' },
  summaryStrong: { color: COLORS.onSurface, fontWeight: '600' },
  actionRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 12 },
  outlineAction: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surfaceContainerLowest },
  outlineActionText: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface },
  credentialsButton: { height: 48, borderRadius: 8, width: '100%', backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  credentialsText: { ...TYPOGRAPHY.labelLg, color: COLORS.onPrimary, textTransform: 'uppercase' },
  sectionCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: COLORS.surfaceContainerHigh, overflow: 'hidden' },
  simpleHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 12 },
  sectionTitle: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface },
  tableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  verifiedText: { ...TYPOGRAPHY.labelSm, color: '#166534', fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, flex: 1 },
  infoValue: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface, fontWeight: '500', flex: 1, textAlign: 'right' },
  guardianList: { padding: 16, gap: 16 },
  guardianCard: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderStyle: 'dashed', borderRadius: 8, padding: 16, backgroundColor: COLORS.surfaceContainerLow },
  guardianTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  guardianAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  guardianAvatarDark: { backgroundColor: COLORS.primary },
  guardianAvatarLight: { backgroundColor: '#65a1fe' },
  guardianInitial: { ...TYPOGRAPHY.headlineSm },
  guardianInitialDark: { color: COLORS.onPrimary },
  guardianInitialLight: { color: '#003670' },
  guardianName: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface },
  guardianRole: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant, marginTop: 2 },
  infoPair: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  infoPairLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant },
  infoPairValue: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface, fontWeight: '500' },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, marginTop: 12 },
  errorText: { ...TYPOGRAPHY.bodyLg, color: COLORS.error, marginTop: 8 },
});
