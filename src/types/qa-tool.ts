export interface DesignerUploadRow {
  Station: string;
  "Work Set": string;
  "CU Name": string;
  Description: string;
  "Work Function": string;
  Quantity: number;
  "System Improvement (I)": string;
  Copy?: string;
}

export interface QAReviewRow {
  id: string;
  issueType: "OK" | "NEEDS REVISIONS";
  station: string;
  workSet: string;
  designerCU: string;
  qaCU: string;
  description: string;
  designerWF: string;
  qaWF: string;
  designerQty: number;
  qaQty: number | null;
  qaComments: string;
  mapNotes?: string;
  cuCheck: boolean;
  wfCheck: boolean;
  qtyCheck: boolean;
}

export interface CULookupItem {
  code: string;
  description: string;
}

export interface DashboardMetrics {
  totalRows: number;
  okCount: number;
  needsRevisionCount: number;
  cuMatchRate: number;
  wfMatchRate: number;
  qtyMatchRate: number;
}
