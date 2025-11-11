export interface PDFPageInfo {
  pageNumber: number;
  workPoint: string | null;
  thumbnail?: string;
}

export interface PDFAnnotation {
  id: string;
  type: 'freehand' | 'rectangle' | 'text' | 'circle';
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
}

export interface PDFPageAnnotations {
  pageNumber: number;
  annotations: PDFAnnotation[];
}

export interface PDFDocumentInfo {
  file: File;
  fileName: string;
  numPages: number;
  pages: PDFPageInfo[];
  stationPageMapping: Record<string, number>;
  stationSpecMapping: Record<string, string>;
}
