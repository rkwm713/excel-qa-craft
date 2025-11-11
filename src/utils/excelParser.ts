import * as XLSX from "xlsx";
import { DesignerUploadRow, QAReviewRow, CULookupItem } from "@/types/qa-tool";
import { normalizeQaRow } from "@/utils/qaValidation";

export const parseDesignerUpload = async (file: File): Promise<DesignerUploadRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as DesignerUploadRow[];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

export const convertToQAReviewRows = (
  designerData: DesignerUploadRow[],
  cuLookup: CULookupItem[]
): QAReviewRow[] => {
  return designerData.map((row, index) =>
    normalizeQaRow({
      id: `row-${index}`,
      issueType: "NEEDS REVISIONS",
      station: row.Station || "",
      workSet: row["Work Set"] || "",
      designerCU: row["CU Name"] || "",
      qaCU: "",
      description: row.Description || "",
      designerWF: row["Work Function"] || "",
      qaWF: "",
      designerQty: row.Quantity || 0,
      qaQty: null,
      qaComments: "",
      cuCheck: true,
      wfCheck: true,
      qtyCheck: true,
    })
  );
};

export const exportToExcel = (data: QAReviewRow[], cuLookup: CULookupItem[]) => {
  const workbook = XLSX.utils.book_new();

  // QA Review Sheet
  const qaReviewData = data.map((row) => ({
    "Issue Type": row.issueType,
    Station: row.station,
    "Work Set": row.workSet,
    "Designer CU": row.designerCU,
    "QA CU": row.qaCU,
    Description: row.description,
    "Designer WF": row.designerWF,
    "QA WF": row.qaWF,
    "Designer Qty": row.designerQty,
    "QA Qty": row.qaQty ?? "",
    "QA Comments": row.qaComments,
    "CU Check": row.qaCU === "" ? "" : row.cuCheck ? "✓" : "✗",
    "WF Check": row.qaWF === "" ? "" : row.wfCheck ? "✓" : "✗",
    "Qty Check": row.qaQty === null ? "" : row.qtyCheck ? "✓" : "✗",
  }));

  const qaReviewSheet = XLSX.utils.json_to_sheet(qaReviewData);
  XLSX.utils.book_append_sheet(workbook, qaReviewSheet, "QA Review");

  // CU Lookup Sheet
  const cuLookupData = cuLookup.map((item) => ({
    Code: item.code,
    Description: item.description,
  }));
  const cuLookupSheet = XLSX.utils.json_to_sheet(cuLookupData);
  XLSX.utils.book_append_sheet(workbook, cuLookupSheet, "CU Lookup");

  // Dashboard Sheet with metrics
  const okCount = data.filter((r) => r.issueType === "OK").length;
  const needsRevisionCount = data.filter((r) => r.issueType === "NEEDS REVISIONS").length;

  const cuReviewed = data.filter((r) => r.qaCU !== "");
  const wfReviewed = data.filter((r) => r.qaWF !== "");
  const qtyReviewed = data.filter((r) => r.qaQty !== null);

  const cuMatches = cuReviewed.filter((r) => r.cuCheck).length;
  const wfMatches = wfReviewed.filter((r) => r.wfCheck).length;
  const qtyMatches = qtyReviewed.filter((r) => r.qtyCheck).length;

  const dashboardData = [
    { Metric: "Total Records", Value: data.length },
    { Metric: "OK Status", Value: okCount },
    { Metric: "Needs Revision", Value: needsRevisionCount },
    {
      Metric: "CU Match Rate",
      Value:
        cuReviewed.length > 0
          ? `${Math.round((cuMatches / cuReviewed.length) * 100)}%`
          : "N/A",
    },
    {
      Metric: "WF Match Rate",
      Value:
        wfReviewed.length > 0
          ? `${Math.round((wfMatches / wfReviewed.length) * 100)}%`
          : "N/A",
    },
    {
      Metric: "Qty Match Rate",
      Value:
        qtyReviewed.length > 0
          ? `${Math.round((qtyMatches / qtyReviewed.length) * 100)}%`
          : "N/A",
    },
  ];

  const dashboardSheet = XLSX.utils.json_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(workbook, dashboardSheet, "Dashboard");

  // Generate file name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const fileName = `QA_Tool_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
