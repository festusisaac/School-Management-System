import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const C = { surface: '#f7f9fb', card: '#ffffff', onSurface: '#191c1e', muted: '#64748b', faint: '#94a3b8', primary: '#031632', secondary: '#055db6', error: '#dc2626' };

export default function ParentDashboard() {
  const { user, logout } = useAuthStore();

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="globe-outline" size={36} color={C.secondary} />
        </View>
        <Text style={styles.title}>Parent Portal</Text>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.message}>
          The parent portal isn't available in the app yet. Please use the school website to check your{'\n'}child's results, fees, attendance and notices.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: C.onSurface, textAlign: 'center' },
  name: { fontSize: 14, color: C.muted, marginTop: 4, textAlign: 'center' },
  message: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21, marginTop: 16, marginBottom: 28 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
