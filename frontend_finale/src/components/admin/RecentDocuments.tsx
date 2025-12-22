import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
  } from "../ui/table";
  import Badge from "../ui/badge/Badge";
  import type { Document } from "../../services/documentService";
  
  interface RecentDocumentsProps {
    documents: Document[];
  }
  
  export default function RecentDocuments({ documents }: RecentDocumentsProps) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
  
    const getStatusBadge = (doc: Document) => {
      if (doc.error_message) {
        return <Badge size="sm" color="error">Error</Badge>;
      }
      if (doc.processed) {
        return <Badge size="sm" color="success">Processed</Badge>;
      }
      return <Badge size="sm" color="warning">Pending</Badge>;
    };
  
    const getClassColor = (className: string) => {
      const colors: Record<string, string> = {
        factures: 'text-blue-600 bg-blue-100 dark:bg-blue-500/10',
        contrats: 'text-green-600 bg-green-100 dark:bg-green-500/10',
        cartes_identite: 'text-purple-600 bg-purple-100 dark:bg-purple-500/10',
      };
      return colors[className] || 'text-gray-600 bg-gray-100 dark:bg-gray-500/10';
    };
  
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Documents
            </h3>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              Latest uploaded documents
            </p>
          </div>
  
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              See all
            </button>
          </div>
        </div>
  
        {documents.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
              No documents uploaded yet
            </p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Document
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Classification
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Confidence
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Size
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHeader>
  
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <svg
                            className="w-5 h-5 text-gray-600 dark:text-gray-400"
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
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm dark:text-white/90 truncate max-w-[200px]">
                            {doc.original_filename}
                          </p>
                          <span className="text-gray-500 text-xs dark:text-gray-400">
                            ID: {doc.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
  
                    <TableCell className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getClassColor(doc.predicted_class)}`}>
                        {doc.predicted_class.replace('_', ' ')}
                      </span>
                    </TableCell>
  
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${doc.confidence_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {doc.confidence_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
  
                    <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
  
                    <TableCell className="py-3">
                      {getStatusBadge(doc)}
                    </TableCell>
  
                    <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(doc.uploaded_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }