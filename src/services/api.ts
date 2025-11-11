import { supabase } from "@/integrations/supabase/client";

// Reviews API
export interface ReviewData {
  review: {
    id: string;
    title: string;
    description?: string;
    file_name?: string;
    kmz_file_name?: string;
    pdf_file_name?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    username?: string;
    full_name?: string;
  };
  reviewRows: any[];
  cuLookup: Array<{ code: string; description: string }>;
  stationPageMapping: Record<string, number>;
  stationSpecMapping: Record<string, string>;
  editedSpecMapping: Record<string, string>;
  pdfAnnotations: Record<number, any[]>;
  workPointNotes: Record<string, string>;
  kmzPlacemarks: any[];
  pdfFile?: {
    data: string; // base64 encoded
    fileName: string;
    mimeType: string;
  } | null;
}

export interface ReviewListItem {
  id: string;
  title: string;
  description?: string;
  file_name?: string;
  kmz_file_name?: string;
  pdf_file_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  username?: string;
  full_name?: string;
}

export const reviewsAPI = {
  list: async (createdBy?: string, limit = 50, offset = 0): Promise<{ reviews: ReviewListItem[] }> => {
    let query = supabase
      .from('reviews')
      .select('id, title, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { reviews: (data as any) ?? [] };
  },

  get: async (id: string): Promise<ReviewData> => {
    const [{ data: review, error: rErr }, { data: points, error: pErr }] = await Promise.all([
      supabase.from('reviews' as any).select('*').eq('id', id).single(),
      supabase.from('work_points' as any).select('*').eq('review_id', id),
    ]);
    if (rErr) throw rErr;
    if (pErr) throw pErr;
    return {
      review: review as any,
      reviewRows: points ?? [],
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
    reviewRows: any[];
    cuLookup: Array<{ code: string; description: string }>;
    stationPageMapping?: Record<string, number>;
    stationSpecMapping?: Record<string, string>;
    editedSpecMapping?: Record<string, string>;
    pdfAnnotations?: Map<number, any[]>;
    workPointNotes?: Record<string, string>;
    kmzPlacemarks?: any[];
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
      .from('users' as any)
      .select('id')
      .eq('id', userId)
      .single();
    
    // Only insert if user doesn't exist (don't overwrite existing password_hash)
    if (!existingUser) {
      const { error: userErr } = await supabase
        .from('users' as any)
        .insert([
          {
            id: userId,
            email: userEmail,
            username: userName,
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
            password_hash: 'auth_user', // Placeholder for auth users (required field)
          },
        ] as any);
      
      if (userErr) {
        // If insert fails (e.g., user was created between check and insert), ignore the error
        // The trigger will handle setting created_by, and if user doesn't exist, we'll get a FK error
        // which is more informative than trying to upsert without password_hash
        console.warn('Failed to create user record:', userErr);
      }
    }

    // Create review (omit id and created_by - they are auto-generated via default/trigger)
    const insertData: any = { title: data.title };
    if (data.description) insertData.description = data.description;

    const { data: review, error } = await supabase
      .from('reviews' as any)
      .insert([insertData]) // created_by is auto-set by trigger, status defaults to 'draft', id is auto-generated
      .select()
      .single();
    if (error) throw error;
    const reviewId = (review as any).id as string;

    // Insert work_points if provided
    if (Array.isArray(data.reviewRows) && data.reviewRows.length > 0) {
      const workPoints = data.reviewRows.map((r: any) => ({
        review_id: reviewId,
        notes: r.qa_comments ?? r.description ?? null,
        status: r.issue_type === 'OK' ? 'closed' : 'open',
      }));
      const { error: wpErr } = await supabase.from('work_points' as any).insert(workPoints as any);
      if (wpErr) throw wpErr;
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
      await supabase.from('files' as any).insert([{ review_id: reviewId, kind: 'pdf', path }] as any);
    }

    return { id: reviewId, message: 'Review created' };
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      reviewRows?: any[];
      cuLookup?: Array<{ code: string; description: string }>;
      stationPageMapping?: Record<string, number>;
      stationSpecMapping?: Record<string, string>;
      editedSpecMapping?: Record<string, string>;
      pdfAnnotations?: Map<number, any[]>;
      workPointNotes?: Record<string, string>;
    }
  ): Promise<{ message: string }> => {
    const updateFields: any = {};
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    const { error } = await supabase.from('reviews').update(updateFields).eq('id', id);
    if (error) throw error;
    return { message: 'Review updated' };
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Review deleted' };
  },
};

