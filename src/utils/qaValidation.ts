import { QAReviewRow } from "@/types/qa-tool";

const cleanString = (value: string | null | undefined) =>
  value ? value.trim() : "";

const normalizeQty = (value: QAReviewRow["qaQty"]) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeQaRow = (row: QAReviewRow): QAReviewRow => {
  const qaCU = cleanString(row.qaCU);
  const qaWF = cleanString(row.qaWF);
  const qaQty = normalizeQty(row.qaQty);

  const designerCU = cleanString(row.designerCU);
  const designerWF = cleanString(row.designerWF);

  const cuCheck = qaCU === "" ? true : qaCU === designerCU;
  const wfCheck = qaWF === "" ? true : qaWF === designerWF;
  const qtyCheck = qaQty === null ? true : qaQty === row.designerQty;

  const qaHasValue = qaCU !== "" || qaWF !== "" || qaQty !== null;
  const issueType =
    qaHasValue && cuCheck && wfCheck && qtyCheck ? "OK" : "NEEDS REVISIONS";

  return {
    ...row,
    qaCU,
    qaWF,
    qaQty,
    cuCheck,
    wfCheck,
    qtyCheck,
    issueType,
  };
};

export const normalizeQaRows = (rows: QAReviewRow[]): QAReviewRow[] =>
  rows.map((row) => normalizeQaRow(row));

