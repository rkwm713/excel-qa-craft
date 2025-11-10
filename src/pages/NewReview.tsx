import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";
import { KMZUpload } from "@/components/KMZUpload";
import { PDFUpload } from "@/components/PDFUpload";
import { Dashboard } from "@/components/Dashboard";
import { QAReviewTable } from "@/components/QAReviewTable";
import { QAReviewSkeleton } from "@/components/QAReviewSkeleton";
import { MapViewer } from "@/components/MapViewer";
import { GoogleApiKeyInput } from "@/components/GoogleApiKeyInput";
import { StreetViewModal } from "@/components/StreetViewModal";
import { LoginDialog } from "@/components/LoginDialog";
import { SaveReviewDialog } from "@/components/SaveReviewDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileSpreadsheet, Map as MapIcon, TrendingUp, FileText, Save, FolderOpen, User, LogOut, ArrowLeft } from "lucide-react";
import { reviewsAPI, authAPI, removeAuthToken } from "@/services/api";
import { parseDesignerUpload, convertToQAReviewRows, exportToExcel } from "@/utils/excelParser";
import { exportDesignerPackage } from "@/utils/exportPackage";
import { parseKMZ } from "@/utils/kmzParser";
import { parsePDFForWorkPoints } from "@/utils/pdfParser";
import { normalizeStation, findMatchingStation } from "@/utils/stationNormalizer";
import { QAReviewRow, DashboardMetrics, CULookupItem } from "@/types/qa-tool";
import { useToast } from "@/hooks/use-toast";
import techservLogo from "@/assets/techserv-logo.png";

