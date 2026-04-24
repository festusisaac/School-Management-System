import jsPDF from 'jspdf';
import { formatCurrency } from '../../../utils/currency';
import { formatDateLocal, formatTimeLocal, formatTimestampLocal } from '../../../utils/date';
import { getFriendlyAction, getFriendlyDetails } from '../../../utils/auditFormatter';

const PAGE = {
  width: 210,
  height: 297,
  margin: 12,
};

type SchoolInfo = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
};

type DailySystemReportPayload = {
  reportDate: Date;
  schoolInfo: SchoolInfo;
  summary: {
    totalStudents: number;
    totalStaff: number;
    totalRevenue: number;
    outstandingFees: number;
    todayActivityLogs: number;
    totalCommunicationLogs: number;
    failedCommunicationLogs: number;
    deliveredCommunicationLogs: number;
    totalFinancialTransactions: number;
  };
  todaysEnrollments: any[];
  todaysPayments: any[];
  activityLogs: any[];
  communicationLogs: any[];
};

const getPageWidth = (pdf: jsPDF) => pdf.internal.pageSize.getWidth();
const getPageHeight = (pdf: jsPDF) => pdf.internal.pageSize.getHeight();

const ensurePage = (pdf: jsPDF, y: number, needed = 10) => {
  if (y + needed <= getPageHeight(pdf) - PAGE.margin) return y;
  pdf.addPage();
  return PAGE.margin;
};

