import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseClient = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Auto-detect API URL based on environment
const getApiBaseUrl = () => {
  // If explicit URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If running on Netlify, use Netlify Functions
  if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com')) {
    return '/.netlify/functions';
  }
  
  // Default to local development server
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Set auth token
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string, fullName?: string) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName }),
    });
  },

  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },
};

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
    const params = new URLSearchParams();
    if (createdBy) params.append('created_by', createdBy);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    const queryString = params.toString();
    const url = queryString ? `/reviews?${queryString}` : '/reviews';
    return apiRequest(url);
  },

  get: async (id: string): Promise<ReviewData> => {
    return apiRequest(`/reviews/${id}`);
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
    // Helper function to safely clone data (removes circular references and non-serializable objects)
    const safeClone = (obj: any, seen = new WeakSet(), depth = 0): any => {
      const MAX_DEPTH = 5;
      if (obj === null || typeof obj !== 'object') return obj;
      if (depth > MAX_DEPTH) return null;
      if (seen.has(obj)) return null;
      if (typeof obj === 'function' || (typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement) || (typeof Event !== 'undefined' && obj instanceof Event)) return null;
      if (Array.isArray(obj)) { seen.add(obj); const r = obj.map(i => safeClone(i, seen, depth + 1)); seen.delete(obj); return r; }
      if (obj instanceof Date) return obj.toISOString();
      if (obj instanceof Map) { seen.add(obj); const r: Record<string, any> = {}; obj.forEach((v, k) => { r[String(k)] = safeClone(v, seen, depth + 1); }); seen.delete(obj); return r; }
      if (obj instanceof Set) { seen.add(obj); const r = Array.from(obj).map(i => safeClone(i, seen, depth + 1)); seen.delete(obj); return r; }
      const isPlain = Object.getPrototypeOf(obj) === Object.prototype || Object.getPrototypeOf(obj) === null;
      if (!isPlain) return null;
      seen.add(obj); const r: Record<string, any> = {}; for (const k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) { try { r[k] = safeClone((obj as any)[k], seen, depth + 1); } catch { r[k] = null; } } seen.delete(obj); return r;
    };

    // Convert Map to object for JSON serialization
    const annotationsObj: Record<string, any[]> = {};
    if (data.pdfAnnotations) {
      data.pdfAnnotations.forEach((value, key) => {
        annotationsObj[key.toString()] = safeClone(value);
      });
    }

    // Upload PDF to Supabase Storage if provided
    let pdfStoragePath: string | undefined;
    if (data.pdfFile && supabaseClient) {
      const reviewId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const path = `reviews/${reviewId}/${data.pdfFile.name}`;
      const { error: uploadError } = await supabaseClient.storage.from('pdf-files').upload(path, data.pdfFile, {
        contentType: data.pdfFile.type || 'application/pdf',
        upsert: true,
      });
      if (uploadError) {
        throw new Error(`PDF upload failed: ${uploadError.message}`);
      }
      pdfStoragePath = path;
    }

    const sanitizedData = {
      title: data.title,
      description: data.description,
      fileName: data.fileName,
      kmzFileName: data.kmzFileName,
      pdfFileName: data.pdfFileName || data.pdfFile?.name,
      reviewRows: safeClone(data.reviewRows),
      cuLookup: safeClone(data.cuLookup),
      stationPageMapping: safeClone(data.stationPageMapping),
      stationSpecMapping: safeClone(data.stationSpecMapping),
      editedSpecMapping: safeClone(data.editedSpecMapping),
      pdfAnnotations: annotationsObj,
      workPointNotes: safeClone(data.workPointNotes),
      kmzPlacemarks: safeClone(data.kmzPlacemarks),
      // send only storage path
      pdfStoragePath,
    };

    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
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
    // Convert Map to object for JSON serialization
    const annotationsObj: Record<string, any[]> = {};
    if (data.pdfAnnotations) {
      data.pdfAnnotations.forEach((value, key) => {
        annotationsObj[key.toString()] = value;
      });
    }

    return apiRequest(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        pdfAnnotations: annotationsObj,
      }),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },
};

