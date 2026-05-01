import jsPDF from 'jspdf';
import { formatCurrency } from '../../../utils/currency';
import { formatDateLocal, formatTimeLocal } from '../../../utils/date';

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

const ensurePage = (pdf: jsPDF, y: number, needed = 10) => {
  if (y + needed <= getPageHeight(pdf) - PAGE.margin) return y;
  pdf.addPage();
  return PAGE.margin;
};

const drawSchoolHeader = (pdf: jsPDF, schoolInfo: any, title: string) => {
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

  y = Math.max(y, PAGE.margin + 14);
  pdf.setDrawColor(215, 215, 215);
  pdf.line(PAGE.margin, y, pageWidth - PAGE.margin, y);
  return y + 7;
};

export const exportDonationHistoryPdf = (payload: { donations: any[]; stats: any }, schoolInfo: any) => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = getPageWidth(pdf);
  let y = drawSchoolHeader(pdf, schoolInfo, 'Donation History Report');

  // Stats Summary
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Impact Summary', PAGE.margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Total Raised: ₦${payload.stats.totalRaised.toLocaleString()} | Total Donors: ${payload.stats.donorCount}`, PAGE.margin, y);
  y += 10;

  // Table Header
  y = ensurePage(pdf, y, 12);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  
  const cols = [
    { label: 'Date', width: 40, align: 'left' as const },
    { label: 'Donor Name', width: 50, align: 'left' as const },
    { label: 'Email', width: 60, align: 'left' as const },
    { label: 'Campaign', width: 60, align: 'left' as const },
    { label: 'Amount', width: 30, align: 'right' as const },
    { label: 'Reference', width: 35, align: 'left' as const },
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

  // Table Body
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  payload.donations.forEach((donation: any) => {
    y = ensurePage(pdf, y, 8);
    const row = [
      `${formatDateLocal(donation.createdAt)} ${formatTimeLocal(donation.createdAt)}`,
      donation.donorName,
      donation.donorEmail,
      donation.project?.title || 'General Endowment',
      `₦${Number(donation.amount).toLocaleString()}`,
      donation.paymentReference || '-',
    ];

    x = PAGE.margin;
    row.forEach((cell, index) => {
      const col = cols[index];
      const clipped = fitTextToWidth(pdf, String(cell || '-'), col.width - 2);
      const textX = getColumnTextX(x, col.width, col.align);
      pdf.text(clipped, textX, y, col.align === 'right' ? { align: 'right' } : undefined);
      x += col.width + columnGap;
    });
    y += 5;
    pdf.setDrawColor(240, 240, 240);
    pdf.line(PAGE.margin, y - 1, pageWidth - PAGE.margin, y - 1);
  });

  // Certification
  y = ensurePage(pdf, y, 30);
  y += 10;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text('This is an official document generated from the PHJC School Management System. All donations listed are verified.', PAGE.margin, y);

  pdf.save(`donation-history-${new Date().toISOString().split('T')[0]}.pdf`);
};
