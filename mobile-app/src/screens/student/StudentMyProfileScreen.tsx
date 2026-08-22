import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { getFileUrl } from '../../services/api';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', error: '#dc2626' };

function fmtDate(v?: string) { if (!v) return '-'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }

function Row({ icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={C.muted} style={{ width: 26 }} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value || '-'}</Text>
    </View>
  );
}

export default function StudentMyProfileScreen() {
  const { user, logout } = useAuthStore();
  const { profile, fetchProfile } = useStudentStore();
  const navigation = useNavigation<any>();

  useEffect(() => { if (user?.token) fetchProfile(user.token); }, [user?.token]);

  const s = profile || {};
  const name = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || 'Student';
  const initials = `${s.firstName?.charAt(0) || ''}${s.lastName?.charAt(0) || ''}`.toUpperCase();
  const photo = s.studentPhoto ? getFileUrl(s.studentPhoto) : null;

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const guardians = [
    { initial: 'F', name: s.fatherName, role: 'Father', phone: s.fatherPhone },
    { initial: 'M', name: s.motherName, role: 'Mother', phone: s.motherPhone },
  ].filter((g) => g.name);
  if (s.guardianName) guardians.push({ initial: 'G', name: s.guardianName, role: s.guardianRelation || 'Guardian', phone: s.guardianPhone });

  return (
    <StudentLayout activeTab="Profile">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('StudentDashboard')}>
          <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : (
            <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{initials || 'S'}</Text></View>
          )}
          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroMeta}>{s.class?.name || 'Student'}</Text>
          {s.admissionNo ? <View style={styles.admBadge}><Ionicons name="finger-print-outline" size={13} color="#cbd5e1" /><Text style={styles.admText}>{s.admissionNo}</Text></View> : null}
        </View>

        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.card}>
          <Row icon="male-female-outline" label="Gender" value={s.gender} />
          <Row icon="calendar-outline" label="Date of Birth" value={fmtDate(s.dob)} />
          <Row icon="water-outline" label="Blood Group" value={s.bloodGroup} />
          <Row icon="mail-outline" label="Email" value={s.email} />
          <Row icon="location-outline" label="Address" value={s.address} />
        </View>

        {guardians.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Guardians</Text>
            <View style={{ gap: 10 }}>
              {guardians.map((g, i) => (
                <View key={i} style={styles.guardianCard}>
                  <View style={styles.guardianAvatar}><Text style={styles.guardianInitial}>{g.initial}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guardianName}>{g.name}</Text>
                    <Text style={styles.guardianRole}>{g.role}</Text>
                  </View>
                  {g.phone ? <Text style={styles.guardianPhone}>{g.phone}</Text> : null}
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={18} color={C.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  hero: { backgroundColor: C.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)' },
  avatarFallback: { backgroundColor: '#0d2748', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },
  heroMeta: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  admBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginTop: 12 },
  admText: { fontSize: 12, color: '#e2e8f0', fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 6, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowLabel: { fontSize: 13, color: C.muted, flex: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: C.onSurface, maxWidth: '55%', textAlign: 'right' },
  guardianCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  guardianAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  guardianInitial: { fontSize: 15, fontWeight: '800', color: C.secondary },
  guardianName: { fontSize: 14, fontWeight: '700', color: C.onSurface },
  guardianRole: { fontSize: 12, color: C.muted, marginTop: 2 },
  guardianPhone: { fontSize: 13, fontWeight: '600', color: C.secondary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, borderRadius: 12, marginTop: 28 },
  logoutText: { color: C.error, fontWeight: '700', fontSize: 15 },
});
