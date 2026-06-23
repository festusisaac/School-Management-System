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
  if (user.role === 'admin') {
    return <AdminStack />;
  }

  switch (user.role) {
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

// --- Admin Stack ---
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentManagement from '../screens/admin/StudentManagement';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import RecordFeeScreen from '../screens/accounting/RecordFeeScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  StudentManagement: undefined;
  StudentProfile: { studentId: string };
  RecordFee: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="StudentManagement" component={StudentManagement} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
      <Stack.Screen name="RecordFee">
        {({ navigation }) => <RecordFeeScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
