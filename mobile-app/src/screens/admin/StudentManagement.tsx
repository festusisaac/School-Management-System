import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

import { database } from '../../database';
import Student from '../../database/models/Student';
import Class from '../../database/models/Class';
import Section from '../../database/models/Section';
import AdminLayout from '../../components/AdminLayout';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0f172a',
  secondary: '#38bdf8',
  onPrimary: '#ffffff',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#0f172a',
  outline: '#e2e8f0',
  textSecondary: '#64748b',
  success: '#10b981',
  successLight: '#dcfce7',
  successText: '#166534',
  error: '#ef4444',
  errorLight: '#fee2e2',
  errorText: '#991b1b',
  pending: '#f59e0b',
  pendingLight: '#fef3c7',
  pendingText: '#92400e',
};

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
  const initials = `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`.toUpperCase();
  const isActive = student.isActive;

  const className = studentClass?.name || '';
  const sectionName = studentSection?.name || '';
  const gradeStr = className ? `Grade ${className}${sectionName ? `-${sectionName}` : ''}` : 'No Class';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {isActive && <View style={styles.cardActiveBorder} />}
      
      {/* Avatar */}
      {student.studentPhoto ? (
        <Image source={{ uri: student.studentPhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initials || 'S'}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.firstName} {student.lastName}
          </Text>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.outline} />
        </View>
        <Text style={styles.studentSub}>
          ID: #{student.admissionNo} • {gradeStr}
        </Text>
      </View>

      {/* Status & Arrow */}
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { 
          backgroundColor: isActive ? COLORS.successLight : COLORS.errorLight 
        }]}>
          <Text style={[styles.statusText, { 
            color: isActive ? COLORS.successText : COLORS.errorText 
          }]}>
            {isActive ? 'ACTIVE' : 'PENDING'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.outline} style={{ marginLeft: 8 }} />
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

  // Local filtering
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
        {/* Top Search Area */}
        <View style={styles.topSection}>
          {/* Page Title */}
          <View style={styles.pageTitleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={COLORS.onSurface} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Students</Text>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, ID or grade..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter" size={14} color={COLORS.textSecondary} />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: COLORS.textSecondary }]} />
              <Text style={styles.statPillText}>Total: {stats.total.toLocaleString()}</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.statPillText, { color: COLORS.success }]}>Active: {stats.active.toLocaleString()}</Text>
            </View>
            <View style={styles.statPill}>
              <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
              <Text style={[styles.statPillText, { color: COLORS.error }]}>Pending: {stats.pending}</Text>
            </View>
          </View>

          {/* Sync Warning */}
          <View style={styles.syncWarning}>
            <Ionicons name="cloud-offline-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.syncWarningText}>
              3 records pending local sync. Connectivity is limited.
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* List */}
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <EnhancedStudentItem student={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.outline} />
              <Text style={styles.emptyTitle}>No Students Found</Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>
    </AdminLayout>
  );
};

const EnhancedStudentManagement = withObservables([], () => ({
  students: database.collections.get<Student>('students').query(Q.sortBy('created_at', Q.desc)).observe(),
}))(StudentManagementScreen);

export default EnhancedStudentManagement;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: COLORS.surface,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.onSurface },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginBottom: 16,
    gap: 6,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  syncWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  syncWarningText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '500',
  },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 4,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActiveBorder: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    backgroundColor: COLORS.secondary,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 6 },
  avatarFallback: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6 
  },
  avatarText: { color: COLORS.onPrimary, fontWeight: 'bold', fontSize: 16 },
  
  cardInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  studentSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.onSurface, marginTop: 16 },

  fab: {
    position: 'absolute', bottom: 16, right: 16, width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
