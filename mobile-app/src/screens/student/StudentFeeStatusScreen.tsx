import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import StudentLayout from '../../components/StudentLayout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useStudentStore } from '../../store/studentStore';
import { apiGet } from '../../services/api';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', money: '#16a34a', error: '#dc2626' };

export default function StudentFeeStatusScreen() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { profile } = useStudentStore();
  const token = user?.token || '';
  const navigation = useNavigation<any>();
  const currency = settings?.currencySymbol || '₦';
  const money = (n: any) => `${currency}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !profile?.id) return;
    try {
      const res = await apiGet(`/finance/family/${profile.id}`, token);
      setData(res);
    } catch (e) { console.error('Failed to load fees', e); } finally { setLoading(false); }
  }, [token, profile?.id]);

  useEffect(() => { if (profile?.id) load(); }, [load, profile?.id]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const siblings: any[] = data?.siblings || [];
  const balance = data?.familyBalance ?? 0;
  const totalDue = data?.familyTotalDue ?? 0;
  const totalPaid = data?.familyTotalPaid ?? 0;
  const owes = Number(balance) > 0;

  return (
    <StudentLayout>
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={C.secondary} /><Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Fee Status</Text>
            <Text style={styles.subtitle}>Your fee account</Text>

            <View style={[styles.balanceCard, { backgroundColor: owes ? '#7f1d1d' : C.primary }]}>
              <Text style={styles.balanceLabel}>{owes ? 'Outstanding Balance' : 'Balance'}</Text>
              <Text style={styles.balanceValue}>{money(balance)}</Text>
              <Text style={styles.balanceHint}>{owes ? 'Please clear your outstanding fees.' : "You're all settled. Thank you!"}</Text>
            </View>

            <View style={styles.miniRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>Total Billed</Text>
                <Text style={styles.miniValue}>{money(totalDue)}</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>Total Paid</Text>
                <Text style={[styles.miniValue, { color: C.money }]}>{money(totalPaid)}</Text>
              </View>
            </View>

            {siblings.length > 1 && (
              <>
                <Text style={styles.sectionTitle}>Family Breakdown</Text>
                <View style={{ gap: 10 }}>
                  {siblings.map((s, i) => {
                    const stBalance = s.balance ?? (Number(s.totalDue || 0) - Number(s.totalPaid || 0));
                    const stOwes = Number(stBalance) > 0;
                    const nm = `${s.student?.firstName || ''} ${s.student?.lastName || ''}`.trim();
                    return (
                      <View key={i} style={styles.sibCard}>
                        <View style={styles.sibAvatar}><Text style={styles.sibAvatarText}>{(s.student?.firstName?.[0] || '') + (s.student?.lastName?.[0] || '')}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sibName}>{nm}{s.student?.id === profile?.id ? ' (You)' : ''}</Text>
                          <Text style={styles.sibMeta}>{s.student?.class?.name || ''}</Text>
                        </View>
                        <Text style={[styles.sibBalance, { color: stOwes ? C.error : C.money }]}>{money(stBalance)}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={18} color={C.secondary} />
              <Text style={styles.noteText}>Payments are recorded by the school. Please visit the bursary to make a payment.</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </StudentLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  title: { fontSize: 22, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 16 },
  balanceCard: { borderRadius: 18, padding: 20, marginBottom: 12 },
  balanceLabel: { fontSize: 12, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  balanceValue: { fontSize: 34, fontWeight: '900', color: '#fff', marginTop: 6 },
  balanceHint: { fontSize: 12, color: '#e2e8f0', marginTop: 6 },
  miniRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  miniStat: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  miniLabel: { fontSize: 12, color: C.muted },
  miniValue: { fontSize: 18, fontWeight: '800', color: C.onSurface, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  sibCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  sibAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  sibAvatarText: { fontSize: 13, fontWeight: '800', color: C.secondary },
  sibName: { fontSize: 14, fontWeight: '700', color: C.onSurface },
  sibMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  sibBalance: { fontSize: 15, fontWeight: '800' },
  noteCard: { flexDirection: 'row', gap: 10, backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginTop: 20, borderWidth: 1, borderColor: '#dbeafe' },
  noteText: { flex: 1, fontSize: 12, color: C.secondary, lineHeight: 18, fontWeight: '500' },
});
