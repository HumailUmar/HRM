import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { EmployeeDocument } from '../types';

export class DocumentService {
  async getDocuments() {
    return getDataAdapter().getDocuments();
  }

  async getDocumentsByEmployee(employeeId: string) {
    const docs = await getDataAdapter().getDocuments();
    return docs.filter(d => d.employeeId === employeeId);
  }

  async getDocument(id: string) {
    const docs = await getDataAdapter().getDocuments();
    return docs.find(d => d.id === id) || null;
  }

  async createDocument(document: EmployeeDocument) {
    if (!document.employeeId) throw new Error('Employee ID is required');
    if (!document.fileName) throw new Error('File name is required');
    return getDataAdapter().saveDocument(document);
  }

  async updateDocument(id: string, data: Partial<EmployeeDocument>) {
    const existing = await this.getDocument(id);
    if (!existing) throw new Error('Document not found');
    const cleanedData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const updated = { ...existing, ...cleanedData };
    return getDataAdapter().saveDocument(updated);
  }

  async deleteDocument(id: string) {
    await this.updateDocument(id, { status: 'Expired' as const });
  }

  async verifyDocument(id: string, verifiedBy: string, verifiedByName: string) {
    await this.updateDocument(id, {
      isVerified: true,
      verifiedBy,
      verifiedByName,
      verifiedAt: new Date().toISOString(),
      status: 'Verified' as const
    });
  }

  async getPendingVerification() {
    const docs = await getDataAdapter().getDocuments();
    return docs.filter(d => d.status === 'Pending Verification');
  }

  async sync() {
    return getDataAdapter().syncModule('documents');
  }
}

export const documentService = new DocumentService();
