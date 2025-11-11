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

      // Handle primitives and null
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      // Depth guard
      if (depth > MAX_DEPTH) {
        return null;
      }

      // Handle circular references
      if (seen.has(obj)) {
        return null; // Replace circular reference with null
      }

      // Skip DOM elements, events, functions, and non-plain instances
      if (
        typeof obj === 'function' ||
        obj instanceof HTMLElement ||
        obj instanceof Event
      ) {
        return null;
      }

      // Allow arrays
      if (Array.isArray(obj)) {
        seen.add(obj);
        const result = obj.map(item => safeClone(item, seen, depth + 1));
        seen.delete(obj);
        return result;
      }

      // Allow Date
      if (obj instanceof Date) {
        return obj.toISOString();
      }

      // Allow Map
      if (obj instanceof Map) {
        seen.add(obj);
        const result: Record<string, any> = {};
        obj.forEach((value, key) => {
          result[String(key)] = safeClone(value, seen, depth + 1);
        });
        seen.delete(obj);
        return result;
      }

      // Allow Set
      if (obj instanceof Set) {
        seen.add(obj);
        const result = Array.from(obj).map(item => safeClone(item, seen, depth + 1));
        seen.delete(obj);
        return result;
      }

      // Only allow plain objects
      const isPlainObject = Object.getPrototypeOf(obj) === Object.prototype || Object.getPrototypeOf(obj) === null;
      if (!isPlainObject) {
        return null;
      }

      // Handle plain objects
      seen.add(obj);
      const result: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          try {
            result[key] = safeClone((obj as any)[key], seen, depth + 1);
          } catch (_) {
            result[key] = null;
          }
        }
      }
      seen.delete(obj);
      return result;
    };

    // Convert Map to object for JSON serialization
    const annotationsObj: Record<string, any[]> = {};
    if (data.pdfAnnotations) {
      data.pdfAnnotations.forEach((value, key) => {
        // Sanitize annotation data to remove any circular references
        annotationsObj[key.toString()] = safeClone(value);
      });
    }

    // Convert PDF file to base64 if provided
    let pdfFileData: { data: string; fileName: string; mimeType: string } | undefined;
    if (data.pdfFile) {
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // data:[mime];base64,XXXXX
            const commaIndex = result.indexOf(',');
            const base64 = commaIndex >= 0 ? result.substring(commaIndex + 1) : result;
            resolve(base64);
          };
          reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
          reader.readAsDataURL(file);
        } catch (e) {
          reject(e);
        }
      });

      const base64 = await toBase64(data.pdfFile);
      pdfFileData = {
        data: base64,
        fileName: data.pdfFile.name,
        mimeType: data.pdfFile.type || 'application/pdf',
      };
    }

    // Sanitize all data before stringifying
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
      pdfFile: pdfFileData,
    };

    // Use JSON request (Netlify Functions work better with JSON)
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

