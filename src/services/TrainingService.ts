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
  async getModules() {
    return getDataAdapter().getTrainingModules();
  }

  async getModule(id: string) {
    const modules = await getDataAdapter().getTrainingModules();
    return modules.find(m => m.id === id) || null;
  }

  async createModule(module: TrainingModule) {
    if (!module.title) throw new Error('Module title is required');
    if (!module.contentType) throw new Error('Content type is required');
    return getDataAdapter().saveTrainingModule(module);
  }

  async updateModule(id: string, data: Partial<TrainingModule>) {
    const existing = await this.getModule(id);
    if (!existing) throw new Error('Module not found');
    const cleanedData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const updated = { ...existing, ...cleanedData };
    return getDataAdapter().saveTrainingModule(updated);
  }

  async getAssignments() {
    return getDataAdapter().getTrainingAssignments();
  }

  async getAssignmentsByEmployee(employeeId: string) {
    const assignments = await getDataAdapter().getTrainingAssignments();
    return assignments.filter(a => a.employeeId === employeeId);
  }

  async createAssignment(assignment: TrainingAssignment) {
    if (!assignment.employeeId) throw new Error('Employee ID is required');
    if (!assignment.courseId) throw new Error('Course ID is required');
    return getDataAdapter().saveTrainingAssignment(assignment);
  }

  async updateAssignment(id: string, data: Partial<TrainingAssignment>) {
    const existing = await getDataAdapter().getTrainingAssignments().then(a => a.find(a => a.id === id));
    if (!existing) throw new Error('Assignment not found');
    const cleanedData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const updated = { ...existing, ...cleanedData };
    return getDataAdapter().saveTrainingAssignment(updated);
  }

  async getRequests() {
    const { getTrainingRequests } = await import('../lib/storage');
    return getTrainingRequests();
  }

  async getMentorships() {
    const { getTrainingMentorships } = await import('../lib/storage');
    return getTrainingMentorships();
  }

  async getSubmissions() {
    const { getTrainingSubmissions } = await import('../lib/storage');
    return getTrainingSubmissions();
  }

  async getQuizzes() {
    const { getTrainingQuizzes } = await import('../lib/storage');
    return getTrainingQuizzes();
  }

  async sync() {
    return getDataAdapter().syncModule('training');
  }
}

export const trainingService = new TrainingService();