const fitText = (pdf: jsPDF, value: string, maxWidth: number) => {
  const text = String(value || '-');
  if (pdf.getTextWidth(text) <= maxWidth) return text;
  const ellipsis = '...';
  let trimmed = text;
  while (trimmed.length > 0 && pdf.getTextWidth(`${trimmed}${ellipsis}`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed ? `${trimmed}${ellipsis}` : ellipsis;
};

const drawHeader = (pdf: jsPDF, schoolInfo: SchoolInfo, reportDate: Date) => {
  const pageWidth = getPageWidth(pdf);
  let y = PAGE.margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(schoolInfo?.name || 'School Management System', PAGE.margin, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const subline = [schoolInfo?.address, schoolInfo?.phone, schoolInfo?.email].filter(Boolean).join(' | ');
  if (subline) {
    pdf.text(subline, PAGE.margin, y);
    y += 5;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('Daily System Report', pageWidth - PAGE.margin, PAGE.margin, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Report Date: ${formatDateLocal(reportDate)}`, pageWidth - PAGE.margin, PAGE.margin + 5, { align: 'right' });
  pdf.text(`Generated: ${formatTimestampLocal(new Date())}`, pageWidth - PAGE.margin, PAGE.margin + 10, { align: 'right' });

  y = Math.max(y, PAGE.margin + 14);
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE.margin, y, pageWidth - PAGE.margin, y);
  return y + 7;
};

const drawSectionTitle = (pdf: jsPDF, y: number, title: string) => {
  y = ensurePage(pdf, y, 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(title, PAGE.margin, y);
  pdf.setDrawColor(230, 230, 230);
  pdf.line(PAGE.margin, y + 2, PAGE.width - PAGE.margin, y + 2);
  return y + 8;
};

const drawSummaryGrid = (pdf: jsPDF, y: number, summary: DailySystemReportPayload['summary']) => {
  const rows: Array<[string, string]> = [
    ['Total Students', String(summary.totalStudents || 0)],
    ['Total Staff', String(summary.totalStaff || 0)],
    ['Total Revenue', formatCurrency(summary.totalRevenue || 0)],
    ['Outstanding Fees', formatCurrency(summary.outstandingFees || 0)],
    ['Today Activity Logs', String(summary.todayActivityLogs || 0)],
    ['Fee Transactions Today', String(summary.totalFinancialTransactions || 0)],
    ['Communication Logs Today', String(summary.totalCommunicationLogs || 0)],
    ['Delivered / Failed Messages', `${summary.deliveredCommunicationLogs || 0} / ${summary.failedCommunicationLogs || 0}`],
  ];

  const leftX = PAGE.margin;
  const rightX = 108;
  const lineHeight = 6;
  const split = Math.ceil(rows.length / 2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  let localY = y;
  rows.slice(0, split).forEach(([label, value]) => {
    localY = ensurePage(pdf, localY, lineHeight);
    pdf.text(`${label}: ${value}`, leftX, localY);
    localY += lineHeight;
  });

  let rightY = y;
  rows.slice(split).forEach(([label, value]) => {
    rightY = ensurePage(pdf, rightY, lineHeight);
    pdf.text(`${label}: ${value}`, rightX, rightY);
    rightY += lineHeight;
  });

  return Math.max(localY, rightY) + 2;
};

const drawSimpleTable = (
  pdf: jsPDF,
  y: number,
  headers: Array<{ label: string; width: number; align?: 'left' | 'right' }>,
  rows: string[][],
  emptyMessage: string,
) => {
  y = ensurePage(pdf, y, 12);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);

  let x = PAGE.margin;
  headers.forEach((header) => {
    const align = header.align || 'left';
    pdf.text(
      header.label,
      align === 'right' ? x + header.width : x,
      y,
      align === 'right' ? { align: 'right' } : undefined,
    );
    x += header.width;
  });

  y += 4;
  pdf.setDrawColor(225, 225, 225);
  pdf.line(PAGE.margin, y - 1.5, PAGE.width - PAGE.margin, y - 1.5);

  if (rows.length === 0) {
    y = ensurePage(pdf, y, 8);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8.5);
    pdf.text(emptyMessage, PAGE.margin, y + 4);
    return y + 10;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  rows.forEach((row) => {
    y = ensurePage(pdf, y, 8);
    let colX = PAGE.margin;
    row.forEach((cell, index) => {
      const header = headers[index];
      const align = header.align || 'left';
      const maxWidth = Math.max(header.width - 2, 8);
      const text = fitText(pdf, cell, maxWidth);
      pdf.text(
        text,
        align === 'right' ? colX + header.width : colX,
        y + 4,
        align === 'right' ? { align: 'right' } : undefined,
      );
      colX += header.width;
    });
    pdf.setDrawColor(245, 245, 245);
    pdf.line(PAGE.margin, y + 6, PAGE.width - PAGE.margin, y + 6);
    y += 7;
  });

  return y + 2;
};

export const exportDailySystemReportPdf = (payload: DailySystemReportPayload) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = drawHeader(pdf, payload.schoolInfo, payload.reportDate);

  y = drawSectionTitle(pdf, y, 'Daily Summary');
  y = drawSummaryGrid(pdf, y, payload.summary);

  y = drawSectionTitle(pdf, y, 'Today Admissions');
  y = drawSimpleTable(
    pdf,
    y,
    [
      { label: 'Time', width: 28 },
      { label: 'Student', width: 72 },
      { label: 'Class', width: 56 },
      { label: 'Admission No.', width: 30 },
    ],
    payload.todaysEnrollments.map((student) => [
      formatTimeLocal(student.createdAt),
      `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
      student?.class?.name || student?.className || 'Not assigned',
      student.admissionNo || '-',
    ]),
    'No student admissions were recorded today.',
  );

  y = drawSectionTitle(pdf, y, 'Today Payments');
  y = drawSimpleTable(
    pdf,
    y,
    [
      { label: 'Time', width: 28 },
      { label: 'Reference', width: 46 },
      { label: 'Type', width: 46 },
      { label: 'Method', width: 42 },
      { label: 'Amount', width: 36, align: 'right' },
    ],
    payload.todaysPayments.map((payment) => [
      formatTimeLocal(payment.createdAt),
      payment.reference || payment.id || '-',
      String(payment.type || 'fee_payment').replace(/_/g, ' '),
      payment.paymentMethod || '-',
      formatCurrency(payment.amount || 0),
    ]),
    'No fee payments were recorded today.',
  );

  y = drawSectionTitle(pdf, y, 'System Activity Logs');
  y = drawSimpleTable(
    pdf,
    y,
    [
      { label: 'Time', width: 28 },
      { label: 'Portal', width: 24 },
      { label: 'Action', width: 58 },
      { label: 'User', width: 40 },
      { label: 'Details', width: 48 },
    ],
    payload.activityLogs.map((log) => [
      formatTimeLocal(log.createdAt),
      log.portal || '-',
      getFriendlyAction(log.method || '', log.path || '', log.action || log.label || 'Activity'),
      log.userEmail || 'System',
      getFriendlyDetails(log.details),
    ]),
    'No activity logs were recorded today.',
  );

  y = drawSectionTitle(pdf, y, 'Communication Logs');
  y = drawSimpleTable(
    pdf,
    y,
    [
      { label: 'Time', width: 26 },
      { label: 'Type', width: 18 },
      { label: 'Status', width: 22 },
      { label: 'Recipient', width: 56 },
      { label: 'Subject / Body', width: 76 },
    ],
    payload.communicationLogs.map((log) => [
      formatTimeLocal(log.createdAt),
      log.type || '-',
      log.status || '-',
      log.recipientName || log.recipient || '-',
      log.subject || log.body || '-',
    ]),
    'No communication logs were recorded today.',
  );

  y = ensurePage(pdf, y, 10);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text(
    'This report summarizes school and system activity captured for the selected day within the platform audit trail.',
    PAGE.margin,
    y,
  );

  const dateStamp = formatDateLocal(payload.reportDate).replace(/[\s,]+/g, '-').toLowerCase();
  pdf.save(`daily-system-report-${dateStamp}.pdf`);
};
