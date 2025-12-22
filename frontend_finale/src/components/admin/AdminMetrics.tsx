import { ArrowUpIcon, ArrowDownIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import type { DashboardStats } from "../../services/documentService";

interface AdminMetricsProps {
  stats: DashboardStats;
  usersCount: number;
}

export default function AdminMetrics({ stats, usersCount }: AdminMetricsProps) {
  const metrics = [
    {
      title: "Total Documents",
      value: stats.total_documents,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      change: stats.total_documents > 0 ? "+100%" : "0%",
      isPositive: true,
      bgColor: "bg-blue-100 dark:bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Processed",
      value: stats.processed_documents,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      change: stats.total_documents > 0 
        ? `${((stats.processed_documents / stats.total_documents) * 100).toFixed(1)}%`
        : "0%",
      isPositive: true,
      bgColor: "bg-green-100 dark:bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Users",
      value: usersCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      change: usersCount > 0 ? "+Active" : "0",
      isPositive: true,
      bgColor: "bg-purple-100 dark:bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Errors",
      value: stats.error_documents,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      change: stats.error_documents > 0 ? "Attention" : "Good",
      isPositive: stats.error_documents === 0,
      bgColor: "bg-red-100 dark:bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-lg transition-shadow"
        >
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${metric.bgColor}`}>
            <div className={metric.iconColor}>
              {metric.icon}
            </div>
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value.toLocaleString()}
              </h4>
            </div>
            <Badge color={metric.isPositive ? "success" : "error"}>
              {metric.isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {metric.change}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}