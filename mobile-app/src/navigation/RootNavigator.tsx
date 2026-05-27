import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Screens
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AccountingDashboard from '../screens/accounting/AccountingDashboard';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import StudentDashboard from '../screens/student/StudentDashboard';
import ParentDashboard from '../screens/parent/ParentDashboard';
import PrincipalDashboard from '../screens/principal/PrincipalDashboard';

export default function RootNavigator() {
  const { user, isLoading } = useAuthStore();

  // Show spinner while reading persisted auth from AsyncStorage
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Not logged in → show login
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in → route by role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'principal':
      return <PrincipalDashboard />;
    case 'accountant':
      return <AccountingDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <LoginScreen />;
  }
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
