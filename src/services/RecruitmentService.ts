import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { Candidate, JDResumeMatch, JobDescription, HireDetails } from '../types';

export class RecruitmentService {
  async getCandidates() {
    return getDataAdapter().getCandidates();
  }

  async getCandidate(id: string) {
    const candidates = await getDataAdapter().getCandidates();
    return candidates.find(c => c.id === id) || null;
  }

  async createCandidate(candidate: Candidate) {
    if (!candidate.name) throw new Error('Candidate name is required');
    if (!candidate.email) throw new Error('Candidate email is required');
    return getDataAdapter().saveCandidate(candidate);
  }

  async updateCandidate(id: string, data: Partial<Candidate>) {
    const existing = await this.getCandidate(id);
    if (!existing) throw new Error('Candidate not found');
    const cleanedData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const updated = { ...existing, ...cleanedData };
    return getDataAdapter().saveCandidate(updated);
  }

  async deleteCandidate(id: string) {
    await this.updateCandidate(id, { status: 'Rejected' as const });
  }

  async getCandidatesByStatus(status: string) {
    const candidates = await getDataAdapter().getCandidates();
    return candidates.filter(c => c.status === status);
  }

  async getJobDescriptions() {
    const { getJobDescriptions } = await import('../lib/storage');
    return getJobDescriptions();
  }

  async getJDMatches() {
    const { getJDMatches } = await import('../lib/storage');
    return getJDMatches();
  }

  async getHires() {
    const { getHires } = await import('../lib/storage');
    return getHires();
  }

  async sync() {
    return getDataAdapter().syncModule('recruitment');
  }
}

export const recruitmentService = new RecruitmentService();
