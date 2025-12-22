import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Download, Star, Tag, Trash2, Clock, Eye, FileText,
  Database, History, CheckCircle, X, Plus, FileJson, FileSpreadsheet,
  FileCheck, FileType, Sparkles, Target, User, AlertCircle, Upload,
  Edit, FolderOpen
} from "lucide-react";
import {
  getDocument, toggleFavorite, addTags, removeTags, downloadExport,
  deleteDocument, getDocumentHistory, correctClassification,
  correctExtractedText, // ← NOUVEAU
  type Document,
} from "../../services/documentService";
import CorrectionModal from "../../components/CorrectionModal";


// Interface pour les logs d'historique
interface HistoryLog {
  id: number;
  document: number;
  document_name: string;
  user_email: string;
  timestamp: string;
  action: string;
  details: Record<string, any> | null;
  success: boolean;
}

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "data" | "history">("preview");
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, id]);

  const fetchDocument = async () => {
    try {
      const data = await getDocument(Number(id));
      setDocument(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getDocumentHistory(Number(id));
      setHistoryLogs(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(Number(id));
      fetchDocument();
      if (activeTab === "history") fetchHistory();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try {
      await addTags(Number(id), [newTag.trim()]);
      setNewTag("");
      setShowTagModal(false);
      fetchDocument();
      if (activeTab === "history") fetchHistory();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTags(Number(id), [tag]);
      fetchDocument();
      if (activeTab === "history") fetchHistory();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDownloadDocument = async (format: "json" | "csv" | "pdf" | "txt") => {
    if (!document) return;
    try {
      await downloadExport(Number(id), format, document.original_filename);
      if (activeTab === "history") fetchHistory();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteDocument = async () => {
    setDeleting(true);
    try {
      await deleteDocument(Number(id));
      navigate("/user/documents");
    } catch (error) {
      console.error("Error:", error);
      setDeleting(false);
    }
  };

  const handleCorrectDocument = async (data: {
    predicted_class?: string;
    structured_data?: Record<string, any>;
  }) => {
    try {
      const updatedDoc = await correctClassification(Number(id), data);
      setDocument(updatedDoc);
      setShowCorrectionModal(false);
      
      // Refresh history if on history tab
      if (activeTab === "history") {
        fetchHistory();
      }
      
      // Optional: Show success message
      alert("Document corrected successfully!");
    } catch (error) {
      console.error("Error correcting document:", error);
      throw error; // Let the modal handle the error
    }
  };

  const handleCorrectText = async (text: string, reason?: string) => {
    try {
      const response = await correctExtractedText(Number(id), {
        extracted_text: text,
        reason: reason || "Manual text correction"
      });
      
      // Update local document state
      setDocument(response.document);
      
      // Refresh history if on history tab
      if (activeTab === "history") {
        fetchHistory();
      }
      
      // Optional: Show success message
      console.log("Text corrected:", response.changes);
    } catch (error) {
      console.error("Error correcting text:", error);
      throw error; // Let the modal handle the error
    }
  };
  

  const getClassColor = (className: string) => {
    const colors: Record<string, string> = {
      factures: "from-blue-500 to-blue-600",
      contrats: "from-green-500 to-green-600",
      cartes_identite: "from-purple-500 to-purple-600",
    };
    return colors[className] || "from-gray-500 to-gray-600";
  };


  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      upload: Upload,
      classification: Sparkles,
      export_json: FileJson,
      export_csv: FileSpreadsheet,
      export_pdf: FileCheck,
      export_txt: FileType,
      add_tags: Tag,
      remove_tags: Tag,
      set_folder: FolderOpen,
      manual_correction: Edit,
      delete: Trash2,
      batch_delete: Trash2,
    };
    return icons[action] || Clock;
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return "bg-red-100 dark:bg-red-900/30 text-red-600";
    const colors: Record<string, string> = {
      upload: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
      classification: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
      export_json: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
      export_csv: "bg-green-100 dark:bg-green-900/30 text-green-600",
      export_pdf: "bg-red-100 dark:bg-red-900/30 text-red-600",
      export_txt: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
      add_tags: "bg-brand-100 dark:bg-brand-900/30 text-brand-600",
      remove_tags: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
      set_folder: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600",
      manual_correction: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
      delete: "bg-red-100 dark:bg-red-900/30 text-red-600",
    };
    return colors[action] || "bg-gray-100 dark:bg-gray-700 text-gray-600";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      upload: "Document Uploaded",
      classification: "Classification",
      export_json: "Export JSON",
      export_csv: "Export CSV",
      export_pdf: "Export PDF",
      export_txt: "Export TXT",
      add_tags: "Tags Added",
      remove_tags: "Tags Removed",
      set_folder: "Folder Set",
      manual_correction: "Manual Correction",
      delete: "Deleted",
      batch_delete: "Batch Deleted",
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const exportOptions = [
    { format: "json", icon: FileJson, label: "JSON", color: "text-yellow-600" },
    { format: "csv", icon: FileSpreadsheet, label: "CSV", color: "text-green-600" },
    { format: "pdf", icon: FileCheck, label: "PDF", color: "text-red-600" },
    { format: "txt", icon: FileType, label: "TXT", color: "text-blue-600" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-brand-200 dark:border-brand-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Not Found</h2>
        <Link to="/user/documents" className="mt-4 inline-block text-brand-600 hover:text-brand-700">
          Back to My Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/user/documents")} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all font-semibold">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handleToggleFavorite} className={`p-3 rounded-xl transition-all ${document.structured_data?.favorite ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 shadow-lg" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-50"}`}>
            <Star className={`w-5 h-5 ${document.structured_data?.favorite ? "fill-yellow-600" : ""}`} />
          </button>
          <button onClick={() => setShowTagModal(true)} className="p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-brand-100 hover:text-brand-600 transition-all">
            <Tag className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-amber-500/25 flex items-center gap-2"
            title="Manual Correction"
          >
            <Edit className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-brand-100 hover:text-brand-600 transition-all">
              <Download className="w-5 h-5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                {exportOptions.map((option) => (
                  <button key={option.format} onClick={() => handleDownloadDocument(option.format as any)} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3">
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Export {option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)} 
            className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document Info Card */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className={`w-24 h-24 bg-gradient-to-br ${getClassColor(document.predicted_class)} rounded-2xl flex items-center justify-center text-white text-4xl flex-shrink-0 shadow-xl`}>
            {document.predicted_class === "factures" && "📄"}
            {document.predicted_class === "contrats" && "📋"}
            {document.predicted_class === "cartes_identite" && "🪪"}
          </div>
          <div className="flex-1 w-full">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{document.original_filename}</h1>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`px-4 py-2 bg-gradient-to-r ${getClassColor(document.predicted_class)} text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-2`}>
                <Sparkles className="w-4 h-4" />{document.predicted_class}
              </span>
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center gap-2">
                <Target className="w-4 h-4" />{document.confidence_percentage}% Confidence
              </span>
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4" />{new Date(document.uploaded_at).toLocaleDateString("en-US")}
              </span>
            </div>
            {document.structured_data?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {document.structured_data.tags.map((tag: string, i: number) => (
                  <span key={i} className="group px-4 py-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-brand-200 transition-colors">
                    <Tag className="w-3 h-3" />{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"><X className="w-4 h-4" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Size</p>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white">{(document.file_size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Characters</p>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white">{document.text_length?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Processing</p>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white">{document.processing_time?.toFixed(2)}s</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Status</p>
                <p className="text-lg font-extrabold text-green-600 flex items-center gap-1"><CheckCircle className="w-5 h-5" />Processed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[{ key: "preview", icon: Eye, label: "Preview" }, { key: "data", icon: Database, label: "Data" }, { key: "history", icon: History, label: "History" }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.key ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <tab.icon className="w-5 h-5" />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === "preview" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-brand-600" />Extracted Text
              </h3>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{document.extracted_text}</pre>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-brand-600" />Structured Data
              </h3>
              {document.structured_data && Object.keys(document.structured_data).length > 0 ? (
                <div className="grid gap-4">
                  {Object.entries(document.structured_data).map(([key, value]) => (
                    <div key={key} className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                      <p className="text-gray-900 dark:text-white font-medium">{typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No structured data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-6 h-6 text-brand-600" />Action History
              </h3>
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
                </div>
              ) : historyLogs.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="space-y-4">
                    {historyLogs.map((log) => {
                      const Icon = getActionIcon(log.action);
                      return (
                        <div key={log.id} className="relative flex gap-4 pl-4">
                          <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getActionColor(log.action, log.success)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  {getActionLabel(log.action)}
                                  {!log.success && <AlertCircle className="w-4 h-4 text-red-500" />}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />{log.user_email}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-lg">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg text-xs">
                                {log.action === "classification" && log.details.predicted_class && (
                                  <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded">
                                      Class: {log.details.predicted_class}
                                    </span>
                                    {log.details.confidence && (
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                        Confidence: {(log.details.confidence * 100).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                )}
                                {log.action === "add_tags" && log.details.tags && (
                                  <div className="flex flex-wrap gap-1">
                                    {log.details.tags.map((tag: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 rounded">+{tag}</span>
                                    ))}
                                  </div>
                                )}
                                {log.action === "manual_correction" && (
                                  <div className="space-y-1">
                                    {log.details.old_class && <p><span className="text-gray-500">From:</span> {log.details.old_class}</p>}
                                    {log.details.new_class && <p><span className="text-gray-500">To:</span> {log.details.new_class}</p>}
                                  </div>
                                )}
                                {log.details.error && (
                                  <p className="text-red-600 dark:text-red-400">{log.details.error}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No history available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Tag</h3>
            </div>
            <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleAddTag()} placeholder="Tag name..." className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white mb-6" />
            <div className="flex gap-3">
              <button onClick={handleAddTag} className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />Add
              </button>
              <button onClick={() => { setShowTagModal(false); setNewTag(""); }} className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-200 dark:border-red-800 animate-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Delete Document
                </h3>
                <p className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Warning Content */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-100 mb-2">
                    You are about to delete:
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-red-900">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                      {document.original_filename}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {(document.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {document.predicted_class}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(document.uploaded_at).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-3 font-medium">
                    All extracted data, text content, and processing history will be permanently removed.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteDocument}
                disabled={deleting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-red-500/25"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Permanently
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-6 py-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white rounded-xl font-bold hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* Additional Warning */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                ⚠️ This action will be recorded in your audit log
              </p>
            </div>
          </div>
        </div>
      )}
      {showCorrectionModal && (
        <CorrectionModal
          document={document}
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          onCorrect={handleCorrectDocument}
          onCorrectText={handleCorrectText}  // ← NOUVEAU
        />
      )}
    </div>
  );
};

export default DocumentViewer;