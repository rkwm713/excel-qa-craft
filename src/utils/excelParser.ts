import * as XLSX from "xlsx";
import { DesignerUploadRow, QAReviewRow, CULookupItem } from "@/types/qa-tool";

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
  return designerData.map((row, index) => {
    const qaCU = row["CU Name"] || "";
    const qaWF = row["Work Function"] || "";
    const qaQty = row.Quantity || 0;

    const cuCheck = qaCU === row["CU Name"];
    const wfCheck = qaWF === row["Work Function"];
    const qtyCheck = qaQty === row.Quantity;

    const issueType = cuCheck && wfCheck && qtyCheck ? "OK" : "NEEDS REVISIONS";

    return {
      id: `row-${index}`,
      issueType: issueType as "OK" | "NEEDS REVISIONS",
      station: row.Station || "",
      workSet: row["Work Set"] || "",
      designerCU: row["CU Name"] || "",
      qaCU,
      description: row.Description || "",
      designerWF: row["Work Function"] || "",
      qaWF,
      designerQty: row.Quantity || 0,
      qaQty,
      qaComments: "",
      cuCheck,
      wfCheck,
      qtyCheck,
    };
  });
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
    "QA Qty": row.qaQty,
    "QA Comments": row.qaComments,
    "CU Check": row.cuCheck ? "✓" : "✗",
    "WF Check": row.wfCheck ? "✓" : "✗",
    "Qty Check": row.qtyCheck ? "✓" : "✗",
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
  const cuMatches = data.filter((r) => r.cuCheck).length;
  const wfMatches = data.filter((r) => r.wfCheck).length;
  const qtyMatches = data.filter((r) => r.qtyCheck).length;

  const dashboardData = [
    { Metric: "Total Records", Value: data.length },
    { Metric: "OK Status", Value: okCount },
    { Metric: "Needs Revision", Value: needsRevisionCount },
    { Metric: "CU Match Rate", Value: `${Math.round((cuMatches / data.length) * 100)}%` },
    { Metric: "WF Match Rate", Value: `${Math.round((wfMatches / data.length) * 100)}%` },
    { Metric: "Qty Match Rate", Value: `${Math.round((qtyMatches / data.length) * 100)}%` },
  ];

  const dashboardSheet = XLSX.utils.json_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(workbook, dashboardSheet, "Dashboard");

  // Generate file name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const fileName = `QA_Tool_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