const NewReview = () => {
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
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);
  const [stationPageMapping, setStationPageMapping] = useState<Record<string, number>>({});
  const [stationSpecMapping, setStationSpecMapping] = useState<Record<string, string>>({});
  const [editedSpecMapping, setEditedSpecMapping] = useState<Record<string, string>>({});
  const [placemarkNotes, setPlacemarkNotes] = useState<Record<string, string>>({});
  const [mapDrawings, setMapDrawings] = useState<any[]>([]);
  const [pdfAnnotations, setPdfAnnotations] = useState<Map<number, any[]>>(new Map());
  const [pdfWorkPointNotes, setPdfWorkPointNotes] = useState<Record<string, string>>({});
  const [currentWorkPoint, setCurrentWorkPoint] = useState<QAReviewRow | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("googleMapsApiKey");
    if (savedKey) {
      setGoogleApiKey(savedKey);
    }
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.user);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setShowLoginDialog(false);
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out",
    });
  };

  const handleSaveReview = async (title: string, description: string) => {
    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }

    setIsSaving(true);
    try {
      await reviewsAPI.create({
        title,
        description,
        fileName,
        kmzFileName,
        pdfFileName,
        pdfFile: pdfFile, // Include the actual PDF file
        reviewRows: qaData,
        cuLookup,
        stationPageMapping,
        stationSpecMapping,
        editedSpecMapping,
        pdfAnnotations,
        workPointNotes: pdfWorkPointNotes,
        kmzPlacemarks,
      });

      toast({
        title: "Review saved",
        description: "Your review has been saved successfully",
      });
      setShowSaveDialog(false);
      navigate("/reviews");
    } catch (error: any) {
      toast({
        title: "Error saving review",
        description: error.message || "Failed to save review",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
      setStationSpecMapping(pdfInfo.stationSpecMapping);
      setCurrentPdfPage(1);

      const mappedCount = Object.keys(pdfInfo.stationPageMapping).length;
      const specCount = Object.keys(pdfInfo.stationSpecMapping).length;
      toast({
        title: "PDF loaded successfully",
        description: `Found ${pdfInfo.numPages} pages. Mapped ${mappedCount} work points${specCount > 0 ? ` and ${specCount} spec numbers` : ''}.`,
      });
    } catch (error) {
      console.error("Error parsing PDF:", error);
      
      // Still attach the file so the viewer works, even if parsing failed
      setPdfFile(file);
      setPdfFileName(file.name);
      setStationPageMapping({});
      setStationSpecMapping({});
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

  const handleSpecNumberChange = (station: string, specNumber: string) => {
    setEditedSpecMapping(prev => {
      const trimmed = specNumber.trim();
      if (trimmed === "") {
        // Remove the entry if empty (revert to original)
        const newMapping = { ...prev };
        delete newMapping[station];
        return newMapping;
      }
      return {
        ...prev,
        [station]: trimmed,
      };
    });
  };

  // Auto-sync: Update current work point when PDF page changes
  const handlePdfPageChange = useCallback((page: number) => {
    setCurrentPdfPage(page);
    
    // Find matching station for this page
    if (stationPageMapping && qaData.length > 0) {
      const station = Object.keys(stationPageMapping).find(
        key => stationPageMapping[key] === page
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
  }, [stationPageMapping, qaData]);

  const handleUpdateRow = useCallback((id: string, field: keyof QAReviewRow, value: any) => {
    setQaData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  }, []);

  const handleAddRow = useCallback((station: string) => {
    const newRow: QAReviewRow = {
      id: `row-${Date.now()}`,
      issueType: "NEEDS REVISIONS",
      station,
      workSet: "",
      designerCU: "",
      qaCU: "",
      description: "",
      designerWF: "",
      qaWF: "",
      designerQty: 0,
      qaQty: 0,
      qaComments: "",
      cuCheck: false,
      wfCheck: false,
      qtyCheck: false,
    };
    setQaData(prev => [...prev, newRow]);
  }, []);

  const handleExport = async () => {
    try {
      if (qaData.length === 0) {
        toast({
          title: "No data to export",
          description: "Please upload a file first",
          variant: "destructive",
        });
        return;
      }

      await exportToExcel(qaData, cuLookup);
      toast({
        title: "Export successful",
        description: "QA Tool data exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data",
        variant: "destructive",
      });
      console.error("Export error:", error);
    }
  };

  const handleJumpToWorkPoint = useCallback((station: string) => {
    if (!pdfFile || !stationPageMapping) return;
    
    const page = findMatchingStation(station, stationPageMapping);
    if (page) {
      setCurrentPdfPage(page);
    }
  }, [pdfFile, stationPageMapping]);

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

  // Handle station selection from sidebar
  const handleStationSelect = useCallback((station: string) => {
    // Jump to specific station
    handleJumpToWorkPoint(station);
  }, [handleJumpToWorkPoint]);

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

  // Auto-select first station when stations are available or when data changes
  useEffect(() => {
    if (stations.length > 0) {
      // If no station selected or selected station no longer exists, select first station
      if (!selectedStation || !stations.includes(selectedStation)) {
        const firstStation = stations[0];
        setSelectedStation(firstStation);
        // Also set the first work point for that station
        const firstWorkPoint = qaData.find(row => row.station === firstStation);
        if (firstWorkPoint) {
          setCurrentWorkPoint(firstWorkPoint);
          // Jump to first work point's page if PDF is loaded
          if (pdfFile) {
            const page = findMatchingStation(firstStation, stationPageMapping);
            if (page) {
              setCurrentPdfPage(page);
            }
          }
        }
      }
    } else {
      // No stations available, clear selection
      setSelectedStation("");
      setCurrentWorkPoint(null);
    }
  }, [stations, selectedStation, qaData, pdfFile, stationPageMapping]);

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
    <div className="min-h-screen flex w-full bg-background">
      {/* Main Content */}
      <div className="flex-1 w-full">
          <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-3">
              {/* Top row: Logo and Export */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-between flex-1">
                  <div className="flex items-center gap-6">
                    <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Dashboard
                    </Button>
                    <img 
                      src={techservLogo} 
                      alt="TechServ" 
                      className="h-12 w-auto"
                    />
                    <div className="border-l border-border pl-6">
                      <h1 className="text-2xl font-bold text-primary uppercase tracking-wide font-saira">New QA Review</h1>
                      <p className="text-sm text-muted-foreground font-neuton">Create a new QA review session</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && (
                      <div className="flex items-center gap-2 text-sm mr-2">
                        <User className="w-4 h-4" />
                        <span className="font-semibold">{currentUser.username}</span>
                      </div>
                    )}
                    {qaData.length > 0 && (
                      <>
                        <Button
                          onClick={() => {
                            if (!currentUser) {
                              setShowLoginDialog(true);
                            } else {
                              setShowSaveDialog(true);
                            }
                          }}
                          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        >
                          <Save className="w-4 h-4" />
                          Save Review
                        </Button>
                        <Button onClick={handleExport} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                          <Download className="w-4 h-4" />
                          Export QA Tool
                        </Button>
                      </>
                    )}
                    {currentUser ? (
                      <Button variant="outline" onClick={handleLogout} className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setShowLoginDialog(true)} className="gap-2">
                        <User className="w-4 h-4" />
                        Login
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bottom row: Tabs and Action Buttons - only show when files are uploaded */}
              {hasUploadedFiles && (
                <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex gap-1 bg-muted/50 p-1.5 rounded-lg border border-border/50 shadow-sm">
                      <Button
                        variant={activeTab === "dashboard" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("dashboard")}
                        className={`gap-2 transition-all duration-200 ${
                          activeTab === "dashboard" 
                            ? "bg-primary text-primary-foreground shadow-md font-semibold" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <TrendingUp className={`w-4 h-4 transition-transform ${activeTab === "dashboard" ? "scale-110" : ""}`} />
                        Dashboard
                      </Button>
                      <Button
                        variant={activeTab === "data" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("data")}
                        className={`gap-2 transition-all duration-200 ${
                          activeTab === "data" 
                            ? "bg-primary text-primary-foreground shadow-md font-semibold" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <FileSpreadsheet className={`w-4 h-4 transition-transform ${activeTab === "data" ? "scale-110" : ""}`} />
                        QA Data
                      </Button>
                      <Button
                        variant={activeTab === "map" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("map")}
                        className={`gap-2 transition-all duration-200 ${
                          activeTab === "map" 
                            ? "bg-primary text-primary-foreground shadow-md font-semibold" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <MapIcon className={`w-4 h-4 transition-transform ${activeTab === "map" ? "scale-110" : ""}`} />
                        Map View
                      </Button>
                    </div>
                    {activeTab === "data" && fileName && (
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold font-saira uppercase tracking-wide text-primary">
                          QA Review: {fileName}
                        </h2>
                      </div>
                    )}
                  </div>
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
                </div>
              )}
            </div>
          </header>

          <main className="w-full px-4 py-4">
        {!hasUploadedFiles ? (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2 font-saira uppercase tracking-wide text-primary">Create New QA Review</h2>
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
                  setStationSpecMapping({});
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
            <div>
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
              {isLoading ? (
                <QAReviewSkeleton count={5} />
              ) : (
                qaData.length > 0 && (
                  <QAReviewTable
                    data={qaData}
                    onUpdateRow={handleUpdateRow}
                    onAddRow={handleAddRow}
                    cuOptions={cuLookup.map((cu) => cu.code)}
                    selectedStation={selectedStation}
                    stations={stations}
                    onStationChange={handleStationSelect}
                    pdfFile={pdfFile}
                    currentPdfPage={currentPdfPage}
                    onPdfPageChange={handlePdfPageChange}
                    stationPageMapping={stationPageMapping}
                    stationSpecMapping={stationSpecMapping}
                    editedSpecMapping={editedSpecMapping}
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
                    View work points on an interactive map
                  </p>
                </div>
              </div>
              {kmzPlacemarks.length > 0 ? (
                <MapViewer
                  placemarks={kmzPlacemarks}
                  onPlacemarkClick={handleStreetViewClick}
                />
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <MapIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold font-saira mb-2">No KMZ File Loaded</h3>
                  <p className="text-muted-foreground font-neuton mb-4">
                    Upload a KMZ file to view work points on the map
                  </p>
                  <Button
                    onClick={() => document.getElementById("kmz-upload")?.click()}
                    className="gap-2"
                  >
                    <MapIcon className="w-4 h-4" />
                    Upload KMZ File
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
          </main>
      </div>

      <StreetViewModal
        isOpen={isStreetViewOpen}
        onClose={() => setIsStreetViewOpen(false)}
        location={streetViewLocation}
        apiKey={googleApiKey}
      />

      {/* Dialogs */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
      <SaveReviewDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveReview}
        defaultTitle={fileName ? `Review: ${fileName}` : "QA Review"}
        isLoading={isSaving}
      />
    </div>
  );
};

export default NewReview;

