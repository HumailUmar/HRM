import { IDataAdapter } from './interfaces/IDataAdapter';
import { getDataAdapter } from './DataAdapterFactory';
import { 
  TrainingModule, 
  TrainingAssignment, 
  TrainingRequest, 
  TrainingMentorship,
  TrainingSubmission,
  TrainingQuiz
} from '../types';

export class TrainingService {
  private adapter: IDataAdapter;

  constructor() {
    this.adapter = getDataAdapter();
  }

  // Modules
  async getModules() {
    return this.adapter.getTrainingModules();
  }

  async getModule(id: string) {
    const modules = await this.adapter.getTrainingModules();
    return modules.find(m => m.id === id) || null;
  }

  async createModule(module: TrainingModule) {
    if (!module.title) throw new Error('Module title is required');
    if (!module.contentType) throw new Error('Content type is required');
    return this.adapter.saveTrainingModule(module);
  }

  async updateModule(id: string, data: Partial<TrainingModule>) {
    const existing = await this.getModule(id);
    if (!existing) throw new Error('Module not found');
    const updated = { ...existing, ...data };
    return this.adapter.saveTrainingModule(updated);
  }

  // Assignments
  async getAssignments() {
    return this.adapter.getTrainingAssignments();
  }

  async getAssignmentsByEmployee(employeeId: string) {
    const assignments = await this.adapter.getTrainingAssignments();
    return assignments.filter(a => a.employeeId === employeeId);
  }

  async createAssignment(assignment: TrainingAssignment) {
    if (!assignment.employeeId) throw new Error('Employee ID is required');
    if (!assignment.courseId) throw new Error('Course ID is required');
    return this.adapter.saveTrainingAssignment(assignment);
  }

  async updateAssignment(id: string, data: Partial<TrainingAssignment>) {
    const existing = await this.adapter.getTrainingAssignments().then(a => a.find(a => a.id === id));
    if (!existing) throw new Error('Assignment not found');
    const updated = { ...existing, ...data };
    return this.adapter.saveTrainingAssignment(updated);
  }

  // Requests
  async getRequests() {
    const { getTrainingRequests } = await import('../lib/storage');
    return getTrainingRequests();
  }

  // Mentorships
  async getMentorships() {
    const { getTrainingMentorships } = await import('../lib/storage');
    return getTrainingMentorships();
  }

  // Submissions
  async getSubmissions() {
    const { getTrainingSubmissions } = await import('../lib/storage');
    return getTrainingSubmissions();
  }

  // Quizzes
  async getQuizzes() {
    const { getTrainingQuizzes } = await import('../lib/storage');
    return getTrainingQuizzes();
  }

  // Sync
  async sync() {
    return this.adapter.syncModule('training');
  }
}

export const trainingService = new TrainingService();
