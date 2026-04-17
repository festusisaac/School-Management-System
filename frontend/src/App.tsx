import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import LoginPage from '@pages/auth/LoginPage'
import ChangePasswordPage from '@pages/auth/ChangePasswordPage'
import DashboardPage from '@pages/dashboard/DashboardPage'
import MaintenancePage from '@pages/MaintenancePage'
import LandingPage from './pages/public/LandingPage'
import NewsPage from './pages/public/NewsPage'
import GalleryPage from './pages/public/GalleryPage'
import AcademicsPage from './pages/public/AcademicsPage'
import NewsDetailPage from './pages/public/NewsDetailPage'
import AdmissionIntroPage from './pages/public/AdmissionIntroPage'
import AdmissionFormPage from './pages/public/AdmissionFormPage'
import AdmissionSuccessPage from './pages/public/AdmissionSuccessPage'
import AdmissionStatusPage from './pages/public/AdmissionStatusPage'
import SetupWizard from './pages/SetupWizard'
import { MainLayout } from './components/layout/MainLayout'
import PublicLayout from './components/layout/PublicLayout'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { SystemProvider, useSystem } from './context/SystemContext'
import * as Academics from './pages/academics';
import * as HR from './pages/hr';
import * as Students from './pages/students';
import * as Parent from './pages/parent';
import * as Finance from './pages/finance';
import * as Examination from './pages/examination';
import * as Settings from './pages/settings';
import * as OnlineClasses from './pages/online-classes';
import * as Homework from './pages/homework';
import * as Communication from './pages/communication';
import * as Audit from './pages/audit';
import FrontCmsDashboard from './pages/front-cms/FrontCmsDashboard';
import { 
  BookList, 
  BookDetail, 
  IssueBook, 
  ReturnBook, 
  Overdues, 
  LibraryDashboard, 
  AuthorManagement, 
  CategoryManagement, 
  LibrarySettings, 
  BookAddEdit 
} from '@pages/library';
import ScrollToTop from './components/common/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import LoadingScreen from './components/common/LoadingScreen';
import './App.css'

function AppRoutes() {
  const { settings, loading } = useSystem();

  if (loading) {
    return <LoadingScreen />;
  }

  // Check for System Initialization
  const isInitialized = settings?.isInitialized;
  const isSetupRoute = window.location.pathname === '/setup';

  if (isInitialized === false && !isSetupRoute) {
    // Force redirect to setup if not initialized
    return <Router><ScrollToTop /><Routes><Route path="*" element={<SetupWizard />} /></Routes></Router>;
  }

  // Check if user is admin (from stored token payload)
  const getUserRole = (): string | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role || null;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole();
  const adminRoles = ['super administrator', 'administrator', 'admin'];
  const isMaintenanceMode = settings?.isMaintenanceMode && !adminRoles.includes(userRole?.toLowerCase() || '');

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Protected Routes */}
        {isMaintenanceMode ? (
          <Route path="*" element={<MaintenancePage />} />
        ) : (
          <>
            {/* Public Routes Wrapped in PublicLayout */}
            <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
            <Route path="/news" element={<PublicLayout><NewsPage /></PublicLayout>} />
            <Route path="/gallery" element={<PublicLayout><GalleryPage /></PublicLayout>} />
            <Route path="/academics" element={<PublicLayout><AcademicsPage /></PublicLayout>} />
            <Route path="/news/:slug" element={<PublicLayout><NewsDetailPage /></PublicLayout>} />
            
            {/* Public Admission Routes */}
            <Route path="/verify/receipt/:id" element={<Finance.VerifyReceiptPage />} />
            <Route path="/admission" element={<PublicLayout><AdmissionIntroPage /></PublicLayout>} />
            <Route path="/admission/apply" element={<PublicLayout><AdmissionFormPage /></PublicLayout>} />
            <Route path="/admission/success" element={<PublicLayout><AdmissionSuccessPage /></PublicLayout>} />
            <Route path="/admission/status" element={<PublicLayout><AdmissionStatusPage /></PublicLayout>} />

            <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/notices" element={<Communication.Noticeboard />} />

              {/* Academics Routes */}
              <Route path="academics">
                <Route path="school-sections" element={<Academics.SchoolSectionsPage />} />
                <Route path="class-timetable" element={<Academics.ClassTimetablePage />} />
                <Route path="teachers-timetable" element={<Academics.TeachersTimetablePage />} />
                <Route path="assign-class-teachers" element={<Academics.AssignClassTeacherPage />} />
                <Route path="promotion" element={<Academics.PromoteStudentsPage />} />
                <Route path="subject-groups" element={<Academics.SubjectGroupsPage />} />
                <Route path="subjects" element={<Academics.SubjectsPage />} />
                <Route path="assign-class-subjects" element={<Academics.ClassSubjectsPage />} />
                <Route path="assign-subject-teachers" element={<Academics.AssignSubjectTeacherPage />} />
                <Route path="classes" element={<Academics.ClassPage />} />
                <Route path="sections" element={<Academics.SectionsPage />} />
              </Route>

              {/* HR Routes */}
              <Route path="hr">
                <Route path="staff" element={<HR.StaffDirectoryPage />} />
                <Route path="staff/profile" element={<HR.StaffProfilePage />} />
                <Route path="departments" element={<HR.DepartmentsPage />} />
                <Route path="attendance" element={<HR.StaffAttendancePage />} />
                <Route path="leave-types" element={<HR.LeaveTypesPage />} />
                <Route path="leave/approve" element={<HR.ApproveLeavePage />} />
                <Route path="leave/apply" element={<HR.ApplyLeavePage />} />
                <Route path="payroll" element={<HR.PayrollPage />} />
                <Route path="ratings" element={<HR.TeacherRatingPage />} />
              </Route>

              {/* Students Routes */}
              <Route path="students">
                <Route path="rate-teachers" element={<Students.StudentRatingPage />} />
                <Route path="directory" element={<Students.StudentDirectory />} />
                <Route path="admission" element={<Students.StudentAdmission />} />
                <Route path="edit/:id" element={<Students.StudentAdmission />} />
                <Route path="online-admission" element={<Students.OnlineAdmission />} />
                <Route path="deactivated" element={<Students.DeactivatedStudents />} />
                <Route path="categories" element={<Students.StudentCategories />} />
                <Route path="houses" element={<Students.StudentHouses />} />
                <Route path="deactivate-reasons" element={<Students.DeactivateReasons />} />
                <Route path="profile/:id" element={<Students.StudentProfile />} />
                <Route path="timetable" element={<Students.StudentTimetablePage />} />
                <Route path="attendance" element={<Students.StudentAttendancePage />} />
                <Route path="attendance/mark" element={<Students.StudentAttendanceMarkingPage />} />
                <Route path="attendance/history" element={<Students.StudentAttendanceHistoryPage />} />
                <Route path="attendance/reports" element={<Students.StudentAttendanceReportsPage />} />
                <Route path="finance" element={<Finance.StudentFinancePage />} />
                <Route path="examination/admit-card" element={<Students.StudentAdmitCardPage />} />
                <Route path="examination/results" element={<Students.StudentResultPage />} />
                <Route path="library" element={<Students.StudentLibraryPage />} />
                <Route path="online-classes" element={<OnlineClasses.OnlineClassesPage />} />
                <Route path="online-classes/history" element={<OnlineClasses.CompletedClassesPage />} />
                <Route path="homework" element={<Homework.HomeworkPage />} />
              </Route>

              {/* Parent Routes */}
              <Route path="parent">
                <Route path="dashboard" element={<Parent.ParentDashboard />} />
                <Route path="billing" element={<Parent.ParentBilling />} />
                <Route path="profile" element={<Parent.ParentProfile />} />
              </Route>

              {/* Online Classes Routes */}
              <Route path="online-classes" element={<OnlineClasses.OnlineClassesPage />} />
              <Route path="online-classes/schedule" element={<OnlineClasses.OnlineClassesPage />} />
              <Route path="online-classes/history" element={<OnlineClasses.CompletedClassesPage />} />
              <Route path="homework" element={<Homework.HomeworkPage />} />

              {/* Library Routes */}
              <Route path="library">
                <Route index element={<BookList />} />
                <Route path="dashboard" element={<LibraryDashboard />} />
                <Route path="authors" element={<AuthorManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="settings" element={<LibrarySettings />} />
                <Route path="add" element={<BookAddEdit />} />
                <Route path="edit/:id" element={<BookAddEdit />} />
                <Route path=":id" element={<BookDetail />} />
                <Route path="issue" element={<IssueBook />} />
                <Route path="return" element={<ReturnBook />} />
                <Route path="overdues" element={<Overdues />} />
              </Route>

              {/* Finance Routes */}
              <Route path="finance">
                <Route index element={<Navigate to="record-payment" replace />} />
                <Route path="record-payment" element={<Finance.RecordPaymentPage />} />
                <Route path="payments" element={<Finance.FeesHistoryPage />} />
                <Route path="debtors" element={<Finance.DebtorsListPage />} />
                <Route path="structures" element={<Finance.FeeStructurePage />} />
                <Route path="discounts" element={<Finance.DiscountsPage />} />
                <Route path="reminders" element={<Finance.PaymentRemindersPage />} />
                <Route path="carry-forward" element={<Finance.CarryForwardPage />} />
                <Route path="carry-forward/history" element={<Finance.CarryForwardHistoryPage />} />
              </Route>

              {/* Examination Routes */}
              <Route path="examination">
                {/* Setup */}
                <Route path="setup/groups" element={<Examination.ExamGroupsPage />} />
                <Route path="setup/structure" element={<Examination.AssessmentStructurePage />} />
                <Route path="setup/grading" element={<Examination.GradingSystemPage />} />
                <Route path="setup/schedules" element={<Examination.ExamSchedulePage />} />
                <Route path="setup/admit-cards" element={<Examination.AdmitCardPage />} />

                {/* Control */}
                <Route path="control/results" element={<Examination.ResultManagementPage />} />
                <Route path="control/scratch-cards" element={<Examination.ScratchCardPage />} />
                <Route path="control/scratch-cards/batches" element={<Examination.ScratchCardBatchesPage />} />
                <Route path="control/scratch-cards/batches/:id" element={<Examination.ScratchCardBatchDetailsPage />} />

                {/* Entry */}
                <Route path="entry/scoresheet" element={<Examination.ScoresheetPage />} />
                <Route path="entry/skills" element={<Examination.SkillsPage />} />
                <Route path="entry/psychomotor" element={<Examination.PsychomotorPage />} />

                {/* Reports */}
                <Route path="reports/class-broadsheet" element={<Examination.ClassBroadsheetPage />} />
                <Route path="reports/subject-broadsheet" element={<Examination.SubjectBroadsheetPage />} />
                <Route path="reports/report-card" element={<Examination.ReportCardPage />} />
                <Route path="reports/report-card/bulk" element={<Examination.BulkReportCardPage />} />
              </Route>

              {/* Communication Routes */}
              <Route path="communication">
                <Route path="templates" element={<Communication.CommunicationTemplates />} />
                <Route path="broadcast" element={<Navigate to="send-broadcast" replace />} />
                <Route path="send-broadcast" element={<Communication.SendBroadcast />} />
                <Route path="logs" element={<Communication.CommunicationLogs />} />
                <Route path="noticeboard" element={<Communication.Noticeboard />} />
                <Route path="manage-notices" element={<Communication.ManageNotices />} />
              </Route>

              {/* Audit & Reports Routes */}
              <Route path="audit-reports">
                <Route index element={<Audit.AuditOverviewPage />} />
                <Route path="overview" element={<Audit.AuditOverviewPage />} />
                <Route path="activity" element={<Audit.ActivityLogsPage />} />
                <Route path="communication" element={<Audit.CommunicationAuditPage />} />
                <Route path="reports-hub" element={<Audit.ReportHubPage />} />
              </Route>

              {/* Settings Routes */}
              <Route path="settings">
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<Settings.GeneralSettingsPage />} />
                <Route path="sessions" element={<Settings.SessionsPage />} />
                <Route path="terms" element={<Settings.TermsPage />} />
                <Route path="roles-permissions" element={<Settings.RolesPermissionsPage />} />
                <Route path="users" element={<Settings.UsersPage />} />
                <Route path="payments" element={<Settings.PaymentSettingsPage />} />
                <Route path="profile" element={<Settings.AdminProfilePage />} />
              </Route>

              {/* Front CMS Routes */}
              <Route path="front-cms">
                <Route index element={<FrontCmsDashboard />} />
                <Route path="hero" element={<FrontCmsDashboard />} />
                <Route path="notice" element={<FrontCmsDashboard />} />
                <Route path="contacts" element={<FrontCmsDashboard />} />
                <Route path="seo" element={<FrontCmsDashboard />} />
                <Route path="media" element={<FrontCmsDashboard />} />
                <Route path="sections" element={<FrontCmsDashboard />} />
                <Route path="stats" element={<FrontCmsDashboard />} />
                <Route path="programs" element={<FrontCmsDashboard />} />
                <Route path="gallery" element={<FrontCmsDashboard />} />
                <Route path="testimonials" element={<FrontCmsDashboard />} />
                <Route path="news" element={<FrontCmsDashboard />} />
              </Route>
            </Route>
          </Route>
          </>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <SystemProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#333',
              },
            }}
          />
        </ToastProvider>
      </ThemeProvider>
    </SystemProvider>
  )
}

export default App
