import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFPageInfo, PDFDocumentInfo } from "@/types/pdf";

// Configure PDF.js worker - must be done before any PDF operations
if (!GlobalWorkerOptions.workerSrc) {
  const pdfjsVersion = '10.2.0'; // Match the version in package.json (react-pdf 10.2.0 uses pdfjs 4.x)
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

export async function parsePDFForWorkPoints(file: File): Promise<PDFDocumentInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  
  const pages: PDFPageInfo[] = [];
  const stationPageMapping: Record<string, number> = {};

  // Parse each page to extract WP (Work Point) numbers
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Extract text items and look for WP patterns
    const text = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    
    // Look for patterns like "WP: 1440859" or "WP 1440859"
    const wpMatch = text.match(/WP[:\s]+(\d+)/i);
    const workPoint = wpMatch ? wpMatch[1] : null;
    
    pages.push({
      pageNumber: pageNum,
      workPoint,
    });

    // Map work point to page number (station = work point)
    if (workPoint) {
      stationPageMapping[workPoint] = pageNum;
    }
  }

  return {
    file,
    fileName: file.name,
    numPages,
    pages,
    stationPageMapping,
  };
}
