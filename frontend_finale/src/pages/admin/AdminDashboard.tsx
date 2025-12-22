import { useEffect, useState } from "react";
import AdminMetrics from "../../components/admin/AdminMetrics";
import DocumentsChart from "../../components/admin/DocumentsChart";
import ClassificationChart from "../../components/admin/ClassificationChart";
import RecentDocuments from "../../components/admin/RecentDocuments";
import UsersList from "../../components/admin/UsersList";
import ActivityTimeline from "../../components/admin/ActivityTimeline";
import PageMeta from "../../components/common/PageMeta";
import { getDashboardStats, getActivity } from "../../services/documentService";
import { getAllUsers } from "../../services/adminUserService";
import type { DashboardStats } from "../../services/documentService";
import type { AdminUser } from "../../services/adminUserService";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger toutes les données en parallèle
      const [dashboardData, usersData, activityData] = await Promise.all([
        getDashboardStats(),
        getAllUsers().catch(() => []), // Fallback si pas d'accès admin
        getActivity().catch(() => []),
      ]);

      setStats(dashboardData);
      setUsers(usersData);
      setActivity(activityData);
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Admin Dashboard | Document Management System"
        description="Administrative dashboard with real-time statistics and analytics"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Overview of your document management system
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Metrics Overview */}
        <AdminMetrics stats={stats} usersCount={users.length} />

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-7">
            <DocumentsChart monthlyData={stats.monthly_uploads} />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ClassificationChart 
              documentsByClass={stats.documents_by_class}
              averageConfidence={stats.average_confidence}
            />
          </div>
        </div>

        {/* Recent Activity & Users */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-7">
            <RecentDocuments documents={stats.recent_documents} />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <UsersList users={users.slice(0, 5)} />
          </div>
        </div>

        {/* Activity Timeline */}
        {activity.length > 0 && (
          <div className="col-span-12">
            <ActivityTimeline activities={activity} />
          </div>
        )}
      </div>
    </>
  );
}