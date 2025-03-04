'use client';

import { useState, useEffect } from 'react';
import { Document, PdfTemplates, FileStatus } from '@/types/document';
import { documentService } from '@/services/documentService';
import { format } from 'date-fns';

interface DocumentListProps {
  userId: string;
  onViewDocument: (document: Document) => void;
  onGenerateDocument: (template: PdfTemplates) => void;
}

export function DocumentList({ userId, onViewDocument, onGenerateDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplates>(PdfTemplates.HOUSE_RULES_AGREEMENT);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.getUserDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const handleGenerateDocument = async () => {
    await onGenerateDocument(selectedTemplate);
    fetchDocuments();
  };

  const handleSignDocument = async (document: Document) => {
    try {
      setLoading(true);
      // Determine the template from the filename
      const template = document.filename.includes("house-rules")
        ? PdfTemplates.HOUSE_RULES_AGREEMENT
        : PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT;

      await documentService.signDocument(userId, template);

      fetchDocuments()
    } catch (error) {
      console.error('Error signing document:', error);
      setError('Failed to sign document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading documents...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        {error}
        <button
          className="ml-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          onClick={fetchDocuments}
        >
          Retry
        </button>
      </div>
    );
  }

  const renderStatusBadge = (status: FileStatus) => {
    switch (status) {
      case FileStatus.UNSIGNED:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Unsigned
          </span>
        );
      case FileStatus.SIGNED:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            Signed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="flex flex-row items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Your Documents</h3>
        <div className="flex items-center gap-2">
          {/* Custom template selector */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center justify-between w-[240px] px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsSelectOpen(!isSelectOpen)}
            >
              <span>
                {selectedTemplate === PdfTemplates.HOUSE_RULES_AGREEMENT
                  ? 'House Rules Agreement'
                  : 'Residential Lease Agreement'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 transition-transform ${isSelectOpen ? 'transform rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isSelectOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <div className="py-1">
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                    onClick={() => {
                      setSelectedTemplate(PdfTemplates.HOUSE_RULES_AGREEMENT);
                      setIsSelectOpen(false);
                    }}
                  >
                    House Rules Agreement
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                    onClick={() => {
                      setSelectedTemplate(PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT);
                      setIsSelectOpen(false);
                    }}
                  >
                    Residential Lease Agreement
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateDocument}
            className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Generate Document
          </button>
        </div>
      </div>
      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-12 w-12 mb-4 text-gray-400"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            <p>No documents found</p>
            <p className="text-sm">Generate a new document to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signed At
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {doc.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(doc.generatedAt), 'PPP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.signedAt ? format(new Date(doc.signedAt), 'PPP') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* "View" button only for documents without URL (using a Blob) */}
                        {!doc.url && (
                          <button
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => onViewDocument(doc)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 mr-1"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            View
                          </button>
                        )}

                        {/* "Open" button for documents with URL (opens in a new tab) */}
                        {doc.url && (
                          <button
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 mr-1"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Open
                          </button>
                        )}

                        {/* "Sign" button for unsigned documents */}
                        {doc.status === FileStatus.UNSIGNED && (
                          <button
                            className="inline-flex items-center px-3 py-1 border border-blue-600 text-sm leading-4 font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-800 hover:border-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => handleSignDocument(doc)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 mr-1"
                            >
                              <path d="M12 22l1-2 1-2 2-1 3-1 1.5.5-3.5 3.5-4 1z"></path>
                              <path d="M9 18l.87-1.312a3 3 0 0 1 4.33-1.45 3 3 0 0 1 1.45 4.33L15 21l-3 1-3-4z"></path>
                              <path d="M9 6V3c0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h3"></path>
                              <path d="M4 10l3-3 2 2"></path>
                            </svg>
                            Sign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}