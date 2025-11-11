import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Type aliases for better readability
type Review = Tables<'reviews'>;
type ReviewInsert = TablesInsert<'reviews'>;
type ReviewUpdate = TablesUpdate<'reviews'>;
type ReviewRow = Tables<'review_rows'>;
type ReviewRowInsert = TablesInsert<'review_rows'>;
type User = Tables<'users'>;
type UserInsert = TablesInsert<'users'>;
type WorkPoint = Tables<'work_points'>;
type WorkPointInsert = TablesInsert<'work_points'>;
type FileInsert = TablesInsert<'files'>;
type CULookup = Tables<'cu_lookup'>;
type PDFMapping = Tables<'pdf_mappings'>;
type PDFAnnotation = Tables<'pdf_annotations'>;
type WorkPointNote = Tables<'work_point_notes'>;
type KMZPlacemark = Tables<'kmz_placemarks'>;

// Reviews API
export interface ReviewData {
  review: Review & {
    username?: string;
    full_name?: string;
  };
  reviewRows: ReviewRow[];
  cuLookup: Array<{ code: string; description: string }>;
  stationPageMapping: Record<string, number>;
  stationSpecMapping: Record<string, string>;
  editedSpecMapping: Record<string, string>;
  pdfAnnotations: Record<number, PDFAnnotation['annotation_data'][]>;
  workPointNotes: Record<string, string>;
  kmzPlacemarks: KMZPlacemark[];
  pdfFile?: {
    data: string; // base64 encoded
    fileName: string;
    mimeType: string;
  } | null;
}

export interface ReviewListItem extends Review {
  username?: string;
  full_name?: string;
}

