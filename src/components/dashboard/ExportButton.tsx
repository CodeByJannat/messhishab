import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportButtonProps {
  onExportPDF: () => Promise<void> | void;
  onExportExcel: () => Promise<void> | void;
  disabled?: boolean;
}

export function ExportButton({ onExportPDF, onExportExcel, disabled }: ExportButtonProps) {
  const { language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);

  const handleExport = async (type: 'pdf' | 'excel') => {
    setIsExporting(true);
    setExportType(type);
    try {
      if (type === 'pdf') {
        await onExportPDF();
      } else {
        await onExportExcel();
      }
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting} className="gap-2">
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {language === 'bn' ? 'ডাউনলোড' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
          <FileText className="w-4 h-4 mr-2" />
          {isExporting && exportType === 'pdf' ? (
            <span>{language === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...'}</span>
          ) : (
            <span>{language === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {isExporting && exportType === 'excel' ? (
            <span>{language === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...'}</span>
          ) : (
            <span>{language === 'bn' ? 'Excel ডাউনলোড' : 'Download Excel'}</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
