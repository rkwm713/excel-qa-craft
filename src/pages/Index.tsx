import { useState, useCallback, useMemo, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { KMZUpload } from "@/components/KMZUpload";
import { PDFUpload } from "@/components/PDFUpload";
import { Dashboard } from "@/components/Dashboard";
import { QAReviewTable } from "@/components/QAReviewTable";
import { QAReviewSkeleton } from "@/components/QAReviewSkeleton";
import { MapViewer } from "@/components/MapViewer";
import { GoogleApiKeyInput } from "@/components/GoogleApiKeyInput";
import { StreetViewModal } from "@/components/StreetViewModal";
import { StationSidebar } from "@/components/StationSidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Download, FileSpreadsheet, Map as MapIcon, TrendingUp, FileText } from "lucide-react";
import { parseDesignerUpload, convertToQAReviewRows, exportToExcel } from "@/utils/excelParser";
import { parseKMZ } from "@/utils/kmzParser";
import { parsePDFForWorkPoints } from "@/utils/pdfParser";
import { normalizeStation, findMatchingStation } from "@/utils/stationNormalizer";
import { QAReviewRow, DashboardMetrics, CULookupItem } from "@/types/qa-tool";
import { useToast } from "@/hooks/use-toast";
import techservLogo from "@/assets/techserv-logo.png";

const Index = () => {
  const [qaData, setQaData] = useState<QAReviewRow[]>([]);
  const [cuLookup, setCuLookup] = useState<CULookupItem[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [kmzPlacemarks, setKmzPlacemarks] = useState<any[]>([]);
  const [kmzFileName, setKmzFileName] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [googleApiKey, setGoogleApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);
  const [stationPageMapping, setStationPageMapping] = useState<Record<string, number>>({});
  const [placemarkNotes, setPlacemarkNotes] = useState<Record<string, string>>({});
  const [mapDrawings, setMapDrawings] = useState<any[]>([]);
  const [pdfAnnotations, setPdfAnnotations] = useState<Map<number, any[]>>(new Map());
  const [pdfWorkPointNotes, setPdfWorkPointNotes] = useState<Record<string, string>>({});
  const [currentWorkPoint, setCurrentWorkPoint] = useState<QAReviewRow | null>(null);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("googleMapsApiKey");
    if (savedKey) {
      setGoogleApiKey(savedKey);
    }
  }, []);

  const [hasUploadedFiles, setHasUploadedFiles] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      toast({
        title: "Processing file...",
        description: "Parsing your Designer Upload file",
      });

      const designerData = await parseDesignerUpload(file);
      
      // Extract unique CU codes for lookup
      const uniqueCUs = Array.from(
        new Set(designerData.map((row) => row["CU Name"]).filter(Boolean))
      ).map((code) => ({
        code,
        description: designerData.find((row) => row["CU Name"] === code)?.Description || "",
      }));

      setCuLookup(uniqueCUs);
      const qaRows = convertToQAReviewRows(designerData, uniqueCUs);
      setQaData(qaRows);
      setFileName(file.name);

      toast({
        title: "File loaded successfully",
        description: `Processed ${qaRows.length} records`,
      });
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error loading file",
        description: "Failed to parse the Excel file. Please check the format.",
        variant: "destructive",
      });
      console.error("Error parsing file:", error);
    }
  };

  const handleKMZFileSelect = async (file: File) => {
    try {
      toast({
        title: "Processing KMZ...",
        description: "Extracting work points from KMZ file",
      });

      const kmzData = await parseKMZ(file);
      setKmzPlacemarks(kmzData.placemarks);
      setKmzFileName(file.name);

      toast({
        title: "KMZ loaded successfully",
        description: `Found ${kmzData.placemarks.length} work points`,
      });

      // Show API key input if not already set
      if (!googleApiKey && !localStorage.getItem("googleMapsApiKey")) {
        setShowApiKeyInput(true);
      }
    } catch (error) {
      toast({
        title: "Error loading KMZ",
        description: "Failed to parse the KMZ file. Please check the format.",
        variant: "destructive",
      });
      console.error("Error parsing KMZ:", error);
    }
  };

  const handlePDFFileSelect = async (file: File) => {
    try {
      toast({
        title: "Processing PDF...",
        description: "Extracting work points from PDF file",
      });

      const pdfInfo = await parsePDFForWorkPoints(file);
      setPdfFile(file);
      setPdfFileName(file.name);
      setStationPageMapping(pdfInfo.stationPageMapping);
      setCurrentPdfPage(1);

      const mappedCount = Object.keys(pdfInfo.stationPageMapping).length;
      toast({
        title: "PDF loaded successfully",
        description: `Found ${pdfInfo.numPages} pages. Mapped ${mappedCount} work points.`,
      });
    } catch (error) {
      console.error("Error parsing PDF:", error);
      
      // Still attach the file so the viewer works, even if parsing failed
      setPdfFile(file);
      setPdfFileName(file.name);
      setStationPageMapping({});
      setCurrentPdfPage(1);
      
      toast({
        title: "PDF loaded (mapping unavailable)",
        description: "We couldn't extract work points from the PDF, but you can still view the document.",
      });
    }
  };

  const handleStationClick = (station: string) => {
    // Switch to data tab and scroll to station
    setActiveTab("data");
    // Could add logic to filter/highlight the station in the table
  };

  const handleStreetViewClick = (location: { lat: number; lng: number; name: string }) => {
    setStreetViewLocation(location);
    setIsStreetViewOpen(true);
  };

  const handleApiKeySubmit = (apiKey: string) => {
    setGoogleApiKey(apiKey);
    setShowApiKeyInput(false);
    toast({
      title: "Street View enabled",
      description: "You can now view locations in Google Street View",
    });
  };

  const handleSkipApiKey = () => {
    setShowApiKeyInput(false);
  };

  const handlePlacemarkNotesChange = (placemarkId: string, notes: string) => {
    setPlacemarkNotes(prev => ({
      ...prev,
      [placemarkId]: notes
    }));
  };

  const handleMapDrawingsChange = (drawings: any[]) => {
    setMapDrawings(drawings);
  };

  const handlePDFAnnotationsChange = (pageNumber: number, annotations: any[]) => {
    setPdfAnnotations(prev => new Map(prev).set(pageNumber, annotations));
  };

  const handlePDFWorkPointNotesChange = (workPoint: string, notes: string) => {
    setPdfWorkPointNotes(prev => ({ ...prev, [workPoint]: notes }));
  };

  // Auto-sync: Update current work point when PDF page changes
  const handlePdfPageChange = useCallback((page: number) => {
    setCurrentPdfPage(page);
    
    // Find station for this page using flexible matching
    const stationEntry = Object.entries(stationPageMapping).find(
      ([_, pageNum]) => pageNum === page
    );
    
    if (stationEntry) {
      const [workPointFromPdf] = stationEntry;
      
      // Find matching QA data row using normalization
      const normalizedWP = normalizeStation(workPointFromPdf);
      const workPoint = qaData.find(row => 
        normalizeStation(row.station) === normalizedWP
      );
      
      if (workPoint) {
        setCurrentWorkPoint(workPoint);
        setSelectedStation(workPoint.station); // Use original station format
      }
    }
  }, [stationPageMapping, qaData]);

  // Jump to work point from context panel
  const handleJumpToWorkPoint = useCallback((station: string) => {
    // Use flexible matching to find page
    const page = findMatchingStation(station, stationPageMapping);
    if (page) {
      setCurrentPdfPage(page);
    }
    
    const workPoint = qaData.find(row => row.station === station);
    if (workPoint) {
      setCurrentWorkPoint(workPoint);
      setSelectedStation(station);
    }
  }, [stationPageMapping, qaData]);

  // Navigate to previous work point
  const handlePreviousWorkPoint = useCallback(() => {
    if (!currentWorkPoint) return;
    
    const currentIndex = qaData.findIndex(row => row.id === currentWorkPoint.id);
    if (currentIndex > 0) {
      const prevWorkPoint = qaData[currentIndex - 1];
      setCurrentWorkPoint(prevWorkPoint);
      setSelectedStation(prevWorkPoint.station);
      
      // Jump PDF using flexible matching
      const page = findMatchingStation(prevWorkPoint.station, stationPageMapping);
      if (page) {
        setCurrentPdfPage(page);
      }
    }
  }, [currentWorkPoint, qaData, stationPageMapping]);

  // Navigate to next work point
  const handleNextWorkPoint = useCallback(() => {
    if (!currentWorkPoint) return;
    
    const currentIndex = qaData.findIndex(row => row.id === currentWorkPoint.id);
    if (currentIndex < qaData.length - 1) {
      const nextWorkPoint = qaData[currentIndex + 1];
      setCurrentWorkPoint(nextWorkPoint);
      setSelectedStation(nextWorkPoint.station);
      
      // Jump PDF using flexible matching
      const page = findMatchingStation(nextWorkPoint.station, stationPageMapping);
      if (page) {
        setCurrentPdfPage(page);
      }
    }
  }, [currentWorkPoint, qaData, stationPageMapping]);

  // Initialize current work point when PDF loads
  useEffect(() => {
    if (pdfFile && qaData.length > 0 && !currentWorkPoint) {
      // Set first work point as current
      const firstWorkPoint = qaData[0];
      setCurrentWorkPoint(firstWorkPoint);
      
      // Jump to first work point's page using flexible matching
      const page = findMatchingStation(firstWorkPoint.station, stationPageMapping);
      if (page) {
        setCurrentPdfPage(page);
      }
    }
  }, [pdfFile, qaData, stationPageMapping, currentWorkPoint]);

  const handleUpdateRow = useCallback((id: string, field: keyof QAReviewRow, value: any) => {
    setQaData((prev) => {
      const index = prev.findIndex((row) => row.id === id);
      if (index === -1) return prev;

      const row = prev[index];
      const updatedRow = { ...row, [field]: value };

      // Recalculate checks if editing QA fields
      if (field === "qaCU") {
        updatedRow.cuCheck = value === row.designerCU;
      }
      if (field === "qaWF") {
        updatedRow.wfCheck = value === row.designerWF;
      }
      if (field === "qaQty") {
        updatedRow.qtyCheck = value === row.designerQty;
      }

      // Auto-update issue type based on checks unless manually overridden
      if (field !== "issueType") {
        updatedRow.issueType =
          updatedRow.cuCheck && updatedRow.wfCheck && updatedRow.qtyCheck
            ? "OK"
            : "NEEDS REVISIONS";
      }

      // Create new array with updated row
      const newData = [...prev];
      newData[index] = updatedRow;
      return newData;
    });
  }, []);

  const handleExport = () => {
    if (qaData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    try {
      exportToExcel(qaData, cuLookup);
      toast({
        title: "Export successful",
        description: "QA Tool workbook has been generated",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate Excel file",
        variant: "destructive",
      });
      console.error("Export error:", error);
    }
  };

  // Get unique stations and their counts
  const { stations, stationCounts } = useMemo(() => {
    const stationsSet = new Set<string>();
    const counts: Record<string, number> = {};
    
    qaData.forEach(row => {
      if (row.station) {
        stationsSet.add(row.station);
        counts[row.station] = (counts[row.station] || 0) + 1;
      }
    });
    
    return {
      stations: Array.from(stationsSet).sort(),
      stationCounts: counts,
    };
  }, [qaData]);

  const metrics = useMemo((): DashboardMetrics => {
    const totalRows = qaData.length;
    const okCount = qaData.filter((r) => r.issueType === "OK").length;
    const needsRevisionCount = qaData.filter((r) => r.issueType === "NEEDS REVISIONS").length;
    const cuMatches = qaData.filter((r) => r.cuCheck).length;
    const wfMatches = qaData.filter((r) => r.wfCheck).length;
    const qtyMatches = qaData.filter((r) => r.qtyCheck).length;

    return {
      totalRows,
      okCount,
      needsRevisionCount,
      cuMatchRate: totalRows > 0 ? (cuMatches / totalRows) * 100 : 0,
      wfMatchRate: totalRows > 0 ? (wfMatches / totalRows) * 100 : 0,
      qtyMatchRate: totalRows > 0 ? (qtyMatches / totalRows) * 100 : 0,
    };
  }, [qaData]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - only show when data is loaded and has multiple stations */}
        {qaData.length > 0 && stations.length > 1 && (
          <StationSidebar
            stations={stations}
            currentStation={selectedStation}
            onStationChange={setSelectedStation}
            stationCounts={stationCounts}
          />
        )}

        {/* Main Content */}
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
            <div className="flex items-center gap-4 px-6 py-4">
              {qaData.length > 0 && stations.length > 1 && (
                <SidebarTrigger className="-ml-1" />
              )}
              <div className="flex items-center justify-between flex-1">
                <div className="flex items-center gap-6">
                  <img 
                    src={techservLogo} 
                    alt="TechServ" 
                    className="h-12 w-auto"
                  />
                  <div className="border-l border-border pl-6">
                    <h1 className="text-2xl font-bold text-primary uppercase tracking-wide font-saira">QA Tool</h1>
                    <p className="text-sm text-muted-foreground font-neuton">Designer Upload Review System</p>
                  </div>
                </div>
                {qaData.length > 0 && (
                  <Button onClick={handleExport} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                    <Download className="w-4 h-4" />
                    Export QA Tool
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="container mx-auto px-6 py-8">
        {!hasUploadedFiles ? (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2 font-saira uppercase tracking-wide text-primary">Welcome to TechServ QA Tool</h2>
              <p className="text-muted-foreground font-neuton text-lg">
                Upload your Designer Upload Excel file, KMZ work points, and PDF diagrams to begin the QA review process
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-neuton italic">
                Scalability and Reliability When and Where You Need It
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <FileUpload 
                onFileSelect={handleFileSelect} 
                fileName={fileName}
                onClear={() => {
                  setQaData([]);
                  setFileName("");
                  setCuLookup([]);
                }}
              />
              <KMZUpload 
                onFileSelect={handleKMZFileSelect} 
                fileName={kmzFileName}
                onClear={() => {
                  setKmzPlacemarks([]);
                  setKmzFileName("");
                }}
              />
              <PDFUpload 
                onFileSelect={handlePDFFileSelect} 
                fileName={pdfFileName}
                onClear={() => {
                  setPdfFile(null);
                  setPdfFileName("");
                  setStationPageMapping({});
                }}
              />
            </div>
            {(fileName || kmzFileName || pdfFileName) && (
              <div className="text-center">
                <Button
                  onClick={() => {
                    setHasUploadedFiles(true);
                    setActiveTab("dashboard");
                  }}
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8"
                >
                  Start QA Review
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
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
              <div className="flex gap-2">
                {!fileName && (
                  <Button variant="outline" onClick={() => document.getElementById("excel-upload-later")?.click()} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Add Excel
                  </Button>
                )}
                {!kmzPlacemarks.length && (
                  <Button variant="outline" onClick={() => document.getElementById("kmz-upload")?.click()} className="gap-2">
                    <MapIcon className="w-4 h-4" />
                    Add KMZ
                  </Button>
                )}
                {!pdfFileName && (
                  <Button variant="outline" onClick={() => document.getElementById("pdf-upload-later")?.click()} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Add PDF
                  </Button>
                )}
                <Button variant="outline" onClick={() => { 
                  setQaData([]); 
                  setKmzPlacemarks([]);
                  setPdfFile(null);
                  setFileName("");
                  setKmzFileName("");
                  setPdfFileName("");
                  setHasUploadedFiles(false);
                }}>
                  Upload New Files
                </Button>
              </div>
              <input
                id="excel-upload-later"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="sr-only"
              />
              <input
                id="kmz-upload"
                type="file"
                accept=".kmz"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleKMZFileSelect(file);
                }}
                className="sr-only"
              />
              <input
                id="pdf-upload-later"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePDFFileSelect(file);
                }}
                className="sr-only"
              />
            </div>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold font-saira uppercase tracking-wide text-primary">
                    QA Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground font-neuton">
                    Overview of QA metrics and performance statistics
                  </p>
                </div>
              </div>

              {qaData.length > 0 && <Dashboard metrics={metrics} />}

              {/* Future grading features will go here */}
              {!isLoading && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold font-saira mb-2">Future Grading Features</h3>
                  <p className="text-muted-foreground font-neuton">
                    Advanced grading and analytics will be added here
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold font-saira uppercase tracking-wide text-primary">
                    QA Review: {fileName}
                  </h2>
                  <p className="text-sm text-muted-foreground font-neuton">
                    Review and validate designer data entries
                    {kmzPlacemarks.length > 0 && ` • ${kmzPlacemarks.length} work points mapped`}
                  </p>
                </div>
                <Button onClick={handleExport} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  <Download className="w-4 h-4" />
                  Export QA Tool
                </Button>
              </div>

              {isLoading ? (
                <QAReviewSkeleton count={5} />
              ) : (
                qaData.length > 0 && (
                  <QAReviewTable
                    data={qaData}
                    onUpdateRow={handleUpdateRow}
                    cuOptions={cuLookup.map((cu) => cu.code)}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedStation={selectedStation}
                    pdfFile={pdfFile}
                    currentPdfPage={currentPdfPage}
                    onPdfPageChange={handlePdfPageChange}
                    stationPageMapping={stationPageMapping}
                    onAnnotationsChange={handlePDFAnnotationsChange}
                    initialAnnotations={pdfAnnotations}
                    onWorkPointNotesChange={handlePDFWorkPointNotesChange}
                    initialWorkPointNotes={pdfWorkPointNotes}
                    currentWorkPoint={currentWorkPoint}
                    onJumpToWorkPoint={handleJumpToWorkPoint}
                    onPreviousWorkPoint={handlePreviousWorkPoint}
                    onNextWorkPoint={handleNextWorkPoint}
                    canGoPrevious={currentWorkPoint ? qaData.findIndex(r => r.id === currentWorkPoint.id) > 0 : false}
                    canGoNext={currentWorkPoint ? qaData.findIndex(r => r.id === currentWorkPoint.id) < qaData.length - 1 : false}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold font-saira uppercase tracking-wide text-primary">
                    Work Points Map: {kmzFileName || "No KMZ loaded"}
                  </h2>
                  <p className="text-sm text-muted-foreground font-neuton">
                    View work points on map with Street View integration
                  </p>
                </div>
              </div>

              {showApiKeyInput && (
                <GoogleApiKeyInput
                  onSubmit={handleApiKeySubmit}
                  onSkip={handleSkipApiKey}
                />
              )}

              {kmzPlacemarks.length > 0 ? (
                <MapViewer
                  placemarks={kmzPlacemarks}
                  onStationClick={handleStationClick}
                  onStreetViewClick={handleStreetViewClick}
                  hasGoogleApiKey={!!googleApiKey}
                  onNotesChange={handlePlacemarkNotesChange}
                  initialNotes={placemarkNotes}
                  onDrawingsChange={handleMapDrawingsChange}
                  initialDrawings={mapDrawings}
                />
              ) : (
                <div className="text-center py-12">
                  <MapIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold font-saira mb-2">No KMZ File Loaded</h3>
                  <p className="text-muted-foreground font-neuton mb-4">
                    Upload a KMZ file to view work points on the map
                  </p>
                  <Button onClick={() => document.getElementById("kmz-upload")?.click()} className="gap-2">
                    <MapIcon className="w-4 h-4" />
                    Upload KMZ
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
          </main>
        </SidebarInset>
      </div>

      <StreetViewModal
        isOpen={isStreetViewOpen}
        onClose={() => setIsStreetViewOpen(false)}
        location={streetViewLocation}
        apiKey={googleApiKey}
      />
    </SidebarProvider>
  );
};

export default Index;
