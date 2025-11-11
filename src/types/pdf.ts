export interface PDFPageInfo {
  pageNumber: number;
  workPoint: string | null;
  thumbnail?: string;
}

export type PDFAnnotationType = 'freehand' | 'rectangle' | 'text' | 'circle' | 'callout';

export interface PDFAnnotation {
  id: string;
  type: PDFAnnotationType;
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  calloutLabel?: number;
  calloutCommentId?: string;
  pageNumber?: number;
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

export interface WorkPointNote {
  id: string;
  text: string;
  calloutAnnotationId?: string;
  calloutNumber?: number;
  pageNumber?: number;
  createdAt: string;
  updatedAt?: string;
}
