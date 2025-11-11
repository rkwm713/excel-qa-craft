import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import type { QAReviewRow } from "@/types/qa-tool";
import type { PostgrestError } from "@supabase/supabase-js";

type Review = Tables<"reviews">;
type ReviewRow = Tables<"review_rows">;
type UserInsert = TablesInsert<"users">;
type ReviewUpdate = TablesUpdate<"reviews">;

type ReviewRowInput = Partial<QAReviewRow> & Record<string, any>;

const REVIEW_ROW_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const toNumeric = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toFlag = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["true", "t", "yes", "y", "1"].includes(normalized)) return 1;
    if (["false", "f", "no", "n", "0"].includes(normalized)) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const serializeReviewRows = (rows: ReviewRowInput[] | undefined): Record<string, unknown>[] => {
  return (rows ?? []).map((row, index) => {
    const rawId = typeof row.id === "string" ? row.id : undefined;
    const issueType = (row.issue_type ?? row.issueType ?? "NEEDS REVISIONS") as string;
    const station = row.station ?? "";

    return {
      id: rawId && REVIEW_ROW_UUID_REGEX.test(rawId) ? rawId : undefined,
      station,
      issue_type: issueType,
      qa_comments: row.qa_comments ?? row.qaComments ?? row.description ?? null,
      description: row.description ?? null,
      work_set: row.work_set ?? row.workSet ?? null,
      qa_cu: row.qa_cu ?? row.qaCU ?? null,
      qa_qty: toNumeric(row.qa_qty ?? row.qaQty),
      qa_wf: row.qa_wf ?? row.qaWF ?? null,
      designer_cu: row.designer_cu ?? row.designerCU ?? null,
      designer_qty: toNumeric(row.designer_qty ?? row.designerQty),
      designer_wf: row.designer_wf ?? row.designerWF ?? null,
      cu_check: toFlag(row.cu_check ?? row.cuCheck),
      wf_check: toFlag(row.wf_check ?? row.wfCheck),
      qty_check: toFlag(row.qty_check ?? row.qtyCheck),
      map_notes: row.map_notes ?? row.mapNotes ?? null,
      row_order:
        typeof row.row_order === "number"
          ? row.row_order
          : typeof row.rowOrder === "number"
            ? row.rowOrder
            : index,
    };
  });
};

const deserializeReviewRows = (rows: ReviewRow[]): QAReviewRow[] => {
  return rows.map((row) => ({
    id: row.id,
    issueType: (row.issue_type as QAReviewRow["issueType"]) ?? "NEEDS REVISIONS",
    station: row.station ?? "",
    workSet: row.work_set ?? "",
    designerCU: row.designer_cu ?? "",
    qaCU: row.qa_cu ?? "",
    description: row.description ?? "",
    designerWF: row.designer_wf ?? "",
    qaWF: row.qa_wf ?? "",
    designerQty: row.designer_qty ?? 0,
    qaQty: row.qa_qty ?? 0,
    qaComments: row.qa_comments ?? "",
    mapNotes: row.map_notes ?? undefined,
    cuCheck: (row.cu_check ?? 0) > 0,
    wfCheck: (row.wf_check ?? 0) > 0,
    qtyCheck: (row.qty_check ?? 0) > 0,
  }));
};

