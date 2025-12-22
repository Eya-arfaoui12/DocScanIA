import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  Star,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Bell,
  Settings,
  ChevronDown,
} from "lucide-react";
import { logout, getCurrentUser } from "../services/authService";

const UserLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };

    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen]);

  const navigation = [
    { name: "Dashboard", href: "/user/dashboard", icon: Home },
    { name: "My Documents", href: "/user/documents", icon: FileText },
    { name: "Scanner", href: "/user/upload", icon: Upload },
    { name: "Favorites", href: "/user/favorites", icon: Star },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/signin");
    }
  };

  const isActive = (path: string) => {
    if (path === "/user/dashboard") {
      return location.pathname === "/user/dashboard" || location.pathname === "/user";
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  // ✅ Fonction pour obtenir l'URL de l'image de profil
  const getProfileImageUrl = () => {
    if (currentUser?.image_url) {
      // Si l'URL est relative, ajouter le domaine du backend
      if (currentUser.image_url.startsWith('/')) {
        return `http://localhost:8000${currentUser.image_url}`;
      }
      return currentUser.image_url;
    }
    if (currentUser?.image) {
      // Fallback pour l'ancien champ 'image'
      if (currentUser.image.startsWith('/')) {
        return `http://localhost:8000${currentUser.image}`;
      }
      return currentUser.image;
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/user/dashboard" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                  DocScan AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Intelligent classification
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="hidden md:flex relative p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {/* ✅ Photo de profil ou Avatar avec initiales */}
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-10 h-10 rounded-xl object-cover shadow-lg ring-2 ring-brand-500/20"
                      onError={(e) => {
                        // En cas d'erreur de chargement, afficher les initiales
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${profileImageUrl ? 'hidden' : ''}`}
                  >
                    {getInitials(currentUser?.username, currentUser?.email)}
                  </div>
                  
                  {/* Nom de l'utilisateur (caché sur mobile) */}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentUser?.username || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentUser?.role || "Member"}
                    </p>
                  </div>
                  
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* User Dropdown - Design Amélioré */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header avec dégradé et photo de profil */}
                    <div className="relative p-6 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white overflow-hidden">
                      {/* Effet de background animé */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      
                      <div className="relative flex items-center gap-4">
                        {profileImageUrl ? (
                          <div className="relative">
                            <img
                              src={profileImageUrl}
                              alt="Profile"
                              className="w-16 h-16 rounded-2xl object-cover shadow-xl ring-4 ring-white/30"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-white/30">
                              {getInitials(currentUser?.username, currentUser?.email)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate">
                            {currentUser?.username || "User"}
                          </p>
                          <p className="text-sm text-brand-100 truncate">
                            {currentUser?.email || "user@example.com"}
                          </p>
                          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                            {currentUser?.role || "Member"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Section (optionnel) */}
                    <div className="grid grid-cols-3 gap-1 p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-center p-2">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">24</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
                      </div>
                      <div className="text-center p-2 border-x border-gray-200 dark:border-gray-700">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">12</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Scans</p>
                      </div>
                      <div className="text-center p-2">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Favoris</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to="/user/profile"
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-brand-50 hover:to-brand-100 dark:hover:from-brand-900/20 dark:hover:to-brand-800/20 transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                          <User className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white font-semibold group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            My Profile
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Manage your information
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      {/* <Link
                        to="/user/settings"
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-700/30 transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white font-semibold">
                            Paramètres
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Personnaliser l'application
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                      </Link> */}
                    </div>

                    {/* Logout Section */}
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                          <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-red-600 dark:text-red-400 font-semibold">
                            Logout
                          </p>
                          <p className="text-xs text-red-500 dark:text-red-400/70">
                            Log out of the account
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-red-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
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
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  DocScan AI
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Intelligent platform for document classification and management using OCR and AI.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                © 2024 DocScan AI. All rights reserved.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                Navigation
              </h4>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Help
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;