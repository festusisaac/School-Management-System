import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

/**
 * Generate PDF from HTML element
 */
export const generatePDF = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<Blob> => {
  const {
    filename = 'document.pdf',
    orientation = 'portrait',
    format = 'a4',
  } = options;

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // mm
    const pageHeight = format === 'a4' ? 297 : 279; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Return as blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Download PDF file
 */
export const downloadPDF = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> => {
  const { filename = 'document.pdf' } = options;
  
  const blob = await generatePDF(element, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate receipt PDF
 */
export const generateReceiptPDF = async (
  receiptElement: HTMLElement,
  transactionId: string
): Promise<Blob> => {
  return generatePDF(receiptElement, {
    filename: `receipt-${transactionId}.pdf`,
    orientation: 'portrait',
    format: 'a4',
  });
};

/**
 * Download receipt as PDF
 */
export const downloadReceiptPDF = async (
  receiptElement: HTMLElement,
  transactionId: string
): Promise<void> => {
  await downloadPDF(receiptElement, {
    filename: `receipt-${transactionId}.pdf`,
    orientation: 'portrait',
    format: 'a4',
  });
};
