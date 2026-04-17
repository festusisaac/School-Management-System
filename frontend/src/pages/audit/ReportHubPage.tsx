import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpen, CreditCard, MessageSquare, Shield } from 'lucide-react';

export default function ReportHubPage() {
  const modules = [
    {
      title: 'Finance Reports',
      description: 'Go to fee history, debtors list, carry-forward history, and family-facing financial exports.',
      icon: CreditCard,
      links: [
        { label: 'Fees History', to: '/finance/payments' },
        { label: 'Debtors List', to: '/finance/debtors' },
        { label: 'Carry-Forward History', to: '/finance/carry-forward/history' },
      ],
    },
    {
      title: 'Attendance Reports',
      description: 'Open student attendance history and exported attendance summaries.',
      icon: BarChart3,
      links: [
        { label: 'Attendance Reports', to: '/students/attendance/reports' },
        { label: 'Attendance History', to: '/students/attendance/history' },
      ],
    },
    {
      title: 'Examination Reports',
      description: 'Jump into class broadsheets, subject broadsheets, and report card workflows.',
      icon: BookOpen,
      links: [
        { label: 'Class Broadsheet', to: '/examination/reports/class-broadsheet' },
        { label: 'Subject Broadsheet', to: '/examination/reports/subject-broadsheet' },
        { label: 'Report Card', to: '/examination/reports/report-card' },
      ],
    },
    {
      title: 'Communication Reports',
      description: 'Review communication history, status outcomes, and outbound delivery behavior.',
      icon: MessageSquare,
      links: [
        { label: 'Communication History', to: '/communication/logs' },
        { label: 'Communication Audit', to: '/audit-reports/communication' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Hub</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Central launch point for financial, academic, attendance, communication, and audit reporting workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {modules.map((module) => (
          <div key={module.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                <module.icon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{module.title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{module.description}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {module.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-primary-800 dark:hover:bg-primary-900/10 dark:hover:text-primary-300"
                >
                  <span>{link.label}</span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-5 dark:border-primary-800 dark:bg-primary-900/10">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-primary-600 dark:text-primary-300" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Audit Note</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This first version gives you a central audit workspace and direct report entry points. We can extend it next with downloadable audit exports, user login/session history, and tenant-scoped action categories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
