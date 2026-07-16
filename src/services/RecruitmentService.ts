import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { Candidate, JDResumeMatch, JobDescription, HireDetails } from '../types';

export class RecruitmentService {
  private adapter: IDataAdapter;

  constructor() {
    this.adapter = getDataAdapter();
  }

  // Candidates
  async getCandidates() {
    return this.adapter.getCandidates();
  }

  async getCandidate(id: string) {
    const candidates = await this.adapter.getCandidates();
    return candidates.find(c => c.id === id) || null;
  }

  async createCandidate(candidate: Candidate) {
    if (!candidate.name) throw new Error('Candidate name is required');
    if (!candidate.email) throw new Error('Candidate email is required');
    return this.adapter.saveCandidate(candidate);
  }

  async updateCandidate(id: string, data: Partial<Candidate>) {
    const existing = await this.getCandidate(id);
    if (!existing) throw new Error('Candidate not found');
    const updated = { ...existing, ...data };
    return this.adapter.saveCandidate(updated);
  }

  async deleteCandidate(id: string) {
    // Soft delete - mark as rejected
    await this.updateCandidate(id, { status: 'Rejected' as const });
  }

  async getCandidatesByStatus(status: string) {
    const candidates = await this.adapter.getCandidates();
    return candidates.filter(c => c.status === status);
  }

  // Job Descriptions
  async getJobDescriptions() {
    // This uses storage directly since not in IDataAdapter
    const { getJobDescriptions } = await import('../lib/storage');
    return getJobDescriptions();
  }

  // JD Matches
  async getJDMatches() {
    const { getJDMatches } = await import('../lib/storage');
    return getJDMatches();
  }

  // Hire Details
  async getHires() {
    const { getHires } = await import('../lib/storage');
    return getHires();
  }

  // Sync
  async sync() {
    return this.adapter.syncModule('recruitment');
  }
}

export const recruitmentService = new RecruitmentService();
