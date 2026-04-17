/**
 * Utility to format technical audit logs into human-readable strings.
 */

const ACTION_MAPPING: Record<string, string> = {
  // Auth & System
  'POST /api/v1/auth/login': 'User System Login',
  'POST /api/v1/auth/logout': 'User System Logout',
  'GET /api/v1/auth/me': 'Account Access Verified',
  'POST /api/v1/system-setup/initialize': 'Core System Initialization',
  'PATCH /api/v1/system-settings': 'School Settings Updated',

  // Students
  'POST /api/v1/students': 'New Student Admission',
  'PUT /api/v1/students/': 'Student Profile Updated',
  'DELETE /api/v1/students/': 'Student Record Deleted',
  'POST /api/v1/students/bulk-import': 'Bulk Student Enrollment',
  'POST /api/v1/students/admission-query': 'Admission Query Processed',

  // Finance
  'POST /api/v1/finance/record-payment': 'Fee Payment Recorded',
  'POST /api/v1/finance/heads': 'New Fee Head Created',
  'PATCH /api/v1/finance/heads/': 'Fee Head Updated',
  'DELETE /api/v1/finance/heads/': 'Fee Head Removed',
  'POST /api/v1/finance/groups': 'Fee Group Created',
  'PATCH /api/v1/finance/groups/': 'Fee Group Updated',
  'POST /api/v1/finance/groups/assign': 'Mass Fee Assignment',
  'POST /api/v1/finance/discounts': 'Fee Discount Created',
  'POST /api/v1/finance/reminders': 'Payment Reminder Sent',
  'POST /api/v1/finance/paystack/verify': 'Online Payment Verified (Paystack)',
  'POST /api/v1/finance/flutterwave/verify': 'Online Payment Verified (Flutterwave)',
  'POST /api/v1/finance/payments/': 'Refund Processed',

  // HR
  'POST /api/v1/hr/staff': 'New Staff Recruited',
  'PUT /api/v1/hr/staff/': 'Staff Profile Updated',
  'DELETE /api/v1/hr/staff/': 'Staff Record Removed',
  'POST /api/v1/hr/staff/bulk/import': 'Bulk Staff Import',
  'POST /api/v1/hr/departments': 'New Department Created',

  // Academics
  'POST /api/v1/academics/classes': 'New Class Created',
  'PATCH /api/v1/academics/classes/': 'Class Configuration Updated',
  'POST /api/v1/academics/subjects': 'New Subject Created',
  'POST /api/v1/academics/timetable': 'Class Timetable Created',
  'POST /api/v1/academics/promote-students': 'Student Promotion Cycle',

  // Examination
  'POST /api/v1/examination/exams': 'New Examination Created',
  'POST /api/v1/examination/marks': 'Exam Marks Recorded',
  'POST /api/v1/examination/results/publish': 'Exam Results Published',
  
  // Custom manual actions
  'BULK_STAFF_IMPORT': 'Batch Staff Records Imported',
  'SYSTEM_INITIALIZATION': 'Institutional Setup Completed',
};

/**
 * Resolves a technical action/method/path to a friendly label.
 */
export function getFriendlyAction(method: string, path: string, originalAction: string): string {
  // 1. Try manual action match first (from our custom logs)
  if (ACTION_MAPPING[originalAction]) return ACTION_MAPPING[originalAction];

  // 2. Clean up path (remove UUIDs/IDs for matching)
  const cleanPath = path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '')
                        .replace(/\/\d+/g, '/')
                        .replace(/\/$/, '');
  
  const key = `${method} ${cleanPath}`;
  
  // 3. Try exact match on method + cleanPath
  if (ACTION_MAPPING[key]) return ACTION_MAPPING[key];

  // 4. Try prefix match
  const match = Object.entries(ACTION_MAPPING).find(([k]) => key.startsWith(k));
  if (match) return match[1];

  // 5. Fallback: Return original action prettified
  return originalAction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats JSON details into a readable string.
 */
export function getFriendlyDetails(details: any): string {
  if (!details) return '-';
  
  let data = details;
  if (typeof details === 'string') {
    try {
      // Clean up stringified escape chars if any
      data = JSON.parse(details.replace(/\\"/g, '"'));
    } catch (e) {
      return details; // Return as is if not valid JSON
    }
  }

  if (typeof data !== 'object' || data === null || Object.keys(data).length === 0) {
    return '-';
  }

  // Define sensitive/technical keys to hide
  const skipKeys = ['tenantId', 'password', 'id', 'userId', 'roleId', 'sessionId', 'termId', 'createdAt', 'updatedAt'];
  
  const entries = Object.entries(data)
    .filter(([key]) => !skipKeys.includes(key))
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      let valDisplay = '';
      
      if (typeof value === 'object' && value !== null) {
        valDisplay = '[Complex Data]';
      } else {
        valDisplay = String(value);
      }
      
      return `${label}: ${valDisplay}`;
    });

  if (entries.length === 0) return 'Action completed successfully';
  
  return entries.join(', ');
}

/**
 * Returns a semantic color class for the action.
 */
export function getActionColor(action: string, method: string): string {
  if (method === 'DELETE') return 'text-red-700 bg-red-50 dark:bg-red-900/20';
  if (method === 'POST') return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20';
  if (method === 'PUT' || method === 'PATCH') return 'text-blue-700 bg-blue-50 dark:bg-blue-900/20';
  return 'text-gray-700 bg-gray-50 dark:bg-gray-800';
}
