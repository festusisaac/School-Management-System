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
      return <TeacherStack />;
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
import StudentEditScreen from '../screens/student/StudentEditScreen';
import StudentAdmissionScreen from '../screens/student/StudentAdmissionScreen';
import RecordFeeScreen from '../screens/accounting/RecordFeeScreen';
import AttendanceScreen from '../screens/admin/AttendanceScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  StudentManagement: undefined;
  StudentProfile: { studentId: string };
  StudentEdit: { studentId: string };
  StudentAdmission: undefined;
  RecordFee: undefined;
  Attendance: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="StudentManagement" component={StudentManagement} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
      <Stack.Screen name="StudentEdit" component={StudentEditScreen} />
      <Stack.Screen name="StudentAdmission" component={StudentAdmissionScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="RecordFee">
        {({ navigation }) => <RecordFeeScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// --- Teacher Stack ---
export type TeacherStackParamList = {
  TeacherDashboard: undefined;
  Attendance: undefined;
  StudentProfile: { studentId: string };
};

const TeacherStack_Nav = createNativeStackNavigator<TeacherStackParamList>();

function TeacherStack() {
  return (
    <TeacherStack_Nav.Navigator screenOptions={{ headerShown: false }}>
      <TeacherStack_Nav.Screen name="TeacherDashboard" component={TeacherDashboard} />
      <TeacherStack_Nav.Screen name="Attendance" component={AttendanceScreen} />
      <TeacherStack_Nav.Screen name="StudentProfile" component={StudentProfileScreen} />
    </TeacherStack_Nav.Navigator>
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
