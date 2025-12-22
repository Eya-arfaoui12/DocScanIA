import { useState, useEffect } from "react";
import { 
  Edit, X, Save, AlertTriangle, FileText, Database, 
  RotateCcw, Type, CheckCircle
} from "lucide-react";
import { Document } from "../services/documentService";

interface CorrectionModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onCorrect: (data: {
    predicted_class?: string;
    structured_data?: Record<string, any>;
  }) => Promise<void>;
  onCorrectText?: (text: string, reason?: string) => Promise<void>;
}

const CorrectionModal = ({ 
  document, 
  isOpen, 
  onClose, 
  onCorrect,
  onCorrectText 
}: CorrectionModalProps) => {
  const [activeTab, setActiveTab] = useState<"classification" | "text">("classification");
  
  // Classification state
  const [correctedClass, setCorrectedClass] = useState(document.predicted_class || "");
  const [structuredData, setStructuredData] = useState<Record<string, any>>(
    document.structured_data || {}
  );
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  
  // Text correction state
  const [extractedText, setExtractedText] = useState(document.extracted_text || "");
  const [correctionReason, setCorrectionReason] = useState("");
  const [textChanged, setTextChanged] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const documentClasses = [
    { value: "factures", label: "📄 Invoice", color: "from-blue-500 to-blue-600" },
    { value: "contrats", label: "📋 Contract", color: "from-green-500 to-green-600" },
    { value: "cartes_identite", label: "🪪 ID Card", color: "from-purple-500 to-purple-600" },
  ];

  // Reset when document changes
  useEffect(() => {
    setCorrectedClass(document.predicted_class || "");
    setStructuredData(document.structured_data || {});
    setExtractedText(document.extracted_text || "");
    setTextChanged(false);
    setError("");
    setSuccessMessage("");
  }, [document]);

  // Track text changes
  useEffect(() => {
    setTextChanged(extractedText !== document.extracted_text);
  }, [extractedText, document.extracted_text]);

  const handleAddField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) return;
    
    setStructuredData({
      ...structuredData,
      [newFieldKey.trim()]: newFieldValue.trim(),
    });
    
    setNewFieldKey("");
    setNewFieldValue("");
  };

  const handleRemoveField = (key: string) => {
    const updated = { ...structuredData };
    delete updated[key];
    setStructuredData(updated);
  };

  const handleUpdateField = (key: string, value: string) => {
    setStructuredData({
      ...structuredData,
      [key]: value,
    });
  };

  const handleResetText = () => {
    if (window.confirm("Reset text to original? This will discard your changes.")) {
      setExtractedText(document.extracted_text || "");
      setTextChanged(false);
    }
  };

  const handleSubmitClassification = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const correctionData: {
        predicted_class?: string;
        structured_data?: Record<string, any>;
      } = {};

      if (correctedClass !== document.predicted_class) {
        correctionData.predicted_class = correctedClass;
      }

      if (JSON.stringify(structuredData) !== JSON.stringify(document.structured_data)) {
        correctionData.structured_data = structuredData;
      }

      if (Object.keys(correctionData).length === 0) {
        setError("No changes detected");
        setIsSaving(false);
        return;
      }

      await onCorrect(correctionData);
      setSuccessMessage("Classification corrected successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save corrections");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitText = async () => {
    if (!onCorrectText) {
      setError("Text correction is not available");
      return;
    }

    if (!textChanged) {
      setError("No changes detected in text");
      return;
    }

    if (extractedText.trim().length === 0) {
      setError("Text cannot be empty");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await onCorrectText(extractedText, correctionReason || "Manual text correction");
      setSuccessMessage("Text corrected successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save text corrections");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Manual Correction</h3>
              <p className="text-brand-100 text-sm">{document.original_filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setActiveTab("classification")}
            className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "classification"
                ? "bg-white dark:bg-gray-800 text-brand-600 border-b-2 border-brand-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Database className="w-5 h-5" />
            Classification & Data
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "text"
                ? "bg-white dark:bg-gray-800 text-brand-600 border-b-2 border-brand-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Type className="w-5 h-5" />
            Extracted Text
            {textChanged && (
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in slide-in-from-top-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 dark:text-green-300 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Classification Tab */}
          {activeTab === "classification" && (
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                    Manual Correction Mode
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Changes will be logged and marked as manually validated. This will override the AI classification.
                  </p>
                </div>
              </div>

              {/* Document Class Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-brand-600" />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    Document Classification
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {documentClasses.map((docClass) => (
                    <button
                      key={docClass.value}
                      onClick={() => setCorrectedClass(docClass.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        correctedClass === docClass.value
                          ? `bg-gradient-to-r ${docClass.color} text-white border-transparent shadow-lg`
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-brand-400"
                      }`}
                    >
                      <div className="text-2xl mb-2">{docClass.label.split(" ")[0]}</div>
                      <div className="font-semibold">{docClass.label.split(" ")[1]}</div>
                    </button>
                  ))}
                </div>

                {correctedClass !== document.predicted_class && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      ✓ Classification changed: <span className="font-bold">{document.predicted_class}</span> → <span className="font-bold">{correctedClass}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Structured Data Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-brand-600" />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    Structured Data Fields
                  </h4>
                </div>

                {/* Existing Fields */}
                <div className="space-y-3 mb-4">
                  {Object.entries(structuredData).map(([key, value]) => {
                    if (key === "tags" || key === "folder" || key === "favorite" || key === "manually_validated" || key === "text_manually_corrected" || key === "text_correction_date") {
                      return null;
                    }

                    return (
                      <div key={key} className="flex gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={key}
                            disabled
                            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
                          />
                          <input
                            type="text"
                            value={typeof value === "object" ? JSON.stringify(value) : String(value)}
                            onChange={(e) => handleUpdateField(key, e.target.value)}
                            className="px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveField(key)}
                          className="w-12 h-12 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-xl transition-colors flex items-center justify-center"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Field */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Add New Field
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      placeholder="Field name"
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddField()}
                      placeholder="Value"
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleAddField}
                      className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-bold transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Correction Tab */}
          {activeTab === "text" && (
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
                <Type className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                    Text Correction Mode
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Edit the extracted text manually. This will update the text used for data extraction and exports.
                  </p>
                </div>
              </div>

              {/* Text is corrected indicator */}
              {document.structured_data?.text_manually_corrected && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    This text was previously corrected on {new Date(document.structured_data.text_correction_date).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Correction Reason (Optional)
                </label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g., Fixed OCR errors, Added missing information..."
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              {/* Text Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                    Extracted Text
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {extractedText.length} characters
                    </span>
                    {textChanged && (
                      <button
                        onClick={handleResetText}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-96 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-white font-mono text-sm resize-none"
                  placeholder="Extracted text will appear here..."
                />
              </div>

              {/* Change Indicator */}
              {textChanged && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Text has been modified. Click "Save Text Correction" to apply changes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-6 py-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white rounded-xl font-bold hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={activeTab === "classification" ? handleSubmitClassification : handleSubmitText}
            disabled={isSaving || (activeTab === "text" && !textChanged)}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-brand-500/25"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {activeTab === "classification" ? "Save Classification" : "Save Text Correction"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionModal;