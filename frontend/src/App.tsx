import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import LoginPage from '@pages/auth/LoginPage'
import DashboardPage from '@pages/dashboard/DashboardPage'
import MaintenancePage from '@pages/MaintenancePage'
import LandingPage from './pages/public/LandingPage'
import SetupWizard from './pages/SetupWizard'
import { MainLayout } from './components/layout/MainLayout'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { SystemProvider, useSystem } from './context/SystemContext'
import * as Academics from './pages/academics';
import * as HR from './pages/hr';
import * as Students from './pages/students';
import * as Finance from './pages/finance';
import * as Examination from './pages/examination';
import * as Settings from './pages/settings';
import * as OnlineClasses from './pages/online-classes';
import * as Homework from './pages/homework';
import * as Communication from './pages/communication';
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
import './App.css'

function AppRoutes() {
  const { settings, loading, getFullUrl } = useSystem();

  if (loading) {
    const schoolName = settings?.schoolName || 'YOUR SCHOOL';
    const logoUrl = settings?.primaryLogo ? getFullUrl(settings.primaryLogo) : null;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            {/* Subtle Pulse Logo */}
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-heading">
                  {schoolName.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Minimal Spinner */}
            <div className="absolute -inset-2 border-2 border-primary-500/20 rounded-2xl"></div>
            <div className="absolute -inset-2 border-t-2 border-primary-500 rounded-2xl animate-spin"></div>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <h2 className="text-slate-900 dark:text-white font-heading font-semibold text-base">
              {schoolName}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
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
  const isMaintenanceMode = settings?.isMaintenanceMode && userRole !== 'Admin';

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Protected Routes */}
        {isMaintenanceMode ? (
          <Route path="*" element={<MaintenancePage />} />
        ) : (
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

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
                <Route path="broadcast" element={<Communication.SendBroadcast />} />
              </Route>

              {/* Settings Routes */}
              <Route path="settings">
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<Settings.GeneralSettingsPage />} />
                <Route path="sessions" element={<Settings.SessionsPage />} />
                <Route path="terms" element={<Settings.TermsPage />} />
                <Route path="roles" element={<Settings.RolesPermissionsPage />} />
                <Route path="users" element={<Settings.UsersPage />} />
              </Route>
            </Route>
          </Route>
        )}

        <Route path="/" element={<LandingPage />} />
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
        </ToastProvider>
      </ThemeProvider>
    </SystemProvider>
  )
}

export default App

