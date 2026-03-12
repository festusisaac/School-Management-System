import React, { useEffect, useState } from 'react'
import apiService from '../../services/api'
import { Link } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  Calendar,
  Banknote,
  UserPlus,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  students: { total: number; active: number; inactive: number }
  staff: { total: number; teaching: number; nonTeaching: number }
  finance: { totalRevenue: number; outstandingFees: number }
  feesOverview: { unpaid: number; partial: number; paid: number }
  academicHealth: {
    teachersYetToSubmit: number
    topPerformingSubject: string
    publishedResultsCount: number
    unpublishedResultsCount: number
    lowAttendanceClasses: string[]
  }
  studentPerformance: {
    schoolWideAverage: number
    topPerformingClasses: string[]
    bottomPerformingClasses: string[]
    studentsAtRisk: number
  }
  accounting: {
    totalExpenses: number
    netBalance: number
    payrollStatus: string
    latestExpense: { category: string; amount: number }
  }
}

interface BasicChartData {
  genderDistribution: { label: string; value: number }[]
  enrollmentTrends: { month: string; count: string }[]
}

interface RecentActivity {
  recentEnrollments: any[]
  recentPayments: any[]
}

const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B'];

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity | null>(null)
  const [charts, setCharts] = useState<BasicChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activitiesData, chartsData] = await Promise.all([
          apiService.getAdminStats(),
          apiService.getRecentActivities(),
          apiService.getAdminCharts(),
        ])
        setStats(statsData)
        setActivities(activitiesData)
        setCharts(chartsData)
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Fallback data for charts if API returns empty
  const enrollmentData = charts?.enrollmentTrends.length
    ? charts.enrollmentTrends
    : [
      { month: 'Jan', count: '0' },
      { month: 'Feb', count: '0' },
      { month: 'Mar', count: '0' },
      { month: 'Apr', count: '0' },
      { month: 'May', count: '0' },
      { month: 'Jun', count: '0' },
    ];

  const genderData = charts?.genderDistribution.length
    ? charts.genderDistribution
    : [
      { label: 'Male', value: 1 },
      { label: 'Female', value: 5 }
    ];

  return (
    <div className="space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of school performance and activities.</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors">
            <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            {new Date().toLocaleDateString()}
          </button>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats?.students?.total || 0}</h3>
            </div>
            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
              <GraduationCap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Active
            </span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-500 dark:text-gray-400">{stats?.students?.inactive || 0} Inactive</span>
          </div>
        </div>

        {/* Total Staff */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Staff</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats?.staff?.total || 0}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium bg-purple-100 px-2 py-0.5 rounded-full text-xs">
              {stats?.staff.teaching} Teaching
            </span>
            <span className="text-gray-500 ml-2 text-xs">
              {stats?.staff.nonTeaching} Non-Teaching
            </span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(stats?.finance?.totalRevenue)}</h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +12%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">from last month</span>
          </div>
        </div>

        {/* Outstanding Fees */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Fees</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(stats?.finance?.outstandingFees)}</h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Banknote className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-600 font-medium text-xs bg-orange-100 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
        </div>

        {/* Fees Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-4">Fees Overview</h3>
          <div className="space-y-4">
            {/* Unpaid */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">{stats?.feesOverview?.unpaid || 0} UNPAID</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats?.feesOverview ? ((stats.feesOverview.unpaid / (stats.feesOverview.unpaid + stats.feesOverview.partial + stats.feesOverview.paid)) * 100).toFixed(2) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${stats?.feesOverview ? (stats.feesOverview.unpaid / (stats.feesOverview.unpaid + stats.feesOverview.partial + stats.feesOverview.paid)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            {/* Partial */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">{stats?.feesOverview?.partial || 0} PARTIAL</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats?.feesOverview ? ((stats.feesOverview.partial / (stats.feesOverview.unpaid + stats.feesOverview.partial + stats.feesOverview.paid)) * 100).toFixed(2) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-sky-400 h-2 rounded-full"
                  style={{ width: `${stats?.feesOverview ? (stats.feesOverview.partial / (stats.feesOverview.unpaid + stats.feesOverview.partial + stats.feesOverview.paid)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            {/* Paid */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">{stats?.feesOverview?.paid || 0} PAID</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats?.feesOverview ? ((stats.feesOverview.paid / (stats.feesOverview.unpaid + stats.feesOverview.partial + stats.feesOverview.paid)) * 100).toFixed(2) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-sky-300 h-2 rounded-full"
                  style={{ width: `${stats?.feesOverview ? (stats.feesOverview.paid / (stats.feesOverview.unpaid + stats.feesOverview.partial + stats.feesOverview.paid)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-4">Academic Health</h3>
          <div className="space-y-4">
            {/* Teachers Yet to Submit */}
            <div className="flex items-center justify-between p-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">Teachers Yet to Submit</span>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {stats?.academicHealth?.teachersYetToSubmit || 0}
              </span>
            </div>

            {/* Top Performing Subject */}
            <div className="flex items-center justify-between p-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">Top Subject</span>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {stats?.academicHealth?.topPerformingSubject || 'N/A'}
              </span>
            </div>

            {/* Low Attendance Alert (Retained as health indicator) */}
            {stats?.academicHealth?.lowAttendanceClasses && stats.academicHealth.lowAttendanceClasses.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1 flex items-center">
                  ⚠ Low Attendance
                </p>
                <p className="text-xs text-gray-800 dark:text-gray-200">
                  Classes: {stats.academicHealth.lowAttendanceClasses.join(', ')}
                </p>
              </div>
            )}

            {/* Published vs Unpublished */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
                <p className="text-xs text-primary-600 dark:text-primary-400 uppercase font-bold mb-1">Published</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.academicHealth?.publishedResultsCount || 0}</p>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold mb-1">Unpublished</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.academicHealth?.unpublishedResultsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Student Performance Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-4">Student Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-medium">School-wide Avg</span>
              <span className="text-gray-900 dark:text-white font-bold text-lg">{stats?.studentPerformance?.schoolWideAverage || 0}%</span>
            </div>

            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center"><TrendingUp className="w-3 h-3 text-green-500 mr-1" /> Top Classes</p>
              <div className="flex gap-2">
                {stats?.studentPerformance?.topPerformingClasses.map((cls, idx) => (
                  <span key={idx} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">{cls}</span>
                ))}
              </div>
            </div>

            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center"><TrendingUp className="w-3 h-3 text-red-500 mr-1 transform rotate-180" /> Needs Improvement</p>
              <div className="flex gap-2">
                {stats?.studentPerformance?.bottomPerformingClasses.map((cls, idx) => (
                  <span key={idx} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold">{cls}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">Students At Risk</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Avg &lt; 45% & Attd &lt; 65%</p>
                </div>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.studentPerformance?.studentsAtRisk || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accounting Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Net Balance</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">{formatCurrency(stats?.accounting?.netBalance)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Expenses</span>
              <span className="font-bold text-red-500 dark:text-red-400">-{formatCurrency(stats?.accounting?.totalExpenses)}</span>
            </div>

            <div className="flex items-center justify-between p-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">Payroll Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stats?.accounting?.payrollStatus === 'Paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                {stats?.accounting?.payrollStatus || 'N/A'}
              </span>
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">Latest Expense:</p>
              <div className="flex justify-between">
                <span>{stats?.accounting?.latestExpense?.category || 'N/A'}</span>
                <span className="font-medium">-{formatCurrency(stats?.accounting?.latestExpense?.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart: Enrollment Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 xl:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enrollment Trends</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly student registration overview</p>
            </div>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gender Distribution</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Student composition by gender</p>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.students?.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {genderData.map((entry, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{entry.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 xl:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activities</h2>
            <Link to="/activity-log" className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</Link>
          </div>

          <div className="space-y-6">
            {/* Enrollments */}
            {activities?.recentEnrollments.map((student: any) => (
              <div key={`enroll-${student.id}`} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      New Student Enrolled: <span className="font-bold">{student.firstName} {student.lastName}</span>
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(student.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Admitted to Class: {student.classLevel}
                  </p>
                </div>
              </div>
            ))}

            {/* Payments */}
            {activities?.recentPayments.map((payment: any) => (
              <div key={`pay-${payment.id}`} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Payment Received: <span className="text-green-600 dark:text-green-400 font-bold">{formatCurrency(payment.amount)}</span>
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
                    {payment.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}

            {!activities?.recentEnrollments.length && !activities?.recentPayments.length && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent activities found.</p>
            )}
          </div>
        </div>

        {/* Quick Actions / System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/students/register" className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Register Student</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add a new student to the system</p>
              </div>
            </Link>

            <Link to="/finance/record-payment" className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Record Payment</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Log a fee payment or expense</p>
              </div>
            </Link>

            <Link to="/staff/add" className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Add Staff</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Onboard a new employee</p>
              </div>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">System Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-300">Database</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-300">SMS Gateway</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-300">Email Service</span>
                </div>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Idle</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DashboardPage
