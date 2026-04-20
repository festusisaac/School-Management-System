import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentLogin from './pages/StudentLogin';
import InstructionPage from './pages/InstructionPage';
import ExamRoom from './pages/ExamRoom';
import ReviewSubmitPage from './pages/ReviewSubmitPage';
import SuccessPage from './pages/SuccessPage';

// Admin Routes
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/AdminLayout';
import PullExamPage from './pages/admin/PullExamPage';
import LiveMonitorPage from './pages/admin/LiveMonitorPage';
import PushResultsPage from './pages/admin/PushResultsPage';
import ResultSummaryPage from './pages/admin/ResultSummaryPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<StudentLogin />} />
        <Route path="/verify" element={<InstructionPage />} />
        <Route path="/exam" element={<ExamRoom />} />
        <Route path="/review" element={<ReviewSubmitPage />} />
        <Route path="/success" element={<SuccessPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="pull" replace />} />
            <Route path="pull" element={<PullExamPage />} />
            <Route path="monitor" element={<LiveMonitorPage />} />
            <Route path="push" element={<PushResultsPage />} />
            <Route path="results" element={<ResultSummaryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
