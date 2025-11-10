import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { QAReviewRow } from "./QAReviewRow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Maximize2, Plus, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PDFViewer } from "./PDFViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { findMatchingSpec } from "@/utils/stationNormalizer";
import { Edit2, Check, X } from "lucide-react";

interface QAReviewTableProps {
  data: QAReviewRowType[];
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  onAddRow?: (station: string) => void;
  cuOptions: string[];
  selectedStation: string;
  stations?: string[];
  onStationChange?: (station: string) => void;
  pdfFile?: File | null;
  currentPdfPage?: number;
  onPdfPageChange?: (page: number) => void;
  stationPageMapping?: Record<string, number>;
  stationSpecMapping?: Record<string, string>;
  editedSpecMapping?: Record<string, string>;
  onSpecNumberChange?: (station: string, specNumber: string) => void;
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
  onAddRow,
  cuOptions, 
  selectedStation,
  stations = [],
  onStationChange,
  pdfFile,
  currentPdfPage = 1,
  onPdfPageChange,
  stationPageMapping,
  stationSpecMapping,
  editedSpecMapping,
  onSpecNumberChange,
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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showOnlyNeedsCorrection, setShowOnlyNeedsCorrection] = useState(false);
  const [editingSpec, setEditingSpec] = useState<string | null>(null);
  const [editingSpecValue, setEditingSpecValue] = useState<string>("");

  // Reset editing state when station changes
  useEffect(() => {
    setEditingSpec(null);
    setEditingSpecValue("");
  }, [selectedStation]);

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

  // Handle column sorting
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn]);

  // Filter and sort data by selected station
  const filteredData = useMemo(() => {
    let filtered = data.filter(row => row.station === selectedStation);
    
    // Filter to show only rows that need correction
    if (showOnlyNeedsCorrection) {
      filtered = filtered.filter(row => !row.cuCheck || !row.wfCheck || !row.qtyCheck);
    }
    
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortColumn) {
          case "designerCU":
            aValue = a.designerCU || "";
            bValue = b.designerCU || "";
            break;
          case "qaCU":
            aValue = a.qaCU || "";
            bValue = b.qaCU || "";
            break;
          case "designerWF":
            aValue = a.designerWF || "";
            bValue = b.designerWF || "";
            break;
          case "qaWF":
            aValue = a.qaWF || "";
            bValue = b.qaWF || "";
            break;
          case "designerQty":
            aValue = typeof a.designerQty === "number" ? a.designerQty : parseFloat(a.designerQty?.toString() || "0") || 0;
            bValue = typeof b.designerQty === "number" ? b.designerQty : parseFloat(b.designerQty?.toString() || "0") || 0;
            break;
          case "qaQty":
            aValue = typeof a.qaQty === "number" ? a.qaQty : parseFloat(a.qaQty?.toString() || "0") || 0;
            bValue = typeof b.qaQty === "number" ? b.qaQty : parseFloat(b.qaQty?.toString() || "0") || 0;
            break;
          default:
            return 0;
        }
        
        // Compare values
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          if (sortDirection === "asc") {
            return aStr.localeCompare(bStr);
          } else {
            return bStr.localeCompare(aStr);
          }
        }
      });
    }
    
    return filtered;
  }, [data, selectedStation, sortColumn, sortDirection, showOnlyNeedsCorrection]);

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
              {onStationChange && stations.length > 0 && (
                <Select value={selectedStation} onValueChange={onStationChange}>
                  <SelectTrigger className="w-[140px] h-7 border-primary/30 bg-primary/10 hover:bg-primary/20 font-saira font-semibold text-primary">
                    <SelectValue placeholder="Select WP">
                      WP {selectedStation}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station} value={station}>
                        WP {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-saira">
                {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
              </Badge>
              {selectedStation && (() => {
                // Get spec number - prioritize edited over original
                // If editedSpec is empty string, it means user cleared it, so use original
                const editedSpec = editedSpecMapping?.[selectedStation];
                const originalSpec = stationSpecMapping ? findMatchingSpec(selectedStation, stationSpecMapping) : null;
                const specNumber = (editedSpec !== undefined && editedSpec !== "") ? editedSpec : originalSpec;
                const isEdited = editedSpec !== undefined && editedSpec !== "" && editedSpec !== originalSpec;
                
                if (editingSpec === selectedStation) {
                  // Edit mode
                  return (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingSpecValue}
                        onChange={(e) => setEditingSpecValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (onSpecNumberChange && selectedStation) {
                              const trimmedValue = editingSpecValue.trim();
                              // If empty, we'll clear the edited spec by storing empty string
                              onSpecNumberChange(selectedStation, trimmedValue);
                            }
                            setEditingSpec(null);
                            setEditingSpecValue("");
                          } else if (e.key === 'Escape') {
                            setEditingSpec(null);
                            setEditingSpecValue("");
                          }
                        }}
                        placeholder="Enter spec number"
                        className="h-7 w-32 text-sm font-saira text-center"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          if (onSpecNumberChange && selectedStation) {
                            const trimmedValue = editingSpecValue.trim();
                            onSpecNumberChange(selectedStation, trimmedValue);
                          }
                          setEditingSpec(null);
                          setEditingSpecValue("");
                        }}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingSpec(null);
                          setEditingSpecValue("");
                        }}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  );
                }
                
                // Display mode
                return specNumber ? (
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={isEdited ? "default" : "secondary"} 
                      className={`font-saira cursor-pointer hover:opacity-80 transition-opacity ${
                        isEdited ? 'bg-orange-500 hover:bg-orange-600' : ''
                      }`}
                      onClick={() => {
                        setEditingSpec(selectedStation);
                        setEditingSpecValue(specNumber);
                      }}
                    >
                      Spec: {specNumber}
                      {isEdited && <span className="ml-1 text-xs">(edited)</span>}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setEditingSpec(selectedStation);
                        setEditingSpecValue(specNumber);
                      }}
                      title="Edit spec number"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 font-saira text-xs"
                    onClick={() => {
                      setEditingSpec(selectedStation);
                      setEditingSpecValue("");
                    }}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Add Spec
                  </Button>
                );
              })()}
            </div>
            <Button
              variant={showOnlyNeedsCorrection ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyNeedsCorrection(!showOnlyNeedsCorrection)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showOnlyNeedsCorrection ? "Show All" : "Needs Correction"}
            </Button>
            {onAddRow && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddRow(selectedStation)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </Button>
            )}
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
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold border-b bg-primary/10 border-r border-primary/20 min-w-[140px] font-saira uppercase tracking-wide cursor-pointer hover:bg-primary/20 transition-colors select-none"
                  onClick={() => handleSort("designerCU")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Designer CU
                    {sortColumn === "designerCU" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold border-b bg-muted/50 min-w-[180px] font-saira uppercase tracking-wide cursor-pointer hover:bg-muted/70 transition-colors select-none"
                  onClick={() => handleSort("qaCU")}
                >
                  <div className="flex items-center justify-center gap-2">
                    QA CU
                    {sortColumn === "qaCU" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold border-b bg-primary/10 border-r border-primary/20 min-w-[120px] font-saira uppercase tracking-wide cursor-pointer hover:bg-primary/20 transition-colors select-none"
                  onClick={() => handleSort("designerWF")}
                >
                  <div className="flex items-center justify-center gap-2">
                    D - WF
                    {sortColumn === "designerWF" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold border-b bg-muted/50 min-w-[100px] font-saira uppercase tracking-wide cursor-pointer hover:bg-muted/70 transition-colors select-none"
                  onClick={() => handleSort("qaWF")}
                >
                  <div className="flex items-center justify-center gap-2">
                    QA WF
                    {sortColumn === "qaWF" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold border-b bg-primary/10 border-r border-primary/20 min-w-[120px] font-saira uppercase tracking-wide cursor-pointer hover:bg-primary/20 transition-colors select-none"
                  onClick={() => handleSort("designerQty")}
                >
                  <div className="flex items-center justify-center gap-2">
                    D - QTY
                    {sortColumn === "designerQty" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide cursor-pointer hover:bg-muted/70 transition-colors select-none"
                  onClick={() => handleSort("qaQty")}
                >
                  <div className="flex items-center justify-center gap-2">
                    QA Qty
                    {sortColumn === "qaQty" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </th>
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
