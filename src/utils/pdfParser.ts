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
      
      // Look for patterns like "WP: 1440859" or "WP 1440859"
      const wpMatch = text.match(/WP[:\s]+(\d+)/i);
      const workPoint = wpMatch ? wpMatch[1] : null;
      
      pages.push({
        pageNumber: pageNum,
        workPoint,
      });

      // Map work point to page number (station = work point)
      if (workPoint) {
        // Store the original extracted work point
        stationPageMapping[workPoint] = pageNum;
        
        // ALSO store with leading zeros (pad to 4 digits) for Excel compatibility
        const paddedWorkPoint = workPoint.padStart(4, '0');
        stationPageMapping[paddedWorkPoint] = pageNum;
        
        console.log(`Found WP ${workPoint} on page ${pageNum} (also mapped as ${paddedWorkPoint})`);
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
