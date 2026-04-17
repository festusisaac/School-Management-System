/**
 * Comprehensive mapping of backend API routes to human-readable labels.
 * Used by AuditInterceptor at log time AND by AuditService for legacy records.
 */
const ACTION_MAPPING: Record<string, string> = {
  // ─── Auth & System ────────────────────────────────────────────
  'POST /auth/login': 'User Logged In',
  'POST /auth/logout': 'User Logged Out',
  'POST /auth/register': 'Account Registered',
  'POST /auth/forgot-password': 'Password Reset Requested',
  'POST /auth/reset-password': 'Password Reset Completed',
  'POST /auth/change-password': 'Password Changed',
  'POST /system-setup/initialize': 'System Initial Setup',
  'PATCH /system-settings': 'School Settings Updated',
  'POST /system-settings': 'School Settings Saved',
  'PUT /system-settings': 'School Settings Updated',

  // ─── Students ─────────────────────────────────────────────────
  'POST /students': 'New Student Admitted',
  'PATCH /students/': 'Student Record Updated',
  'PUT /students/': 'Student Record Updated',
  'DELETE /students/': 'Student Record Deleted',
  'POST /students/bulk-import': 'Bulk Student Import',
  'POST /students/bulk/validate': 'Bulk Student Validation',
  'POST /students/bulk/import': 'Bulk Student Import',
  'POST /students/bulk/promote': 'Students Promoted',
  'PATCH /students/deactivate': 'Student Deactivated',
  'PATCH /students/activate': 'Student Reactivated',
  'POST /students/online-admissions': 'Online Admission Submitted',
  'PATCH /students/online-admissions/': 'Admission Status Updated',
  'POST /students/online-admissions/approve': 'Online Admission Approved',
  'POST /students/categories': 'Student Category Created',
  'DELETE /students/categories/': 'Student Category Removed',
  'POST /students/houses': 'Student House Created',
  'DELETE /students/houses/': 'Student House Removed',
  'POST /students/deactivate-reasons': 'Deactivation Reason Created',
  'DELETE /students/deactivate-reasons/': 'Deactivation Reason Removed',
  'DELETE /students/documents/': 'Student Document Deleted',
  'POST /students/attendance/mark': 'Student Attendance Marked',
  'POST /students/attendance/bulk': 'Bulk Student Attendance Recorded',

  // ─── Finance ──────────────────────────────────────────────────
  'POST /finance/record-payment': 'Fee Payment Recorded',
  'POST /finance/heads': 'Fee Head Created',
  'PATCH /finance/heads/': 'Fee Head Updated',
  'DELETE /finance/heads/': 'Fee Head Deleted',
  'POST /finance/groups': 'Fee Group Created',
  'PATCH /finance/groups/': 'Fee Group Updated',
  'DELETE /finance/groups/': 'Fee Group Deleted',
  'POST /finance/groups/assign': 'Fee Group Assigned to Students',
  'POST /finance/discounts': 'Fee Discount Created',
  'PATCH /finance/discounts/': 'Fee Discount Updated',
  'DELETE /finance/discounts/': 'Fee Discount Removed',
  'POST /finance/reminders': 'Payment Reminder Sent',
  'POST /finance/paystack/verify': 'Online Payment Verified (Paystack)',
  'POST /finance/flutterwave/verify': 'Online Payment Verified (Flutterwave)',
  'POST /finance/carry-forward': 'Balance Carried Forward',
  'POST /finance/payments/': 'Payment Refund Processed',
  'POST /finance/reports/': 'Financial Report Generated',

  // ─── HR / Staff ───────────────────────────────────────────────
  'POST /hr/staff': 'New Staff Member Added',
  'PUT /hr/staff/': 'Staff Record Updated',
  'PATCH /hr/staff/': 'Staff Record Updated',
  'DELETE /hr/staff/': 'Staff Record Removed',
  'POST /hr/staff/bulk/validate': 'Bulk Staff Validation',
  'POST /hr/staff/bulk/import': 'Bulk Staff Imported',
  'POST /hr/departments': 'Department Created',
  'PUT /hr/departments/': 'Department Updated',
  'DELETE /hr/departments/': 'Department Removed',
  'POST /hr/attendance/mark': 'Staff Attendance Marked',
  'POST /hr/attendance/bulk': 'Bulk Staff Attendance Recorded',
  'POST /hr/leaves/apply': 'Leave Application Submitted',
  'POST /hr/leaves/approve/': 'Leave Request Approved/Rejected',
  'PUT /hr/leaves/requests/': 'Leave Approval Updated',
  'POST /hr/leaves/types': 'Leave Type Created',
  'PUT /hr/leaves/types/': 'Leave Type Updated',
  'DELETE /hr/leaves/types/': 'Leave Type Removed',
  'POST /hr/payroll': 'Payroll Created',
  'POST /hr/payroll/bulk': 'Bulk Payroll Generated',
  'PATCH /hr/payroll/': 'Payroll Status Updated',
  'DELETE /hr/payroll/': 'Payroll Record Deleted',
  'POST /hr/ratings': 'Teacher Rating Submitted',
  'PUT /hr/ratings/': 'Teacher Rating Updated',
  'DELETE /hr/ratings/': 'Teacher Rating Removed',

  // ─── Academics ────────────────────────────────────────────────
  'POST /academics/classes': 'New Class Created',
  'PATCH /academics/classes/': 'Class Updated',
  'PUT /academics/classes/': 'Class Updated',
  'DELETE /academics/classes/': 'Class Deleted',
  'POST /academics/sections': 'New Section Created',
  'PATCH /academics/sections/': 'Section Updated',
  'DELETE /academics/sections/': 'Section Deleted',
  'POST /academics/subjects': 'New Subject Created',
  'PATCH /academics/subjects/': 'Subject Updated',
  'DELETE /academics/subjects/': 'Subject Deleted',
  'POST /academics/assign-subject-teacher': 'Subject Teacher Assigned',
  'POST /academics/assign-class-teacher': 'Class Teacher Assigned',
  'DELETE /academics/remove-class-teacher': 'Class Teacher Removed',
  'POST /academics/timetable': 'Timetable Created',
  'PUT /academics/timetable/': 'Timetable Updated',
  'DELETE /academics/timetable/': 'Timetable Deleted',
  'POST /academics/promote-students': 'Students Promoted',
  'POST /academics/sessions': 'Academic Session Created',
  'PATCH /academics/sessions/': 'Academic Session Updated',
  'POST /academics/terms': 'Academic Term Created',
  'PATCH /academics/terms/': 'Academic Term Updated',

  // ─── Examination ──────────────────────────────────────────────
  'POST /examination/exams': 'Examination Created',
  'PATCH /examination/exams/': 'Examination Updated',
  'DELETE /examination/exams/': 'Examination Deleted',
  'POST /examination/marks': 'Exam Marks Entered',
  'PUT /examination/marks/': 'Exam Marks Updated',
  'POST /examination/results/publish': 'Results Published',
  'POST /examination/grades': 'Grading Scale Created',
  'PATCH /examination/grades/': 'Grading Scale Updated',
  'POST /examination/exam-groups': 'Exam Group Created',
  'PATCH /examination/exam-groups/': 'Exam Group Updated',
  'DELETE /examination/exam-groups/': 'Exam Group Deleted',

  // ─── Communication ────────────────────────────────────────────
  'POST /communication/broadcast': 'Broadcast Message Sent',
  'POST /communication/templates': 'Message Template Created',
  'PUT /communication/templates/': 'Message Template Updated',
  'DELETE /communication/templates/': 'Message Template Deleted',
  'POST /communication/notices': 'Notice Published',
  'PATCH /communication/notices/': 'Notice Updated',
  'DELETE /communication/notices/': 'Notice Removed',

  // ─── Roles & Permissions ──────────────────────────────────────
  'POST /roles': 'New Role Created',
  'PATCH /roles/': 'Role Permissions Updated',
  'PUT /roles/': 'Role Updated',
  'DELETE /roles/': 'Role Deleted',

  // ─── School Sections ──────────────────────────────────────────
  'POST /school-sections': 'School Section Created',
  'PATCH /school-sections/': 'School Section Updated',
  'DELETE /school-sections/': 'School Section Removed',

  // ─── CMS ──────────────────────────────────────────────────────
  'POST /cms/': 'CMS Content Updated',
  'PATCH /cms/': 'CMS Content Updated',
  'PUT /cms/': 'CMS Content Updated',
  'DELETE /cms/': 'CMS Content Removed',

  // ─── Custom Manual Actions ────────────────────────────────────
  'BULK_STAFF_IMPORT': 'Bulk Staff Records Imported',
  'SYSTEM_INITIALIZATION': 'System Setup Completed',
};

