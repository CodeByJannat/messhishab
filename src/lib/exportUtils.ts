import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type ExportFilterType = 'daily' | 'monthly' | 'yearly' | 'all';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  messName?: string; // Mess name to display at top of PDF
  columns: ExportColumn[];
  data: Record<string, any>[];
  fileName: string;
  filterType?: ExportFilterType;
  filterDate?: string; // YYYY-MM-DD for daily, YYYY-MM for monthly, YYYY for yearly
}

// Get date range based on filter type
export function getDateRange(filterType: ExportFilterType, filterDate?: string): { start: Date; end: Date } | null {
  if (!filterDate) return null;
  
  const now = new Date();
  
  switch (filterType) {
    case 'daily':
      const day = parseISO(filterDate);
      return { start: startOfDay(day), end: endOfDay(day) };
    case 'monthly':
      const month = parseISO(`${filterDate}-01`);
      return { start: startOfMonth(month), end: endOfMonth(month) };
    case 'yearly':
      const year = parseISO(`${filterDate}-01-01`);
      return { start: startOfYear(year), end: endOfYear(year) };
    case 'all':
    default:
      return null;
  }
}

// Filter data by date range
export function filterDataByDate<T extends { date: string }>(
  data: T[],
  filterType: ExportFilterType,
  filterDate?: string
): T[] {
  const range = getDateRange(filterType, filterDate);
  if (!range) return data;
  
  return data.filter(item => {
    const itemDate = parseISO(item.date);
    return itemDate >= range.start && itemDate <= range.end;
  });
}

// Export to PDF - Note: jsPDF doesn't support Bengali fonts, so we use English text only
export function exportToPDF(options: ExportOptions): void {
  const { title, subtitle, messName, columns, data, fileName } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yOffset = 15;
  
  // Mess Name (if provided) - displayed prominently at top
  if (messName) {
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Primary blue color
    doc.text(messName, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
  }
  
  // Title - Use English titles for PDF (no Bengali font support)
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, pageWidth / 2, yOffset, { align: 'center' });
  yOffset += 8;
  
  // Subtitle (Month)
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Month: ${subtitle}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 8;
  }
  
  // Generated date - Always English for PDF
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const generatedText = `Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`;
  doc.text(generatedText, pageWidth / 2, yOffset, { align: 'center' });
  yOffset += 5;
  
  // Table
  const tableColumns = columns.map(col => col.header);
  const tableData = data.map(row => columns.map(col => {
    const value = row[col.key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  }));
  
  autoTable(doc, {
    head: [tableColumns],
    body: tableData,
    startY: yOffset + 5,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Primary blue
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    margin: { left: 14, right: 14 },
  });
  
  // Footer with page numbers - Always English for PDF
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }
  
  doc.save(`${fileName}.pdf`);
}

// Export to Excel - supports Bengali text
export function exportToExcel(options: ExportOptions): void {
  const { title, columns, data, fileName, subtitle, messName } = options;
  
  // Create worksheet data
  const worksheetData: any[][] = [];
  
  // Add mess name if provided
  if (messName) {
    worksheetData.push([messName]);
  }
  
  // Add title row
  worksheetData.push([title]);
  if (subtitle) {
    worksheetData.push([`Month: ${subtitle}`]);
  }
  worksheetData.push([]); // Empty row
  
  // Add headers
  worksheetData.push(columns.map(col => col.header));
  
  // Add data rows
  data.forEach(row => {
    worksheetData.push(columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      return value;
    }));
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Save file
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Helper to format currency
export function formatCurrency(amount: number, symbol: string = '৳'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

// Helper to create export summary row
export function createSummaryRow(label: string, values: Record<string, any>): Record<string, any> {
  return { ...values, _isSummary: true, name: label };
}
