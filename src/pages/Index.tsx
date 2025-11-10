import { useState, useCallback, useMemo } from "react";
import { FileUpload } from "@/components/FileUpload";
import { KMZUpload } from "@/components/KMZUpload";
import { Dashboard } from "@/components/Dashboard";
import { QAReviewTable } from "@/components/QAReviewTable";
import { MapViewer } from "@/components/MapViewer";
import { GoogleApiKeyInput } from "@/components/GoogleApiKeyInput";
import { StreetViewModal } from "@/components/StreetViewModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileSpreadsheet, Map as MapIcon } from "lucide-react";
import { parseDesignerUpload, convertToQAReviewRows, exportToExcel } from "@/utils/excelParser";
import { parseKMZ } from "@/utils/kmzParser";
import { QAReviewRow, DashboardMetrics, CULookupItem } from "@/types/qa-tool";
import { useToast } from "@/hooks/use-toast";
import techservLogo from "@/assets/techserv-logo.png";

const Index = () => {
  const [qaData, setQaData] = useState<QAReviewRow[]>([]);
  const [cuLookup, setCuLookup] = useState<CULookupItem[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [kmzPlacemarks, setKmzPlacemarks] = useState<any[]>([]);
  const [kmzFileName, setKmzFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("data");
  const [googleApiKey, setGoogleApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [streetViewLocation, setStreetViewLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    try {
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
    } catch (error) {
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

      // Switch to map tab
      setActiveTab("map");
    } catch (error) {
      toast({
        title: "Error loading KMZ",
        description: "Failed to parse the KMZ file. Please check the format.",
        variant: "destructive",
      });
      console.error("Error parsing KMZ:", error);
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

  const handleApiKeySubmit = (key: string) => {
    setGoogleApiKey(key);
    setShowApiKeyInput(false);
    toast({
      title: "API Key saved",
      description: "Street View is now enabled",
    });
  };

  const handleSkipApiKey = () => {
    setShowApiKeyInput(false);
    toast({
      title: "Using map only",
      description: "You can still add an API key later from settings",
    });
  };

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
        {qaData.length === 0 && kmzPlacemarks.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2 font-saira uppercase tracking-wide text-primary">Welcome to TechServ QA Tool</h2>
              <p className="text-muted-foreground font-neuton text-lg">
                Upload your Designer Upload Excel file and KMZ work points to begin the QA review process
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-neuton italic">
                Scalability and Reliability When and Where You Need It
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FileUpload onFileSelect={handleFileSelect} />
              <KMZUpload onFileSelect={handleKMZFileSelect} />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
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
                {!kmzPlacemarks.length && (
                  <Button variant="outline" onClick={() => document.getElementById("kmz-upload")?.click()} className="gap-2">
                    <MapIcon className="w-4 h-4" />
                    Add KMZ
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setQaData([]); setKmzPlacemarks([]); }}>
                  Upload New Files
                </Button>
              </div>
              <input
                id="kmz-upload"
                type="file"
                accept=".kmz"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleKMZFileSelect(file);
                }}
                className="hidden"
              />
            </div>

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

              {qaData.length > 0 && <Dashboard metrics={metrics} />}

              {qaData.length > 0 && (
                <QAReviewTable
                  data={qaData}
                  onUpdateRow={handleUpdateRow}
                  cuOptions={cuLookup.map((cu) => cu.code)}
                />
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

              {showApiKeyInput && kmzPlacemarks.length > 0 && (
                <GoogleApiKeyInput 
                  onApiKeySubmit={handleApiKeySubmit} 
                  onSkip={handleSkipApiKey}
                />
              )}

              {kmzPlacemarks.length > 0 ? (
                <>
                  <MapViewer
                    placemarks={kmzPlacemarks}
                    onStationClick={handleStationClick}
                    onStreetViewClick={handleStreetViewClick}
                    hasGoogleApiKey={!!googleApiKey}
                  />
                  {googleApiKey && (
                    <StreetViewModal
                      isOpen={isStreetViewOpen}
                      onClose={() => setIsStreetViewOpen(false)}
                      location={streetViewLocation}
                      apiKey={googleApiKey}
                    />
                  )}
                </>
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
    </div>
  );
};

export default Index;
