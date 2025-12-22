import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

interface ClassificationChartProps {
  documentsByClass: Array<{ predicted_class: string | null; count: number }>;
  averageConfidence: number;
}

export default function ClassificationChart({ 
  documentsByClass, 
  averageConfidence 
}: ClassificationChartProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ CORRECTION : Filtrer les valeurs null et formater les labels
  const validDocuments = documentsByClass.filter(item => item.predicted_class !== null && item.predicted_class !== '');
  
  const labels = validDocuments.map(item => {
    // Vérification supplémentaire au cas où
    if (!item.predicted_class) return 'Unknown';
    
    return item.predicted_class
      .charAt(0).toUpperCase() + 
      item.predicted_class.slice(1).replace('_', ' ');
  });
  
  const series = validDocuments.map(item => item.count);
  const total = series.reduce((sum, val) => sum + val, 0);

  const colors = ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const options: ApexOptions = {
    colors: colors,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 330,
    },
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              color: "#64748B",
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: "600",
              color: "#1D2939",
              formatter: function (val) {
                return val;
              },
            },
            total: {
              show: true,
              label: "Total Docs",
              fontSize: "14px",
              color: "#64748B",
              formatter: function () {
                return total.toString();
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    labels: labels,
    tooltip: {
      y: {
        formatter: (val: number) => {
          if (total === 0) return `${val} documents`;
          return `${val} documents (${((val / total) * 100).toFixed(1)}%)`;
        },
      },
    },
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // ✅ Gérer le cas où il n'y a aucun document classifié
  if (validDocuments.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-6 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Classification Distribution
              </h3>
              <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                Documents by category
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center h-[330px]">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
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
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                No classified documents yet
              </p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Upload documents to see classification statistics
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-6 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Classification Distribution
            </h3>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              Documents by category
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View Details
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Export Report
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="donut"
              height={330}
            />
          </div>

          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            Avg: {averageConfidence.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="space-y-3">
          {validDocuments.map((item, index) => (
            <div key={item.predicted_class || `unknown-${index}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {item.predicted_class ? item.predicted_class.replace('_', ' ') : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                      backgroundColor: colors[index % colors.length],
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-white/90 min-w-[40px] text-right">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}