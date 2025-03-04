import { DATABASE_API_URL, DOCUMENTS_API_URL } from '@/lib/constants';
import { Document, PdfTemplates } from '@/types/document';

export const documentService = {

  async getUserDocuments(): Promise<Document[]> {

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error('No access token found');

    const response = await fetch(`${DATABASE_API_URL}/files`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to fetch documents');

    return await response.json();
  },

  async generateDocument(userId: string, template: PdfTemplates): Promise<Blob> {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${DOCUMENTS_API_URL}/users/${userId}/files/generate/${template}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to generate document');

    return await response.blob();
  },

  async signDocument(userId: string, template: PdfTemplates): Promise<Blob> {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${DOCUMENTS_API_URL}/users/${userId}/files/sign/${template}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to sign document');

    return await response.blob();
  }
};