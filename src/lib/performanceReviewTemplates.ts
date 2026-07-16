import { PerformanceReviewTemplate } from '../types';

export const DEFAULT_PERFORMANCE_TEMPLATES: PerformanceReviewTemplate[] = [
  {
    id: 'tmpl-annual',
    name: 'Annual Performance Review',
    description: 'Comprehensive annual evaluation covering performance, skills, goals, and leadership.',
    typeId: 'type-annual',
    isActive: true,
    sections: [
      { id: 'sec-perf', templateId: 'tmpl-annual', name: 'Job Performance', description: 'Evaluation of day-to-day responsibilities.', weight: 40, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-skills', templateId: 'tmpl-annual', name: 'Skills & Competencies', description: 'Technical and soft skills assessment.', weight: 30, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-goals', templateId: 'tmpl-annual', name: 'Goals & Objectives', description: 'Progress against set KPIs.', weight: 20, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-lead', templateId: 'tmpl-annual', name: 'Leadership & Collaboration', description: 'Team interaction and leadership potential.', weight: 10, scoringScaleId: 'scale-1-5', questions: [] }
    ],
    fields: []
  },
  {
    id: 'tmpl-360',
    name: '360-Degree Feedback',
    description: 'Multi-perspective feedback covering self, manager, peer, and subordinate inputs.',
    typeId: 'type-360',
    isActive: true,
    sections: [
      { id: 'sec-self', templateId: 'tmpl-360', name: 'Self-Assessment', description: 'Personal reflection on achievements.', weight: 20, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-manager', templateId: 'tmpl-360', name: 'Manager Assessment', description: 'Managerial perspective on performance.', weight: 30, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-peer', templateId: 'tmpl-360', name: 'Peer Assessment', description: 'Feedback from colleagues.', weight: 30, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-sub', templateId: 'tmpl-360', name: 'Subordinate Assessment', description: 'Feedback from direct reports.', weight: 20, scoringScaleId: 'scale-1-5', questions: [] }
    ],
    fields: []
  },
  {
    id: 'tmpl-probation',
    name: 'Probation Review',
    description: 'Entry assessment for new hires completing their probation period.',
    typeId: 'type-probation',
    isActive: true,
    sections: [
      { id: 'sec-job-know', templateId: 'tmpl-probation', name: 'Job Knowledge', description: 'Understanding of role requirements.', weight: 30, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-quality', templateId: 'tmpl-probation', name: 'Quality of Work', description: 'Accuracy and efficiency of tasks.', weight: 25, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-init', templateId: 'tmpl-probation', name: 'Initiative', description: 'Proactivity and self-starting.', weight: 25, scoringScaleId: 'scale-1-5', questions: [] },
      { id: 'sec-team', templateId: 'tmpl-probation', name: 'Teamwork', description: 'Cultural fit and collaboration.', weight: 20, scoringScaleId: 'scale-1-5', questions: [] }
    ],
    fields: []
  }
];
