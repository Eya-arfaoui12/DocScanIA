import React from "react";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Left Side - Illustration & Branding */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo */}
         

          {/* Illustration - Document Management */}
          <div className="relative w-full max-w-md mb-8">
            
            {/* Main illustration container */}
            <div className="relative">
              
              {/* Dashboard mockup */}
              <div className="p-6 bg-white border-2 border-gray-200 shadow-2xl rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                {/* Header */}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded dark:bg-gray-700"></div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  {/* Document items */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 transition-all bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-2 mb-1 bg-gray-300 rounded dark:bg-gray-600" style={{ width: `${80 - i * 15}%` }}></div>
                        <div className="h-1.5 bg-gray-200 rounded dark:bg-gray-600" style={{ width: `${60 - i * 10}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2 text-center bg-blue-50 rounded-lg dark:bg-blue-900/20">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">1.2k</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Docs</div>
                  </div>
                  <div className="p-2 text-center bg-green-50 rounded-lg dark:bg-green-900/20">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">99%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">OCR</div>
                  </div>
                  <div className="p-2 text-center bg-purple-50 rounded-lg dark:bg-purple-900/20">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">24/7</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute p-3 transition-all bg-white border-2 border-gray-200 shadow-lg -right-4 -top-4 rounded-xl animate-pulse dark:bg-gray-800 dark:border-gray-700">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="absolute p-3 transition-all bg-white border-2 border-gray-200 shadow-lg -left-4 -bottom-4 rounded-xl animate-pulse dark:bg-gray-800 dark:border-gray-700" style={{ animationDelay: '1s' }}>
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="text-center">
            <h2 className="mb-3 text-2xl font-bold text-gray-800 dark:text-white">
              Gérez vos documents intelligemment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Numérisez, organisez et retrouvez tous vos documents en quelques secondes
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center w-full px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Theme Toggler */}
      <div className="fixed z-50 bottom-6 right-6">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}