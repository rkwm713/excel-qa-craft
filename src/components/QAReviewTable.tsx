import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { QAReviewRow } from "./QAReviewRow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PDFViewer } from "./PDFViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QAReviewTableProps {
  data: QAReviewRowType[];
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  cuOptions: string[];
  selectedStation: string;
  stations?: string[];
  onStationChange?: (station: string) => void;
  pdfFile?: File | null;
  currentPdfPage?: number;
  onPdfPageChange?: (page: number) => void;
  stationPageMapping?: Record<string, number>;
  onAnnotationsChange?: (pageNumber: number, annotations: any[]) => void;
  initialAnnotations?: Map<number, any[]>;
  onWorkPointNotesChange?: (workPoint: string, notes: string) => void;
  initialWorkPointNotes?: Record<string, string>;
  currentWorkPoint?: QAReviewRowType | null;
  onJumpToWorkPoint?: (station: string) => void;
  onSetCurrentWorkPoint?: (row: QAReviewRowType) => void;
  onPreviousWorkPoint?: () => void;
  onNextWorkPoint?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export const QAReviewTable = ({ 
  data, 
  onUpdateRow, 
  cuOptions, 
  selectedStation,
  stations = [],
  onStationChange,
  pdfFile,
  currentPdfPage = 1,
  onPdfPageChange,
  stationPageMapping,
  onAnnotationsChange,
  initialAnnotations,
  onWorkPointNotesChange,
  initialWorkPointNotes,
  currentWorkPoint,
  onJumpToWorkPoint,
  onSetCurrentWorkPoint,
  onPreviousWorkPoint,
  onNextWorkPoint,
  canGoPrevious = false,
  canGoNext = false,
}: QAReviewTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [pdfViewMode, setPdfViewMode] = useState<"hidden" | "split" | "modal">("hidden");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Memoize the update handler to prevent recreating it on every render
  const handleUpdateRow = useCallback(
    (id: string, field: keyof QAReviewRowType, value: any) => {
      onUpdateRow(id, field, value);
    },
    [onUpdateRow]
  );

  // Handle row click to jump to PDF page and set as current work point
  const handleRowClick = useCallback((row: QAReviewRowType) => {
    // Set this specific row as the current work point
    if (onSetCurrentWorkPoint) {
      onSetCurrentWorkPoint(row);
    }
    
    // Jump to PDF page for this row's station
    if (onJumpToWorkPoint && row.station) {
      onJumpToWorkPoint(row.station);
    }
  }, [onJumpToWorkPoint, onSetCurrentWorkPoint]);

  // Memoize cu options to prevent unnecessary re-renders
  const memoizedCuOptions = useMemo(() => cuOptions, [cuOptions]);

  // Filter data by selected station
  const filteredData = useMemo(() => {
    return data.filter(row => row.station === selectedStation);
  }, [data, selectedStation]);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0;

  // Auto-scroll to active row when currentWorkPoint changes
  useEffect(() => {
    if (currentWorkPoint && parentRef.current) {
      const activeIndex = filteredData.findIndex(row => row.id === currentWorkPoint.id);
      if (activeIndex >= 0) {
        rowVirtualizer.scrollToIndex(activeIndex, {
          align: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [currentWorkPoint, filteredData, rowVirtualizer]);

  const showPdf = pdfFile && onPdfPageChange;

  // Handle PDF view mode changes
  const handleTogglePdfSplit = () => {
    setPdfViewMode(prev => prev === "split" ? "hidden" : "split");
  };

  const handleOpenPdfModal = () => {
    setPdfViewMode("modal");
    setIsPdfModalOpen(true);
  };

  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfViewMode("hidden");
  };

  // Handle station navigation
  const handlePreviousStation = () => {
    if (!onStationChange || stations.length === 0) return;
    const currentIndex = stations.indexOf(selectedStation);
    if (currentIndex > 0) {
      onStationChange(stations[currentIndex - 1]);
    }
  };

  const handleNextStation = () => {
    if (!onStationChange || stations.length === 0) return;
    const currentIndex = stations.indexOf(selectedStation);
    if (currentIndex < stations.length - 1) {
      onStationChange(stations[currentIndex + 1]);
    }
  };

  const canGoPreviousStation = stations.length > 0 && stations.indexOf(selectedStation) > 0;
  const canGoNextStation = stations.length > 0 && stations.indexOf(selectedStation) < stations.length - 1;

  // Render function for table content
  const renderTableContent = () => (
    <div className="space-y-2 pr-2 h-full">
      {/* View Mode Toggle */}
      <Card className="p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-saira">
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousStation}
                disabled={!canGoPreviousStation}
                className="h-6 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="font-saira">
                WP {selectedStation}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextStation}
                disabled={!canGoNextStation}
                className="h-6 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {showPdf && (
            <div className="flex gap-2">
              <Button
                variant={pdfViewMode === "split" ? "default" : "outline"}
                size="sm"
                onClick={handleTogglePdfSplit}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                {pdfViewMode === "split" ? "Hide PDF" : "Split View PDF"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPdfModal}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Open PDF Fullscreen
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Content */}
      <Card className="overflow-hidden">
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 300px)" }}
        >
          <table className="w-full border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[140px] font-saira uppercase tracking-wide">Designer CU</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[180px] font-saira uppercase tracking-wide">QA CU</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">D - WF</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[100px] font-saira uppercase tracking-wide">QA WF</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">D - QTY</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">QA Qty</th>
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualItems.map((virtualRow) => {
                const row = filteredData[virtualRow.index];
                const isActive = currentWorkPoint?.id === row.id;
                return (
                  <QAReviewRow
                    key={row.id}
                    row={row}
                    onUpdateRow={handleUpdateRow}
                    cuOptions={memoizedCuOptions}
                    isActive={isActive}
                    onRowClick={handleRowClick}
                  />
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // Always show table view, with optional PDF split panel
  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-350px)]">
        <ResizablePanel defaultSize={showPdf && pdfViewMode === "split" ? 50 : 100} minSize={30}>
          <div className="h-full flex flex-col">
            {renderTableContent()}
          </div>
        </ResizablePanel>
        
        {showPdf && pdfViewMode === "split" && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <div className="h-full pl-2">
                <PDFViewer
                  file={pdfFile}
                  currentPage={currentPdfPage}
                  onPageChange={onPdfPageChange}
                  stationPageMapping={stationPageMapping}
                  currentStation={selectedStation}
                  onAnnotationsChange={onAnnotationsChange}
                  initialAnnotations={initialAnnotations}
                  onWorkPointNotesChange={onWorkPointNotesChange}
                  initialWorkPointNotes={initialWorkPointNotes}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Fullscreen PDF Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-6">
          <DialogHeader>
            <DialogTitle>PDF Viewer - WP {selectedStation}</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto">
            <PDFViewer
              file={pdfFile}
              currentPage={currentPdfPage}
              onPageChange={onPdfPageChange}
              stationPageMapping={stationPageMapping}
              currentStation={selectedStation}
              onAnnotationsChange={onAnnotationsChange}
              initialAnnotations={initialAnnotations}
              onWorkPointNotesChange={onWorkPointNotesChange}
              initialWorkPointNotes={initialWorkPointNotes}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