export const reviewsAPI = {
  list: async (createdBy?: string, limit = 50, offset = 0): Promise<{ reviews: ReviewListItem[] }> => {
    let query = supabase
      .from('reviews')
      .select('id, title, description, file_name, kmz_file_name, pdf_file_name, status, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { reviews: (data ?? []) as ReviewListItem[] };
  },

  get: async (id: string): Promise<ReviewData> => {
    const [
      { data: review, error: rErr },
      { data: reviewRows, error: rrErr },
      { data: cuLookup, error: cuErr },
      { data: pdfMappings, error: pmErr },
      { data: pdfAnnotations, error: paErr },
      { data: workPointNotes, error: wpnErr },
      { data: kmzPlacemarks, error: kmzErr },
      { data: pdfFiles, error: pfErr },
    ] = await Promise.all([
      supabase.from('reviews').select('*').eq('id', id).single(),
      supabase.from('review_rows').select('*').eq('review_id', id),
      supabase.from('cu_lookup').select('*').eq('review_id', id),
      supabase.from('pdf_mappings').select('*').eq('review_id', id),
      supabase.from('pdf_annotations').select('*').eq('review_id', id),
      supabase.from('work_point_notes').select('*').eq('review_id', id),
      supabase.from('kmz_placemarks').select('*').eq('review_id', id),
      supabase.from('pdf_files').select('*').eq('review_id', id).maybeSingle(),
    ]);
    
    if (rErr) throw rErr;
    
    // Build station page mapping from pdf_mappings
    const stationPageMapping: Record<string, number> = {};
    if (pdfMappings) {
      pdfMappings.forEach((mapping) => {
        stationPageMapping[mapping.station] = mapping.page_number;
      });
    }
    
    // Build station spec mapping from pdf_mappings
    const stationSpecMapping: Record<string, string> = {};
    const editedSpecMapping: Record<string, string> = {};
    if (pdfMappings) {
      pdfMappings.forEach((mapping) => {
        if (mapping.spec_number) {
          stationSpecMapping[mapping.station] = mapping.spec_number;
        }
        if (mapping.edited_spec_number) {
          editedSpecMapping[mapping.station] = mapping.edited_spec_number;
        }
      });
    }
    
    // Build pdf annotations map
    const pdfAnnotationsMap: Record<number, PDFAnnotation['annotation_data'][]> = {};
    if (pdfAnnotations) {
      pdfAnnotations.forEach((annotation) => {
        if (!pdfAnnotationsMap[annotation.page_number]) {
          pdfAnnotationsMap[annotation.page_number] = [];
        }
        pdfAnnotationsMap[annotation.page_number].push(annotation.annotation_data);
      });
    }
    
    // Build work point notes map
    const workPointNotesMap: Record<string, string> = {};
    if (workPointNotes) {
      workPointNotes.forEach((note) => {
        if (note.notes) {
          workPointNotesMap[note.work_point] = note.notes;
        }
      });
    }
    
    // Build CU lookup array
    const cuLookupArray: Array<{ code: string; description: string }> = [];
    if (cuLookup) {
      cuLookup.forEach((cu) => {
        cuLookupArray.push({
          code: cu.code,
          description: cu.description || '',
        });
      });
    }
    
    // Handle PDF file
    let pdfFile: ReviewData['pdfFile'] = null;
    if (pdfFiles && pdfFiles.file_data) {
      pdfFile = {
        data: pdfFiles.file_data,
        fileName: pdfFiles.file_name,
        mimeType: pdfFiles.mime_type || 'application/pdf',
      };
    }
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    return {
      review: review as Review & { username?: string; full_name?: string },
      reviewRows: (reviewRows ?? []) as ReviewRow[],
      cuLookup: cuLookupArray,
      stationPageMapping,
      stationSpecMapping,
      editedSpecMapping,
      pdfAnnotations: pdfAnnotationsMap,
      workPointNotes: workPointNotesMap,
      kmzPlacemarks: (kmzPlacemarks ?? []) as KMZPlacemark[],
      pdfFile,
    };
  },

  create: async (data: {
    title: string;
    description?: string;
    fileName?: string;
    kmzFileName?: string;
    pdfFileName?: string;
    pdfFile?: File;
    reviewRows: ReviewRow[];
    cuLookup: Array<{ code: string; description: string }>;
    stationPageMapping?: Record<string, number>;
    stationSpecMapping?: Record<string, string>;
    editedSpecMapping?: Record<string, string>;
    pdfAnnotations?: Map<number, PDFAnnotation['annotation_data'][]>;
    workPointNotes?: Record<string, string>;
    kmzPlacemarks?: KMZPlacemark[];
  }): Promise<{ id: string; message: string }> => {
    // Ensure the current user has a users record to satisfy FK on reviews.created_by
    const { data: authUserRes, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    const authUser = authUserRes?.user;
    if (!authUser) {
      throw new Error('You must be logged in to create a review.');
    }
    // Ensure the user exists in users table to satisfy FK on reviews.created_by
    // Note: users.id is text, auth.uid() is UUID, so we use the UUID as text
    const userId = authUser.id; // This is already a string/UUID
    const userEmail = authUser.email || '';
    const userName = authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name || 
                     userEmail.split('@')[0] || 
                     'user';
    
    // Check if user exists first
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    // Only insert if user doesn't exist (don't overwrite existing password_hash)
    if (!existingUser) {
      const userInsert: UserInsert = {
        id: userId,
        email: userEmail,
        username: userName,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        password_hash: 'auth_user', // Placeholder for auth users (required field)
      };
      
      const { error: userErr } = await supabase
        .from('users')
        .insert([userInsert]);
      
      if (userErr) {
        // If insert fails (e.g., user was created between check and insert), ignore the error
        // The trigger will handle setting created_by, and if user doesn't exist, we'll get a FK error
        // which is more informative than trying to upsert without password_hash
        // User record creation failed, but this is non-critical
        // The trigger will handle setting created_by, and if user doesn't exist, we'll get a FK error
      }
    }

    // Create review (omit id and created_by - they are auto-generated via default/trigger)
    const reviewInsert: ReviewInsert = {
      title: data.title,
      description: data.description || null,
      file_name: data.fileName || null,
      kmz_file_name: data.kmzFileName || null,
      pdf_file_name: data.pdfFileName || null,
    };

    const { data: review, error } = await supabase
      .from('reviews')
      .insert([reviewInsert]) // created_by is auto-set by trigger, status defaults to 'draft', id is auto-generated
      .select()
      .single();
    if (error) throw error;
    if (!review) throw new Error('Failed to create review');
    const reviewId = review.id;

    // Insert review_rows if provided
    if (Array.isArray(data.reviewRows) && data.reviewRows.length > 0) {
      const reviewRowsInsert: ReviewRowInsert[] = data.reviewRows.map((r) => ({
        id: r.id || crypto.randomUUID(),
        review_id: reviewId,
        station: r.station || '',
        issue_type: r.issueType || 'NEEDS REVISIONS',
        designer_cu: r.designerCU || null,
        qa_cu: r.qaCU || null,
        designer_wf: r.designerWF || null,
        qa_wf: r.qaWF || null,
        designer_qty: r.designerQty || null,
        qa_qty: r.qaQty || null,
        description: r.description || null,
        qa_comments: r.qaComments || null,
        cu_check: r.cuCheck ? 1 : 0,
        wf_check: r.wfCheck ? 1 : 0,
        qty_check: r.qtyCheck ? 1 : 0,
        work_set: r.workSet || null,
        map_notes: null,
        row_order: null,
      }));
      const { error: rrErr } = await supabase.from('review_rows').insert(reviewRowsInsert);
      if (rrErr) throw rrErr;
    }
    
    // Insert CU lookup if provided
    if (Array.isArray(data.cuLookup) && data.cuLookup.length > 0) {
      const cuLookupInsert: TablesInsert<'cu_lookup'>[] = data.cuLookup.map((cu) => ({
        id: crypto.randomUUID(),
        review_id: reviewId,
        code: cu.code,
        description: cu.description || null,
      }));
      const { error: cuErr } = await supabase.from('cu_lookup').insert(cuLookupInsert);
      if (cuErr) throw cuErr;
    }
    
    // Insert PDF mappings if provided
    if (data.stationPageMapping || data.stationSpecMapping || data.editedSpecMapping) {
      const pdfMappingsInsert: TablesInsert<'pdf_mappings'>[] = [];
      const allStations = new Set([
        ...Object.keys(data.stationPageMapping || {}),
        ...Object.keys(data.stationSpecMapping || {}),
        ...Object.keys(data.editedSpecMapping || {}),
      ]);
      
      allStations.forEach((station) => {
        pdfMappingsInsert.push({
          id: crypto.randomUUID(),
          review_id: reviewId,
          station,
          page_number: data.stationPageMapping?.[station] || 1,
          spec_number: data.stationSpecMapping?.[station] || null,
          edited_spec_number: data.editedSpecMapping?.[station] || null,
        });
      });
      
      if (pdfMappingsInsert.length > 0) {
        const { error: pmErr } = await supabase.from('pdf_mappings').insert(pdfMappingsInsert);
        if (pmErr) throw pmErr;
      }
    }
    
    // Insert PDF annotations if provided
    if (data.pdfAnnotations && data.pdfAnnotations.size > 0) {
      const pdfAnnotationsInsert: TablesInsert<'pdf_annotations'>[] = [];
      data.pdfAnnotations.forEach((annotations, pageNumber) => {
        annotations.forEach((annotation) => {
          pdfAnnotationsInsert.push({
            id: crypto.randomUUID(),
            review_id: reviewId,
            page_number: pageNumber,
            annotation_data: annotation,
          });
        });
      });
      
      if (pdfAnnotationsInsert.length > 0) {
        const { error: paErr } = await supabase.from('pdf_annotations').insert(pdfAnnotationsInsert);
        if (paErr) throw paErr;
      }
    }
    
    // Insert work point notes if provided
    if (data.workPointNotes && Object.keys(data.workPointNotes).length > 0) {
      const workPointNotesInsert: TablesInsert<'work_point_notes'>[] = Object.entries(data.workPointNotes).map(([workPoint, notes]) => ({
        id: crypto.randomUUID(),
        review_id: reviewId,
        work_point: workPoint,
        notes: notes || null,
      }));
      const { error: wpnErr } = await supabase.from('work_point_notes').insert(workPointNotesInsert);
      if (wpnErr) throw wpnErr;
    }
    
    // Insert KMZ placemarks if provided
    if (Array.isArray(data.kmzPlacemarks) && data.kmzPlacemarks.length > 0) {
      const kmzPlacemarksInsert: TablesInsert<'kmz_placemarks'>[] = data.kmzPlacemarks.map((placemark) => ({
        id: crypto.randomUUID(),
        review_id: reviewId,
        placemark_data: placemark.placemark_data || placemark,
      }));
      const { error: kmzErr } = await supabase.from('kmz_placemarks').insert(kmzPlacemarksInsert);
      if (kmzErr) throw kmzErr;
    }

    // Optional: upload PDF to storage
    if (data.pdfFile) {
      const path = `reviews/${reviewId}/${data.pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdf-files')
        .upload(path, data.pdfFile, {
          contentType: data.pdfFile.type || 'application/pdf',
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const fileInsert: FileInsert = {
        id: crypto.randomUUID(),
        review_id: reviewId,
        kind: 'pdf',
        path,
        size: data.pdfFile.size,
      };
      await supabase.from('files').insert([fileInsert]);
    }

    return { id: reviewId, message: 'Review created' };
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      reviewRows?: ReviewRow[];
      cuLookup?: Array<{ code: string; description: string }>;
      stationPageMapping?: Record<string, number>;
      stationSpecMapping?: Record<string, string>;
      editedSpecMapping?: Record<string, string>;
      pdfAnnotations?: Map<number, PDFAnnotation['annotation_data'][]>;
      workPointNotes?: Record<string, string>;
    }
  ): Promise<{ message: string }> => {
    const updateFields: ReviewUpdate = {};
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    
    const { error } = await supabase.from('reviews').update(updateFields).eq('id', id);
    if (error) throw error;
    
    // Update review rows if provided
    if (data.reviewRows) {
      // Delete existing rows and insert new ones (simplified approach)
      await supabase.from('review_rows').delete().eq('review_id', id);
      
      if (data.reviewRows.length > 0) {
        const reviewRowsInsert: ReviewRowInsert[] = data.reviewRows.map((r) => ({
          id: r.id || crypto.randomUUID(),
          review_id: id,
          station: r.station || '',
          issue_type: r.issueType || 'NEEDS REVISIONS',
          designer_cu: r.designerCU || null,
          qa_cu: r.qaCU || null,
          designer_wf: r.designerWF || null,
          qa_wf: r.qaWF || null,
          designer_qty: r.designerQty || null,
          qa_qty: r.qaQty || null,
          description: r.description || null,
          qa_comments: r.qaComments || null,
          cu_check: r.cuCheck ? 1 : 0,
          wf_check: r.wfCheck ? 1 : 0,
          qty_check: r.qtyCheck ? 1 : 0,
          work_set: r.workSet || null,
          map_notes: null,
          row_order: null,
        }));
        const { error: rrErr } = await supabase.from('review_rows').insert(reviewRowsInsert);
        if (rrErr) throw rrErr;
      }
    }
    
    // Update other related data similarly if needed
    // (CU lookup, PDF mappings, annotations, etc.)
    
    return { message: 'Review updated' };
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Review deleted' };
  },
};