const ensureUserProfile = async () => {
  const { data: authUserRes, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const authUser = authUserRes?.user;
  if (!authUser) {
    throw new Error("You must be logged in to perform this action.");
  }

  const userId = authUser.id;
  const userEmail = authUser.email || "";
  const userName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    userEmail.split("@")[0] ||
    "user";

  const { data: existingUser, error: lookupErr } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (lookupErr) throw lookupErr;

  if (!existingUser) {
    const userInsert: UserInsert = {
      id: userId,
      email: userEmail,
      username: userName,
      full_name:
        authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      password_hash: "auth_user",
    };

    const { error: userErr } = await supabase.from("users").insert([userInsert]);
    if (userErr) {
      logger.warn("Failed to create user record:", userErr);
    }
  }

  return authUser;
};

const executeRpc = async <T>(
  functionName: string,
  params: Record<string, unknown>
) => {
  return (supabase.rpc as unknown as (
    fn: string,
    p: Record<string, unknown>
  ) => Promise<{ data: T | null; error: PostgrestError | null }>)(functionName, params);
};

export interface ReviewData {
  review: Review & {
    username?: string;
    full_name?: string;
  };
  reviewRows: QAReviewRow[];
  cuLookup: Array<{ code: string; description: string }>;
  stationPageMapping: Record<string, number>;
  stationSpecMapping: Record<string, string>;
  editedSpecMapping: Record<string, string>;
  pdfAnnotations: Record<number, Array<Record<string, unknown>>>;
  workPointNotes: Record<string, string>;
  kmzPlacemarks: Array<Record<string, unknown>>;
  pdfFile?: null;
}

export interface ReviewListItem {
  id: string;
  title: string;
  description?: string;
  file_name?: string;
  kmz_file_name?: string;
  pdf_file_name?: string;
  wo_number?: string | null;
  designer?: string | null;
  qa_tech?: string | null;
  project?: string | null;
  status?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  username?: string;
  full_name?: string;
}

export const reviewsAPI = {
  list: async (
    createdBy?: string,
    limit = 50,
    offset = 0
  ): Promise<{ reviews: ReviewListItem[] }> => {
    let query = supabase
      .from("reviews")
      .select(
        "id, title, description, status, wo_number, designer, qa_tech, project, file_name, kmz_file_name, pdf_file_name, created_by, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (createdBy) {
      query = query.eq("created_by", createdBy);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { reviews: (data ?? []) as ReviewListItem[] };
  },

  get: async (id: string): Promise<ReviewData> => {
    const [{ data: review, error: rErr }, { data: reviewRows, error: rrErr }] = await Promise.all([
      supabase.from("reviews").select("*").eq("id", id).single(),
      supabase
        .from("review_rows")
        .select("*")
        .eq("review_id", id)
        .order("row_order", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true }),
    ]);

    if (rErr) throw rErr;
    if (rrErr) throw rrErr;
    if (!review) {
      throw new Error("Review not found");
    }

    const normalizedRows = deserializeReviewRows((reviewRows ?? []) as ReviewRow[]);

    return {
      review: review as Review & { username?: string; full_name?: string },
      reviewRows: normalizedRows,
      cuLookup: [],
      stationPageMapping: {},
      stationSpecMapping: {},
      editedSpecMapping: {},
      pdfAnnotations: {},
      workPointNotes: {},
      kmzPlacemarks: [],
      pdfFile: null,
    };
  },

  create: async (data: {
    title: string;
    description?: string;
    fileName?: string;
    kmzFileName?: string;
    pdfFileName?: string;
    pdfFile?: File;
    woNumber?: string;
    designer?: string;
    qaTech?: string;
    project?: string;
    status?: string;
    reviewRows: ReviewRowInput[];
    cuLookup: Array<{ code: string; description: string }>;
    stationPageMapping?: Record<string, number>;
    stationSpecMapping?: Record<string, string>;
    editedSpecMapping?: Record<string, string>;
    pdfAnnotations?: Map<number, Array<Record<string, unknown>>>;
    workPointNotes?: Record<string, string>;
    kmzPlacemarks?: Array<Record<string, unknown>>;
  }): Promise<{ id: string; message: string }> => {
    await ensureUserProfile();

    const rowsPayload = serializeReviewRows(data.reviewRows);
    const { data: createdReviewId, error: rpcError } = await executeRpc<string>(
      "create_review_with_rows",
      {
        p_title: data.title,
        p_description: data.description ?? null,
        p_status: data.status ?? "Needs QA Review",
        p_file_name: data.fileName ?? null,
        p_kmz_file_name: data.kmzFileName ?? null,
        p_pdf_file_name: data.pdfFile ? null : data.pdfFileName ?? null,
        p_wo_number: data.woNumber ?? null,
        p_designer: data.designer ?? null,
        p_qa_tech: data.qaTech ?? null,
        p_project: data.project ?? null,
        p_rows: rowsPayload,
      }
    );

    if (rpcError) throw rpcError;
    if (!createdReviewId) {
      throw new Error("Failed to create review");
    }

    const reviewId = createdReviewId;
    const fileUpdates: ReviewUpdate = {};

    if (data.pdfFile) {
      const storagePath = `reviews/${reviewId}/${data.pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("pdf-files")
        .upload(storagePath, data.pdfFile, {
          contentType: data.pdfFile.type || "application/pdf",
          upsert: true,
        });
      if (uploadError) throw uploadError;
      fileUpdates.pdf_file_name = storagePath;
    } else if (data.pdfFileName) {
      fileUpdates.pdf_file_name = data.pdfFileName;
    }

    if (Object.keys(fileUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from("reviews")
        .update(fileUpdates)
        .eq("id", reviewId);
      if (updateError) throw updateError;
    }

    return { id: reviewId, message: "Review created" };
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      woNumber?: string | null;
      designer?: string | null;
      qaTech?: string | null;
      project?: string | null;
      status?: string | null;
      reviewRows?: ReviewRowInput[];
      cuLookup?: Array<{ code: string; description: string }>;
      stationPageMapping?: Record<string, number>;
      stationSpecMapping?: Record<string, string>;
      editedSpecMapping?: Record<string, string>;
      pdfAnnotations?: Map<number, Array<Record<string, unknown>>>;
      workPointNotes?: Record<string, string>;
    }
  ): Promise<{ message: string }> => {
    await ensureUserProfile();

    const updateFields: ReviewUpdate = {};
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.woNumber !== undefined) updateFields.wo_number = data.woNumber;
    if (data.designer !== undefined) updateFields.designer = data.designer;
    if (data.qaTech !== undefined) updateFields.qa_tech = data.qaTech;
    if (data.project !== undefined) updateFields.project = data.project;
    if (data.status !== undefined) updateFields.status = data.status;

    if (Object.keys(updateFields).length > 0) {
      const { error: reviewUpdateError } = await supabase
        .from("reviews")
        .update(updateFields)
        .eq("id", id);
      if (reviewUpdateError) throw reviewUpdateError;
    }

    if (data.reviewRows) {
      const rowsPayload = serializeReviewRows(data.reviewRows);
      const { error: rowsError } = await executeRpc<void>("update_review_rows", {
        p_review_id: id,
        p_rows: rowsPayload,
      });
      if (rowsError) throw rowsError;
    }

    return { message: "Review updated" };
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
    return { message: "Review deleted" };
  },
};


