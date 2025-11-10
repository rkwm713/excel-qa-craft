import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFAnnotationToolbar } from "@/components/PDFAnnotationToolbar";
import { PDFCanvas } from "@/components/PDFCanvas";
import { PDFAnnotation } from "@/types/pdf";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
  const [actualPageWidth, setActualPageWidth] = useState<number>(700); // Fixed reference width for annotations
  const [actualPageHeight, setActualPageHeight] = useState<number>(990); // Fixed reference height for annotations
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<'pan' | 'select' | 'freehand' | 'rectangle' | 'text'>('pan');
  const [annotationsByPage, setAnnotationsByPage] = useState<Map<number, PDFAnnotation[]>>(new Map());
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [workPointNotes, setWorkPointNotes] = useState<string>('');
  const [copiedAnnotation, setCopiedAnnotation] = useState<PDFAnnotation | null>(null);

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
        // Base width for PDF rendering (not constrained by scale for zooming)
        // Allow the PDF to be larger than container when zoomed in
        const baseWidth = Math.min(availableWidth, 700);
        setPageWidth(Math.max(300, baseWidth)); // Minimum 300px width
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []); // Remove scale dependency so width doesn't shrink when zooming

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page: any) => {
    // Get actual PDF page dimensions for consistent annotation coordinates
    const viewport = page.getViewport({ scale: 1.0 });
    // Use the actual PDF page dimensions as the base reference
    // This ensures annotations stay in the same position across different view modes
    const pdfWidth = viewport.width;
    const pdfHeight = viewport.height;
    setActualPageWidth(pdfWidth);
    setActualPageHeight(pdfHeight);
    
    // Update pageWidth to match PDF aspect ratio if needed
    // This ensures the canvas and PDF are perfectly aligned
    const aspectRatio = pdfHeight / pdfWidth;
    const calculatedHeight = pageWidth * aspectRatio;
    // Only update if there's a significant difference
    if (Math.abs(calculatedHeight - pageWidth * 1.414) > 10) {
      // The PDF has a different aspect ratio than assumed
      // We'll handle this in the canvas coordinate system
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 10)); // Increased max zoom to 10x
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.1)); // Decreased min zoom to 0.1x

  const handleZoom = (delta: number, centerX: number, centerY: number) => {
    const container = document.getElementById('pdf-container');
    if (!container) return;

    // Get current scroll position
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    // centerX and centerY are already relative to the container
    // Calculate the point in the content that's under the mouse (including scroll)
    const contentX = scrollLeft + centerX;
    const contentY = scrollTop + centerY;
    
    // Calculate new scale (limit between 0.1 and 10 for more zoom range)
    const newScale = Math.max(0.1, Math.min(10, scale + delta));
    const scaleChange = newScale / scale;
    
    // Update scale
    setScale(newScale);
    
    // Adjust scroll position to keep the point under the mouse cursor in the same visual position
    // After zoom, the same content point should still be under the mouse
    setTimeout(() => {
      const newScrollLeft = contentX * scaleChange - centerX;
      const newScrollTop = contentY * scaleChange - centerY;
      container.scrollLeft = newScrollLeft;
      container.scrollTop = newScrollTop;
    }, 0);
  };
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

  const handleCopy = () => {
    // Copy the most recently added annotation (last in array)
    // In a full implementation, this would copy the selected annotation
    const currentAnnotations = annotationsByPage.get(currentPage) || [];
    if (currentAnnotations.length > 0) {
      const annotationToCopy = currentAnnotations[currentAnnotations.length - 1];
      setCopiedAnnotation(annotationToCopy);
    }
  };

  const handlePaste = () => {
    if (copiedAnnotation) {
      // Create a new annotation with a new ID and slightly offset position
      const newAnnotation: PDFAnnotation = {
        ...copiedAnnotation,
        id: `${copiedAnnotation.type}-${Date.now()}`,
        x: copiedAnnotation.x !== undefined ? (copiedAnnotation.x + 0.02) : undefined, // Offset by 2% of page width
        y: copiedAnnotation.y !== undefined ? (copiedAnnotation.y + 0.02) : undefined, // Offset by 2% of page height
      };
      handleAnnotationAdd(newAnnotation);
    }
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
          onUndo={handleUndo}
          onClear={handleClearAnnotations}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          canUndo={currentPageAnnotations.length > 0}
          onCopy={handleCopy}
          onPaste={handlePaste}
          canCopy={currentPageAnnotations.length > 0}
          canPaste={copiedAnnotation !== null}
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
      <Card className="flex-1 overflow-auto" id="pdf-container" style={{ overscrollBehavior: 'contain', maxHeight: 'calc(100vh - 400px)', minHeight: '500px' }}>
        <div className="flex justify-center p-2" style={{ minWidth: '100%', minHeight: '100%' }}>
          <div ref={pageRef} style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
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
                scale={1}
                width={Math.min(pageWidth * scale, pageWidth * 3)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>
            <PDFCanvas
              width={Math.min(pageWidth * scale, pageWidth * 3)}
              height={actualPageHeight > 0 && actualPageWidth > 0 
                ? Math.min(pageWidth * scale, pageWidth * 3) * (actualPageHeight / actualPageWidth)
                : Math.min(pageWidth * 1.414 * scale, pageWidth * 1.414 * 3)}
              annotations={currentPageAnnotations}
              activeTool={activeTool}
              showAnnotations={showAnnotations}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              scale={1}
              baseWidth={actualPageWidth}
              baseHeight={actualPageHeight}
              displayWidth={Math.min(pageWidth * scale, pageWidth * 3)}
              displayHeight={actualPageHeight > 0 && actualPageWidth > 0
                ? Math.min(pageWidth * scale, pageWidth * 3) * (actualPageHeight / actualPageWidth)
                : Math.min(pageWidth * 1.414 * scale, pageWidth * 1.414 * 3)}
              onZoom={handleZoom}
              pdfPageRef={pageRef}
            />
          </div>
        </div>
      </Card>
      {/* Work Point Notes Section */}
      {currentStation && (
        <Card className="mt-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>QA Notes for WP {currentStation}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rich-text-editor">
              <ReactQuill
                theme="snow"
                value={workPointNotes}
                onChange={setWorkPointNotes}
                placeholder="Add notes for this work point..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link'],
                    ['clean']
                  ],
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet',
                  'color', 'background',
                  'link'
                ]}
                style={{ minHeight: '150px' }}
              />
            </div>
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
