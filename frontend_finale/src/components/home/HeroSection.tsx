import React, { useState, useEffect } from 'react';
import { FileText, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";


// Header Component avec navigation dynamique
function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features", id: "features" },
    { name: "How it Works", href: "#how-it-works", id: "how-it-works" },
    { name: "Benefits", href: "#benefits", id: "benefits" },
    { name: "Pricing", href: "#pricing", id: "pricing" },
  ];

  // ✅ Fonction pour gérer la navigation vers les sections
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    
    // Si on n'est pas sur la page d'accueil, naviguer d'abord vers "/"
    if (location.pathname !== '/') {
      navigate('/');
      // Attendre que la page se charge puis scroller
      setTimeout(() => {
        scrollToSection(id);
      }, 100);
    } else {
      // Sinon, scroller directement
      scrollToSection(id);
    }
    
    // Fermer le menu mobile
    setMobileMenuOpen(false);
  };

  // ✅ Fonction pour scroller vers une section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Hauteur du header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                DocScan AI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Intelligent Classification
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavigation(e, link.id)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors relative group cursor-pointer"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate("/signin")}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="p-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavigation(e, link.id)}
                  className="block px-4 py-3 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/signin");
                  }}
                  className="block w-full px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/signup");
                  }}
                  className="block w-full px-4 py-3 text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Laptop Mockup Component
function LaptopMockup() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  const slides = [
    { type: "scan", title: "Document Scanning" },
    { type: "ocr", title: "OCR Extraction" },
    { type: "classify", title: "AI Classification" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setScanProgress(0);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (slides[currentSlide].type === "scan") {
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => (prev >= 100 ? 100 : prev + 2));
      }, 50);
      return () => clearInterval(progressInterval);
    }
  }, [currentSlide]);

  return (
    <div className="relative">
      {/* Main Laptop */}
      <div className="relative mx-auto" style={{ width: '640px' }}>
        {/* Laptop Screen */}
        <div className="relative bg-gray-900 rounded-t-2xl shadow-2xl border-8 border-gray-800 pt-6 pb-4 px-4">
          {/* Camera */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-10">
            <div className="absolute inset-0.5 bg-gray-600 rounded-full"></div>
          </div>
          
          {/* Screen */}
          <div className="bg-white rounded-lg overflow-hidden shadow-inner" style={{ height: '400px' }}>
            {/* Browser Chrome */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 ml-4">
                  docscan-ai.app/scanner
                </div>
              </div>
            </div>

            {/* App Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  <span className="font-bold text-lg">DocScan AI</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 bg-gray-50 h-full overflow-hidden">
              {/* Scan View */}
              {currentSlide === 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Scanning Document</h3>
                    <span className="text-sm text-gray-500">{scanProgress}%</span>
                  </div>
                  
                  {/* Document Preview */}
                  <div className="relative bg-white rounded-xl p-6 shadow-lg overflow-hidden" style={{ height: '240px' }}>
                    {/* Document */}
                    <div className="bg-white h-full">
                      <div className="h-4 w-2/3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 w-5/6 bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 w-4/5 bg-gray-100 rounded mb-6"></div>
                      <div className="h-20 w-full bg-gray-50 rounded mb-4"></div>
                      <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
                      <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
                    </div>
                    
                    {/* Scan Line */}
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-lg shadow-blue-500/50"
                      style={{ top: `${scanProgress}%`, transition: 'top 0.05s linear' }}
                    ></div>
                    
                    {/* Corner Markers */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">Scanning in progress...</p>
                  </div>
                </div>
              )}

              {/* OCR View */}
              {currentSlide === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Text Extraction (OCR)</h3>
                  
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-xl font-bold">T</span>
                      </div>
                      <span className="font-semibold text-gray-700">Extracted Data</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded animate-pulse">
                        <p className="text-xs text-gray-500">Invoice #</p>
                        <p className="font-semibold text-gray-800">2024-001</p>
                      </div>
                      <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2 rounded animate-pulse" style={{animationDelay: '0.2s'}}>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-semibold text-gray-800">ABC Company</p>
                      </div>
                      <div className="bg-green-50 border-l-4 border-green-400 px-3 py-2 rounded animate-pulse" style={{animationDelay: '0.4s'}}>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-800">$1,250.00</p>
                      </div>
                      <div className="bg-purple-50 border-l-4 border-purple-400 px-3 py-2 rounded animate-pulse" style={{animationDelay: '0.6s'}}>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold text-gray-800">03/15/2024</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
                    <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div>
                </div>
              )}

              {/* Classification View */}
              {currentSlide === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Classification Successful!</h3>
                    <p className="text-sm text-gray-500 mt-1">Document analyzed by AI</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-2xl">📄</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-1">Invoice</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">Confidence: 98.5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Accounting</span>
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">2024</span>
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">Paid</span>
                      <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">PDF</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Laptop Base */}
        <div className="relative h-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-2xl">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-700 rounded-t-lg"></div>
        </div>
        
        {/* Laptop Bottom */}
        <div className="mx-auto bg-gray-900 rounded-b-3xl shadow-2xl" style={{ width: '720px', height: '12px' }}>
          <div className="h-full bg-gradient-to-r from-transparent via-gray-800 to-transparent rounded-b-3xl"></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-6 -right-8 w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-float">
        <div className="text-center">
          <span className="text-3xl">📊</span>
          <p className="text-xs font-bold text-gray-700 mt-1">PDF</p>
        </div>
      </div>
      
      <div className="absolute top-1/4 -left-12 w-20 h-20 bg-white rounded-xl shadow-xl flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
        <span className="text-3xl">📝</span>
      </div>
      
      <div className="absolute bottom-1/4 -right-10 w-18 h-18 bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-xl flex items-center justify-center animate-float" style={{animationDelay: '0.5s'}}>
        <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentSlide ? "w-10 bg-blue-500" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Header />
      
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  AI-Powered Document Processing
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                Scan and Classify Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Documents
                </span>{" "}
                Automatically
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                Intelligent document management solution using AI to scan, 
                classify and organize your documents in seconds.
              </p>

              {/* Boutons avec navigation */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/signup")}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-xl hover:scale-105"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  Get Started Free
                  <svg
                    className={`ml-2 w-5 h-5 transition-transform duration-300 ${
                      isHovered ? "translate-x-1" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>

                <button 
                  onClick={() => navigate("/signin")}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-700 dark:text-blue-300 transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 hover:shadow-lg hover:scale-105"
                >
                  Sign In
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>2-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right content - Laptop Mockup */}
            <div className="relative">
              <LaptopMockup />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -50px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(50px, 50px) scale(1.05); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </section>
    </>
  );
}