/**
 * Resolves a technical action/method/path to a friendly label.
 * Works for both new logs (using method + path) and legacy logs (using stored action string).
 */
export function getFriendlyActionLabel(method: string, path: string, originalAction: string): string {
  // Remove version prefix if present (/api/v1)
  const normalizedPath = path.replace(/^\/api\/v\d+/, '');
  
  // 1. Try manual action match first (for custom-named actions like SYSTEM_INITIALIZATION)
  if (ACTION_MAPPING[originalAction]) return ACTION_MAPPING[originalAction];

  // 2. Clean up path (remove UUIDs/IDs for matching)
  const cleanPath = normalizedPath
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '')
    .replace(/\/\d+/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
  
  const key = `${method} ${cleanPath}`;
  
  // 3. Try exact match on method + cleanPath
  if (ACTION_MAPPING[key]) return ACTION_MAPPING[key];

  // 4. Try prefix match (catches routes with trailing segments like IDs)
  const match = Object.entries(ACTION_MAPPING).find(([k]) => key.startsWith(k));
  if (match) return match[1];

  // 5. Try matching just the original action (which is stored as "METHOD /full/path")
  const actionNormalized = originalAction.replace(/^(GET|POST|PUT|PATCH|DELETE) \/api\/v\d+/, '$1 ')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '')
    .replace(/\/\d+/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
  
  if (ACTION_MAPPING[actionNormalized]) return ACTION_MAPPING[actionNormalized];
  
  const actionMatch = Object.entries(ACTION_MAPPING).find(([k]) => actionNormalized.startsWith(k));
  if (actionMatch) return actionMatch[1];

  // 6. Final fallback: generate a readable label from the path
  return generateFallbackLabel(method, cleanPath || normalizedPath);
}

/**
 * Generates a human-readable label from a method and path when no mapping exists.
 * e.g., "POST /academics/classes" → "New Academic Class"
 */
function generateFallbackLabel(method: string, path: string): string {
  // Extract the meaningful segment (last part of path)
  const segments = path.split('/').filter(Boolean);
  const resource = segments[segments.length - 1] || 'Record';
  
  // Convert kebab/snake-case to readable
  const readable = resource
    .replace(/[-_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();

  switch (method) {
    case 'POST': return `${readable} Created`;
    case 'PUT':
    case 'PATCH': return `${readable} Updated`;
    case 'DELETE': return `${readable} Deleted`;
    default: return `${readable} Action`;
  }
}
