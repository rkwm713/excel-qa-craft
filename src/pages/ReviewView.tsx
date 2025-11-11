import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QAReviewTable } from "@/components/QAReviewTable";
import { Dashboard } from "@/components/Dashboard";
import { MapViewer } from "@/components/MapViewer";
import { PDFUpload } from "@/components/PDFUpload";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useReview, useUpdateReview } from "@/hooks/useReviews";
import { ArrowLeft, FileSpreadsheet, Map as MapIcon, TrendingUp, FileText } from "lucide-react";
import { QAReviewRow, DashboardMetrics } from "@/types/qa-tool";
import { parsePDFForWorkPoints } from "@/utils/pdfParser";
import { normalizeStation, findMatchingStation } from "@/utils/stationNormalizer";
import type { Tables } from "@/integrations/supabase/types";

// Helper function to convert database ReviewRow to QAReviewRow
function convertReviewRowToQA(row: Tables<'review_rows'>): QAReviewRow {
  return {
    id: row.id,
    issueType: (row.issue_type === 'OK' ? 'OK' : 'NEEDS REVISIONS') as QAReviewRow['issueType'],
    station: row.station,
    workSet: row.work_set || '',
    designerCU: row.designer_cu || '',
    qaCU: row.qa_cu || '',
    description: row.description || '',
    designerWF: row.designer_wf || '',
    qaWF: row.qa_wf || '',
    designerQty: row.designer_qty || 0,
    qaQty: row.qa_qty || 0,
    qaComments: row.qa_comments || '',
    mapNotes: row.map_notes || undefined,
    cuCheck: (row.cu_check ?? 0) === 1,
    wfCheck: (row.wf_check ?? 0) === 1,
    qtyCheck: (row.qty_check ?? 0) === 1,
  };
}

