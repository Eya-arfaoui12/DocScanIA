import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CheckCircle,
  X,
  Loader2,
  FileText,
  Shield,
  Zap,
  Target,
  BarChart3,
  Clock,
  FileDigit,
  RotateCcw,
  Eye,
  Sparkles,
} from "lucide-react";
import { uploadDocument, quickClassify } from "../../services/documentService";

interface ClassificationResult {
  id?: number;
  predicted_class: string;
  confidence: number;
  confidence_percentage: number;
  all_probabilities?: Record<string, number>;
  extracted_text: string;
  text_length: number;
  structured_data: Record<string, any>;
  processing_time: number;
}

const UploadDocument = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported format. Please use JPG, PNG or PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB).");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const data = await uploadDocument(selectedFile);
      setResult(data);
      setTimeout(() => setShowResult(true), 100);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleQuickClassify = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const data = await quickClassify(selectedFile);
      setResult(data);
      setTimeout(() => setShowResult(true), 100);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setUploading(false);
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
    const icons: Record<string, string> = {
      invoices: "📄",
      contracts: "📋",
      identity_cards: "🪪",
    };
    return icons[className] || "📁";
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setShowResult(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Upload className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-3xl font-black text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Scan a Document
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload your document for automatic classification by artificial intelligence
          </p>
        </div>

        {/* Upload Zone */}
        {!showResult && (
          <div className={`transition-all duration-500 ${result ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative p-8 md:p-12 border-4 border-dashed rounded-3xl transition-all duration-300 ${
                  dragging
                    ? "border-brand-500 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div className="text-center space-y-8">
                    <div className="space-y-4">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 rounded-3xl flex items-center justify-center shadow-lg">
                        <Upload className="w-10 h-10 text-brand-600" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                          Drag and drop your file
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                          or click to browse your files
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300 flex items-center gap-3 mx-auto"
                    >
                      <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Choose a file
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supported formats: JPG, PNG, PDF • Maximum 10MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* File Preview */}
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-900 dark:text-white truncate text-lg">
                          {selectedFile.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                        </p>
                      </div>
                      <button
                        onClick={resetUpload}
                        className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <X className="w-6 h-6 text-red-500" />
                      </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl animate-pulse">
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                          <X className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="group relative px-8 py-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin z-10" />
                        ) : (
                          <CheckCircle className="w-5 h-5 z-10 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="z-10">
                          {uploading ? "Processing..." : "Scan and Save"}
                        </span>
                      </button>
                      
                      <button
                        onClick={handleQuickClassify}
                        disabled={uploading}
                        className="px-8 py-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-2xl font-bold hover:border-brand-500 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        <Zap className="w-5 h-5" />
                        Quick Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && showResult && (
          <div className={`space-y-8 transition-all duration-500 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {/* Classification Success */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-6 mb-8">
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${getClassColor(
                    result.predicted_class
                  )} rounded-3xl flex items-center justify-center text-4xl shadow-2xl`}
                >
                  {getClassIcon(result.predicted_class)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                      Document Classified!
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Detected type: <span className="font-black text-brand-600 capitalize">{result.predicted_class}</span>
                  </p>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    Confidence Level
                  </span>
                  <span className="text-3xl font-black text-brand-600">
                    {result.confidence_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-brand-600 h-6 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${result.confidence_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* All Probabilities */}
              {result.all_probabilities && (
                <div className="mb-8">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-brand-600" />
                    Probabilities by Category
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(result.all_probabilities).map(([className, prob]) => (
                      <div
                        key={className}
                        className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-brand-500 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-black text-gray-900 dark:text-white capitalize">
                            {className}
                          </span>
                          <span className="text-lg font-black text-brand-600">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 shadow-inner">
                          <div
                            className={`bg-gradient-to-r ${getClassColor(className)} h-3 rounded-full transition-all duration-1000 group-hover:shadow-lg`}
                            style={{ width: `${prob * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <FileDigit className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Extracted Characters
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {result.text_length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Processing Time
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {result.processing_time?.toFixed(2)}s
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Structured Data
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {Object.keys(result.structured_data || {}).length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </p>
                  <p className="text-xl font-black text-emerald-600">
                    Success
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {result.id && (
                <button
                  onClick={() => navigate(`/user/document/${result.id}`)}
                  className="group flex-1 px-8 py-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  View Complete Document
                </button>
              )}
              <button
                onClick={resetUpload}
                className="px-8 py-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-2xl font-bold hover:border-brand-500 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-5 h-5" />
                Scan Another Document
              </button>
            </div>
          </div>
        )}

        {/* Info Cards */}
        {!selectedFile && !showResult && (
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Fast Classification",
                description: "Results in seconds thanks to our advanced AI",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
              },
              {
                icon: Target,
                title: "High Precision",
                description: "Success rate over 95% on all documents",
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
              },
              {
                icon: Shield,
                title: "Maximum Security",
                description: "Your documents are encrypted and protected at all times",
                color: "from-purple-500 to-pink-500",
                bgColor: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`group p-8 bg-gradient-to-br ${feature.bgColor} rounded-3xl border border-gray-200 dark:border-gray-600 hover:shadow-2xl transition-all duration-500`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-xl mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocument;