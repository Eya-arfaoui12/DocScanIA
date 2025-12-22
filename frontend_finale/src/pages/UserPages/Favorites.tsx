import { useEffect, useState } from "react";
import { Link } from "react-router";
import { 
  Star, 
  FileText, 
  Eye, 
  Sparkles, 
  Heart, 
  TrendingUp, 
  Zap,
  Target,
  Crown,
  RotateCcw,
  Filter,
  Search
} from "lucide-react";
import { getFavorites, toggleFavorite, type Document } from "../../services/documentService";

const Favorites = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchFavorites();
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const fetchFavorites = async () => {
    try {
      const data = await getFavorites();
      setDocuments(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (docId: number) => {
    try {
      await toggleFavorite(docId);
      fetchFavorites();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getClassColor = (className: string) => {
    const colors: Record<string, string> = {
      factures: "from-blue-500 to-cyan-500",
      contrats: "from-green-500 to-emerald-500",
      cartes_identite: "from-purple-500 to-pink-500",
    };
    return colors[className] || "from-gray-500 to-gray-600";
  };

  const getClassIcon = (className: string) => {
    const icons: Record<string, string> = {
      factures: "📄",
      contrats: "📋",
      cartes_identite: "🪪",
    };
    return icons[className] || "📁";
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

  const filteredDocuments = documents.filter(doc => 
    doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedClass === "" || doc.predicted_class === selectedClass)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-amber-200/60 dark:border-amber-900/60 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Loading favorites...</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Preparing your collection</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    My Favorites
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg flex items-center gap-3 mt-2">
                    <Heart className="w-5 h-5 text-amber-500" />
                    {documents.length} essential document(s) saved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Filters */}
        {documents.length > 0 && (
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            
            {/* Stats Card */}
            <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 p-8 rounded-3xl text-white shadow-2xl overflow-hidden mb-6">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
              
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Crown className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black">Premium Collection</h3>
                  </div>
                  <p className="text-amber-100 text-lg max-w-2xl">
                    Your <span className="font-black text-white">{documents.length}</span> most important documents are organized here for instant access. Your productivity is our priority! 🚀
                  </p>
                </div>
                <div className="hidden lg:block w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
                  <Star className="w-12 h-12 fill-white" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Search in favorites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">All categories</option>
                    <option value="factures">📄 Invoices</option>
                    <option value="contrats">📋 Contracts</option>
                    <option value="cartes_identite">🪪 ID Cards</option>
                  </select>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedClass("");
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className={`bg-white dark:bg-gray-800 p-12 lg:p-16 rounded-3xl shadow-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/30 dark:to-amber-800/30 rounded-full blur-3xl opacity-50"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-full flex items-center justify-center shadow-2xl">
                <Star className="w-16 h-16 text-amber-500" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
              No Favorites Yet
            </h3>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start marking important documents as favorites to find them instantly.
            </p>

            <Link
              to="/user/documents"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              Browse My Documents
            </Link>
          </div>
        ) : (
          <div className={`space-y-6 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {filteredDocuments.length} document(s) found
              </p>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map((doc, index) => (
                <div
                  key={doc.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-transparent overflow-hidden transform hover:-translate-y-2"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  
                  {/* Document Preview */}
                  <div className="relative h-48 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 dark:from-amber-900/20 dark:via-amber-800/20 dark:to-amber-900/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
                    <FileText className="w-20 h-20 text-amber-400 opacity-60 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                    
                    {/* Favorite Badge */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                      <Star className="w-6 h-6 text-white fill-white" />
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFavorite(doc.id)}
                      className="absolute top-4 left-4 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 opacity-0 group-hover:opacity-100 group/remove"
                    >
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500 group-hover/remove:scale-110 transition-transform" />
                    </button>
                  </div>

                  {/* Document Info */}
                  <div className="p-6">
                    <Link
                      to={`/user/document/${doc.id}`}
                      className="block font-black text-lg text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 mb-3 truncate transition-colors group/title"
                    >
                      <span className="group-hover/title:underline">{doc.original_filename}</span>
                    </Link>

                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 flex items-center gap-2 bg-gradient-to-r ${getClassColor(doc.predicted_class)}/10 border-transparent`}
                      >
                        <span className="text-lg">{getClassIcon(doc.predicted_class)}</span>
                        {doc.predicted_class || "Unclassified"}
                      </span>
                    </div>

                    {/* Confidence Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          AI Confidence
                        </span>
                        <span className="font-black text-amber-600">{doc.confidence_percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000 ease-out"
                          style={{ width: `${doc.confidence_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-2 font-medium">
                        {formatDate(doc.uploaded_at)}
                      </span>
                      <span className="font-bold">{formatFileSize(doc.file_size)}</span>
                    </div>

                    <Link
                      to={`/user/document/${doc.id}`}
                      className="block w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 text-center flex items-center justify-center gap-2 group/action"
                    >
                      <Eye className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                      Open Document
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-8 rounded-3xl border-2 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                    💡 Master Your Favorites
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    Favorite documents form your personal collection of essentials.
                    Click the star <Star className="w-4 h-4 inline text-amber-500" /> on any document to save it instantly.
                    Organize your workspace around what truly matters! ⭐
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