export default function ReviewView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reviewData, isLoading, error } = useReview(id);
  const updateReview = useUpdateReview();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);
  const [pdfAnnotations, setPdfAnnotations] = useState<Map<number, any[]>>(new Map());
  const [pdfWorkPointNotes, setPdfWorkPointNotes] = useState<Record<string, string>>({});
  const [currentWorkPoint, setCurrentWorkPoint] = useState<QAReviewRow | null>(null);
  const { toast } = useToast();

  // Convert review rows to QAReviewRow format
  const qaData = useMemo(() => {
    if (!reviewData) return [];
    return reviewData.reviewRows.map(convertReviewRowToQA);
  }, [reviewData]);
  
  if (error) {
    toast({
      title: "Error loading review",
      description: error instanceof Error ? error.message : "Failed to load review",
      variant: "destructive",
    });
    navigate("/reviews");
    return null;
  }
  
  // Load PDF file when review data is available - using useEffect for side effects
  useEffect(() => {
    if (!reviewData) return;
    
    // Load PDF file if available
    if (reviewData.pdfFile && reviewData.pdfFile.data) {
      try {
        // Convert base64 to blob
        const byteCharacters = atob(reviewData.pdfFile.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: reviewData.pdfFile.mimeType || 'application/pdf' });
        const file = new File([blob], reviewData.pdfFile.fileName, { type: reviewData.pdfFile.mimeType || 'application/pdf' });
        setPdfFile(file);
      } catch (error) {
        // Error loading PDF file - will show in UI if needed
      }
    } else if (reviewData.review?.pdf_file_name) {
      // Try to load from storage bucket
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const path = reviewData.review.pdf_file_name;
      if (supabaseUrl && path) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/pdf-files/${path}`;
        fetch(publicUrl)
          .then((res) => {
            if (res.ok) {
              return res.blob();
            }
            return null;
          })
          .then((blob) => {
            if (blob) {
              const file = new File([blob], path.split('/').pop() || 'document.pdf', { type: blob.type || 'application/pdf' });
              setPdfFile(file);
            }
          })
          .catch((e) => {
            // Error fetching PDF from storage - will show in UI if needed
          });
      }
    }
    
    // Load PDF annotations
    if (reviewData.pdfAnnotations) {
      const annotationsMap = new Map<number, any[]>();
      Object.entries(reviewData.pdfAnnotations).forEach(([page, annotations]) => {
        annotationsMap.set(parseInt(page), annotations);
      });
      setPdfAnnotations(annotationsMap);
    }
    
    // Load work point notes
    if (reviewData.workPointNotes) {
      setPdfWorkPointNotes(reviewData.workPointNotes);
    }
    
    // Auto-select first station
    if (qaData.length > 0) {
      const firstStation = qaData[0].station;
      setSelectedStation(firstStation);
      setCurrentWorkPoint(qaData[0]);
    }
  }, [reviewData, qaData]);

  const handlePDFFileSelect = async (file: File) => {
    try {
      toast({
        title: "Processing PDF...",
        description: "Extracting work points from PDF file",
      });

      const pdfInfo = await parsePDFForWorkPoints(file);
      setPdfFile(file);
      
      // Update mappings if they exist
      if (reviewData) {
        // Merge with existing mappings
        setReviewData({
          ...reviewData,
          stationPageMapping: { ...reviewData.stationPageMapping, ...pdfInfo.stationPageMapping },
          stationSpecMapping: { ...reviewData.stationSpecMapping, ...pdfInfo.stationSpecMapping },
        });
      }

      setCurrentPdfPage(1);

      const mappedCount = Object.keys(pdfInfo.stationPageMapping).length;
      const specCount = Object.keys(pdfInfo.stationSpecMapping).length;
      toast({
        title: "PDF loaded successfully",
        description: `Found ${pdfInfo.numPages} pages. Mapped ${mappedCount} work points${specCount > 0 ? ` and ${specCount} spec numbers` : ''}.`,
      });
    } catch (error) {
      // Error already handled by toast notification
      toast({
        title: "Error loading PDF",
        description: "Failed to parse the PDF file",
        variant: "destructive",
      });
    }
  };

  const handlePdfPageChange = useCallback((page: number) => {
    setCurrentPdfPage(page);
    
    // Find matching station for this page
    if (reviewData?.stationPageMapping && qaData.length > 0) {
      const station = Object.keys(reviewData.stationPageMapping).find(
        key => reviewData.stationPageMapping[key] === page
      );
      if (station) {
        const matchingRow = qaData.find(row => {
          const normalized = normalizeStation(row.station);
          const normalizedKey = normalizeStation(station);
          return normalized === normalizedKey || row.station === station;
        });
        if (matchingRow) {
          setCurrentWorkPoint(matchingRow);
          setSelectedStation(matchingRow.station);
        }
      }
    }
  }, [reviewData?.stationPageMapping, qaData]);

  const handlePDFAnnotationsChange = (pageNumber: number, annotations: any[]) => {
    setPdfAnnotations(prev => new Map(prev).set(pageNumber, annotations));
  };

  const handlePDFWorkPointNotesChange = (workPoint: string, notes: string) => {
    setPdfWorkPointNotes(prev => ({ ...prev, [workPoint]: notes }));
  };

  const handleJumpToWorkPoint = useCallback((station: string) => {
    if (!pdfFile || !reviewData?.stationPageMapping) return;
    
    const page = findMatchingStation(station, reviewData.stationPageMapping);
    if (page) {
      setCurrentPdfPage(page);
    }
  }, [pdfFile, reviewData?.stationPageMapping]);

  const handleSetCurrentWorkPoint = useCallback((row: QAReviewRow) => {
    setCurrentWorkPoint(row);
    setSelectedStation(row.station);
  }, []);

  const handlePreviousWorkPoint = useCallback(() => {
    if (!currentWorkPoint) return;
    const currentIndex = qaData.findIndex(r => r.id === currentWorkPoint.id);
    if (currentIndex > 0) {
      const prevRow = qaData[currentIndex - 1];
      setCurrentWorkPoint(prevRow);
      setSelectedStation(prevRow.station);
      handleJumpToWorkPoint(prevRow.station);
    }
  }, [currentWorkPoint, qaData, handleJumpToWorkPoint]);

  const handleNextWorkPoint = useCallback(() => {
    if (!currentWorkPoint) return;
    const currentIndex = qaData.findIndex(r => r.id === currentWorkPoint.id);
    if (currentIndex < qaData.length - 1) {
      const nextRow = qaData[currentIndex + 1];
      setCurrentWorkPoint(nextRow);
      setSelectedStation(nextRow.station);
      handleJumpToWorkPoint(nextRow.station);
    }
  }, [currentWorkPoint, qaData, handleJumpToWorkPoint]);

  const handleSpecNumberChange = (station: string, specNumber: string) => {
    if (!reviewData || !id) return;
    const newEditedSpecMapping = {
      ...reviewData.editedSpecMapping,
      [station]: specNumber.trim() || undefined,
    };
    // Update local state immediately
    // Optionally save to server
    updateReview.mutate({
      id,
      data: {
        editedSpecMapping: newEditedSpecMapping,
      },
    });
  };

  const handleUpdateRow = (rowId: string, field: keyof QAReviewRow, value: any) => {
    if (!id) return;
    const updatedRows = qaData.map((row) => (row.id === rowId ? { ...row, [field]: value } : row));
    // Convert back to database format and update
    const dbRows = updatedRows.map((row) => ({
      id: row.id,
      review_id: id,
      station: row.station,
      issue_type: row.issueType,
      designer_cu: row.designerCU || null,
      qa_cu: row.qaCU || null,
      designer_wf: row.designerWF || null,
      qa_wf: row.qaWF || null,
      designer_qty: row.designerQty || null,
      qa_qty: row.qaQty || null,
      description: row.description || null,
      qa_comments: row.qaComments || null,
      cu_check: row.cuCheck ? 1 : 0,
      wf_check: row.wfCheck ? 1 : 0,
      qty_check: row.qtyCheck ? 1 : 0,
      work_set: row.workSet || null,
      map_notes: row.mapNotes || null,
      row_order: null,
    }));
    updateReview.mutate({
      id,
      data: {
        reviewRows: dbRows as any,
      },
    });
  };

  const metrics: DashboardMetrics = {
    totalRows: qaData.length,
    okCount: qaData.filter((r) => r.issueType === "OK").length,
    needsRevisionCount: qaData.filter((r) => r.issueType === "NEEDS REVISIONS").length,
    cuMatchRate: qaData.length > 0 ? (qaData.filter((r) => r.cuCheck).length / qaData.length) * 100 : 0,
    wfMatchRate: qaData.length > 0 ? (qaData.filter((r) => r.wfCheck).length / qaData.length) * 100 : 0,
    qtyMatchRate: qaData.length > 0 ? (qaData.filter((r) => r.qtyCheck).length / qaData.length) * 100 : 0,
  };

  const stations = useMemo(() => Array.from(new Set(qaData.map((r) => r.station))).sort(), [qaData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!reviewData || !id) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="flex-1 w-full">
        <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
          <div className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/reviews")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Reviews
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-primary uppercase tracking-wide font-saira">
                    {reviewData.review.title}
                  </h1>
                  <p className="text-sm text-muted-foreground font-neuton">
                    {reviewData.review.description || "QA Review Session"}
                  </p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="dashboard" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  QA Data
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <MapIcon className="w-4 h-4" />
                  Map View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <main className="w-full px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-6">
              {qaData.length > 0 && <Dashboard metrics={metrics} />}
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              {qaData.length > 0 ? (
                <QAReviewTable
                  data={qaData}
                  onUpdateRow={handleUpdateRow}
                  cuOptions={reviewData.cuLookup.map((cu) => cu.code)}
                  selectedStation={selectedStation}
                  stations={stations}
                  onStationChange={setSelectedStation}
                  pdfFile={pdfFile}
                  currentPdfPage={currentPdfPage}
                  onPdfPageChange={handlePdfPageChange}
                  stationPageMapping={reviewData.stationPageMapping}
                  stationSpecMapping={reviewData.stationSpecMapping}
                  editedSpecMapping={reviewData.editedSpecMapping}
                  onSpecNumberChange={handleSpecNumberChange}
                  onAnnotationsChange={handlePDFAnnotationsChange}
                  initialAnnotations={pdfAnnotations}
                  onWorkPointNotesChange={handlePDFWorkPointNotesChange}
                  initialWorkPointNotes={pdfWorkPointNotes}
                  currentWorkPoint={currentWorkPoint}
                  onJumpToWorkPoint={handleJumpToWorkPoint}
                  onSetCurrentWorkPoint={handleSetCurrentWorkPoint}
                  onPreviousWorkPoint={handlePreviousWorkPoint}
                  onNextWorkPoint={handleNextWorkPoint}
                  canGoPrevious={currentWorkPoint ? qaData.findIndex(r => r.id === currentWorkPoint.id) > 0 : false}
                  canGoNext={currentWorkPoint ? qaData.findIndex(r => r.id === currentWorkPoint.id) < qaData.length - 1 : false}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No review data available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <MapViewer
                placemarks={reviewData.kmzPlacemarks || []}
                onPlacemarkClick={() => {}}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

