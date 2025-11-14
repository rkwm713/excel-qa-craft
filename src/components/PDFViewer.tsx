import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Plus, Trash2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFAnnotationToolbar } from "@/components/PDFAnnotationToolbar";
import { PDFCanvas } from "@/components/PDFCanvas";
import { PDFAnnotation, WorkPointNote } from "@/types/pdf";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { normalizeWorkPointNotes, relabelCalloutNotes } from "@/utils/workPointNotes";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

interface PDFViewerProps {
  file: File | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  stationPageMapping?: Record<string, number>;
  currentStation?: string | null;
  onAnnotationsChange?: (pageNumber: number, annotations: PDFAnnotation[]) => void;
  initialAnnotations?: Record<number, PDFAnnotation[]>;
  onWorkPointNotesChange?: (workPoint: string, notes: WorkPointNote[]) => void;
  initialWorkPointNotes?: Record<string, WorkPointNote[] | string>;
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
  const [activeTool, setActiveTool] = useState<'pan' | 'select' | 'freehand' | 'rectangle' | 'text' | 'callout'>('pan');
  const [annotationsByPage, setAnnotationsByPage] = useState<Map<number, PDFAnnotation[]>>(new Map());
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [workPointNotes, setWorkPointNotes] = useState<WorkPointNote[]>([]);
  const [copiedAnnotation, setCopiedAnnotation] = useState<PDFAnnotation | null>(null);

  const commitWorkPointNotes = useCallback(
    (notes: WorkPointNote[]) => {
      if (!currentStation) return;
      onWorkPointNotesChange?.(currentStation, notes);
    },
    [currentStation, onWorkPointNotesChange]
  );

  const persistAnnotationsMap = useCallback(
    (map: Map<number, PDFAnnotation[]>, changedPages: number[] = []) => {
      setAnnotationsByPage(map);
      changedPages.forEach(pageNumber => {
        const annotations = map.get(pageNumber) || [];
        onAnnotationsChange?.(pageNumber, annotations);
      });
    },
    [onAnnotationsChange]
  );

  const syncCalloutAnnotationsWithNotes = useCallback(
    (notes: WorkPointNote[], baseMap?: Map<number, PDFAnnotation[]>) => {
      const sourceMap = baseMap ?? annotationsByPage;
      const calloutMeta = new Map<string, { label?: number; noteId: string }>();
      notes.forEach(note => {
        if (note.calloutAnnotationId) {
          calloutMeta.set(note.calloutAnnotationId, {
            label: note.calloutNumber,
            noteId: note.id,
          });
        }
      });

      let mutated = false;
      const changedPages: number[] = [];
      const newMap = new Map<number, PDFAnnotation[]>();

      sourceMap.forEach((pageAnnotations, pageNumber) => {
        let pageChanged = false;
        const updatedAnnotations: PDFAnnotation[] = [];

        pageAnnotations.forEach(annotation => {
          if (annotation.type !== 'callout') {
            updatedAnnotations.push(annotation);
            return;
          }

          const meta = calloutMeta.get(annotation.id);
          if (!meta) {
            mutated = true;
            pageChanged = true;
            return; // Drop orphaned callout annotation
          }

          if (
            annotation.calloutLabel !== meta.label ||
            annotation.calloutCommentId !== meta.noteId
          ) {
            updatedAnnotations.push({
              ...annotation,
              calloutLabel: meta.label,
              calloutCommentId: meta.noteId,
            });
            mutated = true;
            pageChanged = true;
          } else {
            updatedAnnotations.push(annotation);
          }
        });

        if (pageChanged) {
          changedPages.push(pageNumber);
          newMap.set(pageNumber, updatedAnnotations);
        } else {
          newMap.set(pageNumber, pageAnnotations);
        }
      });

      return {
        map: mutated ? newMap : sourceMap,
        changedPages: mutated ? changedPages : [],
      };
    },
    [annotationsByPage]
  );

  // Initialize annotations from props
  useEffect(() => {
    if (initialAnnotations) {
      // Convert Record to Map
      const map = new Map<number, PDFAnnotation[]>();
      Object.entries(initialAnnotations).forEach(([page, annotations]) => {
        map.set(Number(page), annotations);
      });
      setAnnotationsByPage(map);
    }
  }, [initialAnnotations]);

