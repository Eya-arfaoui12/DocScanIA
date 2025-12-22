import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  FileText,
  Star,
  Trash2,
  Grid3x3,
  List,
  Calendar,
  Eye,
  FolderOpen,
  Clock,
  CheckCircle2,
  RotateCcw,
  Scan,
  FileCheck,
  FilePlus,
  Target,
  AlertTriangle,
  X,
} from "lucide-react";
import { 
  searchDocuments, 
  toggleFavorite, 
  deleteDocument,
  type SearchParams,
  type Document 
} from "../../services/documentService";

const MyDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [sortBy, setSortBy] = useState("-uploaded_at");
  const [showFilters, setShowFilters] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    documentId: number | null;
    documentName: string;
  }>({
    isOpen: false,
    documentId: null,
    documentName: "",
  });

  useEffect(() => {
    fetchDocuments();
    setTimeout(() => setIsVisible(true), 100);
  }, [searchQuery, selectedClass, sortBy]);

  const fetchDocuments = async () => {
    try {
      const params: SearchParams = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedClass) params.class = selectedClass;
      params.sort = sortBy;

      const data = await searchDocuments(params);
      setDocuments(data.results || data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (docId: number) => {
    try {
      await toggleFavorite(docId);
      fetchDocuments();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const openDeleteModal = (docId: number, docName: string) => {
    setDeleteModal({
      isOpen: true,
      documentId: docId,
      documentName: docName,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      documentId: null,
      documentName: "",
    });
  };

  const handleDeleteDocument = async () => {
    if (!deleteModal.documentId) return;

    try {
      await deleteDocument(deleteModal.documentId);
      fetchDocuments();
      closeDeleteModal();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getClassColor = (className: string) => {
    const colors: Record<string, string> = {
      invoices: "from-blue-500 to-cyan-500",
      contracts: "from-green-500 to-emerald-500",
      identity_cards: "from-purple-500 to-pink-500",
    };
    return colors[className] || "from-gray-500 to-gray-600";
  };

  const getClassIcon = (className: string) => {
    switch (className) {
      case "invoices":
        return <FileCheck className="w-4 h-4" />;
      case "contracts":
        return <FileText className="w-4 h-4" />;
      case "identity_cards":
        return <Scan className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const stats = {
    total: documents.length,
    processed: documents.filter((d) => d.processed).length,
    favorites: documents.filter((d) => d.structured_data?.favorite).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Stats */}
        <div className={`space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Title & Action */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    My Documents
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg flex items-center gap-3 mt-2">
                    <FileText className="w-5 h-5 text-brand-500" />
                    {documents.length} document(s) organized with intelligence
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/user/upload"
              className="group relative px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <FilePlus className="w-5 h-5 group-hover:scale-110 transition-transform z-10" />
              <span className="z-10">New Document</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                value: stats.total,
                label: "Total Documents",
                icon: FileText,
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
              },
              {
                value: stats.processed,
                label: "Processed Documents",
                icon: CheckCircle2,
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
              },
              {
                value: stats.favorites,
                label: "Favorites",
                icon: Star,
                color: "from-amber-500 to-orange-500",
                bgColor: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-800/20",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-transparent overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">{stat.label}</p>
                      <p className={`text-4xl font-black ${
                        index === 0 ? "text-gray-900 dark:text-white" :
                        index === 1 ? "text-green-600" : "text-amber-600"
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <stat.icon className={`w-8 h-8 ${
                        index === 0 ? "text-blue-600" :
                        index === 1 ? "text-green-600" : "text-amber-600"
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col xl:flex-row gap-6">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Search by name, content, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white text-lg transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-500"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {/* Filters Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`group px-6 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 ${
                      showFilters
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-2xl">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-gray-600 text-brand-600 shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:text-brand-600"
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        viewMode === "list"
                          ? "bg-white dark:bg-gray-600 text-brand-600 shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:text-brand-600"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Extended Filters */}
              {showFilters && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      📁 Category
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="">All categories</option>
                      <option value="invoices">📄 Invoices</option>
                      <option value="contracts">📋 Contracts</option>
                      <option value="identity_cards">🪪 Identity Cards</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      🔄 Sort by
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="-uploaded_at">📅 Most recent</option>
                      <option value="uploaded_at">📅 Oldest</option>
                      <option value="original_filename">🔤 Name A-Z</option>
                      <option value="-original_filename">🔤 Name Z-A</option>
                      <option value="-confidence">📊 Confidence ↓</option>
                      <option value="confidence">📊 Confidence ↑</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2 flex items-end gap-4">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedClass("");
                        setSortBy("-uploaded_at");
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-brand-200/60 dark:border-brand-900/60 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className={`bg-white dark:bg-gray-800 p-12 lg:p-16 rounded-3xl shadow-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 rounded-full flex items-center justify-center shadow-lg">
              <FileText className="w-12 h-12 text-brand-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              No documents found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
              {searchQuery || selectedClass
                ? "Adjust your search criteria"
                : "Start by scanning your first document"}
            </p>
            <Link
              to="/user/upload"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300"
            >
              <FilePlus className="w-5 h-5" />
              Scan My First Document
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-transparent overflow-hidden transform hover:-translate-y-2"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {/* Document Preview */}
                <div className="relative h-48 bg-gradient-to-br from-brand-50 via-brand-100 to-brand-50 dark:from-brand-900/20 dark:via-brand-800/20 dark:to-brand-900/20 flex items-center justify-center overflow-hidden">
                  <FileText className="w-20 h-20 text-brand-400 opacity-60 group-hover:scale-110 transition-transform duration-500" />
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => handleToggleFavorite(doc.id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
                  >
                    <Star
                      className={`w-5 h-5 transition-all duration-300 ${
                        doc.structured_data?.favorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    {doc.processed ? (
                      <div className="px-3 py-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <CheckCircle2 className="w-3 h-3" />
                        Processed
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="p-6">
                  <Link
                    to={`/user/document/${doc.id}`}
                    className="block font-black text-lg text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 mb-3 truncate transition-colors"
                  >
                    {doc.original_filename}
                  </Link>

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r ${getClassColor(doc.predicted_class)}/10`}
                    >
                      {getClassIcon(doc.predicted_class)}
                      {doc.predicted_class || "Not classified"}
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">AI Confidence</span>
                      <span className="font-black text-brand-600">{doc.confidence_percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-1000"
                        style={{ width: `${doc.confidence_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-2 font-medium">
                      <Calendar className="w-4 h-4" />
                      {formatDate(doc.uploaded_at)}
                    </span>
                    <span className="font-bold">{formatFileSize(doc.file_size)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/document/${doc.id}`}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Open
                    </Link>
                    <button
                      onClick={() => openDeleteModal(doc.id, doc.original_filename)}
                      className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    {[
                      { icon: FileText, label: "Document" },
                      { icon: Target, label: "Category" },
                      { icon: Target, label: "Confidence" },
                      { icon: Calendar, label: "Date" },
                      { label: "Actions" },
                    ].map((header, index) => (
                      <th key={index} className="px-8 py-6 text-left">
                        <div className="flex items-center gap-3 text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {header.icon && <header.icon className="w-4 h-4" />}
                          {header.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-brand-600" />
                          </div>
                          <div>
                            <Link
                              to={`/user/document/${doc.id}`}
                              className="font-bold text-gray-900 dark:text-white hover:text-brand-600 truncate block"
                            >
                              {doc.original_filename}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r ${getClassColor(doc.predicted_class)}/10`}>
                          {getClassIcon(doc.predicted_class)}
                          {doc.predicted_class}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 max-w-[140px]">
                            <div
                              className="bg-gradient-to-r from-brand-500 to-brand-600 h-3 rounded-full"
                              style={{ width: `${doc.confidence_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-lg font-black text-gray-900 dark:text-white">
                            {doc.confidence_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFavorite(doc.id)}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all"
                          >
                            <Star className={`w-5 h-5 ${doc.structured_data?.favorite ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                          </button>
                          <Link
                            to={`/user/document/${doc.id}`}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all"
                          >
                            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(doc.id, doc.original_filename)}
                            className="p-3 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">
                        Delete Document
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDeleteModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete the document{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    "{deleteModal.documentName}"
                  </span>
                  ? This will permanently remove the document and all its associated data.
                </p>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 dark:text-red-300 font-medium text-sm">
                        Warning: This action is irreversible
                      </p>
                      <p className="text-red-700 dark:text-red-400 text-xs mt-1">
                        All extracted data and analysis will be lost permanently.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDocuments;