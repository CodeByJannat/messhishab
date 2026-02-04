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
  columns: ExportColumn[];
  data: Record<string, any>[];
  fileName: string;
  filterType?: ExportFilterType;
  filterDate?: string; // YYYY-MM-DD for daily, YYYY-MM for monthly, YYYY for yearly
  language?: 'en' | 'bn';
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

// Export to PDF
export function exportToPDF(options: ExportOptions): void {
  const { title, subtitle, columns, data, fileName, language = 'en' } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, 28, { align: 'center' });
  }
  
  // Generated date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const generatedText = language === 'bn' 
    ? `তৈরির তারিখ: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`
    : `Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`;
  doc.text(generatedText, pageWidth / 2, 35, { align: 'center' });
  
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
    startY: 42,
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
  
  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    const pageText = language === 'bn' 
      ? `পৃষ্ঠা ${i} / ${pageCount}`
      : `Page ${i} of ${pageCount}`;
    doc.text(pageText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }
  
  doc.save(`${fileName}.pdf`);
}

// Export to Excel
export function exportToExcel(options: ExportOptions): void {
  const { title, columns, data, fileName, subtitle } = options;
  
  // Create worksheet data
  const worksheetData: any[][] = [];
  
  // Add title row
  worksheetData.push([title]);
  if (subtitle) {
    worksheetData.push([subtitle]);
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
