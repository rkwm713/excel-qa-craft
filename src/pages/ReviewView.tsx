import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { reviewsAPI, ReviewData } from "@/services/api";
import { QAReviewTable } from "@/components/QAReviewTable";
import { Dashboard } from "@/components/Dashboard";
import { MapViewer } from "@/components/MapViewer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileSpreadsheet, Map as MapIcon, TrendingUp, Save, Download, Edit2, Check, X } from "lucide-react";
import { QAReviewRow, DashboardMetrics } from "@/types/qa-tool";
import { parsePDFForWorkPoints } from "@/utils/pdfParser";
import { normalizeStation, findMatchingStation } from "@/utils/stationNormalizer";
import { exportToExcel } from "@/utils/excelParser";
import { LoginDialog } from "@/components/LoginDialog";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { normalizeQaRow, normalizeQaRows } from "@/utils/qaValidation";
import { findMatchingSpec } from "@/utils/stationNormalizer";
import { TechServLogo } from "@/components/brand/TechServLogo";
import { UserProfileMenu } from "@/components/UserProfileMenu";

const STATUS_OPTIONS = [
  "Needs QA Review",
  "In Review",
  "Needs Corrections",
  "Corrections Completed",
  "Approved",
] as const;

type StatusOption = typeof STATUS_OPTIONS[number];

type ReviewMetadataState = {
  jobName: string;
  woNumber: string;
  designer: string;
  qaTech: string;
  project: string;
  status: StatusOption;
};

