// services/documentService.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Document {
  id: number;
  file: string;
  original_filename: string;
  file_size: number;
  predicted_class: string;
  confidence: number;
  confidence_percentage: number;
  probability_factures: number;
  probability_contrats: number;
  probability_cartes_identite: number;
  extracted_text: string;
  extracted_text_raw: string;
  text_length: number;
  structured_data: Record<string, any>;
  processed: boolean;
  processing_time: number;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface UploadResponse {
  id: number;
  predicted_class: string;
  confidence: number;
  confidence_percentage: number;
  all_probabilities: Record<string, number>;
  extracted_text: string;
  text_length: number;
  structured_data: Record<string, any>;
  processing_time: number;
}

export interface SearchParams {
  q?: string;
  class?: string;
  date_from?: string;
  date_to?: string;
  min_confidence?: number;
  status?: 'processed' | 'error' | 'pending';
  sort?: string;
}

export interface DashboardStats {
  total_documents: number;
  processed_documents: number;
  error_documents: number;
  pending_documents: number;
  documents_by_class: Array<{ predicted_class: string; count: number }>;
  monthly_uploads: Record<string, number>;
  average_confidence: number;
  recent_documents: Document[];
  popular_tags: Array<{ tag: string; count: number }>;
}


export interface TextCorrectionData {
  extracted_text: string;
  reason?: string;
}

export interface TextForCorrectionResponse {
  document_id: number;
  filename: string;
  predicted_class: string;
  extracted_text: string;
  extracted_text_raw: string;
  text_length: number;
  is_corrected: boolean;
  correction_date: string | null;
  metadata: {
    confidence: number;
    processing_time: number;
    uploaded_at: string;
  };
}

export interface TextCorrectionResponse {
  message: string;
  document: Document;
  changes: {
    old_length: number;
    new_length: number;
    difference: number;
  };
}



// ✅ CORRECTION: Utiliser "Token" au lieu de "Bearer" pour correspondre à authService
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Token ${token}` } : {};
};

// ==================== UPLOAD & CLASSIFICATION ====================

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<Document>(
    `${API_URL}/documents/`,
    formData,
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

export const quickClassify = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<UploadResponse>(
    `${API_URL}/documents/classify/`,
    formData,
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

// ==================== RÉCUPÉRATION ====================

export const getDocuments = async (): Promise<Document[]> => {
  const response = await axios.get(`${API_URL}/documents/`, {
    headers: getAuthHeader(),
  });
  
  // ✅ CORRECTION: Gérer les différents formats de réponse API
  const data = response.data;
  
  // Si c'est déjà un tableau, le retourner
  if (Array.isArray(data)) {
    return data;
  }
  
  // Si c'est un objet avec une propriété results (pagination DRF)
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  
  // Si c'est un objet avec une propriété documents
  if (data && Array.isArray(data.documents)) {
    return data.documents;
  }
  
  // Si c'est un objet avec une propriété data
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  
  // Fallback: retourner un tableau vide
  console.warn('Unexpected API response format:', data);
  return [];
};

export const getDocument = async (id: number): Promise<Document> => {
  const response = await axios.get<Document>(`${API_URL}/documents/${id}/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getMyDocuments = async (): Promise<Document[]> => {
  const response = await axios.get(
    `${API_URL}/documents/my_documents/`,
    {
      headers: getAuthHeader(),
    }
  );
  
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.documents)) return data.documents;
  return [];
};

// ==================== RECHERCHE & FILTRES ====================

export const searchDocuments = async (
  params: SearchParams
): Promise<{ results: Document[]; count: number }> => {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.append('q', params.q);
  if (params.class) queryParams.append('class', params.class);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.min_confidence)
    queryParams.append('min_confidence', params.min_confidence.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.sort) queryParams.append('sort', params.sort);

  const response = await axios.get(
    `${API_URL}/documents/search/?${queryParams.toString()}`,
    {
      headers: getAuthHeader(),
    }
  );

  const data = response.data;
  
  // ✅ CORRECTION: Normaliser la réponse de recherche
  if (Array.isArray(data)) {
    return { results: data, count: data.length };
  }
  
  if (data && Array.isArray(data.results)) {
    return { results: data.results, count: data.count || data.results.length };
  }
  
  if (data && Array.isArray(data.documents)) {
    return { results: data.documents, count: data.count || data.documents.length };
  }
  
  return { results: [], count: 0 };
};

// ==================== FAVORIS ====================

