
// components/home/AutoClassificationAnimation.tsx
import { useState, useEffect } from 'react';

interface Document {
  id: number;
  title: string;
  type: string;
  color: string;
  icon: string;
}

export default function AutoClassificationAnimation() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState(0);

  const documentTypes: Document[] = [
    {
      id: 1,
      title: 'Facture_2024.pdf',
      type: 'Facture',
      color: 'from-blue-500 to-cyan-500',
      icon: '💰',
    },
    {
      id: 2,
      title: 'Contrat_Client.pdf',
      type: 'Contrat',
      color: 'from-purple-500 to-pink-500',
      icon: '📄',
    },
    {
      id: 3,
      title: 'Carte_Identite.jpg',
      type: 'Identité',
      color: 'from-green-500 to-emerald-500',
      icon: '🪪',
    },
    {
      id: 4,
      title: 'Rapport_Annuel.pdf',
      type: 'Rapport',
      color: 'from-orange-500 to-red-500',
      icon: '📊',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDocuments((prev) => {
        const nextDoc = documentTypes[currentDoc];
        const newDocs = [...prev, { ...nextDoc, id: Date.now() + currentDoc }];
        
        setCurrentDoc((curr) => (curr + 1) % documentTypes.length);
        
        // Keep only last 4 documents
        return newDocs.slice(-4);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentDoc]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Classification en cours
          </h3>
          <div className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 rounded-full">
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              IA Active
            </span>
          </div>
        </div>

        {/* Documents list */}
        <div className="space-y-4 min-h-[300px]">
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl animate-slide-in-right opacity-0"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards',
              }}
            >
              {/* Document icon */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-2xl shadow-inner">
                  📄
                </div>
              </div>

              {/* Document info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {doc.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full animate-progress-bar"></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Analyse...
                  </span>
                </div>
              </div>

              {/* Classification badge (appears after delay) */}
              <div className="flex-shrink-0 animate-scale-in opacity-0" style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}>
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${doc.color} text-white shadow-lg flex items-center gap-2`}>
                  <span className="text-lg">{doc.icon}</span>
                  <span className="text-sm font-bold">{doc.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {documents.length * 3}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Classifiés
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                98%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Précision
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                &lt;2s
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Par document
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}