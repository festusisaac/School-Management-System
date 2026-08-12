import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { apiGet } from '../../services/api';
import TeacherLayout from '../../components/TeacherLayout';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
};

export default function TeacherClassesScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      
      try {
        const classesData = await apiGet('/academics/classes', user.token);
        if (Array.isArray(classesData)) {
          setClasses(classesData);
        }
      } catch (e) {
        console.error('Failed to fetch classes', e);
      } finally {
        setIsLoadingClasses(false);
      }

      try {
        const subjectsData = await apiGet('/academics/subjects', user.token);
        if (Array.isArray(subjectsData)) {
          setSubjects(subjectsData);
        }
      } catch (e) {
        console.error('Failed to fetch subjects', e);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    fetchData();
  }, [user]);

  const renderClassItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name="book" size={24} color={COLORS.secondary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classDetails}>
            Level: {item.level || 'N/A'} • Capacity: {item.capacity || 'N/A'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.outline} />
      </View>
    </TouchableOpacity>
  );

  const renderSubjectItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#f5f3ff' }]}>
          <Ionicons name="library" size={24} color="#7c3aed" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classDetails}>
            Code: {item.code || 'N/A'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.outline} />
      </View>
    </TouchableOpacity>
  );

  const isLoading = activeTab === 'classes' ? isLoadingClasses : isLoadingSubjects;
  const currentData = activeTab === 'classes' ? classes : subjects;

  return (
    <TeacherLayout activeTab="Classes">
      <View style={styles.container}>
        <Text style={styles.title}>My Classes & Subjects</Text>
        <Text style={styles.subtitle}>Your currently assigned academics</Text>

        {/* Custom Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'classes' && styles.tabButtonActive]}
            onPress={() => setActiveTab('classes')}
          >
            <Text style={[styles.tabText, activeTab === 'classes' && styles.tabTextActive]}>
              Assigned Classes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'subjects' && styles.tabButtonActive]}
            onPress={() => setActiveTab('subjects')}
          >
            <Text style={[styles.tabText, activeTab === 'subjects' && styles.tabTextActive]}>
              Assigned Subjects
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : currentData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={48} color={COLORS.outline} />
            <Text style={styles.emptyText}>
              No {activeTab} assigned to you.
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            renderItem={activeTab === 'classes' ? renderClassItem : renderSubjectItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});
