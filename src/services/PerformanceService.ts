import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { PerformanceReview, PerformanceGoal, PerformanceReviewCycle } from '../types';

export class PerformanceService {
  async getReviews() {
    return getDataAdapter().getPerformanceReviews();
  }

  async getReview(id: string) {
    const reviews = await getDataAdapter().getPerformanceReviews();
    return reviews.find(r => r.id === id) || null;
  }

  async getReviewsByEmployee(employeeId: string) {
    const reviews = await getDataAdapter().getPerformanceReviews();
    return reviews.filter(r => r.employeeId === employeeId);
  }

  async getReviewsByStatus(status: string) {
    const reviews = await getDataAdapter().getPerformanceReviews();
    return reviews.filter(r => r.status === status);
  }

  async createReview(review: PerformanceReview) {
    if (!review.employeeId) throw new Error('Employee ID is required');
    if (!review.reviewerId) throw new Error('Reviewer ID is required');
    return getDataAdapter().savePerformanceReview(review);
  }

  async updateReview(id: string, data: Partial<PerformanceReview>) {
    const existing = await this.getReview(id);
    if (!existing) throw new Error('Review not found');
    const cleanedData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const updated = { ...existing, ...cleanedData };
    return getDataAdapter().savePerformanceReview(updated);
  }

  async submitReview(id: string) {
    const existing = await this.getReview(id);
    if (!existing) throw new Error('Review not found');
    return getDataAdapter().savePerformanceReview({
      ...existing,
      status: 'Submitted' as const,
      submittedAt: new Date().toISOString()
    });
  }

  async getGoals() {
    return getDataAdapter().getPerformanceGoals();
  }

  async getGoalsByEmployee(employeeId: string) {
    const goals = await getDataAdapter().getPerformanceGoals();
    return goals.filter(g => g.employeeId === employeeId);
  }

  async createGoal(goal: PerformanceGoal) {
    if (!goal.employeeId) throw new Error('Employee ID is required');
    if (!goal.title) throw new Error('Goal title is required');
    return getDataAdapter().savePerformanceGoal(goal);
  }

  async updateGoal(id: string, data: Partial<PerformanceGoal>) {
    const existing = await getDataAdapter().getPerformanceGoals().then(g => g.find(g => g.id === id));
    if (!existing) throw new Error('Goal not found');
    const cleanedData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const updated = { ...existing, ...cleanedData };
    return getDataAdapter().savePerformanceGoal(updated);
  }

  async getReviewCycles() {
    const { getPerformanceReviewCycles } = await import('../lib/storage');
    return getPerformanceReviewCycles();
  }

  async sync() {
    return getDataAdapter().syncModule('performance');
  }
}

export const performanceService = new PerformanceService();
