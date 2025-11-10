import { useState, useCallback, useMemo } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Dashboard } from "@/components/Dashboard";
import { QAReviewTable } from "@/components/QAReviewTable";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { parseDesignerUpload, convertToQAReviewRows, exportToExcel } from "@/utils/excelParser";
import { QAReviewRow, DashboardMetrics, CULookupItem } from "@/types/qa-tool";
import { useToast } from "@/hooks/use-toast";
import techservLogo from "@/assets/techserv-logo.png";

const Index = () => {
  const [qaData, setQaData] = useState<QAReviewRow[]>([]);
  const [cuLookup, setCuLookup] = useState<CULookupItem[]>([]);
  const [fileName, setFileName] = useState<string>("");
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
        {qaData.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2 font-saira uppercase tracking-wide text-primary">Welcome to TechServ QA Tool</h2>
              <p className="text-muted-foreground font-neuton text-lg">
                Upload your Designer Upload Excel file to begin the QA review process
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-neuton italic">
                Scalability and Reliability When and Where You Need It
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold font-saira uppercase tracking-wide text-primary">QA Review: {fileName}</h2>
                <p className="text-sm text-muted-foreground font-neuton">
                  Review and validate designer data entries
                </p>
              </div>
              <Button variant="outline" onClick={() => setQaData([])} className="font-semibold">
                Upload New File
              </Button>
            </div>

            <Dashboard metrics={metrics} />

            <QAReviewTable
              data={qaData}
              onUpdateRow={handleUpdateRow}
              cuOptions={cuLookup.map((cu) => cu.code)}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
