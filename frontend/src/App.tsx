import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@pages/auth/LoginPage'
import RegisterPage from '@pages/auth/RegisterPage'
import DashboardPage from '@pages/dashboard/DashboardPage'
import { MainLayout } from './components/layout/MainLayout'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import * as Academics from './pages/academics';
import * as HR from './pages/hr';
import * as Students from './pages/students';
import * as Finance from './pages/finance';
import * as Examination from './pages/examination';
import * as Settings from './pages/settings';
import ScrollToTop from './components/common/ScrollToTop';
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router future={{ v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
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
                <Route path="departments" element={<HR.DepartmentsPage />} />
                <Route path="designations" element={<HR.DesignationsPage />} />
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

                {/* Entry */}
                <Route path="entry/scoresheet" element={<Examination.ScoresheetPage />} />
                <Route path="entry/skills" element={<Examination.SkillsPage />} />
                <Route path="entry/psychomotor" element={<Examination.PsychomotorPage />} />

                {/* Processing */}
                <Route path="processing/broadsheet" element={<Examination.BroadsheetPage />} />
                <Route path="processing/result-sheet" element={<Examination.ResultSheetPage />} />

                {/* Add other routes as they are implemented */}
              </Route>

              {/* Settings Routes */}
              <Route path="settings">
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<Settings.GeneralSettingsPage />} />
                <Route path="sessions" element={<Settings.SessionsPage />} />
                <Route path="terms" element={<Settings.TermsPage />} />
              </Route>
            </Route>

            <Route path="/" element={<LoginPage />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider >
  )
}

export default App
