'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { DocumentList } from '@/components/documents/document-list';
import { Document, PdfTemplates } from '@/types/document';
import { documentService } from '@/services/documentService';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<PdfTemplates | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleViewDocument = async (document: Document) => {
    try {
      console.log(document.url)
      // Si le document a une URL, pas besoin de l'ouvrir ici car le bouton Open le fera
      if (document.url) {
        return;
      }

      // Déterminer le template à partir du nom du fichier
      const template = document.filename.includes("house-rules")
        ? PdfTemplates.HOUSE_RULES_AGREEMENT
        : PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT;

      setCurrentTemplate(template);
      setSelectedDocument(document);

      const blob = await documentService.generateDocument(user!.sub, template);

      const url = URL.createObjectURL(blob);

      window.open(url, '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur lors du chargement du document :", error);
    }
  };

  const handleGenerateDocument = async (template: PdfTemplates) => {
    if (!user) return;

    try {
      const blob = await documentService.generateDocument(user.sub, template);
      setCurrentTemplate(template);
    } catch (error) {
      console.error('Error generating document:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header />}

      <main className="flex-1 container mx-auto px-4 py-8">
        <DocumentList
          userId={user.sub}
          onViewDocument={handleViewDocument}
          onGenerateDocument={handleGenerateDocument}
        />
      </main>
    </div>
  );
}