import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import { PDFPageInfo, PDFDocumentInfo } from "@/types/pdf";

// Configure PDF.js worker - must be done before any PDF operations
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export async function parsePDFForWorkPoints(file: File): Promise<PDFDocumentInfo> {
  console.log("Starting PDF parse for file:", file.name);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log("PDF arrayBuffer loaded, size:", arrayBuffer.byteLength);
    
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    console.log("PDF document loaded, pages:", pdf.numPages);
    
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
      
      // Look for patterns like "WP: 1440859", "WP 1440859", "WP 2 / 108-705", "WP26", etc.
      // Priority: Try formats with separators first (more specific), then general formats
      let wpMatch = null;
      
      // First, try "WP 2 / 108-705" format - extract just the first number before the slash
      // This is the most common format based on the user's example
      wpMatch = text.match(/WP[:\s]+(\d+)\s*\/\s*\d+/i);
      
      if (!wpMatch) {
        // Try "WP: 1440859" or "WP 1440859" (standard format)
        wpMatch = text.match(/WP[:\s]+(\d+)/i);
      }
      
      if (!wpMatch) {
        // Try "WP26" (no space, no colon)
        wpMatch = text.match(/WP(\d+)/i);
      }
      
      if (!wpMatch) {
        // Try "Work Point 26" or "WorkPoint 26"
        wpMatch = text.match(/Work\s*Point[:\s]+(\d+)/i);
      }
      
      const workPoint = wpMatch ? wpMatch[1] : null;
      
      pages.push({
        pageNumber: pageNum,
        workPoint,
      });

      // Map work point to page number (station = work point)
      if (workPoint) {
        // Store the original extracted work point
        stationPageMapping[workPoint] = pageNum;
        
        // Store normalized version (without leading zeros)
        const normalized = String(parseInt(workPoint, 10));
        if (normalized !== workPoint) {
          stationPageMapping[normalized] = pageNum;
        }
        
        // Store with leading zeros (pad to 4 digits) for Excel compatibility
        const padded4 = workPoint.padStart(4, '0');
        if (padded4 !== workPoint) {
          stationPageMapping[padded4] = pageNum;
        }
        
        // Also store normalized with padding
        const normalizedPadded4 = normalized.padStart(4, '0');
        if (normalizedPadded4 !== workPoint && normalizedPadded4 !== padded4) {
          stationPageMapping[normalizedPadded4] = pageNum;
        }
        
        console.log(`Found WP ${workPoint} on page ${pageNum} (mapped as: ${workPoint}, ${normalized}, ${padded4}, ${normalizedPadded4})`);
      }
    }

    console.log("PDF parsing complete. Total work points found:", Object.keys(stationPageMapping).length);

    return {
      file,
      fileName: file.name,
      numPages,
      pages,
      stationPageMapping,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
