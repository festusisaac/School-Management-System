import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  formatter?: (value: any, row?: any) => any;
}

/**
 * Export data to Excel file
 */
export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Sheet1'
): void => {
  try {
    // Transform data based on columns
    const transformedData = data.map((row) => {
      const transformedRow: any = {};
      columns.forEach((col) => {
        const value = row[col.key];
        transformedRow[col.header] = col.formatter ? col.formatter(value, row) : value;
      });
      return transformedRow;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    // Set column widths
    const columnWidths = columns.map((col) => ({
      wch: Math.max(col.header.length, 15),
    }));
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate and download file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
};

/**
 * Export payment history to Excel
 */
export const exportPaymentHistory = (payments: any[]): void => {
  const columns: ExportColumn[] = [
    { header: 'Date', key: 'createdAt', formatter: (val) => new Date(val).toLocaleDateString() },
    { header: 'Time', key: 'createdAt', formatter: (val) => new Date(val).toLocaleTimeString() },
    { header: 'Reference ID', key: 'reference' },
    { header: 'Payment Method', key: 'paymentMethod' },
    { header: 'Amount', key: 'amount', formatter: (val) => parseFloat(val) },
    { header: 'Type', key: 'type' },
    { header: 'Status', key: 'status' },
  ];

  const filename = `payment-history-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  exportToExcel(payments, columns, filename, 'Payment History');
};

/**
 * Export fee breakdown to Excel
 */
export const exportFeeBreakdown = (feeHeads: any[]): void => {
  const columns: ExportColumn[] = [
    { header: 'Fee Head', key: 'name' },
    { header: 'Total Amount', key: 'amount', formatter: (val) => parseFloat(val) },
    { header: 'Amount Paid', key: 'amount', formatter: (val, row) => parseFloat(val) - parseFloat(row.balance) },
    { header: 'Balance', key: 'balance', formatter: (val) => parseFloat(val) },
    { header: 'Status', key: 'balance', formatter: (val) => parseFloat(val) <= 0 ? 'PAID' : 'PENDING' },
  ];

  const filename = `fee-breakdown-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  exportToExcel(feeHeads, columns, filename, 'Fee Breakdown');
};

/**
 * Export financial statement to Excel
 */
export const exportFinancialStatement = (statement: any): void => {
  const summaryData = [
    { Item: 'Total Due', Amount: parseFloat(statement.totalDue || '0') },
    { Item: 'Amount Paid', Amount: parseFloat(statement.totalPaid || '0') },
    { Item: 'Balance', Amount: parseFloat(statement.balance || '0') },
  ];

  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Fee breakdown sheet
  if (statement.assignedHeads && statement.assignedHeads.length > 0) {
    const feeData = statement.assignedHeads.map((head: any) => ({
      'Fee Head': head.name,
      'Total Amount': parseFloat(head.amount),
      'Amount Paid': parseFloat(head.amount) - parseFloat(head.balance),
      'Balance': parseFloat(head.balance),
      'Status': parseFloat(head.balance) <= 0 ? 'PAID' : 'PENDING',
    }));
    const feeSheet = XLSX.utils.json_to_sheet(feeData);
    XLSX.utils.book_append_sheet(workbook, feeSheet, 'Fee Breakdown');
  }

  const filename = `financial-statement-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Export staff directory to Excel
 */
export const exportStaffDirectory = (staff: any[]): void => {
  const columns: ExportColumn[] = [
    // Identification
    { header: 'Staff ID', key: 'employeeId' },
    { header: 'Full Name', key: 'firstName', formatter: (_val, row) => `${row.firstName} ${row.lastName}` },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Biometric ID', key: 'biometricId' },
    
    // Organization
    { header: 'Department', key: 'department', formatter: (val) => val?.name || 'N/A' },
    { header: 'Role', key: 'role', formatter: (val) => val?.name || 'N/A' },
    { header: 'Status', key: 'status' },
    { header: 'Employment Type', key: 'employmentType' },
    { header: 'Teaching Staff', key: 'isTeachingStaff', formatter: (val) => val ? 'Yes' : 'No' },
    { header: 'Date of Joining', key: 'dateOfJoining', formatter: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    
    // Personal Details
    { header: 'Gender', key: 'gender' },
    { header: 'Date of Birth', key: 'dateOfBirth', formatter: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { header: 'Blood Group', key: 'bloodGroup' },
    { header: 'Marital Status', key: 'maritalStatus' },
    { header: 'Father Name', key: 'fatherName' },
    { header: 'Mother Name', key: 'motherName' },
    
    // Qualifications & History
    { header: 'Qualifications', key: 'qualifications' },
    { header: 'Work Experience', key: 'workExperience' },
    { header: 'Note', key: 'note' },
    
    // Bank Details
    { header: 'Basic Salary', key: 'basicSalary', formatter: (val) => val ? parseFloat(val).toFixed(2) : '0.00' },
    { header: 'Bank Name', key: 'bankName' },
    { header: 'Account Title', key: 'accountTitle' },
    { header: 'Account Number', key: 'accountNumber' },
    
    // Address
    { header: 'Current Address', key: 'address' },
    { header: 'Permanent Address', key: 'permanentAddress' },
    { header: 'City', key: 'city' },
    { header: 'State', key: 'state' },
    { header: 'Country', key: 'country' },
    { header: 'Postal Code', key: 'postalCode' },
    
    // Emergency Contact
    { header: 'Emergency Contact Name', key: 'emergencyContactName' },
    { header: 'Emergency Contact Phone', key: 'emergencyContactPhone' },
    { header: 'Emergency Contact Relation', key: 'emergencyContactRelation' },
    
    // Social Links
    { header: 'Facebook', key: 'facebookUrl' },
    { header: 'Twitter', key: 'twitterUrl' },
    { header: 'LinkedIn', key: 'linkedinUrl' },
    { header: 'Instagram', key: 'instagramUrl' },
  ];

  const filename = `staff-directory-full-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  exportToExcel(staff, columns, filename, 'Staff Directory');
};
