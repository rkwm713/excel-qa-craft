import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PDFAnnotationToolbar } from "@/components/PDFAnnotationToolbar";
import { PDFCanvas } from "@/components/PDFCanvas";
import { PDFAnnotation } from "@/types/pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  stationPageMapping?: Record<string, number>;
  currentStation?: string | null;
  onAnnotationsChange?: (pageNumber: number, annotations: PDFAnnotation[]) => void;
  initialAnnotations?: Map<number, PDFAnnotation[]>;
  onWorkPointNotesChange?: (workPoint: string, notes: string) => void;
  initialWorkPointNotes?: Record<string, string>;
}

export function PDFViewer({
  file,
  currentPage,
  onPageChange,
  stationPageMapping,
  currentStation,
  onAnnotationsChange,
  initialAnnotations,
  onWorkPointNotesChange,
  initialWorkPointNotes,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [activeTool, setActiveTool] = useState<'pan' | 'select' | 'freehand' | 'rectangle' | 'circle' | 'text'>('pan');
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(4);
  const [annotationsByPage, setAnnotationsByPage] = useState<Map<number, PDFAnnotation[]>>(new Map());
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [workPointNotes, setWorkPointNotes] = useState<string>('');

  // Initialize annotations from props
  useEffect(() => {
    if (initialAnnotations) {
      setAnnotationsByPage(initialAnnotations);
    }
  }, [initialAnnotations]);

  // Initialize work point notes
  useEffect(() => {
    if (currentStation && initialWorkPointNotes?.[currentStation]) {
      setWorkPointNotes(initialWorkPointNotes[currentStation]);
    } else {
      setWorkPointNotes('');
    }
  }, [currentStation, initialWorkPointNotes]);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById("pdf-container");
      if (container) {
        // Account for padding (p-2 = 8px on each side = 16px) and some margin
        const availableWidth = container.clientWidth - 32;
        // Ensure PDF fits within container - divide by scale to account for zoom
        const maxWidth = availableWidth / scale;
        // Cap at reasonable maximum to prevent overflow
        const constrainedWidth = Math.min(maxWidth, 700);
        setPageWidth(Math.max(300, constrainedWidth)); // Minimum 300px width
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [scale]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handlePrevPage = () => onPageChange(Math.max(currentPage - 1, 1));
  const handleNextPage = () => onPageChange(Math.min(currentPage + 1, numPages));

  const handleAnnotationAdd = (annotation: PDFAnnotation) => {
    const currentAnnotations = annotationsByPage.get(currentPage) || [];
    const updatedAnnotations = [...currentAnnotations, annotation];
    const newMap = new Map(annotationsByPage);
    newMap.set(currentPage, updatedAnnotations);
    setAnnotationsByPage(newMap);
    onAnnotationsChange?.(currentPage, updatedAnnotations);
  };

  const handleAnnotationUpdate = (annotationId: string, updates: Partial<PDFAnnotation>) => {
    const currentAnnotations = annotationsByPage.get(currentPage) || [];
    const updatedAnnotations = currentAnnotations.map(ann =>
      ann.id === annotationId ? { ...ann, ...updates } : ann
    );
    const newMap = new Map(annotationsByPage);
    newMap.set(currentPage, updatedAnnotations);
    setAnnotationsByPage(newMap);
    onAnnotationsChange?.(currentPage, updatedAnnotations);
  };

  const handleUndo = () => {
    const currentAnnotations = annotationsByPage.get(currentPage) || [];
    if (currentAnnotations.length === 0) return;
    
    const updatedAnnotations = currentAnnotations.slice(0, -1);
    const newMap = new Map(annotationsByPage);
    newMap.set(currentPage, updatedAnnotations);
    setAnnotationsByPage(newMap);
    onAnnotationsChange?.(currentPage, updatedAnnotations);
  };

  const handleClearAnnotations = () => {
    const newMap = new Map(annotationsByPage);
    newMap.set(currentPage, []);
    setAnnotationsByPage(newMap);
    onAnnotationsChange?.(currentPage, []);
  };

  const handleSaveNotes = () => {
    if (currentStation) {
      onWorkPointNotesChange?.(currentStation, workPointNotes);
    }
  };

  const currentPageAnnotations = annotationsByPage.get(currentPage) || [];

  if (!file) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Maximize2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No PDF loaded</p>
          <p className="text-sm mt-2">Upload a Work Order Map PDF to view diagrams</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Annotation Toolbar */}
      <div className="mb-1">
        <PDFAnnotationToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          color={drawColor}
          onColorChange={setDrawColor}
          lineWidth={lineWidth}
          onLineWidthChange={setLineWidth}
          onUndo={handleUndo}
          onClear={handleClearAnnotations}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          canUndo={currentPageAnnotations.length > 0}
        />
      </div>

      {/* Page Navigation and Zoom Controls */}
      <Card className="mb-1 p-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => onPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    Page {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
      <Card className="flex-1 overflow-auto" id="pdf-container">
        <div className="flex justify-center p-2">
          <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, maxWidth: '100%', overflow: 'hidden' }}>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-[600px]">
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                width={Math.min(pageWidth, 700)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            <PDFCanvas
              width={Math.min(pageWidth * scale, 1000)}
              height={Math.min(pageWidth * 1.414 * scale, 1414)}
              annotations={currentPageAnnotations}
              activeTool={activeTool}
              color={drawColor}
              lineWidth={lineWidth}
              showAnnotations={showAnnotations}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              scale={scale}
              baseWidth={Math.min(pageWidth, 700)}
              baseHeight={Math.min(pageWidth * 1.414, 990)}
            />
          </div>
        </div>
      </Card>
      {/* Work Point Notes Section */}
      {currentStation && (
        <Card className="mt-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>📝 QA Notes for WP {currentStation}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {workPointNotes.length}/500 characters
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={workPointNotes}
              onChange={(e) => setWorkPointNotes(e.target.value)}
              placeholder="Add notes for this work point..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