export const toggleFavorite = async (id: number): Promise<void> => {
  await axios.post(
    `${API_URL}/documents/${id}/toggle_favorite/`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
};

export const getFavorites = async (): Promise<Document[]> => {
  const response = await axios.get(
    `${API_URL}/documents/favorites/`,
    {
      headers: getAuthHeader(),
    }
  );
  
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// ==================== TAGS & DOSSIERS ====================

export const addTags = async (id: number, tags: string[]): Promise<void> => {
  await axios.post(
    `${API_URL}/documents/${id}/add_tags/`,
    { tags },
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
};

export const removeTags = async (id: number, tags: string[]): Promise<void> => {
  await axios.post(
    `${API_URL}/documents/${id}/remove_tags/`,
    { tags },
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
};

export const setFolder = async (id: number, folder: string): Promise<void> => {
  await axios.post(
    `${API_URL}/documents/${id}/set_folder/`,
    { folder },
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
};

export const getFolders = async (): Promise<string[]> => {
  const response = await axios.get<{ folders: string[] }>(
    `${API_URL}/documents/folders/`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data.folders || [];
};

// ==================== EXPORTS ====================

export const exportDocument = async (
  id: number,
  format: 'json' | 'csv' | 'pdf' | 'txt'
): Promise<Blob> => {
  const response = await axios.get(
    `${API_URL}/documents/${id}/export_${format}/`,
    {
      headers: getAuthHeader(),
      responseType: 'blob',
    }
  );
  return response.data;
};

export const downloadExport = async (
  id: number,
  format: 'json' | 'csv' | 'pdf' | 'txt',
  filename: string
) => {
  const blob = await exportDocument(id, format);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ==================== SUPPRESSION ====================

export const deleteDocument = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/documents/${id}/`, {
    headers: getAuthHeader(),
  });
};

export const batchDelete = async (ids: number[]): Promise<void> => {
  await axios.post(
    `${API_URL}/documents/batch_delete/`,
    { document_ids: ids },
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
};

// ==================== STATISTIQUES ====================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axios.get(
    `${API_URL}/documents/dashboard_stats/`,
    {
      headers: getAuthHeader(),
    }
  );
  
  // ✅ CORRECTION: Retourner des valeurs par défaut si la réponse est vide
  const data = response.data;
  
  return {
    total_documents: data?.total_documents ?? 0,
    processed_documents: data?.processed_documents ?? 0,
    error_documents: data?.error_documents ?? 0,
    pending_documents: data?.pending_documents ?? 0,
    documents_by_class: data?.documents_by_class ?? [],
    monthly_uploads: data?.monthly_uploads ?? {},
    average_confidence: data?.average_confidence ?? 0,
    recent_documents: data?.recent_documents ?? [],
    popular_tags: data?.popular_tags ?? [],
  };
};

export const getStatistics = async () => {
  const response = await axios.get(`${API_URL}/documents/statistics/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ==================== HISTORIQUE ====================

export const getDocumentHistory = async (id: number) => {
  const response = await axios.get(`${API_URL}/documents/${id}/history/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getActivity = async () => {
  const response = await axios.get(`${API_URL}/documents/activity/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ==================== CORRECTION MANUELLE ====================

export const correctClassification = async (
  id: number,
  data: {
    predicted_class?: string;
    structured_data?: Record<string, any>;
  }
): Promise<Document> => {
  const response = await axios.post<{ document: Document }>(
    `${API_URL}/documents/${id}/correct_classification/`,
    data,
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.document;
};



/**
 * Récupère le texte extrait pour correction
 */
export const getTextForCorrection = async (
  id: number
): Promise<TextForCorrectionResponse> => {
  const response = await axios.get<TextForCorrectionResponse>(
    `${API_URL}/documents/${id}/get_text_for_correction/`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};

/**
 * Corrige le texte extrait d'un document
 */
export const correctExtractedText = async (
  id: number,
  data: TextCorrectionData
): Promise<TextCorrectionResponse> => {
  const response = await axios.post<TextCorrectionResponse>(
    `${API_URL}/documents/${id}/correct_extracted_text/`,
    data,
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * Annule la dernière correction de texte
 */
export const revertTextCorrection = async (
  id: number
): Promise<{ message: string; document: Document }> => {
  const response = await axios.post(
    `${API_URL}/documents/${id}/revert_text_correction/`,
    {},
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// ==================== INFO MODÈLE ====================

export const getModelInfo = async () => {
  const response = await axios.get(`${API_URL}/documents/model_info/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};