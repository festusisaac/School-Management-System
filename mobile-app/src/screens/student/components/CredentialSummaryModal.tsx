import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Alert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { apiPatch } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import Student from '../../../database/models/Student';

const COLORS = {
  primary: '#031632',
  onPrimary: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  onSurface: '#191c1e',
  onSurfaceVariant: '#44474d',
  outlineVariant: '#c5c6ce',
  error: '#ba1a1a',
  secondary: '#055db6',
};

const TYPOGRAPHY = {
  headlineSm: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  labelLg: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  bodyMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
};

interface CredentialSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student;
}

export default function CredentialSummaryModal({ visible, onClose, student }: CredentialSummaryModalProps) {
  const { user } = useAuthStore();
  const token = user?.token;
  const [isOnline, setIsOnline] = useState(true);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return unsubscribe;
  }, []);

  const handleResetPassword = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You must be connected to the internet to reset credentials.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // Assuming student has a userId field representing the core users table ID, or we use admissionNo to patch
      // Using student.userId if available, else falling back to student.id (sync ID might not be user ID).
      const targetUserId = (student as any).userId || student.id; 
      await apiPatch(`/users/${targetUserId}`, token || '', { password });
      
      Alert.alert('Success', 'Password reset successfully');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentUsername = student.email || student.admissionNo || '-';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.title}>Portal Credentials</Text>
              <Text style={styles.subtitle}>Administrative Access Only</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {!isOnline && (
            <View style={styles.offlineWarning}>
              <Ionicons name="cloud-offline" size={20} color={COLORS.error} />
              <Text style={styles.offlineText}>Internet connection required to modify credentials.</Text>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Student Account</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{studentUsername}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Enter new password"
                  editable={isOnline && !isSubmitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Repeat new password"
                  editable={isOnline && !isSubmitting}
                />
              </View>

              <TouchableOpacity 
                style={[styles.resetButton, (!isOnline || isSubmitting) && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={!isOnline || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.onPrimary} size="small" />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={18} color={COLORS.onPrimary} />
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  title: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onSurface,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  closeBtn: {
    marginLeft: 'auto',
    padding: 8,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffdad6',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    gap: 12,
  },
  offlineText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.error,
    flex: 1,
  },
  body: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  cardTitle: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onSurface,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.onPrimary,
    textTransform: 'uppercase',
  },
});
