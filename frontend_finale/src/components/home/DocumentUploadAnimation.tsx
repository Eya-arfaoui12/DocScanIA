// components/home/DocumentUploadAnimation.tsx
import { useState, useEffect } from 'react';

interface UploadingFile {
  id: number;
  name: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete';
}

export default function DocumentUploadAnimation() {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileNames = [
    'Facture_Mars_2024.pdf',
    'Contrat_Signature.pdf',
    'Rapport_Financier.xlsx',
    'Carte_Identite.jpg',
  ];

  useEffect(() => {
    // Simulate drag and drop
    const dragInterval = setInterval(() => {
      setIsDragging(true);
      setTimeout(() => setIsDragging(false), 1000);
    }, 6000);

    // Add new file
    const fileInterval = setInterval(() => {
      const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
      const newFile: UploadingFile = {
        id: Date.now(),
        name: randomFile,
        progress: 0,
        status: 'uploading',
      };

      setFiles((prev) => [...prev.slice(-2), newFile]);

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, progress: 100, status: 'processing' }
                : f
            )
          );

          // Mark as complete after processing
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === newFile.id ? { ...f, status: 'complete' } : f
              )
            );
          }, 1500);

          clearInterval(progressInterval);
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id ? { ...f, progress } : f
            )
          );
        }
      }, 200);
    }, 4000);

    return () => {
      clearInterval(dragInterval);
      clearInterval(fileInterval);
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Upload zone */}
      <div
        className={`relative border-4 border-dashed rounded-2xl transition-all duration-300 ${
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-105'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
        }`}
      >
        {/* Upload icon and text */}
        <div className="p-12 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white mb-6 transition-transform duration-300 ${
            isDragging ? 'scale-125 rotate-12' : 'scale-100'
          }`}>
            <svg
              className={`w-10 h-10 transition-transform duration-300 ${
                isDragging ? 'translate-y-2' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {isDragging ? (
            <div className="animate-fade-in">
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mb-2">
                Déposez vos fichiers ici
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Les fichiers seront automatiquement traités
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Glissez-déposez vos documents
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ou cliquez pour parcourir
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span>PDF</span>
                <span>•</span>
                <span>DOCX</span>
                <span>•</span>
                <span>PNG</span>
                <span>•</span>
                <span>JPG</span>
              </div>
            </div>
          )}
        </div>

        {/* Uploading files list */}
        {files.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-slide-in-up"
              >
                {/* File icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    {file.status === 'complete' ? (
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-brand-500 animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">
                      {file.status === 'uploading' && `${Math.round(file.progress)}%`}
                      {file.status === 'processing' && 'Traitement...'}
                      {file.status === 'complete' && 'Terminé'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {file.status !== 'complete' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          file.status === 'processing'
                            ? 'bg-purple-500 animate-pulse'
                            : 'bg-gradient-to-r from-brand-500 to-purple-600'
                        }`}
                        style={{
                          width: `${file.status === 'processing' ? 100 : file.progress}%`,
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Status badge */}
                  {file.status === 'complete' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                        ✓ Classifié
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        OCR Effectué
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating file icons */}
      {isDragging && (
        <>
          <div className="absolute -top-8 left-1/4 text-4xl animate-float-slow">
            📄
          </div>
          <div className="absolute -top-12 right-1/4 text-3xl animate-float-slow animation-delay-500">
            📋
          </div>
          <div className="absolute -top-6 left-1/2 text-3xl animate-float-slow animation-delay-1000">
            📑
          </div>
        </>
      )}
    </div>
  );
}