export default function ReviewView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [qaData, setQaData] = useState<QAReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);
  const [pdfAnnotations, setPdfAnnotations] = useState<Map<number, any[]>>(new Map());
  const [pdfWorkPointNotes, setPdfWorkPointNotes] = useState<Record<string, WorkPointNote[]>>({});
  const [currentWorkPoint, setCurrentWorkPoint] = useState<QAReviewRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [metadata, setMetadata] = useState<ReviewMetadataState>({
    jobName: "",
    woNumber: "",
    designer: "",
    qaTech: "",
    project: "",
    status: STATUS_OPTIONS[0],
  });
  const [isMetadataSaving, setIsMetadataSaving] = useState(false);
  const { toast } = useToast();
  const [editingSpec, setEditingSpec] = useState<string | null>(null);
  const [editingSpecValue, setEditingSpecValue] = useState<string>("");

  const handleSaveReview = useCallback(async () => {
    if (!id || !reviewData) return;

    setIsSaving(true);
    try {
      await reviewsAPI.update(id, {
        reviewRows: qaData,
        cuLookup: reviewData.cuLookup ?? [],
        stationPageMapping: reviewData.stationPageMapping ?? {},
        stationSpecMapping: reviewData.stationSpecMapping ?? {},
        editedSpecMapping: reviewData.editedSpecMapping ?? {},
        pdfAnnotations,
        workPointNotes: pdfWorkPointNotes,
      });

      toast({
        title: "Review saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving review",
        description: error?.message ?? "Failed to save review.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [id, reviewData, qaData, pdfAnnotations, pdfWorkPointNotes, toast]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        setCurrentUser(profile || { id: user.id, email: user.email, username: user.email?.split("@")[0] ?? "user" });
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
    }
  }, []);

  const handleLoginSuccess = useCallback((user: any) => {
    setCurrentUser(user);
    setShowLoginDialog(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out",
    });
  }, [toast]);

  useEffect(() => {
    if (id) {
      loadReview(id);
    }
  }, [id]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (reviewData?.review) {
      const statusCandidate = reviewData.review.status || STATUS_OPTIONS[0];
      const statusValue = (STATUS_OPTIONS as readonly string[]).includes(statusCandidate)
        ? (statusCandidate as StatusOption)
        : STATUS_OPTIONS[0];

      setMetadata({
        jobName: reviewData.review.title ?? "",
        woNumber: reviewData.review.wo_number ?? "",
        designer: reviewData.review.designer ?? "",
        qaTech: reviewData.review.qa_tech ?? "",
        project: reviewData.review.project ?? "",
        status: statusValue,
      });
    }
  }, [reviewData]);

  const loadReview = async (reviewId: string) => {
    setIsLoading(true);

    try {
      const data = await reviewsAPI.get(reviewId);
      
      setReviewData(data);
      
      // Convert review rows to QAReviewRow format
      const rows = normalizeQaRows(
        data.reviewRows.map((row) => ({
          ...row,
          id: row.id,
        }))
      );
      setQaData(rows);
      
      // Load PDF file if available (async, don't block)
      if (data.pdfFile && data.pdfFile.data) {
        try {
          // Convert base64 to blob
          const byteCharacters = atob(data.pdfFile.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: data.pdfFile.mimeType || 'application/pdf' });
          const file = new File([blob], data.pdfFile.fileName, { type: data.pdfFile.mimeType || 'application/pdf' });
          setPdfFile(file);
        } catch (error) {
          console.error('Error loading PDF file:', error);
          toast({
            title: "PDF loading error",
            description: "Could not load the PDF file. The review data is still available.",
          });
        }
      } else if (data.review?.pdf_file_name) {
        // Treat pdf_file_name as a Supabase Storage path (load asynchronously)
        const loadPdfAsync = async () => {
          try {
            const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
            const path = data.review.pdf_file_name as string;
            if (supabaseUrl && path) {
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/pdf-files/${path}`;
              
              // Add timeout to fetch
              const controller = new AbortController();
              const fetchTimeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout for PDF fetch
              
              const res = await fetch(publicUrl, { signal: controller.signal });
              clearTimeout(fetchTimeout);
              
              if (res.ok) {
                const blob = await res.blob();
                const file = new File([blob], path.split('/').pop() || 'document.pdf', { type: blob.type || 'application/pdf' });
                setPdfFile(file);
              } else {
                console.warn('Failed to fetch PDF from storage:', res.status);
                toast({
                  title: "PDF not available",
                  description: "Could not load the PDF file from storage.",
                });
              }
            }
          } catch (e) {
            if ((e as Error).name === 'AbortError') {
              console.warn('PDF fetch timed out');
              toast({
                title: "PDF loading timeout",
                description: "PDF file took too long to load.",
              });
            } else {
              console.error('Error fetching PDF from storage:', e);
            }
          }
        };
        
        // Load PDF in background, don't block review loading
        loadPdfAsync();
      }
      
      // Load PDF annotations
      if (data.pdfAnnotations && Object.keys(data.pdfAnnotations).length > 0) {
        const annotationsMap = new Map<number, any[]>();
        Object.entries(data.pdfAnnotations).forEach(([page, annotations]) => {
          annotationsMap.set(parseInt(page), annotations);
        });
        setPdfAnnotations(annotationsMap);
      }
      
      // Load work point notes
      if (data.workPointNotes && Object.keys(data.workPointNotes).length > 0) {
        setPdfWorkPointNotes(data.workPointNotes);
      }
      
      // Auto-select first station
      if (rows.length > 0) {
        const firstStation = rows[0].station;
        setSelectedStation(firstStation);
        setCurrentWorkPoint(rows[0]);
      }
      
      toast({
        title: "Review loaded",
        description: `Loaded review: ${data.review.title}`,
      });
    } catch (error: any) {
      toast({
        title: "Error loading review",
        description: error.message || "Failed to load review",
        variant: "destructive",
      });
      navigate("/reviews");
    } finally {
      setIsLoading(false);
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
      console.error("Error parsing PDF:", error);
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
    if (!reviewData) return;
    setReviewData({
      ...reviewData,
      editedSpecMapping: {
        ...reviewData.editedSpecMapping,
        [station]: specNumber.trim() || undefined,
      },
    });
  };

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
    qaQty: null,
    qaComments: "",
    cuCheck: true,
    wfCheck: true,
    qtyCheck: true,
  };
  const normalized = normalizeQaRow(newRow);
  setQaData((prev) => [...prev, normalized]);
}, []);

  const handleUpdateRow = (rowId: string, field: keyof QAReviewRow, value: any) => {
    setQaData((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const updatedRow = normalizeQaRow({ ...row, [field]: value });
        if (currentWorkPoint?.id === rowId) {
          setCurrentWorkPoint(updatedRow);
        }
        return updatedRow;
      })
    );
  };

const handleExport = useCallback(async () => {
  try {
    if (qaData.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no QA data available to export.",
        variant: "destructive",
      });
      return;
    }

    await exportToExcel(qaData, reviewData?.cuLookup ?? []);
    toast({
      title: "Export successful",
      description: "QA Tool data exported to Excel.",
    });
  } catch (error) {
    toast({
      title: "Export failed",
      description: "Failed to export QA data.",
      variant: "destructive",
    });
  }
}, [qaData, reviewData?.cuLookup, toast]);

  const cuOptions = useMemo(() => {
    const lookupCodes = reviewData?.cuLookup?.map((cu) => cu.code).filter(Boolean) ?? [];
    const rowCodes = qaData.flatMap((row) => [row.designerCU, row.qaCU]).filter(Boolean) as string[];
    return Array.from(new Set([...lookupCodes, ...rowCodes]));
  }, [reviewData, qaData]);

  const cuReviewed = qaData.filter((r) => r.qaCU !== "");
  const wfReviewed = qaData.filter((r) => r.qaWF !== "");
  const qtyReviewed = qaData.filter((r) => r.qaQty !== null);

  const metrics: DashboardMetrics = {
    totalRows: qaData.length,
    okCount: qaData.filter((r) => r.issueType === "OK").length,
    needsRevisionCount: qaData.filter((r) => r.issueType === "NEEDS REVISIONS").length,
    cuMatchRate: cuReviewed.length > 0 ? (cuReviewed.filter((r) => r.cuCheck).length / cuReviewed.length) * 100 : 0,
    wfMatchRate: wfReviewed.length > 0 ? (wfReviewed.filter((r) => r.wfCheck).length / wfReviewed.length) * 100 : 0,
    qtyMatchRate: qtyReviewed.length > 0 ? (qtyReviewed.filter((r) => r.qtyCheck).length / qtyReviewed.length) * 100 : 0,
  };

  const metadataChanged = useMemo(() => {
    if (!reviewData) return false;
    const review = reviewData.review;
    return (
      metadata.jobName !== (review.title ?? "") ||
      metadata.woNumber !== (review.wo_number ?? "") ||
      metadata.designer !== (review.designer ?? "") ||
      metadata.qaTech !== (review.qa_tech ?? "") ||
      metadata.project !== (review.project ?? "") ||
      metadata.status !== ((review.status as StatusOption | null) ?? STATUS_OPTIONS[0])
    );
  }, [metadata, reviewData]);

  const handleMetadataFieldChange = useCallback(
    (field: keyof ReviewMetadataState, value: string) => {
      setMetadata((prev) => {
        const next: ReviewMetadataState = {
          ...prev,
          [field]: value,
        };

        if (field === "woNumber") {
          if (prev.jobName === prev.woNumber || prev.jobName.trim() === "") {
            next.jobName = value;
          }
        }

        return next;
      });
    },
    []
  );

  const handleMetadataSave = useCallback(async () => {
    if (!id || !reviewData) return;
    if (!currentUser || currentUser.id !== reviewData.review.created_by) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to update this review.",
        variant: "destructive",
      });
      return;
    }
    setIsMetadataSaving(true);
    try {
      const trimmedJobName = metadata.jobName.trim();
      const trimmedWo = metadata.woNumber.trim();
      const trimmedDesigner = metadata.designer.trim();
      const trimmedQaTech = metadata.qaTech.trim();
      const trimmedProject = metadata.project.trim();

      await reviewsAPI.update(id, {
        title: trimmedJobName || trimmedWo || reviewData.review.title,
        woNumber: trimmedWo || null,
        designer: trimmedDesigner || null,
        qaTech: trimmedQaTech || null,
        project: trimmedProject || null,
        status: metadata.status,
      });

      setReviewData((prev) =>
        prev
          ? {
              ...prev,
              review: {
                ...prev.review,
                title: trimmedJobName || trimmedWo || prev.review.title,
                wo_number: trimmedWo || null,
                designer: trimmedDesigner || null,
                qa_tech: trimmedQaTech || null,
                project: trimmedProject || null,
                status: metadata.status,
              },
            }
          : prev
      );

      setMetadata((prev) => ({
        ...prev,
        jobName: trimmedJobName || trimmedWo || prev.jobName,
        woNumber: trimmedWo,
        designer: trimmedDesigner,
        qaTech: trimmedQaTech,
        project: trimmedProject,
      }));

      toast({
        title: "Metadata updated",
        description: "Review details have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating metadata",
        description: error?.message ?? "Failed to update review metadata.",
        variant: "destructive",
      });
    } finally {
      setIsMetadataSaving(false);
    }
  }, [currentUser, id, metadata, reviewData, toast]);

  const stations = Array.from(new Set(qaData.map((r) => r.station))).sort();
  const stationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    qaData.forEach((r) => {
      counts[r.station] = (counts[r.station] || 0) + 1;
    });
    return counts;
  }, [qaData]);

  const handlePreviousStation = useCallback(() => {
    const idx = stations.indexOf(selectedStation);
    if (idx > 0) setSelectedStation(stations[idx - 1]);
  }, [stations, selectedStation]);

  const handleNextStation = useCallback(() => {
    const idx = stations.indexOf(selectedStation);
    if (idx >= 0 && idx < stations.length - 1) setSelectedStation(stations[idx + 1]);
  }, [stations, selectedStation]);

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

  if (!reviewData) {
    return null;
  }

  const canEditReview = currentUser?.id === reviewData.review.created_by;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="flex-1 w-full">
        <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-white/95 shadow-brand-sm backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/reviews")}
                  className="gap-2 text-[hsl(var(--color-secondary))] hover:text-[hsl(var(--color-primary))]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Reviews</span>
                </Button>
                <div className="hidden h-8 w-px bg-[hsl(var(--border))] md:block" />
                <TechServLogo variant="secondary" width={120} />
                <div className="space-y-1">
                  <h1 className="text-xl font-saira font-semibold uppercase tracking-[0.08em] text-[hsl(var(--color-primary))]">
                    {reviewData.review.title || metadata.woNumber || "Untitled Review"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-neuton text-[hsl(var(--color-secondary))]">
                    {metadata.woNumber && <span>WO# {metadata.woNumber}</span>}
                    <Badge
                      variant={
                        metadata.status === "Approved"
                          ? "success"
                          : metadata.status === "Needs Corrections"
                            ? "destructive"
                            : metadata.status === "In Review"
                              ? "default"
                              : "secondary"
                      }
                      className="text-[11px]"
                    >
                      {metadata.status}
                    </Badge>
                    {reviewData.review.description &&
                      reviewData.review.description !== "QA Review Session" && (
                        <span className="truncate max-w-[16rem]">
                          {reviewData.review.description}
                        </span>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {qaData.length > 0 && (
                  <div className="flex items-center gap-2">
                    {canEditReview && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={handleSaveReview}
                        disabled={isSaving || !canEditReview}
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden lg:inline">
                          {isSaving ? "Saving..." : "Save Changes"}
                        </span>
                      </Button>
                    )}
                    <Button size="sm" variant="cta" onClick={handleExport} className="gap-2">
                      <Download className="w-4 h-4" />
                      <span className="hidden lg:inline">Export QA Tool</span>
                    </Button>
                  </div>
                )}
                <div className="h-8 w-px bg-[hsl(var(--border))]" />
                <UserProfileMenu
                  user={currentUser}
                  onLogin={() => setShowLoginDialog(true)}
                  onLogout={handleLogout}
                />
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsla(var(--color-light)/0.45)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm font-neuton text-[hsl(var(--color-dark))]">
                <span className="font-saira text-xs uppercase tracking-[0.12em] text-[hsl(var(--color-primary))]">
                  Review Summary
                </span>
                <span className="text-xs text-[hsl(var(--color-secondary))]">
                  Designer: {metadata.designer || "—"}
                </span>
                <span className="text-xs text-[hsl(var(--color-secondary))]">
                  QA Tech: {metadata.qaTech || "—"}
                </span>
                <span className="text-xs text-[hsl(var(--color-secondary))]">
                  Project: {metadata.project || "—"}
                </span>
              </div>
            </div>
            <div className="border-t border-[hsl(var(--border))] bg-[hsla(var(--color-light)/0.4)]">
              <div className="flex h-12 items-center gap-1 px-6">
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("dashboard")}
                  className={`
                    gap-2 rounded-b-none h-10 font-medium
                    ${activeTab === "dashboard" 
                      ? "bg-background text-[hsl(var(--color-primary))] border-t-2 border-x border-[hsl(var(--color-primary))] shadow-sm" 
                      : "hover:bg-[hsla(var(--color-primary)/0.08)] text-[hsl(var(--color-secondary))]"
                    }
                  `}
                >
                  <TrendingUp className="w-4 h-4" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === "data" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("data")}
                  className={`
                    gap-2 rounded-b-none h-10 font-medium
                    ${activeTab === "data" 
                      ? "bg-background text-[hsl(var(--color-primary))] border-t-2 border-x border-[hsl(var(--color-primary))] shadow-sm" 
                      : "hover:bg-[hsla(var(--color-primary)/0.08)] text-[hsl(var(--color-secondary))]"
                    }
                  `}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  QA Data
                </Button>
                <Button
                  variant={activeTab === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("map")}
                  className={`
                    gap-2 rounded-b-none h-10 font-medium
                    ${activeTab === "map" 
                      ? "bg-background text-[hsl(var(--color-primary))] border-t-2 border-x border-[hsl(var(--color-primary))] shadow-sm" 
                      : "hover:bg-[hsla(var(--color-primary)/0.08)] text-[hsl(var(--color-secondary))]"
                    }
                  `}
                >
                  <MapIcon className="w-4 h-4" />
                  Map View
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-saira uppercase tracking-wide text-primary">
                    Review Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metadata-job-name">Job Name</Label>
                      <Input
                        id="metadata-job-name"
                        value={metadata.jobName}
                        onChange={(e) => handleMetadataFieldChange("jobName", e.target.value)}
                        placeholder="Enter job name"
                        disabled={isMetadataSaving || !canEditReview}
                      />
                    </div>
                    <div className="space-y-2 max-w-sm md:max-w-none">
                      <Label htmlFor="metadata-status">Status</Label>
                      <Select
                        value={metadata.status}
                        onValueChange={(value) =>
                          handleMetadataFieldChange("status", value as StatusOption)
                        }
                        disabled={isMetadataSaving || !canEditReview}
                      >
                        <SelectTrigger id="metadata-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metadata-wo">WO# (Work Order Number)</Label>
                      <Input
                        id="metadata-wo"
                        value={metadata.woNumber}
                        onChange={(e) => handleMetadataFieldChange("woNumber", e.target.value)}
                        placeholder="Enter WO#"
                        disabled={isMetadataSaving || !canEditReview}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metadata-project">Project</Label>
                      <Input
                        id="metadata-project"
                        value={metadata.project}
                        onChange={(e) => handleMetadataFieldChange("project", e.target.value)}
                        placeholder="Enter project name"
                        disabled={isMetadataSaving || !canEditReview}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metadata-designer">Designer</Label>
                      <Input
                        id="metadata-designer"
                        value={metadata.designer}
                        onChange={(e) => handleMetadataFieldChange("designer", e.target.value)}
                        placeholder="Enter designer name"
                        disabled={isMetadataSaving || !canEditReview}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metadata-qa-tech">QA Tech</Label>
                      <Input
                        id="metadata-qa-tech"
                        value={metadata.qaTech}
                        onChange={(e) => handleMetadataFieldChange("qaTech", e.target.value)}
                        placeholder="Enter QA technician name"
                        disabled={isMetadataSaving || !canEditReview}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleMetadataSave}
                      disabled={isMetadataSaving || !metadataChanged || !canEditReview}
                    >
                      {isMetadataSaving
                        ? "Saving..."
                        : !canEditReview
                          ? "View Only"
                          : metadataChanged
                            ? "Save Details"
                            : "Up to date"}
                    </Button>
                  </div>
                  {!canEditReview && (
                    <p className="text-sm text-muted-foreground">
                      Only the review owner can update these details.
                    </p>
                  )}
                </CardContent>
              </Card>

              {qaData.length > 0 && <Dashboard metrics={metrics} />}
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              {/* WP Navigation Row */}
              {qaData.length > 0 && (
                <Card className="p-2">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    {/* Left: empty spacer since tabs now appear on title hover */}
                    <div />
                    {/* Center: WP navigation + records */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousStation}
                        disabled={stations.indexOf(selectedStation) <= 0}
                        className="h-7 px-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Select value={selectedStation} onValueChange={setSelectedStation}>
                        <SelectTrigger className="w-[160px] h-8 border-primary/40 bg-primary/10 hover:bg-primary/20 font-saira font-semibold text-primary">
                          <SelectValue placeholder="Select WP" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((s) => (
                            <SelectItem key={s} value={s}>
                              WP {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextStation}
                        disabled={stations.indexOf(selectedStation) >= stations.length - 1}
                        className="h-7 px-2"
                      >
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </Button>
                      <Badge variant="default" className="font-saira text-sm px-3 py-1">
                        {stationCounts[selectedStation] || 0} {stationCounts[selectedStation] === 1 ? "record" : "records"}
                      </Badge>
                    </div>
                    {/* Right: Spec display / edit */}
                    <div className="flex items-center justify-end gap-2">
                      {(() => {
                        const editedSpec = reviewData.editedSpecMapping?.[selectedStation];
                        const originalSpec = reviewData.stationSpecMapping
                          ? findMatchingSpec(selectedStation, reviewData.stationSpecMapping)
                          : null;
                        const specNumber =
                          editedSpec !== undefined && editedSpec !== "" ? editedSpec : originalSpec;
                        const isEdited =
                          editedSpec !== undefined && editedSpec !== "" && editedSpec !== originalSpec;

                        if (editingSpec === selectedStation) {
                          return (
                            <>
                              <Input
                                value={editingSpecValue}
                                onChange={(e) => setEditingSpecValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSpecNumberChange(selectedStation, editingSpecValue.trim());
                                    setEditingSpec(null);
                                    setEditingSpecValue("");
                                  } else if (e.key === "Escape") {
                                    setEditingSpec(null);
                                    setEditingSpecValue("");
                                  }
                                }}
                                placeholder="Enter spec number"
                                className="h-8 w-40 text-sm font-saira text-center"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  handleSpecNumberChange(selectedStation, editingSpecValue.trim());
                                  setEditingSpec(null);
                                  setEditingSpecValue("");
                                }}
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setEditingSpec(null);
                                  setEditingSpecValue("");
                                }}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          );
                        }

                        return specNumber ? (
                          <Badge
                            variant={isEdited ? "default" : "secondary"}
                            className={`font-saira cursor-pointer hover:opacity-80 transition-opacity ${
                              isEdited ? "bg-orange-500 hover:bg-orange-600" : ""
                            }`}
                            onClick={() => {
                              setEditingSpec(selectedStation);
                              setEditingSpecValue(specNumber);
                            }}
                          >
                            Spec: {specNumber}
                            {isEdited && <span className="ml-1 text-xs">(edited)</span>}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 font-saira text-xs"
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
                  </div>
                </Card>
              )}
              {qaData.length > 0 ? (
                <QAReviewTable
                  data={qaData}
                  onUpdateRow={handleUpdateRow}
                  onAddRow={handleAddRow}
                  cuOptions={cuOptions}
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
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
}

