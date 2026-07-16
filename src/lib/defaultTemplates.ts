import { OnboardingTemplate } from '../types';

export const DEFAULT_ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: 'tmpl-standard',
    name: 'Standard Full-Time Employee',
    description: 'Standard onboarding checklist for full-time on-site employees.',
    isActive: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    tasks: [
      {
        id: 'task-welcome',
        taskName: 'Send Welcome Email',
        description: 'Send onboarding details and login credentials to the new employee.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'welcomeEmailSent'
      },
      {
        id: 'task-contract',
        taskName: 'Generate E-Signature Contract',
        description: 'Prepare and dispatch contract for digital signature.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'contractSigned'
      },
      {
        id: 'task-email',
        taskName: 'Setup Email Account',
        description: 'Create official GSuite corporate email and access credentials.',
        assignedTo: 'IT',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-equipment',
        taskName: 'Assign Laptop & Equipment',
        description: 'Configure and hand over development machine and peripheral kit.',
        assignedTo: 'IT',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-training',
        taskName: 'Assign Training Materials',
        description: 'Provision training course access and schedule initial orientation.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 2,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'trainingAssigned'
      },
      {
        id: 'task-mentor',
        taskName: 'Assign Mentor',
        description: 'Pair the new recruit with a senior developer/analyst.',
        assignedTo: 'Manager',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-complete-training',
        taskName: 'Complete Training',
        description: 'Finish all core training curriculum modules.',
        assignedTo: 'Employee',
        dueDaysAfterJoining: 14,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'trainingCompleted'
      },
      {
        id: 'task-feedback',
        taskName: 'Submit Training Feedback',
        description: 'Complete the feedback form on the training program quality.',
        assignedTo: 'Employee',
        dueDaysAfterJoining: 15,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'feedbackSubmitted'
      },
      {
        id: 'task-office',
        taskName: 'Setup Office Seat',
        description: 'Allocate desk workstation, chair, and access badge.',
        assignedTo: 'Facilities',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-payroll',
        taskName: 'Create Payroll Record',
        description: 'Set up employee bank/salary profiling in the payroll engine.',
        assignedTo: 'Finance',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      }
    ]
  },
  {
    id: 'tmpl-remote',
    name: 'Remote Employee',
    description: 'Onboarding template customized for fully remote hires.',
    isActive: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    tasks: [
      {
        id: 'task-remote-welcome',
        taskName: 'Send Welcome Email',
        description: 'Welcome email with links to virtual portals.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'welcomeEmailSent'
      },
      {
        id: 'task-remote-contract',
        taskName: 'Generate E-Signature Contract',
        description: 'Digital contract workflow setup.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'contractSigned'
      },
      {
        id: 'task-remote-vpn',
        taskName: 'Setup Remote Access & VPN',
        description: 'Grant secure enterprise VPN credentials.',
        assignedTo: 'IT',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-remote-training',
        taskName: 'Assign Online Training',
        description: 'LMS course setups for distributed teams.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 2,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'trainingAssigned'
      },
      {
        id: 'task-remote-mentor',
        taskName: 'Assign Mentor',
        description: 'Pair with virtual buddy for Slack check-ins.',
        assignedTo: 'Manager',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-remote-complete-training',
        taskName: 'Complete Training',
        description: 'Finish virtual compliance and security modules.',
        assignedTo: 'Employee',
        dueDaysAfterJoining: 14,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'trainingCompleted'
      },
      {
        id: 'task-remote-feedback',
        taskName: 'Submit Training Feedback',
        description: 'Submit remote evaluation feedback form.',
        assignedTo: 'Employee',
        dueDaysAfterJoining: 15,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'feedbackSubmitted'
      },
      {
        id: 'task-remote-payroll',
        taskName: 'Create Payroll Record',
        description: 'Sync banking parameters for wire transactions.',
        assignedTo: 'Finance',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      }
    ]
  },
  {
    id: 'tmpl-intern',
    name: 'Intern',
    description: 'Lightweight checklist specialized for interns and short-term trainees.',
    isActive: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    tasks: [
      {
        id: 'task-intern-welcome',
        taskName: 'Send Welcome Email',
        description: 'Send interns welcome packet and program outline.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'welcomeEmailSent'
      },
      {
        id: 'task-intern-training',
        taskName: 'Assign Intern Training',
        description: 'Configure entry-level skill tracks.',
        assignedTo: 'HR',
        dueDaysAfterJoining: 2,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'trainingAssigned'
      },
      {
        id: 'task-intern-mentor',
        taskName: 'Assign Mentor',
        description: 'Assign technical guidance advisor.',
        assignedTo: 'Manager',
        dueDaysAfterJoining: 1,
        isRequired: true,
        autoTrigger: false
      },
      {
        id: 'task-intern-complete-training',
        taskName: 'Complete Training',
        description: 'Finish standard intern boot camp syllabus.',
        assignedTo: 'Employee',
        dueDaysAfterJoining: 10,
        isRequired: true,
        autoTrigger: true,
        triggerCondition: 'trainingCompleted'
      },
      {
        id: 'task-intern-payroll',
        taskName: 'Create Payroll Record',
        description: 'Establish stipend recording parameters.',
        assignedTo: 'Finance',
        dueDaysAfterJoining: 0,
        isRequired: true,
        autoTrigger: false
      }
    ]
  }
];
