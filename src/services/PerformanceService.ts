import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { PerformanceReview, PerformanceGoal, PerformanceReviewCycle } from '../types';

export class PerformanceService {
  private adapter: IDataAdapter;

  constructor() {
    this.adapter = getDataAdapter();
  }

  // Reviews
  async getReviews() {
    return this.adapter.getPerformanceReviews();
  }

  async getReview(id: string) {
    const reviews = await this.adapter.getPerformanceReviews();
    return reviews.find(r => r.id === id) || null;
  }

  async getReviewsByEmployee(employeeId: string) {
    const reviews = await this.adapter.getPerformanceReviews();
    return reviews.filter(r => r.employeeId === employeeId);
  }

  async getReviewsByStatus(status: string) {
    const reviews = await this.adapter.getPerformanceReviews();
    return reviews.filter(r => r.status === status);
  }

  async createReview(review: PerformanceReview) {
    if (!review.employeeId) throw new Error('Employee ID is required');
    if (!review.reviewerId) throw new Error('Reviewer ID is required');
    return this.adapter.savePerformanceReview(review);
  }

  async updateReview(id: string, data: Partial<PerformanceReview>) {
    const existing = await this.getReview(id);
    if (!existing) throw new Error('Review not found');
    const updated = { ...existing, ...data };
    return this.adapter.savePerformanceReview(updated);
  }

  async submitReview(id: string) {
    const existing = await this.getReview(id);
    if (!existing) throw new Error('Review not found');
    return this.adapter.savePerformanceReview({
      ...existing,
      status: 'Submitted' as const,
      submittedAt: new Date().toISOString()
    });
  }

  // Goals
  async getGoals() {
    return this.adapter.getPerformanceGoals();
  }

  async getGoalsByEmployee(employeeId: string) {
    const goals = await this.adapter.getPerformanceGoals();
    return goals.filter(g => g.employeeId === employeeId);
  }

  async createGoal(goal: PerformanceGoal) {
    if (!goal.employeeId) throw new Error('Employee ID is required');
    if (!goal.title) throw new Error('Goal title is required');
    return this.adapter.savePerformanceGoal(goal);
  }

  async updateGoal(id: string, data: Partial<PerformanceGoal>) {
    const existing = await this.adapter.getPerformanceGoals().then(g => g.find(g => g.id === id));
    if (!existing) throw new Error('Goal not found');
    const updated = { ...existing, ...data };
    return this.adapter.savePerformanceGoal(updated);
  }

  // Review Cycles
  async getReviewCycles() {
    const { getPerformanceReviewCycles } = await import('../lib/storage');
    return getPerformanceReviewCycles();
  }

  // Sync
  async sync() {
    return this.adapter.syncModule('performance');
  }
}

export const performanceService = new PerformanceService();
