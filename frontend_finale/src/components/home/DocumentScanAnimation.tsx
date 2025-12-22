// components/home/DocumentScanAnimation.tsx
import { useState, useEffect } from 'react';

export default function DocumentScanAnimation() {
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true);
      setScanProgress(0);
      setIsComplete(false);

      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsScanning(false);
            setIsComplete(true);
            setTimeout(() => setIsComplete(false), 1000);
            return 100;
          }
          return prev + 2;
        });
      }, 30);

      return () => clearInterval(progressInterval);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Document mockup */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-700">
        {/* Document header */}
        <div className="bg-gradient-to-r from-brand-500 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>

        {/* Document content */}
        <div className="p-8 relative">
          {/* Text lines simulation */}
          <div className="space-y-3 mb-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          </div>

          {/* Image placeholder */}
          <div className="w-full h-32 bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/20 dark:to-purple-900/20 rounded-lg mb-6"></div>

          {/* More text lines */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>

          {/* Scanning beam effect */}
          {isScanning && (
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-lg shadow-brand-500/50 transition-all duration-75"
              style={{
                top: `${(scanProgress / 100) * 100}%`,
                opacity: 0.8,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 blur-sm"></div>
            </div>
          )}

          {/* Success checkmark */}
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-xl animate-scale-in">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isScanning && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Scanning document...
              </span>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                {Math.round(scanProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-600 transition-all duration-75 rounded-full"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-brand-400 rounded-full animate-float"></div>
      <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-400 rounded-full animate-float animation-delay-1000"></div>
      <div className="absolute top-1/2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-float animation-delay-2000"></div>
    </div>
  );
}