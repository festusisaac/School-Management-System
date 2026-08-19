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
      return <AccountingStack />;
    case 'teacher':
      return <TeacherStack />;
    case 'student':
      return <StudentStack />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <LoginScreen />;
  }
}

// --- Admin Stack ---
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentManagement from '../screens/admin/StudentManagement';
import StaffManagementScreen from '../screens/admin/StaffManagementScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import StudentEditScreen from '../screens/student/StudentEditScreen';
import StudentAdmissionScreen from '../screens/student/StudentAdmissionScreen';
import RecordFeeScreen from '../screens/accounting/RecordFeeScreen';
import AttendanceScreen from '../screens/admin/AttendanceScreen';
import ProfileScreen from '../screens/admin/ProfileScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  StudentManagement: undefined;
  StaffManagement: undefined;
  StudentProfile: { studentId: string };
  StudentEdit: { studentId: string };
  StudentAdmission: undefined;
  RecordFee: undefined;
  Attendance: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="StudentManagement" component={StudentManagement} />
      <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
      <Stack.Screen name="StudentEdit" component={StudentEditScreen} />
      <Stack.Screen name="StudentAdmission" component={StudentAdmissionScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="RecordFee">
        {({ navigation }) => <RecordFeeScreen onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// --- Teacher Stack ---
import TeacherClassesScreen from '../screens/teacher/TeacherClassesScreen';
import EnterScoresScreen from '../screens/teacher/EnterScoresScreen';
import AssignmentsScreen from '../screens/teacher/AssignmentsScreen';
import DownloadCenterScreen from '../screens/teacher/DownloadCenterScreen';
import OnlineClassScreen from '../screens/teacher/OnlineClassScreen';
import MyTimetableScreen from '../screens/teacher/MyTimetableScreen';
import ClassRosterScreen from '../screens/teacher/ClassRosterScreen';
import StudentDetailScreen from '../screens/teacher/StudentDetailScreen';
import ApplyLeaveScreen from '../screens/teacher/ApplyLeaveScreen';
import NoticesScreen from '../screens/teacher/NoticesScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

export type TeacherStackParamList = {
  TeacherDashboard: undefined;
  TeacherClasses: undefined;
  Attendance: undefined;
  StudentProfile: { studentId: string };
  Profile: undefined;
  EnterScores: undefined;
  Assignments: undefined;
  DownloadCenter: undefined;
  OnlineClass: undefined;
  MyTimetable: undefined;
  ClassRoster: { classId: string; className?: string };
  StudentDetail: { studentId: string };
  ApplyLeave: undefined;
  Notices: undefined;
};

const TeacherStack_Nav = createNativeStackNavigator<TeacherStackParamList>();

function TeacherStack() {
  return (
    <TeacherStack_Nav.Navigator screenOptions={{ headerShown: false }}>
      <TeacherStack_Nav.Screen name="TeacherDashboard" component={TeacherDashboard} />
      <TeacherStack_Nav.Screen name="TeacherClasses" component={TeacherClassesScreen} />
      <TeacherStack_Nav.Screen name="Attendance" component={AttendanceScreen} />
      <TeacherStack_Nav.Screen name="StudentProfile" component={StudentProfileScreen} />
      <TeacherStack_Nav.Screen name="Profile" component={TeacherProfileScreen} />
      <TeacherStack_Nav.Screen name="EnterScores" component={EnterScoresScreen} />
      <TeacherStack_Nav.Screen name="Assignments" component={AssignmentsScreen} />
      <TeacherStack_Nav.Screen name="DownloadCenter" component={DownloadCenterScreen} />
      <TeacherStack_Nav.Screen name="OnlineClass" component={OnlineClassScreen} />
      <TeacherStack_Nav.Screen name="MyTimetable" component={MyTimetableScreen} />
      <TeacherStack_Nav.Screen name="ClassRoster" component={ClassRosterScreen} />
      <TeacherStack_Nav.Screen name="StudentDetail" component={StudentDetailScreen} />
      <TeacherStack_Nav.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
      <TeacherStack_Nav.Screen name="Notices" component={NoticesScreen} />
    </TeacherStack_Nav.Navigator>
  );
}

// --- Accounting Stack ---
import FeesHistoryScreen from '../screens/accounting/FeesHistoryScreen';
import DebtorsScreen from '../screens/accounting/DebtorsScreen';
import CollectionSummaryScreen from '../screens/accounting/CollectionSummaryScreen';
import ExpensesScreen from '../screens/accounting/ExpensesScreen';
import AccountantProfileScreen from '../screens/accounting/AccountantProfileScreen';
import { performGlobalSync } from '../hooks/useAutoSync';

export type AccountingStackParamList = {
  AccountingDashboard: undefined;
  RecordFee: undefined;
  FeesHistory: undefined;
  Debtors: undefined;
  CollectionSummary: undefined;
  Expenses: undefined;
  Profile: undefined;
};

const AccountingStack_Nav = createNativeStackNavigator<AccountingStackParamList>();

function AccountingStack() {
  return (
    <AccountingStack_Nav.Navigator screenOptions={{ headerShown: false }}>
      <AccountingStack_Nav.Screen name="AccountingDashboard" component={AccountingDashboard} />
      <AccountingStack_Nav.Screen name="FeesHistory" component={FeesHistoryScreen} />
      <AccountingStack_Nav.Screen name="Debtors" component={DebtorsScreen} />
      <AccountingStack_Nav.Screen name="CollectionSummary" component={CollectionSummaryScreen} />
      <AccountingStack_Nav.Screen name="Expenses" component={ExpensesScreen} />
      <AccountingStack_Nav.Screen name="Profile" component={AccountantProfileScreen} />
      <AccountingStack_Nav.Screen name="RecordFee">
        {({ navigation }) => (
          <RecordFeeScreen
            onBack={() => {
              navigation.goBack();
              performGlobalSync();
            }}
          />
        )}
      </AccountingStack_Nav.Screen>
    </AccountingStack_Nav.Navigator>
  );
}

// --- Student Stack ---
import StudentResultsScreen from '../screens/student/StudentResultsScreen';
import StudentFeeStatusScreen from '../screens/student/StudentFeeStatusScreen';
import StudentHomeworkScreen from '../screens/student/StudentHomeworkScreen';
import StudentAttendanceScreen from '../screens/student/StudentAttendanceScreen';
import StudentTimetableScreen from '../screens/student/StudentTimetableScreen';
import StudentOnlineClassesScreen from '../screens/student/StudentOnlineClassesScreen';
import StudentDownloadsScreen from '../screens/student/StudentDownloadsScreen';
import StudentNoticesScreen from '../screens/student/StudentNoticesScreen';
import StudentMyProfileScreen from '../screens/student/StudentMyProfileScreen';

export type StudentStackParamList = {
  StudentDashboard: undefined;
  Results: undefined;
  FeeStatus: undefined;
  Homework: undefined;
  Attendance: undefined;
  Timetable: undefined;
  OnlineClasses: undefined;
  Downloads: undefined;
  Notices: undefined;
  Profile: undefined;
};

const StudentStack_Nav = createNativeStackNavigator<StudentStackParamList>();

function StudentStack() {
  return (
    <StudentStack_Nav.Navigator screenOptions={{ headerShown: false }}>
      <StudentStack_Nav.Screen name="StudentDashboard" component={StudentDashboard} />
      <StudentStack_Nav.Screen name="Results" component={StudentResultsScreen} />
      <StudentStack_Nav.Screen name="FeeStatus" component={StudentFeeStatusScreen} />
      <StudentStack_Nav.Screen name="Homework" component={StudentHomeworkScreen} />
      <StudentStack_Nav.Screen name="Attendance" component={StudentAttendanceScreen} />
      <StudentStack_Nav.Screen name="Timetable" component={StudentTimetableScreen} />
      <StudentStack_Nav.Screen name="OnlineClasses" component={StudentOnlineClassesScreen} />
      <StudentStack_Nav.Screen name="Downloads" component={StudentDownloadsScreen} />
      <StudentStack_Nav.Screen name="Notices" component={StudentNoticesScreen} />
      <StudentStack_Nav.Screen name="Profile" component={StudentMyProfileScreen} />
    </StudentStack_Nav.Navigator>
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
