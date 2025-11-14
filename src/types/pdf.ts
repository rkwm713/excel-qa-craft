export interface PDFPageInfo {
  pageNumber: number;
  workPoint: string | null;
  thumbnail?: string;
}

export interface PDFAnnotation {
  id: string;
  type: 'freehand' | 'rectangle' | 'text' | 'circle' | 'callout';
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  calloutLabel?: string | number;
  calloutCommentId?: string;
  pageNumber?: number;
}

export interface WorkPointNote {
  id: string;
  text: string;
  createdAt: string;
  calloutAnnotationId?: string;
  calloutNumber?: number;
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
