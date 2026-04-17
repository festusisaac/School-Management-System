import jsPDF from 'jspdf';
import { formatCurrency } from '../../../utils/currency';
import { formatDateLocal, formatTimeLocal } from '../../../utils/date';
import { getDetailedPaymentMethod } from '../../../utils/transactionUtils';

const PAGE = {
  width: 210,
  height: 297,
  margin: 12,
};

const getPageWidth = (pdf: jsPDF) => pdf.internal.pageSize.getWidth();
const getPageHeight = (pdf: jsPDF) => pdf.internal.pageSize.getHeight();

const fitTextToWidth = (pdf: jsPDF, value: string, maxWidth: number) => {
  const text = String(value || '-');
  if (!text) return '-';
  if (pdf.getTextWidth(text) <= maxWidth) return text;

  const ellipsis = '...';
  let trimmed = text;
  while (trimmed.length > 0 && pdf.getTextWidth(`${trimmed}${ellipsis}`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed ? `${trimmed}${ellipsis}` : ellipsis;
};

const getColumnTextX = (x: number, width: number, align: 'left' | 'right', padding = 1.5) => (
  align === 'right' ? x + width - padding : x + padding
);

const getFeeHistoryTypeLabel = (value: string) => {
  const normalized = String(value || '').toUpperCase();
  switch (normalized) {
    case 'FEE_PAYMENT':
      return 'PAYMENT';
    case 'CARRY_FORWARD':
      return 'TRANSFER';
    default:
      return normalized.replace(/_/g, ' ') || '-';
  }
};

const ensurePage = (pdf: jsPDF, y: number, needed = 10) => {
  if (y + needed <= getPageHeight(pdf) - PAGE.margin) return y;
  pdf.addPage();
  return PAGE.margin;
};

const drawSchoolHeader = (pdf: jsPDF, schoolInfo: any, title: string, subtitle?: string) => {
  const pageWidth = getPageWidth(pdf);
  let y = PAGE.margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(schoolInfo?.name || 'School Management System', PAGE.margin, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const addressLine = [schoolInfo?.address, schoolInfo?.phone, schoolInfo?.email].filter(Boolean).join(' | ');
  if (addressLine) {
    pdf.text(addressLine, PAGE.margin, y);
    y += 5;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(title, pageWidth - PAGE.margin, PAGE.margin, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Generated ${new Date().toLocaleString()}`, pageWidth - PAGE.margin, PAGE.margin + 5, { align: 'right' });
  if (subtitle) {
    pdf.text(subtitle, pageWidth - PAGE.margin, PAGE.margin + 10, { align: 'right' });
  }

  y = Math.max(y, PAGE.margin + 14);
  pdf.setDrawColor(215, 215, 215);
  pdf.line(PAGE.margin, y, pageWidth - PAGE.margin, y);
  return y + 7;
};

const drawKeyValueGrid = (pdf: jsPDF, y: number, title: string, rows: Array<[string, string]>, rightAligned = false) => {
  const pageWidth = getPageWidth(pdf);
  y = ensurePage(pdf, y, 24);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(title.toUpperCase(), rightAligned ? pageWidth - PAGE.margin : PAGE.margin, y, rightAligned ? { align: 'right' } : undefined);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  rows.forEach(([label, value]) => {
    y = ensurePage(pdf, y, 6);
    const text = `${label}: ${value || '-'}`;
    pdf.text(text, rightAligned ? pageWidth - PAGE.margin : PAGE.margin, y, rightAligned ? { align: 'right' } : undefined);
    y += 5;
  });
  return y;
};

export const exportStudentStatementPdf = (payload: { student: any; statement: any }, schoolInfo: any) => {
  const { student, statement } = payload;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = drawSchoolHeader(
    pdf,
    schoolInfo,
    'Student Account Statement',
    statement?.sessionName ? `Session ${statement.sessionName}` : undefined
  );

  const leftRows: Array<[string, string]> = [
    ['Student Name', `${student?.firstName || ''} ${student?.lastName || ''}`.trim()],
    ['Admission Number', student?.admissionNo || 'N/A'],
    ['Class', student?.class?.name || 'N/A'],
  ];

  const rightRows: Array<[string, string]> = [
    ['Academic Session', statement?.sessionName || 'Current Session'],
    ['Total Due', formatCurrency(statement?.totalDue || 0)],
    ['Total Paid', formatCurrency(statement?.totalPaid || 0)],
    ['Closing Balance', formatCurrency(statement?.balance || 0)],
  ];

  const startY = y;
  const leftEnd = drawKeyValueGrid(pdf, startY, 'Student Profile', leftRows);
  const rightEnd = drawKeyValueGrid(pdf, startY, 'Statement Summary', rightRows, true);
  y = Math.max(leftEnd, rightEnd) + 3;

  const feeRows = [
    ...(statement?.assignedHeads || []).map((head: any) => ({
      description: head.name,
      category: head.group || 'Fee Group',
      billed: parseFloat(head.amount || '0'),
      paid: parseFloat(head.paid || '0'),
      balance: parseFloat(head.balance || '0'),
    })),
    ...(statement?.carryForwards || []).map((cf: any) => ({
      description: cf.name,
      category: 'Carry Forward',
      billed: parseFloat(cf.amount || '0'),
      paid: parseFloat(cf.paid || '0'),
      balance: parseFloat(cf.balance || '0'),
    })),
  ];

  const transactions = (statement?.transactions || []).filter((tx: any) => tx.type !== 'CARRY_FORWARD');

  y = ensurePage(pdf, y, 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Fee Ledger', PAGE.margin, y);
  y += 4;
  pdf.setDrawColor(230, 230, 230);
  pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 5;

  pdf.setFontSize(8);
  pdf.text('Description', PAGE.margin, y);
  pdf.text('Category', 88, y);
  pdf.text('Billed', 140, y, { align: 'right' });
  pdf.text('Paid', 168, y, { align: 'right' });
  pdf.text('Balance', PAGE.width - PAGE.margin, y, { align: 'right' });
  y += 4;
  pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  feeRows.forEach((row: any) => {
    y = ensurePage(pdf, y, 10);
    pdf.text(String(row.description || '-').slice(0, 38), PAGE.margin, y);
    pdf.text(String(row.category || '-').slice(0, 22), 88, y);
    pdf.text(formatCurrency(row.billed), 140, y, { align: 'right' });
    pdf.text(formatCurrency(row.paid), 168, y, { align: 'right' });
    pdf.text(formatCurrency(row.balance), PAGE.width - PAGE.margin, y, { align: 'right' });
    y += 5;
    pdf.setDrawColor(244, 244, 244);
    pdf.line(PAGE.margin, y - 2, PAGE.width - PAGE.margin, y - 2);
  });

  y += 3;
  y = ensurePage(pdf, y, 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Transaction Ledger', PAGE.margin, y);
  y += 4;
  pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 5;

  pdf.setFontSize(8);
  pdf.text('Date', PAGE.margin, y);
  pdf.text('Reference', 52, y);
  pdf.text('Method', 112, y);
  pdf.text('Type', 155, y);
  pdf.text('Amount', PAGE.width - PAGE.margin, y, { align: 'right' });
  y += 4;
  pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  transactions.forEach((tx: any) => {
    y = ensurePage(pdf, y, 10);
    pdf.text(`${formatDateLocal(tx.createdAt)} ${formatTimeLocal(tx.createdAt)}`, PAGE.margin, y);
    pdf.text(String(tx.reference || tx.id || '-').slice(0, 28), 52, y);
    pdf.text(String(getDetailedPaymentMethod(tx) || tx.paymentMethod || '-').slice(0, 20), 112, y);
    pdf.text(String(tx.type || '-').replace(/_/g, ' ').slice(0, 14), 155, y);
    pdf.text(formatCurrency(tx.amount || 0), PAGE.width - PAGE.margin, y, { align: 'right' });
    y += 5;
    pdf.setDrawColor(244, 244, 244);
    pdf.line(PAGE.margin, y - 2, PAGE.width - PAGE.margin, y - 2);
  });

  y += 6;
  y = ensurePage(pdf, y, 14);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text(
    'This statement is system-generated and reflects the student account position for the selected academic session.',
    PAGE.margin,
    y
  );

  pdf.save(`${student?.firstName || 'student'}-${student?.lastName || ''}-statement.pdf`);
};

export const exportFeeHistoryPdf = (payload: any, schoolInfo: any) => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = getPageWidth(pdf);
  let y = drawSchoolHeader(
    pdf,
    schoolInfo,
    'School Fee History Report',
    payload?.sessionName ? `Session ${payload.sessionName}` : undefined
  );

  const filterParts = [
    payload?.filters?.studentId ? `Search ${payload.filters.studentId}` : null,
    payload?.filters?.startDate ? `From ${payload.filters.startDate}` : null,
    payload?.filters?.endDate ? `To ${payload.filters.endDate}` : null,
    payload?.filters?.method ? `Method ${payload.filters.method}` : null,
    payload?.filters?.type ? `Type ${payload.filters.type}` : null,
  ].filter(Boolean);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(
    `Payments ${payload?.stats?.paymentCount || 0} | Partial ${payload?.stats?.partialCount || 0} | Refunds ${payload?.stats?.refundCount || 0} | Waivers ${payload?.stats?.waiverCount || 0} | Net ${formatCurrency(payload?.totalAmount || 0)}`,
    PAGE.margin,
    y
  );
  y += 5;
  if (filterParts.length) {
    pdf.text(filterParts.join(' | '), PAGE.margin, y);
    y += 5;
  }

  y += 2;
  y = ensurePage(pdf, y, 12);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  const cols = [
    { label: 'Date', width: 29, align: 'left' as const },
    { label: 'Student', width: 34, align: 'left' as const },
    { label: 'Admission', width: 25, align: 'left' as const },
    { label: 'Fee Items', width: 56, align: 'left' as const },
    { label: 'Amount', width: 20, align: 'right' as const },
    { label: 'Type', width: 18, align: 'left' as const },
    { label: 'Method', width: 28, align: 'left' as const },
    { label: 'Reference', width: 32, align: 'left' as const },
  ];
  const columnGap = 4;

  let x = PAGE.margin;
  cols.forEach((col) => {
    const textX = getColumnTextX(x, col.width, col.align);
    pdf.text(col.label, textX, y, col.align === 'right' ? { align: 'right' } : undefined);
    x += col.width + columnGap;
  });
  y += 4;
  pdf.line(PAGE.margin, y, pageWidth - PAGE.margin, y);
  y += 5;

  const resolveFeeItems = (tx: any) => {
    const allocations = tx?.meta?.allocations || tx?.meta?.bulkAllocations || [];
    if (!Array.isArray(allocations) || !allocations.length) return 'General payment';
    return allocations.map((item: any) => item.name).join(', ');
  };

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  payload.items.forEach((tx: any) => {
    y = ensurePage(pdf, y, 8);
    const row = [
      `${formatDateLocal(tx.createdAt)} ${formatTimeLocal(tx.createdAt)}`,
      `${tx.student?.firstName || ''} ${tx.student?.lastName || ''}`.trim() || 'Direct',
      tx.student?.admissionNo || 'N/A',
      resolveFeeItems(tx),
      formatCurrency(tx.amount || 0),
      getFeeHistoryTypeLabel(tx.type),
      String(getDetailedPaymentMethod(tx) || tx.paymentMethod || '-'),
      tx.reference || tx.id || '-',
    ];

    x = PAGE.margin;
    row.forEach((cell, index) => {
      const col = cols[index];
      const clipped = fitTextToWidth(pdf, String(cell || '-'), col.width - 4);
      const textX = getColumnTextX(x, col.width, col.align);
      pdf.text(clipped, textX, y, col.align === 'right' ? { align: 'right' } : undefined);
      x += col.width + columnGap;
    });
    y += 4.5;
    pdf.setDrawColor(244, 244, 244);
    pdf.line(PAGE.margin, y - 2, pageWidth - PAGE.margin, y - 2);
  });

  pdf.save(`fee-history-${new Date().toISOString().split('T')[0]}.pdf`);
};
