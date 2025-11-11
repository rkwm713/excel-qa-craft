import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Helper to authenticate token
const authenticateToken = (event) => {
  const authHeader = event.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return null;
  }
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  if (!supabase) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Database not configured' }),
    };
  }

  const path = event.path.replace('/.netlify/functions/reviews', '');
  const method = event.httpMethod;

  try {
    // Get all reviews
    if (path === '' && method === 'GET') {
      const { created_by, limit = 50, offset = 0 } = event.queryStringParameters || {};
      
      let query = supabase
        .from('reviews')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (created_by) {
        query = query.eq('created_by', created_by);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to fetch reviews' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ reviews: data || [] }),
      };
    }

    // Get single review
    if (path.startsWith('/') && method === 'GET' && path !== '/') {
      const id = path.substring(1);

      // Fetch review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single();

      if (reviewError || !review) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Review not found' }),
        };
      }

      // Fetch all related data
      const [rowsResult, cuResult, mappingsResult, annotationsResult, notesResult, placemarksResult, pdfFileResult] = await Promise.all([
        supabase.from('review_rows').select('*').eq('review_id', id).order('row_order'),
        supabase.from('cu_lookup').select('*').eq('review_id', id),
        supabase.from('pdf_mappings').select('*').eq('review_id', id),
        supabase.from('pdf_annotations').select('*').eq('review_id', id),
        supabase.from('work_point_notes').select('*').eq('review_id', id),
        supabase.from('kmz_placemarks').select('*').eq('review_id', id),
        supabase.from('pdf_files').select('*').eq('review_id', id).single(),
      ]);

      const rows = rowsResult.data || [];
      const cu = cuResult.data || [];
      const mappings = mappingsResult.data || [];
      const annotations = annotationsResult.data || [];
      const notes = notesResult.data || [];
      const placemarks = placemarksResult.data || [];
      const pdfFile = pdfFileResult.data;

      // Build mappings
      const stationPageMapping = {};
      const stationSpecMapping = {};
      const editedSpecMapping = {};
      mappings.forEach(m => {
        stationPageMapping[m.station] = m.page_number;
        if (m.spec_number) stationSpecMapping[m.station] = m.spec_number;
        if (m.edited_spec_number) editedSpecMapping[m.station] = m.edited_spec_number;
      });

      const annotationsMap = {};
      annotations.forEach(a => {
        annotationsMap[a.page_number] = a.annotation_data;
      });

      const notesMap = {};
      notes.forEach(n => {
        notesMap[n.work_point] = n.notes;
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          review,
          reviewRows: rows.map(r => ({
            id: r.id,
            issueType: r.issue_type,
            station: r.station,
            workSet: r.work_set,
            designerCU: r.designer_cu,
            qaCU: r.qa_cu,
            description: r.description,
            designerWF: r.designer_wf,
            qaWF: r.qa_wf,
            designerQty: r.designer_qty,
            qaQty: r.qa_qty,
            qaComments: r.qa_comments || '',
            mapNotes: r.map_notes || '',
            cuCheck: Boolean(r.cu_check),
            wfCheck: Boolean(r.wf_check),
            qtyCheck: Boolean(r.qty_check),
          })),
          cuLookup: cu.map(c => ({ code: c.code, description: c.description })),
          stationPageMapping,
          stationSpecMapping,
          editedSpecMapping,
          pdfAnnotations: annotationsMap,
          workPointNotes: notesMap,
          kmzPlacemarks: placemarks.map(p => p.placemark_data),
          pdfFile: pdfFile ? {
            data: (() => {
              try {
                const raw = pdfFile.file_data;
                if (typeof raw === 'string' && raw.startsWith('\\x')) {
                  const hex = raw.slice(2);
                  return Buffer.from(hex, 'hex').toString('base64');
                }
                if (raw instanceof Uint8Array || Array.isArray(raw)) {
                  return Buffer.from(raw).toString('base64');
                }
                // Fallback
                return Buffer.from(String(raw)).toString('base64');
              } catch (e) {
                return '';
              }
            })(),
            fileName: pdfFile.file_name,
            mimeType: pdfFile.mime_type,
          } : null,
        }),
      };
    }

    // Create review
    if (path === '' && method === 'POST') {
      const user = authenticateToken(event);
      if (!user) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      let requestData;
      try {
        requestData = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid request format' }),
        };
      }

      const {
        title,
        description,
        fileName,
        kmzFileName,
        pdfFileName,
        reviewRows: rows,
        cuLookup: cu,
        stationPageMapping,
        stationSpecMapping,
        editedSpecMapping,
        pdfAnnotations: annotations,
        workPointNotes: notes,
        kmzPlacemarks: placemarks,
        pdfFile: pdfFileData,
        pdfStoragePath,
      } = requestData;

      if (!title) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Title is required' }),
        };
      }

      const reviewId = uuidv4();
      const newReview = {
        id: reviewId,
        title,
        description: description || null,
        file_name: fileName || null,
        kmz_file_name: kmzFileName || null,
        pdf_file_name: pdfStoragePath || pdfFileName || null, // store storage path here
        created_by: user.id,
      };

      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([newReview]);

      if (reviewError) {
        console.error('Error creating review:', reviewError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            error: 'Failed to create review',
            details: reviewError.message || JSON.stringify(reviewError)
          }),
        };
      }

      // Insert review rows
      if (rows && Array.isArray(rows) && rows.length > 0) {
        try {
          const reviewRowsData = rows.map((row, i) => ({
            id: uuidv4(),
            review_id: reviewId,
            issue_type: row.issueType,
            station: row.station,
            work_set: row.workSet || null,
            designer_cu: row.designerCU || null,
            qa_cu: row.qaCU || null,
            description: row.description || null,
            designer_wf: row.designerWF || null,
            qa_wf: row.qaWF || null,
            designer_qty: row.designerQty || 0,
            qa_qty: row.qaQty || 0,
            qa_comments: row.qaComments || '',
            map_notes: row.mapNotes || '',
            cu_check: row.cuCheck ? 1 : 0,
            wf_check: row.wfCheck ? 1 : 0,
            qty_check: row.qtyCheck ? 1 : 0,
            row_order: i,
          }));

          const { error: rowsError } = await supabase.from('review_rows').insert(reviewRowsData);
          if (rowsError) {
            console.error('Error inserting review rows:', rowsError);
            throw new Error(`Failed to insert review rows: ${rowsError.message}`);
          }
        } catch (e) {
          console.error('Error processing review rows:', e);
          throw e;
        }
      }

      // Insert CU lookup
      if (cu && Array.isArray(cu) && cu.length > 0) {
        try {
          const cuData = cu.map(cuItem => ({
            id: uuidv4(),
            review_id: reviewId,
            code: cuItem.code,
            description: cuItem.description || null,
          }));

          const { error: cuError } = await supabase.from('cu_lookup').insert(cuData);
          if (cuError) {
            console.error('Error inserting CU lookup:', cuError);
            throw new Error(`Failed to insert CU lookup: ${cuError.message}`);
          }
        } catch (e) {
          console.error('Error processing CU lookup:', e);
          throw e;
        }
      }

      // Insert PDF mappings
      if (stationPageMapping) {
        try {
          const mappingsData = Object.entries(stationPageMapping).map(([station, pageNumber]) => ({
            id: uuidv4(),
            review_id: reviewId,
            station,
            page_number: pageNumber,
            spec_number: stationSpecMapping?.[station] || null,
            edited_spec_number: editedSpecMapping?.[station] || null,
          }));

          if (mappingsData.length > 0) {
            const { error: mappingsError } = await supabase.from('pdf_mappings').insert(mappingsData);
            if (mappingsError) {
              console.error('Error inserting PDF mappings:', mappingsError);
              throw new Error(`Failed to insert PDF mappings: ${mappingsError.message}`);
            }
          }
        } catch (e) {
          console.error('Error processing PDF mappings:', e);
          throw e;
        }
      }

      // Insert PDF annotations
      if (annotations) {
        try {
          const annotationsData = Object.entries(annotations).map(([pageNumber, annotationData]) => ({
            id: uuidv4(),
            review_id: reviewId,
            page_number: parseInt(pageNumber),
            annotation_data: annotationData,
          }));

          if (annotationsData.length > 0) {
            const { error: annotationsError } = await supabase.from('pdf_annotations').insert(annotationsData);
            if (annotationsError) {
              console.error('Error inserting PDF annotations:', annotationsError);
              throw new Error(`Failed to insert PDF annotations: ${annotationsError.message}`);
            }
          }
        } catch (e) {
          console.error('Error processing PDF annotations:', e);
          throw e;
        }
      }

      // Insert work point notes
      if (notes) {
        try {
          const notesData = Object.entries(notes).map(([workPoint, noteText]) => ({
            id: uuidv4(),
            review_id: reviewId,
            work_point: workPoint,
            notes: noteText || null,
          }));

          if (notesData.length > 0) {
            const { error: notesError } = await supabase.from('work_point_notes').insert(notesData);
            if (notesError) {
              console.error('Error inserting work point notes:', notesError);
              throw new Error(`Failed to insert work point notes: ${notesError.message}`);
            }
          }
        } catch (e) {
          console.error('Error processing work point notes:', e);
          throw e;
        }
      }

      // Insert KMZ placemarks
      if (placemarks && Array.isArray(placemarks) && placemarks.length > 0) {
        try {
          const placemarksData = placemarks.map(placemark => ({
            id: uuidv4(),
            review_id: reviewId,
            placemark_data: placemark,
          }));

          const { error: placemarksError } = await supabase.from('kmz_placemarks').insert(placemarksData);
          if (placemarksError) {
            console.error('Error inserting KMZ placemarks:', placemarksError);
            throw new Error(`Failed to insert KMZ placemarks: ${placemarksError.message}`);
          }
        } catch (e) {
          console.error('Error processing KMZ placemarks:', e);
          throw e;
        }
      }

      // Insert PDF file if provided
      if (pdfFileData && pdfFileData.data) {
        // Deprecated path: we no longer store blobs here to avoid limits
        console.log('Skipping inline PDF storage; using Supabase Storage path instead');
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ id: reviewId, message: 'Review created successfully' }),
      };
    }

    // Update review
    if (path.startsWith('/') && method === 'PUT' && path !== '/') {
      const id = path.substring(1);
      const user = authenticateToken(event);
      if (!user) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      // Check if review exists and user owns it
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('created_by')
        .eq('id', id)
        .single();

      if (reviewError || !review || review.created_by !== user.id) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Not authorized' }),
        };
      }

      const requestData = JSON.parse(event.body);
      const { title, description, reviewRows: rows, cuLookup: cu, stationPageMapping, stationSpecMapping, editedSpecMapping, pdfAnnotations: annotations, workPointNotes: notes } = requestData;

      // Update review metadata
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      updateData.updated_at = new Date().toISOString();

      await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id);

      // Delete existing related data
      await Promise.all([
        supabase.from('review_rows').delete().eq('review_id', id),
        supabase.from('cu_lookup').delete().eq('review_id', id),
        supabase.from('pdf_mappings').delete().eq('review_id', id),
        supabase.from('pdf_annotations').delete().eq('review_id', id),
        supabase.from('work_point_notes').delete().eq('review_id', id),
      ]);

      // Re-insert data (same as create)
      if (rows && Array.isArray(rows) && rows.length > 0) {
        const reviewRowsData = rows.map((row, i) => ({
          id: uuidv4(),
          review_id: id,
          issue_type: row.issueType,
          station: row.station,
          work_set: row.workSet || null,
          designer_cu: row.designerCU || null,
          qa_cu: row.qaCU || null,
          description: row.description || null,
          designer_wf: row.designerWF || null,
          qa_wf: row.qaWF || null,
          designer_qty: row.designerQty || 0,
          qa_qty: row.qaQty || 0,
          qa_comments: row.qaComments || '',
          map_notes: row.mapNotes || '',
          cu_check: row.cuCheck ? 1 : 0,
          wf_check: row.wfCheck ? 1 : 0,
          qty_check: row.qtyCheck ? 1 : 0,
          row_order: i,
        }));

        await supabase.from('review_rows').insert(reviewRowsData);
      }

      if (cu && Array.isArray(cu) && cu.length > 0) {
        const cuData = cu.map(cuItem => ({
          id: uuidv4(),
          review_id: id,
          code: cuItem.code,
          description: cuItem.description || null,
        }));

        await supabase.from('cu_lookup').insert(cuData);
      }

      if (stationPageMapping) {
        const mappingsData = Object.entries(stationPageMapping).map(([station, pageNumber]) => ({
          id: uuidv4(),
          review_id: id,
          station,
          page_number: pageNumber,
          spec_number: stationSpecMapping?.[station] || null,
          edited_spec_number: editedSpecMapping?.[station] || null,
        }));

        if (mappingsData.length > 0) {
          await supabase.from('pdf_mappings').insert(mappingsData);
        }
      }

      if (annotations) {
        const annotationsData = Object.entries(annotations).map(([pageNumber, annotationData]) => ({
          id: uuidv4(),
          review_id: id,
          page_number: parseInt(pageNumber),
          annotation_data: annotationData,
        }));

        if (annotationsData.length > 0) {
          await supabase.from('pdf_annotations').insert(annotationsData);
        }
      }

      if (notes) {
        const notesData = Object.entries(notes).map(([workPoint, noteText]) => ({
          id: uuidv4(),
          review_id: id,
          work_point: workPoint,
          notes: noteText || null,
        }));

        if (notesData.length > 0) {
          await supabase.from('work_point_notes').insert(notesData);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Review updated successfully' }),
      };
    }

    // Delete review
    if (path.startsWith('/') && method === 'DELETE' && path !== '/') {
      const id = path.substring(1);
      const user = authenticateToken(event);
      if (!user) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      // Check if review exists and user owns it
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('created_by')
        .eq('id', id)
        .single();

      if (reviewError || !review || review.created_by !== user.id) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Not authorized' }),
        };
      }

      // Delete review (cascade will handle related data)
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting review:', deleteError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to delete review' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Review deleted successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error in reviews function:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};
