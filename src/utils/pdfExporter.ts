import { PDFDocument, PDFPage, rgb, PDFFont } from 'pdf-lib';
import { PDFAnnotation } from '@/types/pdf';

/**
 * Export PDF with annotations merged onto the pages
 */
export async function exportAnnotatedPDF(
  pdfFile: File,
  annotations: Map<number, PDFAnnotation[]>,
  stationPageMapping: Record<string, number>
): Promise<Blob> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  const pages = pdfDoc.getPages();
  
  // Process each page that has annotations
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const pageNumber = pageIndex + 1;
    const pageAnnotations = annotations.get(pageNumber) || [];
    
    if (pageAnnotations.length === 0) continue;
    
    const { width, height } = page.getSize();
    
    // Draw each annotation on the page
    for (const annotation of pageAnnotations) {
      const color = parseColor(annotation.color);
      
      switch (annotation.type) {
        case 'rectangle':
          if (annotation.x !== undefined && annotation.y !== undefined && 
              annotation.width !== undefined && annotation.height !== undefined) {
            // Convert normalized coordinates to PDF coordinates
            const x = (annotation.x * width);
            const y = height - (annotation.y * height) - (annotation.height * height);
            const w = annotation.width * width;
            const h = annotation.height * height;
            
            page.drawRectangle({
              x,
              y,
              width: w,
              height: h,
              borderColor: color,
              borderWidth: annotation.lineWidth || 2,
            });
          }
          break;
          
        case 'circle':
          if (annotation.x !== undefined && annotation.y !== undefined && 
              annotation.width !== undefined) {
            const centerX = annotation.x * width;
            const centerY = height - (annotation.y * height);
            const radius = (annotation.width / 2) * width;
            
            // Draw circle using arc
            page.drawCircle({
              x: centerX,
              y: centerY,
              size: radius * 2,
              borderColor: color,
              borderWidth: annotation.lineWidth || 2,
            });
          }
          break;
          
        case 'text':
          if (annotation.x !== undefined && annotation.y !== undefined && annotation.text) {
            try {
              // Try to embed a standard font
              const font = await pdfDoc.embedFont('Helvetica');
              const fontSize = (annotation.fontSize || 12) * (width / 800); // Scale font size
              
              page.drawText(annotation.text, {
                x: annotation.x * width,
                y: height - (annotation.y * height),
                size: fontSize,
                color: color,
              });
            } catch (error) {
              console.warn('Failed to draw text annotation:', error);
            }
          }
          break;
          
        case 'freehand':
          if (annotation.points && annotation.points.length > 1) {
            // Draw freehand as connected lines
            for (let i = 0; i < annotation.points.length - 1; i++) {
              const start = annotation.points[i];
              const end = annotation.points[i + 1];
              
              page.drawLine({
                start: { x: start.x * width, y: height - (start.y * height) },
                end: { x: end.x * width, y: height - (end.y * height) },
                color: color,
                thickness: annotation.lineWidth || 2,
              });
            }
          }
          break;
      }
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Parse color string to RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  
  // Handle named colors
  const colorMap: Record<string, { r: number; g: number; b: number }> = {
    red: rgb(1, 0, 0),
    green: rgb(0, 1, 0),
    blue: rgb(0, 0, 1),
    black: rgb(0, 0, 0),
    white: rgb(1, 1, 1),
    yellow: rgb(1, 1, 0),
    orange: rgb(1, 0.5, 0),
  };
  
  return colorMap[color.toLowerCase()] || rgb(1, 0, 0);
}