  // Initialize work point notes
  useEffect(() => {
    if (!currentStation) {
      setWorkPointNotes([]);
      return;
    }
    const normalized = normalizeWorkPointNotes(initialWorkPointNotes?.[currentStation], currentStation);
    setWorkPointNotes(normalized);
    const { map, changedPages } = syncCalloutAnnotationsWithNotes(normalized);
    if (changedPages.length > 0) {
      persistAnnotationsMap(map, changedPages);
    }
  }, [currentStation, initialWorkPointNotes, syncCalloutAnnotationsWithNotes, persistAnnotationsMap]);

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
    let annotationWithPage: PDFAnnotation = {
      ...annotation,
      pageNumber: currentPage,
    };

    let notesToPersist = workPointNotes;

    if (annotation.type === 'callout') {
      const commentId = generateId('comment');
      const newNote: WorkPointNote = {
        id: commentId,
        text: '',
        calloutAnnotationId: annotationWithPage.id,
        createdAt: new Date().toISOString(),
      };

      const relabeledNotes = relabelCalloutNotes([...workPointNotes, newNote]);
      const noteMeta = relabeledNotes.find(note => note.id === commentId);
      annotationWithPage = {
        ...annotationWithPage,
        calloutCommentId: commentId,
        calloutLabel: noteMeta?.calloutNumber,
      };

      setWorkPointNotes(relabeledNotes);
      commitWorkPointNotes(relabeledNotes);
      notesToPersist = relabeledNotes;
    }

    const updatedAnnotations = [...currentAnnotations, annotationWithPage];
    const baseMap = new Map(annotationsByPage);
    baseMap.set(currentPage, updatedAnnotations);

    const { map, changedPages } = syncCalloutAnnotationsWithNotes(notesToPersist, baseMap);
    const pagesToNotify = new Set<number>([currentPage, ...changedPages]);
    persistAnnotationsMap(map, Array.from(pagesToNotify));
  };

  const handleAnnotationUpdate = (annotationId: string, updates: Partial<PDFAnnotation>) => {
    const currentAnnotations = annotationsByPage.get(currentPage) || [];
    const updatedAnnotations = currentAnnotations.map(ann => {
      if (ann.id !== annotationId) return ann;
      return {
        ...ann,
        ...updates,
        pageNumber: currentPage,
      };
    });
    const baseMap = new Map(annotationsByPage);
    baseMap.set(currentPage, updatedAnnotations);
    const { map, changedPages } = syncCalloutAnnotationsWithNotes(workPointNotes, baseMap);
    const pagesToNotify = new Set<number>([currentPage, ...changedPages]);
    persistAnnotationsMap(map, Array.from(pagesToNotify));
  };

  const handleUndo = () => {
    const currentAnnotations = annotationsByPage.get(currentPage) || [];
    if (currentAnnotations.length === 0) return;
    
    const removedAnnotation = currentAnnotations[currentAnnotations.length - 1];
    const updatedAnnotations = currentAnnotations.slice(0, -1);

    let nextNotes = workPointNotes;
    if (removedAnnotation.type === 'callout') {
      const filtered = workPointNotes.filter(note => note.calloutAnnotationId !== removedAnnotation.id);
      nextNotes = relabelCalloutNotes(filtered);
      setWorkPointNotes(nextNotes);
      commitWorkPointNotes(nextNotes);
    }

    const baseMap = new Map(annotationsByPage);
    baseMap.set(currentPage, updatedAnnotations);
    const { map, changedPages } = syncCalloutAnnotationsWithNotes(nextNotes, baseMap);
    const pagesToNotify = new Set<number>([currentPage, ...changedPages]);
    persistAnnotationsMap(map, Array.from(pagesToNotify));
  };

  const handleClearAnnotations = () => {
    const existingAnnotations = annotationsByPage.get(currentPage) || [];
    const removedCalloutIds = existingAnnotations
      .filter(annotation => annotation.type === 'callout')
      .map(annotation => annotation.id);

    let nextNotes = workPointNotes;
    if (removedCalloutIds.length > 0) {
      const filteredNotes = workPointNotes.filter(note => !note.calloutAnnotationId || !removedCalloutIds.includes(note.calloutAnnotationId));
      nextNotes = relabelCalloutNotes(filteredNotes);
      setWorkPointNotes(nextNotes);
      commitWorkPointNotes(nextNotes);
    }

    const baseMap = new Map(annotationsByPage);
    baseMap.set(currentPage, []);
    const { map, changedPages } = syncCalloutAnnotationsWithNotes(nextNotes, baseMap);
    const pagesToNotify = new Set<number>([currentPage, ...changedPages]);
    persistAnnotationsMap(map, Array.from(pagesToNotify));
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
      if (copiedAnnotation.type === 'callout') {
        newAnnotation.calloutCommentId = undefined;
        newAnnotation.calloutLabel = undefined;
      }
      handleAnnotationAdd(newAnnotation);
    }
  };

  const handleAddGeneralNote = () => {
    const newNote: WorkPointNote = {
      id: generateId('note'),
      text: '',
      createdAt: new Date().toISOString(),
    };
    const nextNotes = [...workPointNotes, newNote];
    setWorkPointNotes(nextNotes);
    commitWorkPointNotes(nextNotes);
    const { map, changedPages } = syncCalloutAnnotationsWithNotes(nextNotes);
    if (changedPages.length > 0) {
      persistAnnotationsMap(map, changedPages);
    }
  };

  const handleNoteTextChange = (noteId: string, text: string) => {
    const nextNotes = workPointNotes.map(note =>
      note.id === noteId
        ? {
            ...note,
            text,
            updatedAt: new Date().toISOString(),
          }
        : note
    );
    setWorkPointNotes(nextNotes);
    commitWorkPointNotes(nextNotes);
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = workPointNotes.find(note => note.id === noteId);
    if (!noteToDelete) return;

    let workingMap = annotationsByPage;
    const removalPages: number[] = [];

    if (noteToDelete.calloutAnnotationId) {
      workingMap = new Map(annotationsByPage);
      workingMap.forEach((pageAnnotations, pageNumber) => {
        const filtered = pageAnnotations.filter(annotation => annotation.id !== noteToDelete.calloutAnnotationId);
        if (filtered.length !== pageAnnotations.length) {
          workingMap.set(pageNumber, filtered);
          removalPages.push(pageNumber);
        }
      });
    }

    const filteredNotes = workPointNotes.filter(note => note.id !== noteId);
    const relabeledNotes = relabelCalloutNotes(filteredNotes);
    setWorkPointNotes(relabeledNotes);
    commitWorkPointNotes(relabeledNotes);

    const { map, changedPages } = syncCalloutAnnotationsWithNotes(relabeledNotes, workingMap instanceof Map ? workingMap : new Map(annotationsByPage));
    const pagesToNotify = new Set<number>([...removalPages, ...changedPages]);
    if (pagesToNotify.size > 0 || workingMap !== annotationsByPage) {
      persistAnnotationsMap(map, Array.from(pagesToNotify));
    }
  };

  const handleJumpToNotePage = (note: WorkPointNote) => {
    // Notes no longer have pageNumber, so this function is deprecated
    return;
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
              <Badge variant="secondary" className="text-xs">
                {workPointNotes.length} {workPointNotes.length === 1 ? 'comment' : 'comments'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workPointNotes.length === 0 ? (
              <div className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-6 text-center text-sm text-muted-foreground">
                No comments yet. Use the Callout tool on the PDF to drop a numbered note or add a general comment below.
              </div>
            ) : (
              <div className="space-y-3">
                {workPointNotes.map((note) => (
                  <div key={note.id} className="rounded-md border border-border bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={note.calloutNumber ? "default" : "outline"} className="text-xs">
                          {note.calloutNumber ? `Callout #${note.calloutNumber}` : 'Comment'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Delete comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={note.text}
                      onChange={(event) => handleNoteTextChange(note.id, event.target.value)}
                      placeholder={note.calloutNumber ? `Details for callout #${note.calloutNumber}` : "Add your comment..."}
                      className="mt-2 min-h-[80px]"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleAddGeneralNote}>
                <Plus className="h-4 w-4" />
                Add Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
