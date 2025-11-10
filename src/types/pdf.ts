export interface PDFPageInfo {
  pageNumber: number;
  workPoint: string | null;
  thumbnail?: string;
}

export interface PDFDocumentInfo {
  file: File;
  fileName: string;
  numPages: number;
  pages: PDFPageInfo[];
  stationPageMapping: Record<string, number>;
}
