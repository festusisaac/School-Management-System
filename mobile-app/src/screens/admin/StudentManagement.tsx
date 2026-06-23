import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

import { database } from '../../database';
import { getSyncBaseUrl } from '../../services/api';
import Student from '../../database/models/Student';
import Class from '../../database/models/Class';
import Section from '../../database/models/Section';
import AdminLayout from '../../components/AdminLayout';

const { width } = Dimensions.get('window');

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
  primaryContainer: '#1a2b48',
  onPrimaryContainer: '#8293b5',
  secondary: '#055db6',
  secondaryContainer: '#65a1fe',
  onSecondaryContainer: '#003670',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
};

const TYPOGRAPHY = {
  headlineSm: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 32 },
  titleMd: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  labelLg: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMd: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSm: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
  bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
};

// Helper function to get full photo URL
function getPhotoUrl(photoPath?: string): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  const baseUrl = getSyncBaseUrl().replace('/api/v1', '');
  return `${baseUrl}/${photoPath}`;
}

// --- Component for individual Student Row ---
const StudentItem = ({ 
  student, 
  studentClass, 
  studentSection 
}: { 
  student: Student;
  studentClass?: Class | null;
  studentSection?: Section | null;
}) => {
  const navigation = useNavigation();
  const initials = `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`.toUpperCase();
  const isActive = student.isActive;

  const className = studentClass?.name || '';
  const sectionName = studentSection?.name || '';
  const gradeStr = className ? `${className}${sectionName ? ` ${sectionName}` : ''}` : 'No Class';
  
  const photoUrl = getPhotoUrl(student.studentPhoto);
  
  const handlePress = () => {
    // @ts-ignore
    navigation.navigate('StudentProfile', { studentId: student.id });
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
      <View style={[styles.cardActiveIndicator, { backgroundColor: isActive ? '#29a845' : COLORS.error }]} />
      
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initials || 'S'}</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.firstName} {student.lastName}
          </Text>
          {isActive && <Ionicons name="checkmark-circle" size={14} color="#29a845" />}
        </View>
        <Text style={styles.studentSub}>
          ID: {student.admissionNo} • {gradeStr}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { 
          backgroundColor: isActive ? '#dcfce7' : COLORS.errorContainer 
        }]}>
          <Text style={[styles.statusText, { 
            color: isActive ? '#166534' : COLORS.onErrorContainer 
          }]}>
            {isActive ? 'ACTIVE' : 'PENDING'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.outlineVariant} style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );
};

const EnhancedStudentItem = withObservables(['student'], ({ student }) => ({
  student: student.observe(),
  studentClass: student.class.observe(),
  studentSection: student.section.observe(),
}))(StudentItem);

// --- Main Screen ---
interface Props {
  students: Student[];
}

const StudentManagementScreen = ({ students }: Props) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName || ''}`.toLowerCase();
      return fullName.includes(q) || s.admissionNo.toLowerCase().includes(q);
    });
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      active: students.filter(s => s.isActive).length,
      pending: students.filter(s => !s.isActive).length,
    };
  }, [students]);

  return (
    <AdminLayout activeTab="Students">
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.pageTitleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Student Directory</Text>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.onSurfaceVariant} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, ID or grade..."
                placeholderTextColor={COLORS.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.statPillText}>Total: {stats.total.toLocaleString()}</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: '#29a845' }]} />
              <Text style={[styles.statPillText, { color: '#29a845' }]}>Active: {stats.active.toLocaleString()}</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
              <Text style={[styles.statPillText, { color: COLORS.error }]}>Pending: {stats.pending}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <EnhancedStudentItem student={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.outlineVariant} />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptySub}>Try adjusting your search criteria</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>
    </AdminLayout>
  );
};

const EnhancedStudentManagement = withObservables([], () => ({
  students: database.collections.get<Student>('students')
    .query(
      Q.where('is_active', true),
      Q.sortBy('created_at', Q.desc)
    )
    .observe(),
}))(StudentManagementScreen);

export default EnhancedStudentManagement;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceContainerLow },
  
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  pageTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onSurface,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, ...TYPOGRAPHY.bodyMd, color: COLORS.onSurface },

  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statPillText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.onSurfaceVariant,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  cardActiveIndicator: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginLeft: 8 },
  avatarFallback: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: COLORS.primaryContainer, 
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8 
  },
  avatarText: { ...TYPOGRAPHY.titleMd, color: COLORS.onPrimaryContainer },
  
  cardInfo: { flex: 1, marginLeft: 16 },
  studentName: { ...TYPOGRAPHY.labelLg, color: COLORS.onSurface, fontSize: 16 },
  studentSub: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, fontSize: 13 },
  
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  statusText: { ...TYPOGRAPHY.labelSm, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyTitle: { ...TYPOGRAPHY.titleMd, color: COLORS.onSurface, marginTop: 16 },
  emptySub: { ...TYPOGRAPHY.bodyMd, color: COLORS.onSurfaceVariant, marginTop: 8 },

  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
});
