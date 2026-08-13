import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { apiGet, getFileUrl } from '../../services/api';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  success: '#16a34a',
  error: '#ba1a1a',
  warning: '#d97706',
};

function fmtDate(d?: string | Date) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TeacherProfileScreen() {
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const token = user?.token || '';
  const currency = settings?.currencySymbol || '₦';

  const [profile, setProfile] = useState<any | null>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'details' | 'salary'>('details');

  const money = (n: any) => `${currency}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/hr/staff/profile/me', token);
      setProfile(data);
      if (data?.id) {
        const pr = await apiGet(`/hr/payroll?staffId=${data.id}`, token).catch(() => []);
        setPayrolls(Array.isArray(pr) ? pr : []);
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const openLink = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url.startsWith('http') ? url : getFileUrl(url));
    } catch {
      Alert.alert('Error', 'Could not open the link.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const statusColor = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'active') return { color: COLORS.success, bg: '#dcfce7' };
    if (v === 'on leave') return { color: COLORS.warning, bg: '#fef3c7' };
    return { color: '#64748b', bg: '#f1f5f9' };
  };

  const renderDetails = () => {
    if (!profile) return null;
    const photo = getFileUrl(profile.photo);
    const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();
    const sc = statusColor(profile.status);
    const socials = [
      { url: profile.facebookUrl, icon: 'logo-facebook', label: 'Facebook', color: '#1877F2' },
      { url: profile.twitterUrl, icon: 'logo-twitter', label: 'Twitter', color: '#1DA1F2' },
      { url: profile.linkedinUrl, icon: 'logo-linkedin', label: 'LinkedIn', color: '#0A66C2' },
      { url: profile.instagramUrl, icon: 'logo-instagram', label: 'Instagram', color: '#E4405F' },
    ].filter((s) => s.url);
    const docs = [
      profile.resume && { url: profile.resume, label: 'Resume', tag: 'PDF' },
      profile.idProof && { url: profile.idProof, label: 'Identity Proof', tag: 'ID' },
      ...((profile.certificates || []).map((c: string, i: number) => ({ url: c, label: `Certificate ${i + 1}`, tag: 'CERT' }))),
    ].filter(Boolean) as { url: string; label: string; tag: string }[];

    return (
      <>
        {/* Header card */}
        <View style={styles.headerCard}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={[styles.statusBadge, { color: sc.color, backgroundColor: sc.bg }]}>
            {profile.status || 'N/A'}
          </Text>
          <View style={styles.headerMetaRow}>
            <View style={styles.headerMeta}>
              <Text style={styles.metaLabel}>Staff ID</Text>
              <Text style={styles.metaValue}>{profile.employeeId || 'N/A'}</Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerMeta}>
              <Text style={styles.metaLabel}>Department</Text>
              <Text style={styles.metaValue}>{profile.department?.name || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <Section title="Personal & Family">
          <Row label="Father's Name" value={profile.fatherName} />
          <Row label="Mother's Name" value={profile.motherName} />
          <Row label="Date of Birth" value={fmtDate(profile.dateOfBirth)} />
          <Row label="Gender" value={profile.gender} />
          <Row label="Marital Status" value={profile.maritalStatus} />
          <Row label="Teaching Staff" value={profile.isTeachingStaff ? 'Yes' : 'No'} last />
        </Section>

        <Section title="Contact">
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone} action={profile.phone ? { icon: 'call', onPress: () => Linking.openURL(`tel:${profile.phone}`) } : undefined} />
          <Row label="Address" value={profile.address} />
          <Row label="Emergency Contact" value={profile.emergencyContactPhone} last />
        </Section>

        <Section title="Employment">
          <Row label="Designation" value={profile.designation?.name} />
          <Row label="Employment Type" value={profile.employmentType} />
          <Row label="Monthly Basic" value={money(profile.basicSalary)} />
          <Row label="Date Joined" value={fmtDate(profile.dateOfJoining)} last />
        </Section>

        <Section title="Bank Account">
          <Row label="Bank Name" value={profile.bankName} />
          <Row label="Account Number" value={profile.accountNumber} last />
        </Section>

        {docs.length > 0 && (
          <Section title="Documents">
            {docs.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.docRow, i === docs.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => openLink(d.url)}
              >
                <View style={styles.docTag}>
                  <Text style={styles.docTagText}>{d.tag}</Text>
                </View>
                <Text style={styles.docLabel}>{d.label}</Text>
                <Ionicons name="open-outline" size={18} color={COLORS.secondary} />
              </TouchableOpacity>
            ))}
          </Section>
        )}

        {socials.length > 0 && (
          <Section title="Social">
            <View style={styles.socialRow}>
              {socials.map((s, i) => (
                <TouchableOpacity key={i} style={styles.socialBtn} onPress={() => openLink(s.url)}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                  <Text style={styles.socialLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderSalary = () => {
    const sorted = [...payrolls].sort((a, b) => (b.year - a.year) || (b.month - a.month));
    return (
      <View style={{ gap: 12 }}>
        {sorted.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cash-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>No payroll history in your record.</Text>
          </View>
        ) : (
          sorted.map((p) => {
            const allowances = (p.allowances || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
            const deductions = (p.deductions || []).reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
            const paid = (p.status || '').toLowerCase() === 'paid';
            return (
              <View key={p.id} style={styles.payCard}>
                <View style={styles.payHeader}>
                  <Text style={styles.payPeriod}>
                    {MONTHS[(p.month || 1) - 1] || 'UNK'} {p.year || ''}
                  </Text>
                  <Text
                    style={[
                      styles.payStatus,
                      paid ? { color: COLORS.success, backgroundColor: '#dcfce7' } : { color: COLORS.warning, backgroundColor: '#fef3c7' },
                    ]}
                  >
                    {p.status || 'Pending'}
                  </Text>
                </View>
                <View style={styles.payGrid}>
                  <PayCell label="Base" value={money(p.basicSalary)} />
                  <PayCell label="Allowances" value={`+${money(allowances)}`} color={COLORS.success} />
                  <PayCell label="Deductions" value={`-${money(deductions)}`} color={COLORS.error} />
                </View>
                <View style={styles.payNetRow}>
                  <Text style={styles.payNetLabel}>Net Pay</Text>
                  <Text style={styles.payNetValue}>{money(p.netSalary)}</Text>
                </View>
                {p.paymentDate ? <Text style={styles.payDate}>Paid {fmtDate(p.paymentDate)}</Text> : null}
              </View>
            );
          })
        )}
      </View>
    );
  };

  return (
    <TeacherLayout activeTab="Profile">
      <View style={styles.container}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'details' && styles.tabBtnActive]} onPress={() => setTab('details')}>
            <Text style={[styles.tabText, tab === 'details' && styles.tabTextActive]}>Full Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'salary' && styles.tabBtnActive]} onPress={() => setTab('salary')}>
            <Text style={[styles.tabText, tab === 'salary' && styles.tabTextActive]}>Salary History</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : !profile ? (
          <View style={styles.emptyCard}>
            <Ionicons name="person-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Profile not found</Text>
            <Text style={styles.emptyText}>We couldn't find a staff record for your account.</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          >
            {tab === 'details' ? renderDetails() : renderSalary()}
          </ScrollView>
        )}
      </View>
    </TeacherLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, value, last, action }: { label: string; value?: string; last?: boolean; action?: { icon: any; onPress: () => void } }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue}>{value || 'N/A'}</Text>
        {action && value ? (
          <TouchableOpacity onPress={action.onPress} style={styles.rowAction}>
            <Ionicons name={action.icon} size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function PayCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.payCell}>
      <Text style={styles.payCellLabel}>{label}</Text>
      <Text style={[styles.payCellValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5, marginBottom: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 7 },
  tabBtnActive: {
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: COLORS.primary },

  headerCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.secondary },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center' },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  headerMetaRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignSelf: 'stretch',
  },
  headerMeta: { flex: 1, alignItems: 'center' },
  headerDivider: { width: 1, backgroundColor: '#e2e8f0' },
  metaLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface, marginTop: 3 },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1.4, justifyContent: 'flex-end' },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, textAlign: 'right', flexShrink: 1 },
  rowAction: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docTag: { width: 40, height: 30, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  docTagText: { fontSize: 9, fontWeight: '800', color: COLORS.secondary },
  docLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.onSurface },

  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 14 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  socialLabel: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.error },

  payCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  payPeriod: { fontSize: 15, fontWeight: '800', color: COLORS.onSurface },
  payStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  payGrid: { flexDirection: 'row', gap: 8 },
  payCell: { flex: 1 },
  payCellLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  payCellValue: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface, marginTop: 2 },
  payNetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  payNetLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  payNetValue: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  payDate: { fontSize: 11, color: '#94a3b8', marginTop: 6 },

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
});
