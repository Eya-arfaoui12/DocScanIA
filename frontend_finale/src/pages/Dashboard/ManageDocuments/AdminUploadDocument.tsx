import React, { useState, useEffect, useMemo, ChangeEvent, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import {
  getDocuments, searchDocuments, deleteDocument, batchDelete,
  downloadExport, getDashboardStats, getDocumentHistory, uploadDocument,
  quickClassify, Document, SearchParams, DashboardStats, UploadResponse,
} from "../../../services/documentService";

// Types
type BadgeColor = "success" | "warning" | "error" | undefined;
type DocumentStatus = "processed" | "error" | "pending";
type ExportFormat = "json" | "csv" | "pdf" | "txt";

interface Filters {
  status: string; type: string; search: string;
  dateFrom: string; dateTo: string; minConfidence: string; sort: string;
}

interface UploadedFile {
  file: File; id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number; result?: Document | UploadResponse; error?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États principaux
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // État pour les notifications toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  // États Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<"full" | "quick">("full");
  const [isUploading, setIsUploading] = useState(false);

  // États Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch', id?: number, count?: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // États Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const [filters, setFilters] = useState<Filters>({
    status: "", type: "", search: "", dateFrom: "", dateTo: "",
    minConfidence: "", sort: "-uploaded_at",
  });

  // Fonction pour afficher un toast
  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helpers
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof AxiosError) {
      return err.response?.data?.detail || err.response?.data?.message || "An error occurred";
    }
    return err instanceof Error ? err.message : "Unknown error";
  };

  const getFileIcon = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const icons: Record<string, string> = {
      pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
      jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", txt: "📃",
    };
    return icons[ext] || "📎";
  };

  const getStatusColor = (doc: Document): BadgeColor => {
    if (doc.processed && !doc.error_message) return "success";
    if (doc.error_message) return "error";
    return "warning";
  };

  const getStatusLabel = (doc: Document): string => {
    if (doc.processed && !doc.error_message) return "Approved";
    if (doc.error_message) return "Rejected";
    return "Pending";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // API Calls
  const loadDocuments = async () => {
    try {
      setLoading(true); 
      setError(null);
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      showToast('error', errorMsg);
      setDocuments([]);
    } finally { 
      setLoading(false); 
    }
  };

  const loadStats = async () => {
    try { 
      setStats(await getDashboardStats()); 
    } catch (err) {
      showToast('error', 'Failed to load statistics');
      setStats(null); 
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true); 
      setError(null);
      const params: SearchParams = {
        q: filters.search || undefined,
        class: filters.type || undefined,
        status: (filters.status as DocumentStatus) || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        min_confidence: filters.minConfidence ? parseFloat(filters.minConfidence) : undefined,
        sort: filters.sort || undefined,
      };
      const result = await searchDocuments(params);
      setDocuments(result?.results || []);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      showToast('error', errorMsg);
      setDocuments([]);
    } finally { 
      setLoading(false); 
    }
  };

  const openDeleteModal = (type: 'single' | 'batch', id?: number) => {
    if (type === 'single' && id) {
      setDeleteTarget({ type: 'single', id });
    } else if (type === 'batch' && selectedDocs.length > 0) {
      setDeleteTarget({ type: 'batch', count: selectedDocs.length });
    }
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single' && deleteTarget.id) {
        await deleteDocument(deleteTarget.id);
        setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
        showToast('success', 'Document deleted successfully');
      } else if (deleteTarget.type === 'batch') {
        await batchDelete(selectedDocs);
        setDocuments(prev => prev.filter(d => !selectedDocs.includes(d.id)));
        setSelectedDocs([]);
        showToast('success', `${selectedDocs.length} document(s) deleted successfully`);
      }
      await loadStats();
      closeDeleteModal();
    } catch (err) {
      showToast('error', getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const handleExport = async (id: number, format: ExportFormat) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    try {
      await downloadExport(id, format, doc.original_filename.replace(/\.[^/.]+$/, ""));
      showToast('success', `Document exported as ${format.toUpperCase()}`);
    } catch (err) { 
      showToast('error', getErrorMessage(err));
    }
  };

  const openDetailsModal = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDocument(null);
  };

  const handleRefresh = async () => {
    setError(null);
    await Promise.all([loadDocuments(), loadStats()]);
    showToast('success', 'Documents refreshed successfully');
  };

  // Upload Functions
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) return "File exceeds 10MB";
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif", "txt"];
    if (!ext || !allowed.includes(ext)) return `Unsupported: .${ext}`;
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const files: UploadedFile[] = Array.from(newFiles).map(file => {
      const error = validateFile(file);
      return { file, id: generateId(), status: error ? "error" : "pending", progress: 0, error: error || undefined };
    });
    setUploadFiles(prev => [...prev, ...files]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); 
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => setUploadFiles(prev => prev.filter(f => f.id !== id));

  const uploadSingleFile = async (uf: UploadedFile) => {
    setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "uploading", progress: 10 } : f));
    try {
      const interval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uf.id && f.progress < 90 ? { ...f, progress: f.progress + 15 } : f
        ));
      }, 150);
      const result = uploadMode === "quick" ? await quickClassify(uf.file) : await uploadDocument(uf.file);
      clearInterval(interval);
      setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "success", progress: 100, result } : f));
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message;
      setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "error", progress: 0, error: errorMsg } : f));
      showToast('error', `Failed to upload ${uf.file.name}: ${errorMsg}`);
    }
  };

  const handleUploadAll = async () => {
    const pending = uploadFiles.filter(f => f.status === "pending");
    if (!pending.length) return;
    setIsUploading(true);
    for (const file of pending) await uploadSingleFile(file);
    setIsUploading(false);
    loadDocuments(); 
    loadStats();
    showToast('success', `${pending.length} file(s) uploaded successfully`);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false); 
    setUploadFiles([]); 
    setIsDragging(false);
  };

  useEffect(() => { 
    loadDocuments(); 
    loadStats(); 
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.values(filters).some(v => v !== "" && v !== "-uploaded_at")) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    return documents.filter(doc => {
      const matchSearch = !filters.search || doc.original_filename.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus = !filters.status || (
        filters.status === "processed" ? doc.processed && !doc.error_message :
        filters.status === "error" ? !!doc.error_message : !doc.processed
      );
      const matchType = !filters.type || doc.predicted_class === filters.type;
      return matchSearch && matchStatus && matchType;
    });
  }, [documents, filters]);

  const hasActiveFilters = useMemo(() => Object.entries(filters).some(([k, v]) => k !== "sort" && v !== ""), [filters]);
  const pendingCount = uploadFiles.filter(f => f.status === "pending").length;
  const successCount = uploadFiles.filter(f => f.status === "success").length;

  if (loading && !documents.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[99999] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto min-w-[300px] max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 transform transition-all duration-300 animate-slideInRight"
            style={{
              borderColor: 
                toast.type === 'success' ? '#10B981' :
                toast.type === 'error' ? '#EF4444' :
                toast.type === 'warning' ? '#F59E0B' : '#3B82F6'
            }}
          >
            <div className="flex items-start gap-3 p-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                toast.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                toast.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                toast.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {toast.type === 'success' && (
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  toast.type === 'success' ? 'text-green-900 dark:text-green-100' :
                  toast.type === 'error' ? 'text-red-900 dark:text-red-100' :
                  toast.type === 'warning' ? 'text-yellow-900 dark:text-yellow-100' :
                  'text-blue-900 dark:text-blue-100'
                }`}>
                  {toast.type === 'success' ? 'Success' :
                   toast.type === 'error' ? 'Error' :
                   toast.type === 'warning' ? 'Warning' : 'Info'}
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 break-words">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
              <div 
                className={`h-full ${
                  toast.type === 'success' ? 'bg-green-500' :
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{
                  animation: 'progress 5s linear forwards'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-lg animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Confirm Deletion
              </h3>
              
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                {deleteTarget.type === 'single' 
                  ? "Are you sure you want to delete this document? This action cannot be undone."
                  : `Are you sure you want to delete ${deleteTarget.count} document(s)? This action cannot be undone.`
                }
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>Delete</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - SANS HEADER EN HAUT */}
      {showDetailsModal && selectedDocument && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-lg animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden animate-scaleIn">
            
            {/* Body - Directement sans header */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)] relative">
              {/* Bouton Close en haut à droite dans le contenu */}
              <button 
                onClick={closeDetailsModal} 
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Information</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Document ID</label>
                    <p className="text-gray-900 dark:text-white mt-1">#{selectedDocument.id}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">File Name</label>
                    <p className="text-gray-900 dark:text-white mt-1 break-all">{selectedDocument.original_filename}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</label>
                    <p className="text-gray-900 dark:text-white mt-1">{formatFileSize(selectedDocument.file_size)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">{new Date(selectedDocument.uploaded_at).toLocaleString()}</p>
                  </div>

                  {selectedDocument.processed_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Processed Date</label>
                      <p className="text-gray-900 dark:text-white mt-1">{new Date(selectedDocument.processed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Classification */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Classification</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      <Badge size="sm" color={getStatusColor(selectedDocument)}>{getStatusLabel(selectedDocument)}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Document Type</label>
                    <div className="mt-1">
                      <Badge size="sm" variant="light">{selectedDocument.predicted_class || "N/A"}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Confidence</label>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all" 
                          style={{ width: `${selectedDocument.confidence_percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.round(selectedDocument.confidence_percentage || 0)}%
                      </span>
                    </div>
                  </div>

                  {selectedDocument.error_message && (
                    <div>
                      <label className="text-sm font-medium text-red-500">Error Message</label>
                      <p className="text-red-600 dark:text-red-400 mt-1 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        {selectedDocument.error_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Data */}
              {(selectedDocument as any).extracted_data && Object.keys((selectedDocument as any).extracted_data).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extracted Data</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                      {JSON.stringify((selectedDocument as any).extracted_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer simplifié */}
            <div className="flex items-center justify-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {(["pdf", "csv", "json", "txt"] as ExportFormat[]).map(fmt => (
                <Button
                  key={fmt}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleExport(selectedDocument.id, fmt);
                    closeDetailsModal();
                  }}
                  className="min-w-[100px]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal - CONTINUE... */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden transform transition-all animate-scaleIn">
            <div className="relative p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    Upload Documents
                  </h3>
                  <p className="text-white/90 mt-2 text-sm">Drag & drop your files or click to browse</p>
                </div>
                <button onClick={closeUploadModal} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl">
                <button onClick={() => setUploadMode("full")}
                  className={`group relative py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
                    uploadMode === "full" 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
                  }`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      uploadMode === "full" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-600"
                    }`}>
                      <svg className={`w-5 h-5 ${uploadMode === "full" ? "text-white" : "text-gray-600 dark:text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">Full Upload</div>
                      <div className={`text-xs ${uploadMode === "full" ? "text-white/80" : "text-gray-500"}`}>Save & Process</div>
                    </div>
                  </div>
                </button>
                <button onClick={() => setUploadMode("quick")}
                  className={`group relative py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
                    uploadMode === "quick" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
                  }`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      uploadMode === "quick" ? "bg-white/20" : "bg-gray-200 dark:bg-gray-600"
                    }`}>
                      <svg className={`w-5 h-5 ${uploadMode === "quick" ? "text-white" : "text-gray-600 dark:text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">Quick Test</div>
                      <div className={`text-xs ${uploadMode === "quick" ? "text-white/80" : "text-gray-500"}`}>Classify Only</div>
                    </div>
                  </div>
                </button>
              </div>

              <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-3 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${
                  isDragging 
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 scale-105 shadow-2xl" 
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-xl"
                }`}>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt" onChange={handleFileSelect} className="hidden" />
                
                <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                  isDragging 
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110 shadow-2xl" 
                    : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                }`}>
                  <svg className={`w-12 h-12 transition-all ${isDragging ? "text-white scale-110" : "text-gray-400 dark:text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                  {isDragging ? "Release to drop files" : "Drop your files here"}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">or click anywhere to browse</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {["PDF", "DOC", "DOCX", "XLS", "XLSX", "JPG", "PNG", "GIF", "TXT"].map(f => (
                    <span key={f} className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm">
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Maximum size: 10MB per file</p>
              </div>

              {uploadFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{uploadFiles.length} file(s)</span>
                      {pendingCount > 0 && (
                        <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                          {pendingCount} pending
                        </span>
                      )}
                      {successCount > 0 && (
                        <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          {successCount} success
                        </span>
                      )}
                    </div>
                    <button onClick={() => setUploadFiles([])} className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {uploadFiles.map(uf => (
                      <div key={uf.id} className="group relative p-4 bg-white dark:bg-gray-700/50 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl shadow-md">
                            {getFileIcon(uf.file.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{uf.file.name}</p>
                              {uf.status === "success" && uf.result && (
                                <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-400 rounded-lg capitalize">
                                  {(uf.result as any).predicted_class}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formatFileSize(uf.file.size)}</p>

                            {uf.status === "uploading" && (
                              <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 animate-pulse"
                                  style={{ width: `${uf.progress}%` }}></div>
                              </div>
                            )}

                            {uf.error && (
                              <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {uf.error}
                              </p>
                            )}

                            {uf.status === "success" && uf.result && (
                              <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Confidence: {Math.round((uf.result as any).confidence_percentage || 0)}%
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {uf.status === "pending" && (
                              <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            )}
                            {uf.status === "uploading" && (
                              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                            {uf.status === "success" && (
                              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {uf.status === "error" && (
                              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}

                            <button onClick={() => removeFile(uf.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
              {successCount > 0 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {successCount} file(s) uploaded successfully!
                </div>
              )}
              <div className="flex gap-3 ml-auto">
                <Button variant="outline" onClick={closeUploadModal} className="px-6 py-3 font-bold">
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleUploadAll} 
                  disabled={!pendingCount || isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload {pendingCount > 0 && `(${pendingCount})`}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(100px);
          }
          to { 
            opacity: 1; 
            transform: translateX(0);
          }
        }
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>

      {/* Main Content */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-gray-900">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and organize all company documents</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedDocs.length > 0 && (
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openDeleteModal('batch')}>
                Delete ({selectedDocs.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              Filter {hasActiveFilters && <span className="ml-1 w-5 h-5 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">{Object.entries(filters).filter(([k, v]) => k !== "sort" && v !== "").length}</span>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </Button>
            <Button size="sm" variant="primary" className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => setShowUploadModal(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Document
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <input type="text" placeholder="Search..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="">All Status</option>
                <option value="processed">Approved</option>
                <option value="pending">Pending</option>
                <option value="error">Rejected</option>
              </select>
              <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="">All Types</option>
                <option value="factures">Factures</option>
                <option value="contrats">Contrats</option>
                <option value="cartes_identite">Cartes ID</option>
              </select>
              <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={() => setFilters({ status: "", type: "", search: "", dateFrom: "", dateTo: "", minConfidence: "", sort: "-uploaded_at" })}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 px-6 py-4 sm:grid-cols-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600">{stats.total_documents}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600">{stats.processed_documents}</div>
              <div className="text-sm text-green-600">Approved</div>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="text-2xl font-bold text-orange-600">{stats.pending_documents}</div>
              <div className="text-sm text-orange-600">Pending</div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="text-2xl font-bold text-purple-600">{filteredDocuments.length}</div>
              <div className="text-sm text-purple-600">Filtered</div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4">
                  <input type="checkbox" checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={() => setSelectedDocs(selectedDocs.length === filteredDocuments.length ? [] : filteredDocuments.map(d => d.id))}
                    className="w-4 h-4 text-blue-600 rounded" />
                </TableCell>
                <TableCell isHeader className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Document</TableCell>
                <TableCell isHeader className="px-4 py-4 font-semibold text-gray-900 dark:text-white">Type</TableCell>
                <TableCell isHeader className="px-4 py-4 font-semibold text-gray-900 dark:text-white">Size</TableCell>
                <TableCell isHeader className="px-4 py-4 font-semibold text-gray-900 dark:text-white">Date</TableCell>
                <TableCell isHeader className="px-4 py-4 font-semibold text-gray-900 dark:text-white">Status</TableCell>
                <TableCell isHeader className="px-4 py-4 font-semibold text-gray-900 dark:text-white">Confidence</TableCell>
                <TableCell isHeader className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-500">
                      <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No documents found</p>
                      <p className="mt-1">Upload a new document to get started</p>
                      <Button variant="primary" size="sm" className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => setShowUploadModal(true)}>
                        Upload Document
                      </Button>
                    </div>
                  </td>
                </TableRow>
              ) : (
                filteredDocuments.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <input type="checkbox" checked={selectedDocs.includes(doc.id)}
                        onChange={() => setSelectedDocs(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id])}
                        className="w-4 h-4 text-blue-600 rounded" />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg">
                          {getFileIcon(doc.original_filename)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{doc.original_filename}</p>
                          <p className="text-xs text-gray-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge size="sm" variant="light">{doc.predicted_class || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-gray-500 text-sm">{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell className="px-4 py-4 text-gray-500 text-sm">{doc.processed_at ? new Date(doc.processed_at).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge size="sm" color={getStatusColor(doc)}>{getStatusLabel(doc)}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ width: `${doc.confidence_percentage || 0}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{Math.round(doc.confidence_percentage || 0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetailsModal(doc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Export">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                          <div className="absolute right-0 z-10 hidden w-32 py-1 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg group-hover:block">
                            {(["pdf", "csv", "json", "txt"] as ExportFormat[]).map(fmt => (
                              <button key={fmt} onClick={() => handleExport(doc.id, fmt)} className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                Export {fmt.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => openDeleteModal('single', doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-800 sm:flex-row">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredDocuments.length}</span> of <span className="font-semibold">{documents.length}</span> documents
            {selectedDocs.length > 0 && <span className="ml-2">• <span className="font-semibold">{selectedDocs.length}</span> selected</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;