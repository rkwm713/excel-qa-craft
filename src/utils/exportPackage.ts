import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { exportAnnotatedPDF } from './pdfExporter';
import { QAReviewRow, CULookupItem } from '@/types/qa-tool';
import { PDFAnnotation } from '@/types/pdf';

/**
 * Export a package containing:
 * 1. Annotated PDF with all QA annotations
 * 2. Excel file with revisions needed for the designer
 */
export async function exportDesignerPackage(
  qaData: QAReviewRow[],
  cuLookup: CULookupItem[],
  pdfFile: File | null,
  pdfAnnotations: Map<number, PDFAnnotation[]>,
  stationPageMapping: Record<string, number>,
  pdfWorkPointNotes: Record<string, string>
): Promise<void> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  
  // 1. Export Excel with revisions needed
  const revisionsData = qaData
    .filter(row => row.issueType === 'NEEDS REVISIONS')
    .map((row) => ({
      'WP': row.station,
      'Work Set': row.workSet,
      'Designer CU': row.designerCU,
      'QA CU (Revision Needed)': row.qaCU,
      'Designer WF': row.designerWF,
      'QA WF (Revision Needed)': row.qaWF,
      'Designer Qty': row.designerQty,
      'QA Qty (Revision Needed)': row.qaQty,
      'Description': row.description,
      'QA Comments': row.qaComments || '',
      'CU Needs Change': row.cuCheck ? 'No' : 'Yes',
      'WF Needs Change': row.wfCheck ? 'No' : 'Yes',
      'Qty Needs Change': row.qtyCheck ? 'No' : 'Yes',
    }));
  
  const workbook = XLSX.utils.book_new();
  
  // Revisions Sheet - only rows that need changes
  const revisionsSheet = XLSX.utils.json_to_sheet(revisionsData);
  XLSX.utils.book_append_sheet(workbook, revisionsSheet, 'Revisions Needed');
  
  // Summary Sheet
  const summaryData = [
    { 'Metric': 'Total Records', 'Value': qaData.length },
    { 'Metric': 'Records Needing Revision', 'Value': revisionsData.length },
    { 'Metric': 'Records OK', 'Value': qaData.length - revisionsData.length },
    { 'Metric': 'CU Changes Needed', 'Value': qaData.filter(r => !r.cuCheck).length },
    { 'Metric': 'WF Changes Needed', 'Value': qaData.filter(r => !r.wfCheck).length },
    { 'Metric': 'Qty Changes Needed', 'Value': qaData.filter(r => !r.qtyCheck).length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Work Point Notes Sheet
  const notesData = Object.entries(pdfWorkPointNotes)
    .filter(([_, notes]) => notes.trim().length > 0)
    .map(([wp, notes]) => ({
      'WP': wp,
      'QA Notes': notes,
    }));
  
  if (notesData.length > 0) {
    const notesSheet = XLSX.utils.json_to_sheet(notesData);
    XLSX.utils.book_append_sheet(workbook, notesSheet, 'WP Notes');
  }
  
  // Convert workbook to buffer
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  zip.file(`QA_Revisions_${timestamp}.xlsx`, excelBuffer);
  
  // 2. Export annotated PDF if available
  if (pdfFile && pdfAnnotations.size > 0) {
    try {
      const annotatedPdfBlob = await exportAnnotatedPDF(
        pdfFile,
        pdfAnnotations,
        stationPageMapping
      );
      const pdfArrayBuffer = await annotatedPdfBlob.arrayBuffer();
      zip.file(`Annotated_PDF_${timestamp}.pdf`, pdfArrayBuffer);
    } catch (error) {
      console.error('Error exporting annotated PDF:', error);
      // Still include original PDF if annotation export fails
      const pdfArrayBuffer = await pdfFile.arrayBuffer();
      zip.file(`Original_PDF_${timestamp}.pdf`, pdfArrayBuffer);
    }
  } else if (pdfFile) {
    // Include original PDF even if no annotations
    const pdfArrayBuffer = await pdfFile.arrayBuffer();
    zip.file(`PDF_${timestamp}.pdf`, pdfArrayBuffer);
  }
  
  // Generate and download zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `QA_Designer_Package_${timestamp}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

