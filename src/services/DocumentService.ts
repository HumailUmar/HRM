import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { EmployeeDocument } from '../types';

export class DocumentService {
  private adapter: IDataAdapter;

  constructor() {
    this.adapter = getDataAdapter();
  }

  async getDocuments() {
    return this.adapter.getDocuments();
  }

  async getDocumentsByEmployee(employeeId: string) {
    const docs = await this.adapter.getDocuments();
    return docs.filter(d => d.employeeId === employeeId);
  }

  async getDocument(id: string) {
    const docs = await this.adapter.getDocuments();
    return docs.find(d => d.id === id) || null;
  }

  async createDocument(document: EmployeeDocument) {
    if (!document.employeeId) throw new Error('Employee ID is required');
    if (!document.fileName) throw new Error('File name is required');
    return this.adapter.saveDocument(document);
  }

  async updateDocument(id: string, data: Partial<EmployeeDocument>) {
    const existing = await this.getDocument(id);
    if (!existing) throw new Error('Document not found');
    const updated = { ...existing, ...data };
    return this.adapter.saveDocument(updated);
  }

  async deleteDocument(id: string) {
    // Soft delete - mark as expired
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
    const docs = await this.adapter.getDocuments();
    return docs.filter(d => d.status === 'Pending Verification');
  }

  // Sync
  async sync() {
    return this.adapter.syncModule('documents');
  }
}

export const documentService = new DocumentService();
