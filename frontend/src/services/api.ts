import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
export const FILE_BASE_URL = (import.meta as any).env.VITE_UPLOAD_URL || 'http://localhost:3000'

export const getFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${FILE_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

class ApiService {
  private axiosInstance: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    onSuccess: (token: string) => void
    onFailed: (error: any) => void
  }> = []

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    })

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Automatically unwrap the data envelope if it exists
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          response.data = response.data.data;
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config
        const isLoginRequest = originalRequest.url?.includes('/auth/login')
        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh')

        if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest && !isRefreshRequest) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                onSuccess: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                  resolve(this.axiosInstance(originalRequest))
                },
                onFailed: (err: any) => {
                  reject(err)
                },
              })
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refresh_token = localStorage.getItem('refresh_token')
            if (!refresh_token) {
              // No refresh token, clear everything and redirect
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('user')
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login'
              }
              return Promise.reject(new Error('No refresh token available'))
            }

            const response = await this.axiosInstance.post<{
              access_token: string
              refresh_token: string
            }>('/auth/refresh', { refresh_token })

            const { access_token, refresh_token: newRefreshToken } = response.data

            localStorage.setItem('access_token', access_token)
            localStorage.setItem('refresh_token', newRefreshToken)

            this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
            originalRequest.headers.Authorization = `Bearer ${access_token}`

            this.failedQueue.forEach((prom) => prom.onSuccess(access_token))
            this.failedQueue = []

            return this.axiosInstance(originalRequest)
          } catch (err: any) {
            // Refresh failed - clear tokens and redirect to login
            this.failedQueue.forEach((prom) => prom.onFailed(err))
            this.failedQueue = []

            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }

            return Promise.reject(err)
          } finally {
            this.isRefreshing = false
          }
        }

        // Handle 401 errors that don't trigger refresh (e.g., refresh endpoint itself)
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')

          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }

        // Handle System Not Initialized (403 with specific message)
        if (error.response?.status === 403 && error.response?.data?.error === 'SystemNotInitialized') {
          if (!window.location.pathname.includes('/setup')) {
            window.location.href = '/setup'
          }
        }

        return Promise.reject(error)
      },
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.axiosInstance.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data: any, config?: AxiosRequestConfig) {
    const response = await this.axiosInstance.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data: any, config?: AxiosRequestConfig) {
    const response = await this.axiosInstance.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data: any, config?: AxiosRequestConfig) {
    const response = await this.axiosInstance.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.axiosInstance.delete<T>(url, config)
    return response.data
  }

  // System Settings
  async getPublicSettings() {
    return this.get<any>('/system/settings/public')
  }

  // Finance API methods
  async getStudentStatement(studentId: string) {
    return this.get<any>(`/finance/statement/${studentId}`)
  }

  async getFamilyFinancials(studentId: string) {
    return this.get<any>(`/finance/family/${studentId}`)
  }

  async recordPayment(data: any) {
    return this.post<any>('/finance/record-payment', data)
  }

  async verifyPaystackPayment(data: { reference: string, meta: any, studentId: string }) {
    return this.post<any>('/finance/paystack/verify', data)
  }

  async verifyFlutterwavePayment(data: { transactionId: string, meta: any, studentId: string, txRef?: string }) {
    return this.post<any>('/finance/flutterwave/verify', data)
  }

  async refundPayment(id: string, reason: string) {
    return this.post<any>(`/finance/payments/${id}/refund`, { reason })
  }

  async getFinancePayments(params?: any) {
    return this.get<any>('/finance/payments', { params })
  }

  async getDebtorsList(params: { classId?: string; search?: string; page?: number; limit?: number; minBalance?: number; riskLevel?: string; sectionId?: string } = {}) {
    return this.get<any>('/finance/debtors', { params })
  }

  async getFeeStructures() {
    return this.get<any[]>('/finance/structures')
  }

  async createFeeStructure(data: any) {
    return this.post<any>('/finance/structures', data)
  }

  // Modern Fee Structure
  async getFeeHeads() {
    return this.get<any[]>('/finance/heads')
  }

  async createFeeHead(data: any) {
    return this.post<any>('/finance/heads', data)
  }

  async deleteFeeHead(id: string) {
    return this.delete<any>(`/finance/heads/${id}`)
  }

  async updateFeeHead(id: string, data: any) {
    return this.patch<any>(`/finance/heads/${id}`, data)
  }

  async getFeeGroups() {
    return this.get<any[]>('/finance/groups')
  }

  async createFeeGroup(data: any) {
    return this.post<any>('/finance/groups', data)
  }

  async deleteFeeGroup(id: string) {
    return this.delete<any>(`/finance/groups/${id}`)
  }

  async updateFeeGroup(id: string, data: any) {
    return this.patch<any>(`/finance/groups/${id}`, data)
  }

  async bulkAssignFeeGroup(id: string, data: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }) {
    return this.post<any>(`/finance/groups/${id}/assign`, data)
  }

  async simulateFeeGroup(id: string, data: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }) {
    return this.post<any>(`/finance/groups/${id}/simulate`, data)
  }


  async getDiscounts() {
    return this.get<any[]>('/finance/discounts')
  }

  async createDiscount(data: any) {
    return this.post<any>('/finance/discounts', data)
  }

  // Advanced Discount Management
  async getDiscountProfiles() {
    return this.get<any[]>('/finance/discount-profiles')
  }

  async createDiscountProfile(data: any) {
    return this.post<any>('/finance/discount-profiles', data)
  }

  async updateDiscountProfile(id: string, data: any) {
    return this.patch<any>(`/finance/discount-profiles/${id}`, data)
  }

  async deleteDiscountProfile(id: string) {
    return this.delete<any>(`/finance/discount-profiles/${id}`)
  }

  async getDiscountProfileById(id: string) {
    return this.get<any>(`/finance/discount-profiles/${id}`)
  }

  async assignDiscountProfile(id: string, data: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }) {
    return this.post<any>(`/finance/discount-profiles/${id}/assign`, data)
  }

  async simulateDiscountProfile(id: string, data: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }) {
    return this.post<any>(`/finance/discount-profiles/${id}/simulate`, data)
  }

  async getReminders(params: { studentId?: string; page?: number; limit?: number } = {}) {
    return this.get<any>('/finance/reminders', { params })
  }

  async sendBulkReminders(data: { studentIds: string[]; channel: string; messageTemplate?: string }) {
    return this.post<any>('/finance/reminders/bulk', data)
  }

  async createReminder(data: any) {
    return this.post<any>('/finance/reminders', data)
  }

  async carryForward(data: any) {
    return this.post<any>('/finance/carry-forward', data)
  }

  async listCarryForwards(params: { studentId?: string; academicYear?: string; page?: number; limit?: number } = {}) {
    return this.get<any>('/finance/carry-forward', { params })
  }

  async deleteCarryForward(id: string) {
    return this.delete<any>(`/finance/carry-forward/${id}`)
  }

  // Dashboard API methods
  async getAdminStats(params?: any) {
    return this.get<any>('/reporting/dashboard/admin/stats', { params })
  }

  async getAdminCharts(params?: any) {
    return this.get<any>('/reporting/dashboard/admin/charts', { params })
  }

  async getRecentActivities(params?: any) {
    return this.get<any>('/reporting/dashboard/admin/activities', { params })
  }

  // Classes
  async getClasses() {
    const response = await this.axiosInstance.get('/academics/classes')
    return response.data
  }

  async getPublicClasses() {
    const response = await this.axiosInstance.get('/academics/public/classes')
    return response.data
  }

  async getClassById(id: string) {
    const response = await this.axiosInstance.get(`/academics/classes/${id}`)
    return response.data
  }

  async createClass(data: { name: string; isActive?: boolean }) {
    const response = await this.axiosInstance.post('/academics/classes', data)
    return response.data
  }

  async updateClass(id: string, data: { name?: string; isActive?: boolean }) {
    const response = await this.axiosInstance.put(`/academics/classes/${id}`, data)
    return response.data
  }

  async deleteClass(id: string) {
    const response = await this.axiosInstance.delete(`/academics/classes/${id}`)
    return response.data
  }

  async toggleClassStatus(id: string) {
    const response = await this.axiosInstance.patch(`/academics/classes/${id}/toggle-status`)
    return response.data
  }

  // Sections
  async getSections() {
    const response = await this.axiosInstance.get('/academics/sections')
    return response.data
  }

  async getSectionById(id: string) {
    const response = await this.axiosInstance.get(`/academics/sections/${id}`)
    return response.data
  }

  async createSection(data: { name: string; classId: string; isActive?: boolean }) {
    const response = await this.axiosInstance.post('/academics/sections', data)
    return response.data
  }

  async updateSection(id: string, data: { name?: string; classId?: string; isActive?: boolean }) {
    const response = await this.axiosInstance.put(`/academics/sections/${id}`, data)
    return response.data
  }

  async deleteSection(id: string) {
    const response = await this.axiosInstance.delete(`/academics/sections/${id}`)
    return response.data
  }

  async toggleSectionStatus(id: string) {
    const response = await this.axiosInstance.patch(`/academics/sections/${id}/toggle-status`)
    return response.data
  }

  // School Sections
  async getSchoolSections() {
    return this.get<any[]>('/academics/school-sections')
  }

  async createSchoolSection(data: { name: string; code?: string; description?: string }) {
    return this.post<any>('/academics/school-sections', data)
  }

  async updateSchoolSection(id: string, data: { name?: string; code?: string; description?: string }) {
    return this.put<any>(`/academics/school-sections/${id}`, data)
  }

  async deleteSchoolSection(id: string) {
    return this.delete<any>(`/academics/school-sections/${id}`)
  }

  async toggleSchoolSectionStatus(id: string) {
    return this.patch<any>(`/academics/school-sections/${id}/toggle`, {})
  }

  // Subjects
  async getSubjects() {
    const response = await this.axiosInstance.get('/academics/subjects')
    return response.data
  }

  async getSubjectById(id: string) {
    const response = await this.axiosInstance.get(`/academics/subjects/${id}`)
    return response.data
  }

  async createSubject(data: { name: string; groupId?: string; isCore?: boolean; isActive?: boolean }) {
    const response = await this.axiosInstance.post('/academics/subjects', data)
    return response.data
  }

  async updateSubject(id: string, data: { name?: string; groupId?: string; isCore?: boolean; isActive?: boolean }) {
    const response = await this.axiosInstance.put(`/academics/subjects/${id}`, data)
    return response.data
  }

  async deleteSubject(id: string) {
    const response = await this.axiosInstance.delete(`/academics/subjects/${id}`)
    return response.data
  }

  async toggleSubjectStatus(id: string) {
    const response = await this.axiosInstance.patch(`/academics/subjects/${id}/toggle-status`)
    return response.data
  }

  // Class Subjects
  async getClassSubjects(classId: string, sectionId?: string) {
    const response = await this.axiosInstance.get(`/academics/assign-class-subjects/class/${classId}`, {
      params: { sectionId }
    })
    return response.data
  }

  async createClassSubject(data: { classId: string; sectionId?: string; subjectId: string; isCore?: boolean }) {
    const response = await this.axiosInstance.post('/academics/assign-class-subjects', data)
    return response.data
  }

  async bulkAssignClassSubjects(data: { classId: string; sectionId?: string; subjectIds: string[]; isCore?: boolean }) {
    const response = await this.axiosInstance.post('/academics/assign-class-subjects/bulk', data)
    return response.data
  }

  async updateClassSubject(id: string, data: { isCore?: boolean; isActive?: boolean }) {
    const response = await this.axiosInstance.patch(`/academics/assign-class-subjects/${id}`, data)
    return response.data
  }

  async toggleClassSubjectStatus(id: string) {
    const response = await this.axiosInstance.patch(`/academics/assign-class-subjects/${id}/toggle`)
    return response.data
  }

  async deleteClassSubject(id: string) {
    const response = await this.axiosInstance.delete(`/academics/assign-class-subjects/${id}`)
    return response.data
  }

  // Subject Groups
  async getSubjectGroups() {
    const response = await this.axiosInstance.get('/academics/subject-groups')
    return response.data
  }

  async createSubjectGroup(data: { name: string; description?: string; isActive?: boolean }) {
    const response = await this.axiosInstance.post('/academics/subject-groups', data)
    return response.data
  }

  async updateSubjectGroup(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const response = await this.axiosInstance.put(`/academics/subject-groups/${id}`, data)
    return response.data
  }

  async deleteSubjectGroup(id: string) {
    const response = await this.axiosInstance.delete(`/academics/subject-groups/${id}`)
    return response.data
  }

  async toggleSubjectGroupStatus(id: string) {
    const response = await this.axiosInstance.patch(`/academics/subject-groups/${id}/toggle-status`)
    return response.data
  }

  // Timetable Periods
  async getPeriods() {
    const response = await this.axiosInstance.get('/academics/timetable/periods')
    return response.data
  }

  async initializeDefaultPeriods() {
    const response = await this.axiosInstance.get('/academics/timetable/periods/initialize')
    return response.data
  }

  async createPeriod(data: { name: string; type: string; startTime: string; endTime: string; periodOrder: number }) {
    const response = await this.axiosInstance.post('/academics/timetable/periods', data)
    return response.data
  }

  async updatePeriod(id: string, data: { name?: string; type?: string; startTime?: string; endTime?: string; periodOrder?: number }) {
    const response = await this.axiosInstance.put(`/academics/timetable/periods/${id}`, data)
    return response.data
  }

  async deletePeriod(id: string) {
    const response = await this.axiosInstance.delete(`/academics/timetable/periods/${id}`)
    return response.data
  }

  // Timetable Slots
  async getTimetable(classId: string, sectionId?: string) {
    const response = await this.axiosInstance.get('/academics/timetable/slots', {
      params: { classId, sectionId: sectionId || undefined }
    })
    return response.data
  }

  async getTeacherTimetable(teacherId: string) {
    const response = await this.axiosInstance.get(`/academics/timetable/slots/teacher/${teacherId}`)
    return response.data
  }

  async createTimetableSlot(data: {
    classId: string;
    sectionId?: string;
    dayOfWeek: number;
    periodId: string;
    subjectId: string;
    teacherId?: string;
    roomNumber?: string;
  }) {
    const response = await this.axiosInstance.post('/academics/timetable/slots', data)
    return response.data
  }

  async updateTimetableSlot(id: string, data: {
    dayOfWeek?: number;
    periodId?: string;
    subjectId?: string;
    teacherId?: string;
    roomNumber?: string;
  }) {
    const response = await this.axiosInstance.put(`/academics/timetable/slots/${id}`, data)
    return response.data
  }

  async deleteTimetableSlot(id: string) {
    const response = await this.axiosInstance.delete(`/academics/timetable/slots/${id}`)
    return response.data
  }

  async saveTimetableBulk(data: {
    classId: string;
    sectionId?: string;
    slots: Array<{
      dayOfWeek: number;
      periodId: string;
      subjectId: string;
      teacherId?: string;
      roomNumber?: string;
    }>;
  }) {
    const response = await this.axiosInstance.post('/academics/timetable/slots/bulk', data)
    return response.data
  }

  async copyTimetable(data: {
    sourceClassId: string;
    sourceSectionId?: string;
    targetClassId: string;
    targetSectionId?: string;
  }) {
    const response = await this.axiosInstance.post('/academics/timetable/slots/copy', data)
    return response.data
  }

  async reorderPeriods(periodIds: string[]) {
    const response = await this.axiosInstance.post('/academics/timetable/periods/reorder', { periodIds })
    return response.data
  }

  // Subject Teacher Assignment
  async getSubjectTeachers(classId: string, sectionId?: string) {
    return this.get<any[]>('/academics/subject-teachers', { params: { classId, sectionId: sectionId || undefined } })
  }

  async assignSubjectTeachers(data: { classId: string; sectionId?: string; assignments: Array<{ subjectId: string; teacherId: string }> }) {
    return this.post<any>('/academics/subject-teachers', data)
  }

  // Class Teacher Assignment
  async assignClassTeacher(classId: string, sectionId: string | undefined, teacherId: string) {
    if (sectionId) {
      const response = await this.axiosInstance.post(`/academics/sections/${sectionId}/assign-teacher`, { teacherId })
      return response.data
    } else {
      const response = await this.axiosInstance.post(`/academics/classes/${classId}/assign-teacher`, { teacherId })
      return response.data
    }
  }

  async removeClassTeacher(classId: string, sectionId?: string) {
    if (sectionId) {
      const response = await this.axiosInstance.delete(`/academics/sections/${sectionId}/remove-teacher`)
      return response.data
    } else {
      const response = await this.axiosInstance.delete(`/academics/classes/${classId}/remove-teacher`)
      return response.data
    }
  }

  // Bulk Student Import
  async validateBulkStudents(data: any[]) {
    return this.post<any[]>('/students/bulk/validate', data)
  }

  async importBulkStudents(data: any[]) {
    return this.post<{ jobId: string }>('/students/bulk/import', data)
  }

  async getStudentImportStatus(jobId: string) {
    return this.get<any>(`/students/bulk/import/status/${jobId}`)
  }

  // HR API methods
  async getDepartments() {
    return this.get<any[]>('/hr/departments')
  }

  async createDepartment(data: any) {
    return this.post<any>('/hr/departments', data)
  }

  async updateDepartment(id: string, data: any) {
    return this.put<any>(`/hr/departments/${id}`, data)
  }

  async deleteDepartment(id: string) {
    return this.delete<any>(`/hr/departments/${id}`)
  }

  async getDesignations() {
    return this.get<any[]>('/hr/designations')
  }

  async getDesignationHierarchy() {
    return this.get<any[]>('/hr/designations/hierarchy')
  }

  async createDesignation(data: any) {
    return this.post<any>('/hr/designations', data)
  }

  async updateDesignation(id: string, data: any) {
    return this.put<any>(`/hr/designations/${id}`, data)
  }

  async deleteDesignation(id: string) {
    return this.delete<any>(`/hr/designations/${id}`)
  }

  async getStaff(params?: any) {
    return this.get<any[]>('/hr/staff', { params })
  }

  async getStaffById(id: string) {
    return this.get<any>(`/hr/staff/${id}`)
  }

  async createStaff(data: any) {
    if (data instanceof FormData) {
      return this.post<any>('/hr/staff', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return this.post<any>('/hr/staff', data)
  }

  async updateStaff(id: string, data: any) {
    if (data instanceof FormData) {
      return this.put<any>(`/hr/staff/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return this.put<any>(`/hr/staff/${id}`, data)
  }

  async deleteStaff(id: string) {
    return this.delete<any>(`/hr/staff/${id}`)
  }

  async getStaffStatistics() {
    return this.get<any>('/hr/staff/statistics')
  }

  async getMyProfile() {
    return this.get<any>('/hr/staff/profile/me')
  }

  async validateBulkStaff(data: any[]) {
    return this.post<any[]>('/hr/staff/bulk/validate', data)
  }

  async importBulkStaff(data: any[]) {
    return this.post<{ jobId: string }>('/hr/staff/bulk/import', data)
  }

  async getStaffImportStatus(jobId: string) {
    return this.get<any>(`/hr/staff/bulk/import/status/${jobId}`)
  }

  // Attendance API methods
  async markAttendance(data: any) {
    return this.post<any>('/hr/attendance/mark', data)
  }

  async bulkMarkAttendance(data: any) {
    return this.post<any>('/hr/attendance/bulk', data)
  }

  async getDailyAttendance(date: string, sectionId?: string) {
    const url = sectionId 
      ? `/hr/attendance/daily?date=${date}&sectionId=${sectionId}`
      : `/hr/attendance/daily?date=${date}`
    return this.get<any[]>(url)
  }

  async getAttendanceSummary(date: string, sectionId?: string) {
    const url = sectionId 
      ? `/hr/attendance/summary?date=${date}&sectionId=${sectionId}`
      : `/hr/attendance/summary?date=${date}`
    return this.get<any>(url)
  }

  // Leave API methods (HR Controller)
  async getLeaveTypes() {
    return this.get<any[]>('/hr/leaves/types')
  }

  async createLeaveType(data: any) {
    return this.post<any>('/hr/leaves/types', data)
  }

  async updateLeaveApproval(requestId: string, approvalId: string, data: any) {
    return this.put<any>(`/hr/leaves/requests/${requestId}/approvals/${approvalId}`, data)
  }

  async updateLeaveType(id: string, data: any) {
    return this.put<any>(`/hr/leaves/types/${id}`, data)
  }

  async deleteLeaveType(id: string) {
    return this.delete<any>(`/hr/leaves/types/${id}`)
  }

  async applyLeave(data: any) {
    if (data instanceof FormData) {
      return this.post<any>('/hr/leaves/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return this.post<any>('/hr/leaves/apply', data)
  }

  async getMyLeaveRequests() {
    return this.get<any[]>('/hr/leaves/my-requests')
  }

  async getAllLeaveRequests() {
    return this.get<any[]>('/hr/leaves/all-requests')
  }

  async approveLeave(id: string, data: { status: 'Approved' | 'Rejected', comment?: string }) {
    return this.post<any>(`/hr/leaves/approve/${id}`, data)
  }

  async getLeaveBalance() {
    return this.get<any>('/hr/leaves/balance')
  }

  // Payroll API methods
  async getPayrolls(params?: { month?: number; year?: number; staffId?: string; sectionId?: string }) {
    return this.get<any[]>('/hr/payroll', { params })
  }

  async getPayrollById(id: string) {
    return this.get<any>(`/hr/payroll/${id}`)
  }

  async createPayroll(data: any) {
    return this.post<any>('/hr/payroll', data)
  }

  async bulkCreatePayroll(data: { month: number; year: number; sectionId?: string }) {
    return this.post<any>('/hr/payroll/bulk', data)
  }

  async getPayrollAnalytics(params: { month: number; year: number; sectionId?: string }) {
    return this.get<any>('/hr/payroll/analytics', { params })
  }

  async updatePayrollStatus(id: string, data: { status: string; paymentMethod?: string; paymentDate?: string }) {
    return this.patch<any>(`/hr/payroll/${id}/status`, data)
  }

  async deletePayroll(id: string) {
    return this.delete<any>(`/hr/payroll/${id}`)
  }

  // Teacher Rating API methods
  async getRatings(params?: any) {
    return this.get<any[]>('/hr/ratings', { params })
  }

  async getTeacherRatings(teacherId: string) {
    return this.get<any[]>(`/hr/ratings/teacher/${teacherId}`)
  }

  async getAverageTeacherRating(teacherId: string) {
    return this.get<number>(`/hr/ratings/teacher/${teacherId}/average`)
  }

  async createRating(data: any) {
    return this.post<any>('/hr/ratings', data)
  }

  async getMyTeachers() {
    return this.get<any[]>('/hr/ratings/my-teachers')
  }

  async updateRating(id: string, data: any) {
    return this.put<any>(`/hr/ratings/${id}`, data)
  }

  async deleteRating(id: string) {
    return this.delete<any>(`/hr/ratings/${id}`)
  }

  // Student API methods
  async getStudents(params?: any) {
    return this.get<any[]>('/students', { params })
  }

  async promoteStudents(data: { studentIds: string[], classId: string, sectionId?: string }) {
    return this.post<any>('/students/bulk/promote', data)
  }

  async createStudent(data: any) {
    if (data instanceof FormData) {
      return this.post<any>('/students', data)
    }
    return this.post<any>('/students', data)
  }

  async getStudentCategories() {
    return this.get<any[]>('/students/categories')
  }

  async createStudentCategory(data: any) {
    return this.post<any>('/students/categories', data)
  }

  async deleteStudentCategory(id: string) {
    return this.delete<any>(`/students/categories/${id}`)
  }

  async getStudentHouses() {
    return this.get<any[]>('/students/houses')
  }

  async getDeactivatedStudents() {
    return this.get<any[]>('/students/deactivated')
  }

  async getStudentById(id: string) {
    return this.get<any>(`/students/${id}`)
  }

  async getStudentProfile() {
    return this.get<any>('/students/profile/me')
  }

  async updateStudent(id: string, data: any) {
    if (data instanceof FormData) {
      return this.patch<any>(`/students/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return this.patch<any>(`/students/${id}`, data, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  async deleteStudent(id: string) {
    return this.delete<any>(`/students/${id}`)
  }

  async deleteStudentDocument(id: string) {
    return this.delete<any>(`/students/documents/${id}`)
  }

  async createOnlineAdmission(data: any) {
    if (data instanceof FormData) {
      return this.post<any>('/students/online-admissions', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return this.post<any>('/students/online-admissions', data)
  }

  async getOnlineAdmissionStatus(referenceNumber: string) {
    return this.get<any>(`/students/online-admissions/status/${encodeURIComponent(referenceNumber)}`)
  }

  async verifyAdmissionPayment(reference: string, email: string) {
    return this.get<any>(`/students/online-admission/verify-payment/${encodeURIComponent(reference)}`, {
      params: { email }
    })
  }

  async createStudentHouse(data: any) {
    return this.post<any>('/students/houses', data)
  }

  async deleteStudentHouse(id: string) {
    return this.delete<void>(`/students/houses/${id}`)
  }

  async getDeactivateReasons() {
    return this.get<any[]>('/students/deactivate-reasons/all')
  }

  async createDeactivateReason(data: any) {
    return this.post<any>('/students/deactivate-reasons', data)
  }

  async deleteDeactivateReason(id: string) {
    return this.delete<void>(`/students/deactivate-reasons/${id}`)
  }

  async getOnlineAdmissions() {
    return this.get<any[]>('/students/online-admissions')
  }

  async updateOnlineAdmissionStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    return this.patch<any>(`/students/online-admissions/${id}/status`, { status })
  }

  async approveOnlineAdmission(id: string) {
    return this.post<any>(`/students/online-admissions/${id}/approve`, {})
  }

  // Student Attendance methods
  async getStudentAttendance(studentId: string, startDate: string, endDate: string) {
    return this.get<any[]>(`/students/attendance/student/${studentId}`, {
      params: { startDate, endDate }
    });
  }

  async markStudentAttendance(data: any) {
    return this.post<any>('/students/attendance/mark', data)
  }

  async bulkMarkStudentAttendance(data: { records: any[] }) {
    return this.post<any>('/students/attendance/bulk', data)
  }

  async getStudentClassAttendance(classId: string, date: string, sectionId?: string) {
    return this.get<any[]>(`/students/attendance/class/${classId}`, { params: { date, sectionId } })
  }

  async getAttendanceLogs(params: { startDate: string, endDate: string, classId?: string, sectionId?: string }) {
    return this.get<any[]>('/students/attendance/logs', { params })
  }

  // Examination Student API
  async getStudentExamDashboard(studentId: string) {
    return this.get<any>(`/examination/student/${studentId}/dashboard`)
  }

  async verifyStudentResult(studentId: string, data: { code: string; pin: string; examGroupId: string }) {
    return this.post<any>(`/examination/student/${studentId}/verify-result`, data)
  }

  async getStudentAdmitCard(studentId: string, examGroupId: string) {
    return this.get<any>(`/examination/student/${studentId}/admit-card`, { params: { examGroupId } })
  }

  // Teacher Dashboard API
  async getTeacherStats() {
    return this.get<any>('/hr/staff/dashboard/stats')
  }

  async getTeacherTodayTimetable() {
    return this.get<any[]>('/academics/timetable/slots/teacher/today')
  }

  // Communication Templates
  async getMessageTemplates(params?: { type?: 'EMAIL' | 'SMS' }) {
    return this.get<any[]>('/communication/templates', { params })
  }

  async getMessageTemplateById(id: string) {
    return this.get<any>(`/communication/templates/${id}`)
  }

  async createMessageTemplate(data: any) {
    return this.post<any>('/communication/templates', data)
  }

  async updateMessageTemplate(id: string, data: any) {
    return this.put<any>(`/communication/templates/${id}`, data)
  }

  async deleteMessageTemplate(id: string) {
    return this.delete<any>(`/communication/templates/${id}`)
  }

  // Broadcasting
  async sendBroadcast(data: SendBroadcastDto) {
    return this.post<{ queued: number }>('/communication/broadcast', data)
  }

  async getCommunicationLogs(params?: any) {
    return this.get<any[]>('/communication/logs', { params })
  }

  async getCommunicationLogsByStudent(studentId: string) {
    return this.get<any[]>(`/communication/logs/student/${studentId}`)
  }

  // Noticeboard
  async getNotices(params?: { audience?: string, schoolSectionId?: string }) {
    return this.get<Notice[]>(`/communication/notices`, { params })
  }

  async getNoticesForAdmin(params?: { schoolSectionId?: string }) {
    return this.get<Notice[]>(`/communication/notices/admin`, { params })
  }

  async getNoticeById(id: string) {
    return this.get<Notice>(`/communication/notices/${id}`)
  }

  async createNotice(data: Partial<Notice>) {
    return this.post<Notice>(`/communication/notices`, data)
  }

  async updateNotice(id: string, data: Partial<Notice>) {
    return this.patch<Notice>(`/communication/notices/${id}`, data)
  }

  async deleteNotice(id: string) {
    return this.delete<void>(`/communication/notices/${id}`)
  }
}

export const api = new ApiService()
export default api

export enum MessageTemplateType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: MessageTemplateType;
  subject?: string;
  body: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export enum BroadcastTarget {
  ALL_STUDENTS = 'ALL_STUDENTS',
  CLASS = 'CLASS',
  SECTION = 'SECTION',
  STAFF = 'STAFF',
  INDIVIDUAL_STUDENTS = 'INDIVIDUAL_STUDENTS',
  INDIVIDUAL_STAFF = 'INDIVIDUAL_STAFF',
  DEBTORS_ONLY = 'DEBTORS_ONLY',
  PAID_ONLY = 'PAID_ONLY',
}

export interface SendBroadcastDto {
  channel: 'EMAIL' | 'SMS';
  target: BroadcastTarget;
  targetIds?: string[];
  sectionId?: string;
  templateId?: string;
  subject?: string;
  body: string;
  includeParents?: boolean;
  scheduledAt?: string;
}

export enum NoticeType {
  ANNOUNCEMENT = 'Announcement',
  ACADEMIC = 'Academic',
  EVENT = 'Event',
  EMERGENCY = 'Emergency',
  MAINTENANCE = 'Maintenance'
}

export enum NoticeAudience {
  ALL = 'All',
  STUDENTS = 'Students',
  STAFF = 'Staff'
}

export enum NoticePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  targetAudience: NoticeAudience;
  priority: NoticePriority;
  schoolSectionId?: string;
  isSticky: boolean;
  isActive: boolean;
  authorId: string;
  author?: {
    firstName: string;
    lastName: string;
    photo?: string;
  };
  expiresAt?: string;
  attachments?: string[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
