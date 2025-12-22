import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Upload,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Zap,
  Target,
  Sparkles,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "../../services/documentService";

const UserDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchStats();
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-brand-200/60 dark:border-brand-900/60 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Loading error
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Welcome! Here's an overview of your activity
              </p>
            </div>
            <Link
              to="/user/upload"
              className="group relative px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform z-10" />
              <span className="z-10">New Document</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            {
              title: "Total Documents",
              value: stats.total_documents,
              icon: FileText,
              color: "from-blue-500 to-cyan-500",
              bgColor: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
              textColor: "text-blue-600",
            },
            {
              title: "Processed Documents",
              value: stats.processed_documents,
              icon: CheckCircle2,
              color: "from-green-500 to-emerald-500",
              bgColor: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
              textColor: "text-green-600",
            },
            {
              title: "Pending",
              value: stats.pending_documents,
              icon: Clock,
              color: "from-amber-500 to-orange-500",
              bgColor: "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20",
              textColor: "text-amber-600",
            },
            {
              title: "Average Confidence",
              value: `${stats.average_confidence}%`,
              icon: Target,
              color: "from-purple-500 to-pink-500",
              bgColor: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
              textColor: "text-purple-600",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-transparent overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <stat.icon className={`w-7 h-7 ${stat.textColor}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{stat.title}</p>
                <p className={`text-3xl font-black ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Documents by Class */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Distribution by Type */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Distribution by Type
              </h2>
            </div>
            <div className="space-y-4">
              {stats.documents_by_class.map((item, index) => {
                const percentage = stats.total_documents > 0 
                  ? (item.count / stats.total_documents * 100).toFixed(1) 
                  : 0;
                
                const colors: Record<string, string> = {
                  invoices: "from-blue-500 to-cyan-500",
                  contracts: "from-green-500 to-emerald-500",
                  identity_cards: "from-purple-500 to-pink-500",
                };
                
                const icons: Record<string, string> = {
                  invoices: "📄",
                  contracts: "📋",
                  identity_cards: "🪪",
                };

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{icons[item.predicted_class] || "📁"}</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {item.predicted_class}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                          {item.count}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${colors[item.predicted_class] || "from-gray-500 to-gray-600"} h-3 rounded-full transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  Recent Documents
                </h2>
              </div>
              <Link
                to="/user/documents"
                className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-2 group"
              >
                View all
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recent_documents.slice(0, 5).map((doc) => (
                <Link
                  key={doc.id}
                  to={`/user/document/${doc.id}`}
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:border-brand-500"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 transition-colors">
                      {doc.original_filename}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {doc.predicted_class} • {doc.confidence_percentage}%
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    doc.processed 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600" 
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                  }`}>
                    {doc.processed ? "Processed" : "In progress"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        {stats.popular_tags && stats.popular_tags.length > 0 && (
          <div className={`bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Popular Tags
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {stats.popular_tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 text-brand-700 dark:text-brand-300 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg transition-all duration-300"
                >
                  {tag.tag}
                  <span className="px-2 py-0.5 bg-brand-500 text-white rounded-full text-xs">
                    {tag.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            {
              title: "Scan a Document",
              description: "Upload and analyze a new document",
              icon: Upload,
              link: "/user/upload",
              color: "from-blue-500 to-cyan-500",
              bgColor: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
            },
            {
              title: "My Documents",
              description: "View all your classified documents",
              icon: FileText,
              link: "/user/documents",
              color: "from-green-500 to-emerald-500",
              bgColor: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
            },
            {
              title: "My Favorites",
              description: "Quick access to your important documents",
              icon: Star,
              link: "/user/favorites",
              color: "from-amber-500 to-orange-500",
              bgColor: "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20",
            },
          ].map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-transparent overflow-hidden"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${action.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <action.icon className={`w-8 h-8 bg-gradient-to-r ${action.color} bg-clip-text text-transparent`} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {action.description}
              </p>
              <div className="flex items-center gap-2 text-brand-600 font-bold group-hover:gap-3 transition-all">
                Access
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Info Banner */}
        <div className={`bg-gradient-to-r from-brand-500 to-brand-600 p-8 rounded-3xl text-white shadow-2xl overflow-hidden relative transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black">Optimize Your Productivity</h3>
              </div>
              <p className="text-brand-100 text-lg">
                Use tags to organize your documents, mark your favorites for quick access,
                and leverage AI to automate your document management! 🚀
              </p>
            </div>
            <Link
              to="/user/upload"
              className="px-8 py-4 bg-white text-brand-600 rounded-2xl font-bold hover:shadow-xl transition-all duration-300 flex items-center gap-3 flex-shrink-0"
            >
              <Upload className="w-5 h-5" />
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;