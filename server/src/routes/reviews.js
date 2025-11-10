import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { get, all, run } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads (memory storage for now)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const router = express.Router();

// Get all reviews (with optional filtering)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { created_by, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT r.*, u.username, u.full_name FROM reviews r LEFT JOIN users u ON r.created_by = u.id';
    const params = [];
    
    if (created_by) {
      query += ' WHERE r.created_by = ?';
      params.push(created_by);
    }
    
    query += ' ORDER BY r.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const reviews = await all(query, params);
    
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single review with all data
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get review
    const review = await get(
      'SELECT r.*, u.username, u.full_name FROM reviews r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?',
      [id]
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Get review rows
    const rows = await all(
      'SELECT * FROM review_rows WHERE review_id = ? ORDER BY row_order, created_at',
      [id]
    );
    
    // Get CU lookup
    const cuLookup = await all('SELECT code, description FROM cu_lookup WHERE review_id = ?', [id]);
    
    // Get PDF mappings
    const pdfMappings = await all('SELECT * FROM pdf_mappings WHERE review_id = ?', [id]);
    
    // Get PDF file
    const pdfFile = await get('SELECT file_data, file_name, mime_type FROM pdf_files WHERE review_id = ?', [id]);
    
    // Get PDF annotations
    const pdfAnnotations = await all('SELECT * FROM pdf_annotations WHERE review_id = ?', [id]);
    
    // Get work point notes
    const workPointNotes = await all('SELECT work_point, notes FROM work_point_notes WHERE review_id = ?', [id]);
    
    // Get KMZ placemarks
    const kmzPlacemarks = await all('SELECT placemark_data FROM kmz_placemarks WHERE review_id = ?', [id]);
    
    // Transform data
    const stationPageMapping = {};
    const stationSpecMapping = {};
    const editedSpecMapping = {};
    pdfMappings.forEach(m => {
      stationPageMapping[m.station] = m.page_number;
      if (m.spec_number) {
        stationSpecMapping[m.station] = m.spec_number;
      }
      if (m.edited_spec_number) {
        editedSpecMapping[m.station] = m.edited_spec_number;
      }
    });
    
    const annotationsMap = {};
    pdfAnnotations.forEach(a => {
      annotationsMap[a.page_number] = JSON.parse(a.annotation_data);
    });
    
    const notesMap = {};
    workPointNotes.forEach(n => {
      notesMap[n.work_point] = n.notes;
    });
    
    const placemarks = kmzPlacemarks.map(p => JSON.parse(p.placemark_data));
    
    // Transform rows
    const reviewRows = rows.map(row => ({
      id: row.id,
      issueType: row.issue_type,
      station: row.station,
      workSet: row.work_set,
      designerCU: row.designer_cu,
      qaCU: row.qa_cu,
      description: row.description,
      designerWF: row.designer_wf,
      qaWF: row.qa_wf,
      designerQty: row.designer_qty,
      qaQty: row.qa_qty,
      qaComments: row.qa_comments || '',
      mapNotes: row.map_notes || '',
      cuCheck: Boolean(row.cu_check),
      wfCheck: Boolean(row.wf_check),
      qtyCheck: Boolean(row.qty_check),
    }));
    
    res.json({
      review,
      reviewRows,
      cuLookup,
      stationPageMapping,
      stationSpecMapping,
      editedSpecMapping,
      pdfAnnotations: annotationsMap,
      workPointNotes: notesMap,
      kmzPlacemarks: placemarks,
      pdfFile: pdfFile ? {
        data: pdfFile.file_data.toString('base64'),
        fileName: pdfFile.file_name,
        mimeType: pdfFile.mime_type,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new review - handle both JSON and multipart form data
router.post('/', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  try {
    // Parse data - could be in req.body (JSON) or req.body.data (multipart)
    let requestData;
    if (req.body.data) {
      // Multipart form data - parse JSON string
      requestData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } else {
      // Regular JSON body
      requestData = req.body;
    }

    const {
      title,
      description,
      fileName,
      kmzFileName,
      pdfFileName,
      reviewRows,
      cuLookup,
      stationPageMapping,
      stationSpecMapping,
      editedSpecMapping,
      pdfAnnotations,
      workPointNotes,
      kmzPlacemarks,
    } = requestData;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const reviewId = uuidv4();
    const userId = req.user.id;
    
    // Create review
    await run(
      `INSERT INTO reviews (id, title, description, file_name, kmz_file_name, pdf_file_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, title, description || null, fileName || null, kmzFileName || null, pdfFileName || null, userId]
    );
    
    // Insert review rows
    if (reviewRows && Array.isArray(reviewRows)) {
      for (let i = 0; i < reviewRows.length; i++) {
        const row = reviewRows[i];
        // Always generate a new UUID for database storage to avoid conflicts
        const rowId = uuidv4();
        await run(
          `INSERT INTO review_rows (
            id, review_id, issue_type, station, work_set, designer_cu, qa_cu, description,
            designer_wf, qa_wf, designer_qty, qa_qty, qa_comments, map_notes,
            cu_check, wf_check, qty_check, row_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rowId, reviewId, row.issueType, row.station, row.workSet || null,
            row.designerCU || null, row.qaCU || null, row.description || null,
            row.designerWF || null, row.qaWF || null, row.designerQty || 0, row.qaQty || 0,
            row.qaComments || '', row.mapNotes || '',
            row.cuCheck ? 1 : 0, row.wfCheck ? 1 : 0, row.qtyCheck ? 1 : 0, i
          ]
        );
      }
    }
    
    // Insert CU lookup
    if (cuLookup && Array.isArray(cuLookup)) {
      for (const cu of cuLookup) {
        await run(
          'INSERT INTO cu_lookup (id, review_id, code, description) VALUES (?, ?, ?, ?)',
          [uuidv4(), reviewId, cu.code, cu.description || null]
        );
      }
    }
    
    // Insert PDF mappings
    if (stationPageMapping) {
      for (const [station, pageNumber] of Object.entries(stationPageMapping)) {
        const specNumber = stationSpecMapping?.[station] || null;
        const editedSpec = editedSpecMapping?.[station] || null;
        await run(
          'INSERT OR REPLACE INTO pdf_mappings (id, review_id, station, page_number, spec_number, edited_spec_number) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), reviewId, station, pageNumber, specNumber, editedSpec]
        );
      }
    }
    
    // Insert PDF annotations
    if (pdfAnnotations) {
      for (const [pageNumber, annotations] of Object.entries(pdfAnnotations)) {
        await run(
          'INSERT OR REPLACE INTO pdf_annotations (id, review_id, page_number, annotation_data) VALUES (?, ?, ?, ?)',
          [uuidv4(), reviewId, parseInt(pageNumber), JSON.stringify(annotations)]
        );
      }
    }
    
    // Insert work point notes
    if (workPointNotes) {
      for (const [workPoint, notes] of Object.entries(workPointNotes)) {
        await run(
          'INSERT OR REPLACE INTO work_point_notes (id, review_id, work_point, notes) VALUES (?, ?, ?, ?)',
          [uuidv4(), reviewId, workPoint, notes || null]
        );
      }
    }
    
    // Insert KMZ placemarks
    if (kmzPlacemarks && Array.isArray(kmzPlacemarks)) {
      for (const placemark of kmzPlacemarks) {
        await run(
          'INSERT INTO kmz_placemarks (id, review_id, placemark_data) VALUES (?, ?, ?)',
          [uuidv4(), reviewId, JSON.stringify(placemark)]
        );
      }
    }
    
    // Store PDF file if provided
    if (req.file && req.file.buffer) {
      await run(
        'INSERT INTO pdf_files (id, review_id, file_data, file_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), reviewId, req.file.buffer, req.file.originalname || pdfFileName || 'document.pdf', req.file.size, req.file.mimetype || 'application/pdf']
      );
    }
    
    res.status(201).json({ id: reviewId, message: 'Review created successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update review
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if review exists and user owns it
    const review = await get('SELECT created_by FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }
    
    const {
      title,
      description,
      reviewRows,
      cuLookup,
      stationPageMapping,
      stationSpecMapping,
      editedSpecMapping,
      pdfAnnotations,
      workPointNotes,
    } = req.body;
    
    // Update review metadata
    if (title !== undefined || description !== undefined) {
      await run(
        'UPDATE reviews SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, description, id]
      );
    }
    
    // Delete existing data
    await run('DELETE FROM review_rows WHERE review_id = ?', [id]);
    await run('DELETE FROM cu_lookup WHERE review_id = ?', [id]);
    await run('DELETE FROM pdf_mappings WHERE review_id = ?', [id]);
    await run('DELETE FROM pdf_annotations WHERE review_id = ?', [id]);
    await run('DELETE FROM work_point_notes WHERE review_id = ?', [id]);
    await run('DELETE FROM pdf_files WHERE review_id = ?', [id]);
    
    // Re-insert data (same logic as create)
    if (reviewRows && Array.isArray(reviewRows)) {
      for (let i = 0; i < reviewRows.length; i++) {
        const row = reviewRows[i];
        // Always generate a new UUID for database storage to avoid conflicts
        const rowId = uuidv4();
        await run(
          `INSERT INTO review_rows (
            id, review_id, issue_type, station, work_set, designer_cu, qa_cu, description,
            designer_wf, qa_wf, designer_qty, qa_qty, qa_comments, map_notes,
            cu_check, wf_check, qty_check, row_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rowId, id, row.issueType, row.station, row.workSet || null,
            row.designerCU || null, row.qaCU || null, row.description || null,
            row.designerWF || null, row.qaWF || null, row.designerQty || 0, row.qaQty || 0,
            row.qaComments || '', row.mapNotes || '',
            row.cuCheck ? 1 : 0, row.wfCheck ? 1 : 0, row.qtyCheck ? 1 : 0, i
          ]
        );
      }
    }
    
    if (cuLookup && Array.isArray(cuLookup)) {
      for (const cu of cuLookup) {
        await run(
          'INSERT INTO cu_lookup (id, review_id, code, description) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, cu.code, cu.description || null]
        );
      }
    }
    
    if (stationPageMapping) {
      for (const [station, pageNumber] of Object.entries(stationPageMapping)) {
        const specNumber = stationSpecMapping?.[station] || null;
        const editedSpec = editedSpecMapping?.[station] || null;
        await run(
          'INSERT INTO pdf_mappings (id, review_id, station, page_number, spec_number, edited_spec_number) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, station, pageNumber, specNumber, editedSpec]
        );
      }
    }
    
    if (pdfAnnotations) {
      for (const [pageNumber, annotations] of Object.entries(pdfAnnotations)) {
        await run(
          'INSERT INTO pdf_annotations (id, review_id, page_number, annotation_data) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, parseInt(pageNumber), JSON.stringify(annotations)]
        );
      }
    }
    
    if (workPointNotes) {
      for (const [workPoint, notes] of Object.entries(workPointNotes)) {
        await run(
          'INSERT INTO work_point_notes (id, review_id, work_point, notes) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, workPoint, notes || null]
        );
      }
    }
    
    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if review exists and user owns it
    const review = await get('SELECT created_by FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }
    
    // Delete review (cascade will delete related data)
    await run('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

