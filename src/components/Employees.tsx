import { useData } from '../contexts/DataContext';
import { logger } from '../lib/logger';
import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { Employee, EmployeeDocument, LegacyOnboardingTask, OnboardingTemplate, TimelineEvent, EmployeeEducation, EmployeeCertification, PreviousEmployer, Department, Designation, User, ExitRecord, PersonalInfo, EmploymentDetails, CompensationDetails, OnboardingChecklist, ExitChecklist, EmployeeHistoryEntry } from '../types';
import EmployeeSalary from './EmployeeSalary';
import { Plus, Mail, ShieldAlert, BadgeCheck, CheckSquare, Square, X, Award, Layers, Star, ArrowRight, Loader2, FileText, Calendar, Compass, UserCheck, TrendingUp, Bell, CheckSquare as CheckIcon, Activity, AlertCircle, Download, Eye, UploadCloud, Fingerprint, DollarSign } from 'lucide-react';
import { exportEmployeeDirectoryToPDF } from '../utils/pdfGenerator';
import { getNextEmployeeId } from '../utils/idHelper';
import { getInitials } from '../utils/safeText';
import { safeLower } from '../utils/safeText';
import { getEmployeeDesignation, getEmployeeDepartment } from '../lib/employeeUtils';

interface EmployeesProps {
  user: User;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  onboardingTasks: LegacyOnboardingTask[];
  setOnboardingTasks: (tasks: LegacyOnboardingTask[]) => void;
  isMockMode: boolean;
  onboardingTemplates?: OnboardingTemplate[];
  departments: Department[];
  designations: Designation[];
  documents?: EmployeeDocument[];
  setDocuments?: (docs: EmployeeDocument[]) => void;
}

export default function Employees({
  user,
  documents = [],
  setDocuments,
  employees,
  setEmployees,
  onboardingTasks,
  setOnboardingTasks,
  isMockMode,
  onboardingTemplates,
  departments,
  designations
}: EmployeesProps) {
  const data = useData();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Details Sub-tab State
  const [detailsTab, setDetailsTab] = useState<'profile' | 'timeline' | 'onboarding' | 'mentorship' | 'documents' | 'salary' | 'history' | 'status_history'>('profile');

  // Custom Timeline Milestone Form
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneStage, setMilestoneStage] = useState<'Recruitment' | 'Onboarding' | 'Performance' | 'Promotion' | 'Exit'>('Performance');

  // Custom Onboarding Task Form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignedToId, setTaskAssignedToId] = useState("");

  // Mentor state
  const [selectedMentorId, setSelectedMentorId] = useState("");

  // Modals / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<Employee | null>(null);

  // Modal active tab inside the Add Employee Modal
  const [addModalTab, setAddModalTab] = useState<number>(0);

  // New Employee fields
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState(''); // Keep for basic backward-compatibility
  const [newEmpPersonalEmail, setNewEmpPersonalEmail] = useState('');
  const [newEmpPhoneWork, setNewEmpPhoneWork] = useState('');
  const [newEmpPhonePersonal, setNewEmpPhonePersonal] = useState('');
  const [newEmpDob, setNewEmpDob] = useState('');
  const [newEmpGender, setNewEmpGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say' | ''>('');
  const [newEmpNationality, setNewEmpNationality] = useState('');
  const [newEmpCnic, setNewEmpCnic] = useState('');
  const [newEmpReligion, setNewEmpReligion] = useState('');
  const [newEmpMaritalStatus, setNewEmpMaritalStatus] = useState<'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Separated' | ''>('');
  const [newEmpBloodGroup, setNewEmpBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown' | ''>('');
  
  const [newEmpCurrentAddress, setNewEmpCurrentAddress] = useState('');
  const [newEmpPermanentAddress, setNewEmpPermanentAddress] = useState('');
  const [newEmpCity, setNewEmpCity] = useState('');
  const [newEmpState, setNewEmpState] = useState('');
  const [newEmpCountry, setNewEmpCountry] = useState('');
  const [newEmpPostalCode, setNewEmpPostalCode] = useState('');
  
  const [newEmpEmergencyName, setNewEmpEmergencyName] = useState('');
  const [newEmpEmergencyPhone, setNewEmpEmergencyPhone] = useState('');
  const [newEmpEmergencyRelationship, setNewEmpEmergencyRelationship] = useState('');
  
  const [newEmpLinkedin, setNewEmpLinkedin] = useState('');
  const [newEmpGithub, setNewEmpGithub] = useState('');
  const [newEmpOtherSocials, setNewEmpOtherSocials] = useState('');
  
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpEmploymentType, setNewEmpEmploymentType] = useState<'Permanent' | 'Contract' | 'Intern' | 'Part-time' | 'Freelance' | 'Consultant' | ''>('');
  const [newEmpGrade, setNewEmpGrade] = useState('');
  const [newEmpJobCategory, setNewEmpJobCategory] = useState('');
  const [newEmpJoiningDate, setNewEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEmpIsProbation, setNewEmpIsProbation] = useState(false);
  const [newEmpProbationEndDate, setNewEmpProbationEndDate] = useState('');
  const [newEmpConfirmationDate, setNewEmpConfirmationDate] = useState('');
  const [newEmpWorkLocation, setNewEmpWorkLocation] = useState<'Office' | 'Remote' | 'Hybrid' | ''>('');
  const [newEmpShift, setNewEmpShift] = useState('');
  const [newEmpCostCenter, setNewEmpCostCenter] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState(3000);
  const [newEmpSeat, setNewEmpSeat] = useState(0);
  const [newEmpReportingManagerId, setNewEmpReportingManagerId] = useState('');
  const [newEmpHrBpId, setNewEmpHrBpId] = useState('');
  const [newEmpPayrollGroup, setNewEmpPayrollGroup] = useState('');
  const [newEmpDepartmentId, setNewEmpDepartmentId] = useState('');
  const [newEmpDesignationId, setNewEmpDesignationId] = useState('');
  const [newEmpPunchCode, setNewEmpPunchCode] = useState('');

  // Uploaded Document references
  const [newEmpProfileImage, setNewEmpProfileImage] = useState('');
  const [newEmpCnicFrontImage, setNewEmpCnicFrontImage] = useState('');
  const [newEmpCnicBackImage, setNewEmpCnicBackImage] = useState('');

  // State to track individual file upload loaders (profileImage, cnicFrontImage, cnicBackImage, certFile)
  const [isUploadingDoc, setIsUploadingDoc] = useState<Record<string, boolean>>({});

  // Helper handler to upload file via Google Drive or Offline Sandbox
  const handleDocUpload = async (field: 'profileImage' | 'cnicFrontImage' | 'cnicBackImage' | 'certFile', file: File) => {
    setIsUploadingDoc(prev => ({ ...prev, [field]: true }));
    try {
      if (isMockMode) {
        // Mock Mode: Create local object URL for offline sandbox preview
        const localUrl = URL.createObjectURL(file);
        // Map to corresponding state setter
        if (field === 'profileImage') setNewEmpProfileImage(localUrl);
        else if (field === 'cnicFrontImage') setNewEmpCnicFrontImage(localUrl);
        else if (field === 'cnicBackImage') setNewEmpCnicBackImage(localUrl);
        else if (field === 'certFile') setCertFileUrl(localUrl);
      } else {
        // Production Mode: Upload to Google Drive
        const settings = await data.getSettings();
        const folderId = settings.googleSheets.driveFolderId;
        const fileUrl = await data.uploadFile(file, folderId);
        
        if (field === 'profileImage') setNewEmpProfileImage(fileUrl);
        else if (field === 'cnicFrontImage') setNewEmpCnicFrontImage(fileUrl);
        else if (field === 'cnicBackImage') setNewEmpCnicBackImage(fileUrl);
        else if (field === 'certFile') setCertFileUrl(fileUrl);
      }
    } catch (error) {
      logger.error(`Error uploading ${field}:`, error);
      // Fallback
      const localUrl = URL.createObjectURL(file);
      if (field === 'profileImage') setNewEmpProfileImage(localUrl);
      else if (field === 'cnicFrontImage') setNewEmpCnicFrontImage(localUrl);
      else if (field === 'cnicBackImage') setNewEmpCnicBackImage(localUrl);
      else if (field === 'certFile') setCertFileUrl(localUrl);
    } finally {
      setIsUploadingDoc(prev => ({ ...prev, [field]: false }));
    }
  };

  // Education Sub-list State
  const [newEmpEducationList, setNewEmpEducationList] = useState<EmployeeEducation[]>([]);
  const [eduDegree, setEduDegree] = useState('');
  const [eduFieldOfStudy, setEduFieldOfStudy] = useState('');
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduYearOfGraduation, setEduYearOfGraduation] = useState('');
  const [eduGrade, setEduGrade] = useState('');
  const [eduIsHighest, setEduIsHighest] = useState(false);

  // Certifications Sub-list State
  const [newEmpCertificationsList, setNewEmpCertificationsList] = useState<EmployeeCertification[]>([]);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certCredentialId, setCertCredentialId] = useState('');
  const [certFileUrl, setCertFileUrl] = useState('');

  // Previous Employers Sub-list State
  const [newEmpPreviousEmployersList, setNewEmpPreviousEmployersList] = useState<PreviousEmployer[]>([]);
  const [prevCompany, setPrevCompany] = useState('');
  const [prevTitle, setPrevTitle] = useState('');
  const [prevStartDate, setPrevStartDate] = useState('');
  const [prevEndDate, setPrevEndDate] = useState('');
  const [prevReason, setPrevReason] = useState('');
  const [prevContactPerson, setPrevContactPerson] = useState('');
  const [prevContactPhone, setPrevContactPhone] = useState('');

  // Form helpers for Education, Certifications, Previous Employers
  const handleAddEducation = () => {
    if (!eduDegree || !eduInstitution) {
      alert("Please fill Degree and Institution.");
      return;
    }
    const item: EmployeeEducation = {
      id: `EDU-${Date.now()}`,
      degree: eduDegree,
      fieldOfStudy: eduFieldOfStudy,
      institution: eduInstitution,
      startDate: eduStartDate,
      endDate: eduEndDate,
      yearOfGraduation: eduYearOfGraduation,
      grade: eduGrade || undefined,
      isHighest: eduIsHighest
    };
    setNewEmpEducationList(prev => [...prev, item]);
    setEduDegree('');
    setEduFieldOfStudy('');
    setEduInstitution('');
    setEduStartDate('');
    setEduEndDate('');
    setEduYearOfGraduation('');
    setEduGrade('');
    setEduIsHighest(false);
  };

  const handleAddCertification = () => {
    if (!certName || !certIssuer) {
      alert("Please fill Certification Name and Issuing Organization.");
      return;
    }
    const item: EmployeeCertification = {
      id: `CERT-${Date.now()}`,
      name: certName,
      issuingOrganization: certIssuer,
      issueDate: certIssueDate,
      expiryDate: certExpiryDate || undefined,
      credentialId: certCredentialId || undefined,
      fileUrl: certFileUrl || undefined
    };
    setNewEmpCertificationsList(prev => [...prev, item]);
    setCertName('');
    setCertIssuer('');
    setCertIssueDate('');
    setCertExpiryDate('');
    setCertCredentialId('');
    setCertFileUrl('');
  };

  const handleAddPreviousEmployer = () => {
    if (!prevCompany || !prevTitle) {
      alert("Please fill Company Name and Job Title.");
      return;
    }
    const item: PreviousEmployer = {
      id: `PREV-${Date.now()}`,
      companyName: prevCompany,
      jobTitle: prevTitle,
      startDate: prevStartDate,
      endDate: prevEndDate,
      reasonForLeaving: prevReason || undefined,
      contactPerson: prevContactPerson || undefined,
      contactPhone: prevContactPhone || undefined
    };
    setNewEmpPreviousEmployersList(prev => [...prev, item]);
    setPrevCompany('');
    setPrevTitle('');
    setPrevStartDate('');
    setPrevEndDate('');
    setPrevReason('');
    setPrevContactPerson('');
    setPrevContactPhone('');
  };

  // Feedback Form fields
  const [feedbackTrainer, setFeedbackTrainer] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');

  // Filtering
  const filteredEmployees = employees.filter((emp) => {
    let matchesStatus = true;
    if (filterStatus === 'All') {
      matchesStatus = true;
    } else if (filterStatus === 'Active') {
      matchesStatus = emp.status === 'Active';
    } else if (filterStatus === 'All Active') {
      matchesStatus = ['Active', 'Onboarding', 'Probation'].includes(emp.status);
    } else if (filterStatus === 'Terminated') {
      matchesStatus = ['Terminated', 'Resigned', 'Retired', 'Deceased', 'Contract Expired'].includes(emp.status);
    } else {
      matchesStatus = emp.status === filterStatus;
    }
    
    const matchesSearch = safeLower(emp.name).includes(safeLower(searchTerm)) || 
                          getEmployeeDesignation(emp, designations).toLowerCase().includes(safeLower(searchTerm)) ||
                          getEmployeeDepartment(emp, departments).toLowerCase().includes(safeLower(searchTerm));
    return matchesStatus && matchesSearch;
  });

  // Handle adding employee
  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail || !newEmpRole || !newEmpDept) {
      alert("Please fill Name, Work Email, Role/Designation, and Department on Tabs 1 & 5.");
      return;
    }

    // Auto assign a seat if we can find a free seat
    let assignedSeat = Number(newEmpSeat);
    if (assignedSeat === 0) {
      const occupiedSeats = employees.filter(e => e.employment.status !== 'Terminated').map(e => e.employment.seatNumber);
      for (let s = 1; s <= 30; s++) {
        if (!occupiedSeats.includes(s)) {
          assignedSeat = s;
          break;
        }
      }
    }

    const settings = await data.getSettings();
    const isDbStorage = settings.storageType === 'mysql' || settings.storageType === 'postgresql';
    const finalId = isDbStorage 
      ? `EMP-TEMP-${Date.now()}` 
      : getNextEmployeeId(employees);

    const newEmp: Employee = {
      id: finalId,
      name: newEmpName,
      email: newEmpEmail,
      status: 'Onboarding',
      personal: {
        name: newEmpName,
        email: newEmpEmail,
        phone: newEmpPhoneWork || newEmpPhone || '+92 300 0000000',
        personalEmail: newEmpPersonalEmail || undefined,
        phonePersonal: newEmpPhonePersonal || undefined,
        cnic: newEmpCnic || undefined,
        cnicFrontImage: newEmpCnicFrontImage || undefined,
        cnicBackImage: newEmpCnicBackImage || undefined,
        dateOfBirth: newEmpDob || undefined,
        gender: (newEmpGender as any) || undefined,
        maritalStatus: (newEmpMaritalStatus as any) || undefined,
        nationality: newEmpNationality || undefined,
        religion: newEmpReligion || undefined,
        bloodGroup: (newEmpBloodGroup as any) || undefined,
        currentAddress: newEmpCurrentAddress || undefined,
        permanentAddress: newEmpPermanentAddress || undefined,
        city: newEmpCity || undefined,
        state: newEmpState || undefined,
        country: newEmpCountry || undefined,
        postalCode: newEmpPostalCode || undefined,
        emergencyContactName: newEmpEmergencyName || undefined,
        emergencyContactPhone: newEmpEmergencyPhone || undefined,
        emergencyContactRelationship: newEmpEmergencyRelationship || undefined,
        linkedinUrl: newEmpLinkedin || undefined,
        githubUrl: newEmpGithub || undefined,
        otherSocialUrls: newEmpOtherSocials || undefined,
        profileImage: newEmpProfileImage || undefined,
      },
      employment: {
        joiningDate: newEmpJoiningDate || new Date().toISOString().split('T')[0],
        status: 'Onboarding',
        departmentId: newEmpDepartmentId || undefined,
        designationId: newEmpDesignationId || undefined,
        grade: newEmpGrade || undefined,
        jobCategory: newEmpJobCategory || undefined,
        employmentType: (newEmpEmploymentType as any) || undefined,
        isProbation: newEmpIsProbation,
        probationEndDate: newEmpProbationEndDate || undefined,
        confirmationDate: newEmpConfirmationDate || undefined,
        workLocation: (newEmpWorkLocation as any) || undefined,
        shift: newEmpShift || undefined,
        costCenter: newEmpCostCenter || undefined,
        reportingManagerId: newEmpReportingManagerId || undefined,
        hrBusinessPartnerId: newEmpHrBpId || undefined,
        role: 'Employee',
        payrollGroup: newEmpPayrollGroup || undefined,
        punchCode: newEmpPunchCode || undefined,
        seatNumber: assignedSeat,
      },
      compensation: {
        currency: 'USD',
        salaryStructure: {
          id: `SAL-${Date.now()}`,
          employeeId: '', // To be filled
          components: [
            { id: 'BASIC', name: 'Basic Salary', type: 'fixed', amount: Number(newEmpSalary), taxable: true }
          ],
          totalMonthly: Number(newEmpSalary),
          totalAnnual: Number(newEmpSalary) * 12,
          ctc: Number(newEmpSalary) * 13,
          employerContributions: { pf: 0, esi: 0, gratuity: 0 },
          currency: 'USD',
          effectiveFrom: newEmpJoiningDate || new Date().toISOString().split('T')[0],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        salaryHistory: []
      },
      onboarding: {
        contractSigned: false,
        trainingAssigned: false,
        trainingCompleted: false,
        welcomeEmailSent: false,
        feedbackSubmitted: false,
        templateId: onboardingTemplates?.[0]?.id,
        tasksStatus: {},
        tasksCompleted: []
      },
      exit: null,
      education: newEmpEducationList,
      certifications: newEmpCertificationsList,
      previousEmployers: newEmpPreviousEmployersList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };

    const updated = [newEmp, ...employees];
    setEmployees(updated);

    // Persist the new employee to the backend immediately.
    try {
      await data.saveEmployee(newEmp);
    } catch (persistErr) {
      logger.error('Failed to persist new employee to backend; kept in local state:', persistErr);
    }
    
    // Log to simulated sheet
    data.addSheetLog("HumailEli_Employees", "INSERT", {
      employeeId: newEmp.id,
      name: newEmp.name,
      role: getEmployeeDesignation(newEmp, designations),
      department: getEmployeeDepartment(newEmp, departments),
      status: newEmp.employment.status
    });

    // Reset fields
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpPunchCode('');
    setNewEmpPersonalEmail('');
    setNewEmpPhoneWork('');
    setNewEmpPhonePersonal('');
    setNewEmpDob('');
    setNewEmpGender('');
    setNewEmpNationality('');
    setNewEmpCnic('');
    setNewEmpReligion('');
    setNewEmpMaritalStatus('');
    setNewEmpBloodGroup('');
    setNewEmpCurrentAddress('');
    setNewEmpPermanentAddress('');
    setNewEmpCity('');
    setNewEmpState('');
    setNewEmpCountry('');
    setNewEmpPostalCode('');
    setNewEmpEmergencyName('');
    setNewEmpEmergencyPhone('');
    setNewEmpEmergencyRelationship('');
    setNewEmpLinkedin('');
    setNewEmpGithub('');
    setNewEmpOtherSocials('');
    setNewEmpRole('');
    setNewEmpDept('');
    setNewEmpDepartmentId('');
    setNewEmpDesignationId('');
    setNewEmpEmploymentType('');
    setNewEmpGrade('');
    setNewEmpJobCategory('');
    setNewEmpJoiningDate(new Date().toISOString().split('T')[0]);
    setNewEmpIsProbation(false);
    setNewEmpProbationEndDate('');
    setNewEmpConfirmationDate('');
    setNewEmpWorkLocation('');
    setNewEmpShift('');
    setNewEmpCostCenter('');
    setNewEmpSalary(3000);
    setNewEmpSeat(0);
    setNewEmpReportingManagerId('');
    setNewEmpHrBpId('');
    setNewEmpPayrollGroup('');
    setNewEmpProfileImage('');
    setNewEmpCnicFrontImage('');
    setNewEmpCnicBackImage('');
    setNewEmpEducationList([]);
    setNewEmpCertificationsList([]);
    setNewEmpPreviousEmployersList([]);
    
    setAddModalTab(0);
    setShowAddModal(false);
    setSelectedEmployee(newEmp);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);

  // Helper for Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return { bg: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' };
      case 'Onboarding': return { bg: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' };
      case 'Probation': return { bg: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' };
      case 'On Leave': return { bg: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' };
      case 'Suspended': return { bg: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' };
      case 'Contract Expired': return { bg: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' };
      case 'Deceased': return { bg: 'bg-slate-800 text-white', dot: 'bg-slate-300' };
      default: return { bg: 'bg-slate-100 text-slate-800', dot: 'bg-slate-500' }; // Resigned, Retired, Terminated
    }
  };


  const [empHistory, setEmpHistory] = useState<EmployeeHistoryEntry[]>([]);

  useEffect(() => {
    if (selectedEmployee && detailsTab === 'history') {
      data.getEmployeeHistory(selectedEmployee.id).then(setEmpHistory).catch(() => setEmpHistory([]));
    }
  }, [selectedEmployee?.id, detailsTab, data]);

  const [showDocUploadModal, setShowDocUploadModal] = useState(false);

  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [newStatusUpdate, setNewStatusUpdate] = useState('');
  const [statusReason, setStatusReason] = useState('');

  // State for conditional status fields
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Personal');
  const [suspensionStartDate, setSuspensionStartDate] = useState('');
  const [suspensionEndDate, setSuspensionEndDate] = useState('');
  const [probationStartDate, setProbationStartDate] = useState('');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [dateOfPassing, setDateOfPassing] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');


  const [uploadDocType, setUploadDocType] = useState('OTHER');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleProfileDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !uploadFile || !setDocuments || !documents) return;

    const newDoc: EmployeeDocument = {
      id: `DOC-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      documentType: uploadDocType as any,
      documentTypeLabel: uploadDocType.replace(/_/g, ' '),
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileType: uploadFile.type,
      fileUrl: URL.createObjectURL(uploadFile),
      driveFileId: `mock-drive-id-${Date.now()}`,
      uploadedBy: "HR-ADMIN",
      uploadedByName: "HR Admin",
      uploadedAt: new Date().toISOString(),
      isVerified: false,
      status: "Pending Verification",
      notes: "",
      tags: [],
      version: 1,
    };

    setDocuments([newDoc, ...documents]);
    setShowDocUploadModal(false);
    setUploadDocType('OTHER');
    setUploadFile(null);
  };


  // Handle upload of signed contract
  const handleContractUpload = async (empId: string, file: File) => {
    setIsUploading(true);
    try {
      const settings = await data.getSettings();
      let fileId = "mock-drive-file-id-123456";
      
      if (!settings.isMockMode) {
        // Upload file to Drive
        fileId = await data.uploadFile(
          file,
          settings.googleSheets.driveFolderId
        );
        
        // Log documents metadata in HumailEli_Documents sheet
        const docRecord = {
          docId: `DOC-${Date.now().toString().slice(-4)}`,
          empId: empId,
          fileName: file.name,
          fileId: fileId,
          uploadedAt: new Date().toISOString()
        };
        await data.addSheetLog(settings.googleSheets.documentsSheet || "HumailEli_Documents", "INSERT", docRecord);
        alert(`Contract uploaded successfully to Google Drive (ID: ${fileId}) and registered in Google Sheets!`);
      } else {
        alert("Contract upload simulated successfully in offline Sandbox mode!");
      }

      // Complete contract onboarding step
      const updated = employees.map((emp) => {
        if (emp.id === empId) {
          const onboarding = { ...emp.onboarding, contractSigned: true };
          let status = emp.status;
          if (onboarding.contractSigned && onboarding.trainingCompleted && onboarding.welcomeEmailSent) {
            status = 'Active';
          }
          const updatedEmp = { ...emp, onboarding, status };
          if (selectedEmployee?.id === emp.id) {
            setSelectedEmployee(updatedEmp);
          }
          return updatedEmp;
        }
        return emp;
      });
      setEmployees(updated);
    } catch (err: any) {
      logger.error(err);
      alert(`File upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle onboarding checklist items
  const toggleOnboarding = (empId: string, item: keyof Employee['onboarding']) => {
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        const onboarding = { ...emp.onboarding, [item]: !emp.onboarding[item] };
        
        let status = emp.status;
        if (item === 'trainingCompleted' && onboarding.trainingCompleted && !onboarding.feedbackSubmitted) {
          // Training completed trigger training feedback modal
          setTimeout(() => setShowFeedbackModal(emp), 300);
        }

        // If welcome email is toggled on, show alert or simulation message
        if (item === 'welcomeEmailSent' && onboarding.welcomeEmailSent) {
          alert(`Welcome Email simulated & sent to ${emp.email}!`);
        }

        // Part 5: Trigger Automation Triggers
        const onboardingTasksStatus = { ...(emp.onboarding.tasksStatus || {}) };
        let onboardingTasksCompleted = [...(emp.onboarding.tasksCompleted || [])];

        if (emp.onboarding.templateId) {
          const template = onboardingTemplates?.find(t => t.id === emp.onboarding.templateId);
          if (template) {
            template.tasks.forEach(task => {
              if (task.autoTrigger && task.triggerCondition === item) {
                if (onboarding[item]) {
                  onboardingTasksStatus[task.id] = 'completed';
                  if (!onboardingTasksCompleted.includes(task.id)) {
                    onboardingTasksCompleted.push(task.id);
                  }
                } else {
                  onboardingTasksStatus[task.id] = 'pending';
                  onboardingTasksCompleted = onboardingTasksCompleted.filter(id => id !== task.id);
                }
              }
            });
          }
        }

        // If everything except feedback is done, or feedback is done, mark as active
        const template = onboardingTemplates?.find(t => t.id === emp.onboarding.templateId);
        const totalTemplateTasks = template ? template.tasks.length : 0;
        const allTemplateTasksDone = totalTemplateTasks > 0 && onboardingTasksCompleted.length === totalTemplateTasks;

        if ((onboarding.contractSigned && onboarding.trainingCompleted && onboarding.welcomeEmailSent) || allTemplateTasksDone) {
          status = 'Active';
          const currentTimeline = [...(emp.journeyTimeline || [])];
          const hasTimelineEvent = currentTimeline.some(evt => evt.title === "Onboarding Fully Completed");
          if (!hasTimelineEvent) {
            const completedEvent: TimelineEvent = {
              id: `EVT-${Date.now()}-done`,
              stage: 'Onboarding',
              date: new Date().toISOString().split('T')[0],
              title: "Onboarding Fully Completed",
              description: allTemplateTasksDone 
                ? `Completed all ${totalTemplateTasks} template tasks of "${template?.name}" successfully!`
                : "Completed all fundamental onboarding milestones successfully!"
            };
            currentTimeline.unshift(completedEvent);
          }
          emp.journeyTimeline = currentTimeline;
        } else {
          status = 'Onboarding';
        }

        const updatedEmp: Employee = { 
          ...emp, 
          onboarding: {
            ...onboarding,
            tasksStatus: onboardingTasksStatus as any,
            tasksCompleted: onboardingTasksCompleted
          }, 
          status
        };

        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee(updatedEmp);
        }

        // Sync to GSheet if not mock mode
        if (!isMockMode) {
          import('../lib/storage').then(m => m.syncEmployeeToGSheet(updatedEmp));
        }

        return updatedEmp;
      }
      return emp;
    });

    setEmployees(updated);
    // Persist to backend after state update.
    const targetEmp = updated.find(e => e.id === empId);
    if (targetEmp) {
      data.saveEmployee(targetEmp).catch(err => logger.error('Failed to persist onboarding toggle:', err));
    }
  };

  // Submit Feedback modal
  const handleFeedbackSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!showFeedbackModal) return;

    const empId = showFeedbackModal.id;
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        const onboarding = { ...emp.onboarding, feedbackSubmitted: true };
        const updatedEmp: Employee = {
          ...emp,
          onboarding,
          trainingFeedback: {
            trainerName: feedbackTrainer || "Internal Trainer",
            rating: feedbackRating,
            comments: feedbackComments || "Great training content.",
            submittedAt: new Date().toISOString().split('T')[0]
          }
        };

        data.addSheetLog("HumailEli_TrainingFeedback", "INSERT", {
          employeeId: emp.id,
          employeeName: emp.name,
          trainer: feedbackTrainer,
          rating: feedbackRating,
          comments: feedbackComments
        });

        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee(updatedEmp);
        }
        return updatedEmp;
      }
      return emp;
    });

    setEmployees(updated);
    // Persist the employee feedback change to backend.
    const targetEmp = updated.find(e => e.id === empId);
    if (targetEmp) {
      data.saveEmployee(targetEmp).catch(err => logger.error('Failed to persist training feedback:', err));
    }
    setFeedbackTrainer('');
    setFeedbackRating(5);
    setFeedbackComments('');
    setShowFeedbackModal(null);
  };

  // Toggle exit checklist items
  const toggleExitChecklist = (empId: string, item: keyof NonNullable<Employee['exit']>) => {
    const updated = employees.map((emp) => {
      if (emp.id === empId && emp.exit) {
        const exit = { ...emp.exit, [item]: !emp.exit[item] };
        
        // If exit process is entirely complete, keep status as terminated
        const updatedEmp = { ...emp, exit };
        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee(updatedEmp);
        }
        return updatedEmp;
      }
      return emp;
    });
    setEmployees(updated);
  };

  // Initiate Exit Formalities
  const handleInitiateExit = async (employee: Employee) => {
    if (employee.status === 'Terminated' || employee.status === 'Resigned') {
      alert("Exit formalities already initiated for this employee.");
      return;
    }

    const checklistTemplates = await data.getExitChecklistTemplates();
    const interviewTemplates = await data.getExitInterviewTemplates();

    if (checklistTemplates.length === 0) {
      alert('No checklist templates found. Please create one in Settings → Exit Management → Checklists.');
      return;
    }

    const records = await data.getExitRecords();
    const existingExit = records.find(r => r.employeeId === employee.id && r.status !== 'Completed' && r.status !== 'Cancelled');
    if (existingExit) {
      alert('This employee already has an active exit process.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to initiate the exit process for ${employee.name}? This will change their status and release their seat.`);
    if (!confirmed) return;

    try {
      const template = checklistTemplates[0];
      const interviewTemplate = interviewTemplates[0];

      const newExitRecord: ExitRecord = {
        id: `EXIT-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        initiatedBy: user?.id || 'HR-ADMIN',
        initiatedByName: user?.email || 'HR Administrator',
        initiatedAt: new Date().toISOString(),
        status: 'Initiated',
        resignationDate: new Date().toISOString().split('T')[0],
        lastWorkingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Resignation',
        checklistTemplateId: template?.id,
        checklistItems: template ? template.items.map(item => ({
          itemId: item.id,
          itemName: item.name,
          status: 'Pending'
        })) : [],
        settlement: {
          totalAmount: 0,
          leaveEncashment: 0,
          gratuity: 0,
          bonus: 0,
          deductions: 0,
          paymentType: 'Bank Transfer'
        },
        interviewTemplateId: interviewTemplate?.id,
        interviewResponses: interviewTemplate ? interviewTemplate.questions.map(q => ({
          questionId: q.id,
          questionText: q.questionText,
          answer: '',
          recordedBy: '',
          recordedAt: ''
        })) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await data.createExitRecord(newExitRecord);

      // Update employee status
      const updated = employees.map((emp) => {
        if (emp.id === employee.id) {
          const updatedEmp: Employee = {
            ...emp,
            status: 'Terminated',
            employment: {
              ...emp.employment,
              seatNumber: 0
            },
            exit: {
              resignationAccepted: true,
              assetHandover: false,
              ndaRenewed: false,
              finalSettlement: false,
              exitInterview: false
            }
          };

          data.addSheetLog("HumailEli_Employees", "UPDATE", {
            employeeId: emp.id,
            name: emp.name,
            status: 'Terminated',
            action: 'EXIT_INITIATED',
            exitRecordId: newExitRecord.id
          });

          if (selectedEmployee?.id === emp.id) {
            setSelectedEmployee(updatedEmp);
          }
          return updatedEmp;
        }
        return emp;
      });

      setEmployees(updated);
      // Persist the employee status change to backend.
      const targetEmp = updated.find(e => e.id === employee.id);
      if (targetEmp) {
        data.saveEmployee(targetEmp).catch(err => logger.error('Failed to persist exit employee:', err));
      }
      alert(`Exit formalities initiated for ${employee.name}. Check Settings → Exit Management for progress.`);
    } catch (err: any) {
      logger.error("Error initiating exit:", err);
      alert("Failed to initiate exit. Please check the console for details.");
    }
  };

  // Timeline Event addition
  const handleAddTimelineMilestone = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !milestoneTitle) return;

    const newMilestone: TimelineEvent = {
      id: `EVT-${Date.now()}`,
      stage: milestoneStage,
      date: new Date().toISOString().split('T')[0],
      title: milestoneTitle,
      description: milestoneDesc
    };

    const updatedTimeline = selectedEmployee.journeyTimeline 
      ? [newMilestone, ...selectedEmployee.journeyTimeline]
      : [newMilestone];

    const updatedEmployees = employees.map(emp => {
      if (emp.id === selectedEmployee.id) {
        return { ...emp, journeyTimeline: updatedTimeline };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    setSelectedEmployee(prev => prev ? { ...prev, journeyTimeline: updatedTimeline } : null);

    // Persist to backend.
    const targetEmp = updatedEmployees.find(emp => emp.id === selectedEmployee.id);
    if (targetEmp) {
      data.saveEmployee(targetEmp).catch(err => logger.error('Failed to persist timeline milestone:', err));
    }

    // Sync to GSheet if not mock mode
    if (!isMockMode) {
      try {
        const { syncEmployeeToGSheet } = await import('../lib/storage');
        const targetEmp = updatedEmployees.find(emp => emp.id === selectedEmployee.id);
        if (targetEmp) await syncEmployeeToGSheet(targetEmp);
      } catch (err) {
        logger.error("Timeline milestone sync error:", err);
      }
    }

    setMilestoneTitle("");
    setMilestoneDesc("");
    setShowAddMilestone(false);
  };

  // Onboarding task addition
  const handleAddOnboardingTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !taskName) return;

    const assignedEmp = employees.find(emp => emp.id === taskAssignedToId);

    const newTask: LegacyOnboardingTask = {
      id: `TASK-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      taskName,
      dueDate: taskDueDate || new Date().toISOString().split('T')[0],
      assignedToId: taskAssignedToId,
      assignedToName: assignedEmp ? assignedEmp.name : "HR Administrator",
      completed: false
    };

    const updatedTasks = [newTask, ...onboardingTasks];
    setOnboardingTasks(updatedTasks);

    // Sync to GSheet if not mock mode
    if (!isMockMode) {
      try {
        const { syncOnboardingTaskToGSheet } = await import('../lib/storage');
        await syncOnboardingTaskToGSheet(newTask);
      } catch (err) {
        logger.error("Onboarding task sync error:", err);
      }
    }

    setTaskName("");
    setTaskDueDate("");
    setTaskAssignedToId("");
    setShowAddTask(false);
  };

  const handleUpdateTemplateTaskStatus = async (
    empId: string,
    taskId: string,
    newStatus: 'pending' | 'in-progress' | 'completed' | 'overdue'
  ) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === empId) {
        const onboardingTasksStatus = { ...(emp.onboarding.tasksStatus || {}), [taskId]: newStatus };
        let onboardingTasksCompleted = [...(emp.onboarding.tasksCompleted || [])];

        if (newStatus === 'completed') {
          if (!onboardingTasksCompleted.includes(taskId)) {
            onboardingTasksCompleted.push(taskId);
          }
        } else {
          onboardingTasksCompleted = onboardingTasksCompleted.filter(id => id !== taskId);
        }

        // Auto trigger checks (if any legacy milestones are linked to this task)
        const template = onboardingTemplates?.find(t => t.id === emp.onboarding.templateId);
        const task = template?.tasks.find(t => t.id === taskId);
        const onboarding = { ...emp.onboarding };

        if (task && task.autoTrigger && task.triggerCondition) {
          const conditionKey = task.triggerCondition as keyof OnboardingChecklist;
          if (conditionKey in onboarding) {
            (onboarding as any)[conditionKey] = (newStatus === 'completed');
          }
        }

        // If all template tasks are completed, automatically mark the employee as active
        let status = emp.status;
        const totalTemplateTasks = template ? template.tasks.length : 0;
        const allTemplateTasksDone = totalTemplateTasks > 0 && onboardingTasksCompleted.length === totalTemplateTasks;

        if ((onboarding.contractSigned && onboarding.trainingCompleted && onboarding.welcomeEmailSent) || allTemplateTasksDone) {
          status = 'Active';
          const hasTimelineEvent = emp.journeyTimeline?.some(evt => evt.title === "Onboarding Fully Completed");
          if (!hasTimelineEvent) {
            const completedEvent: TimelineEvent = {
              id: `EVT-${Date.now()}-done`,
              stage: 'Onboarding',
              date: new Date().toISOString().split('T')[0],
              title: "Onboarding Fully Completed",
              description: allTemplateTasksDone 
                ? `Completed all ${totalTemplateTasks} template tasks of "${template?.name}" successfully!`
                : "Completed all fundamental onboarding milestones successfully!"
            };
            emp.journeyTimeline = [completedEvent, ...(emp.journeyTimeline || [])];
          }
        } else {
          status = 'Onboarding';
        }

        const updatedEmp: Employee = {
          ...emp,
          onboarding: {
            ...onboarding,
            tasksStatus: onboardingTasksStatus as any,
            tasksCompleted: onboardingTasksCompleted
          },
          status
        };

        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee(updatedEmp);
        }

        // Sync to GSheet if not mock mode
        if (!isMockMode) {
          import('../lib/storage').then(m => m.syncEmployeeToGSheet(updatedEmp));
        }

        return updatedEmp;
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    // Persist to backend.
    const targetEmp = updatedEmployees.find(emp => emp.id === empId);
    if (targetEmp) {
      data.saveEmployee(targetEmp).catch(err => logger.error('Failed to persist template task status:', err));
    }
  };

  const toggleOnboardingTaskComplete = async (taskId: string) => {
    const updatedTasks = onboardingTasks.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, completed: !t.completed };
        // Sync to GSheet if not mock mode
        if (!isMockMode) {
          import('../lib/storage').then(m => m.syncOnboardingTaskToGSheet(updated));
        }
        return updated;
      }
      return t;
    });
    setOnboardingTasks(updatedTasks);
  };

  // Mentor Assignment
  const handleAssignMentor = async (mentorId: string) => {
    if (!selectedEmployee) return;

    const newMentor = employees.find(emp => emp.id === mentorId);
    const mentorName = newMentor ? newMentor.name : undefined;
    const oldMentorId = selectedEmployee.mentorId;

    const updatedTimelineEvent: TimelineEvent = {
      id: `EVT-${Date.now()}`,
      stage: 'Onboarding',
      date: new Date().toISOString().split('T')[0],
      title: "Mentor Assigned",
      description: mentorName ? `Assigned mentor ${mentorName} for training and evaluation guidance.` : "Mentor removed."
    };

    const updatedTimeline = selectedEmployee.journeyTimeline 
      ? [updatedTimelineEvent, ...selectedEmployee.journeyTimeline]
      : [updatedTimelineEvent];

    const updatedEmployees = employees.map(emp => {
      // 1. Update the mentee (selectedEmployee)
      if (emp.id === selectedEmployee.id) {
        return { 
          ...emp, 
          mentorId: mentorId || undefined, 
          mentorName: mentorName || undefined,
          journeyTimeline: updatedTimeline
        };
      }
      // 2. Remove mentee from old mentor
      if (oldMentorId && emp.id === oldMentorId) {
        return {
          ...emp,
          mentees: (emp.mentees || []).filter(id => id !== selectedEmployee.id)
        };
      }
      // 3. Add mentee to new mentor
      if (mentorId && emp.id === mentorId) {
        return {
          ...emp,
          mentees: [...(emp.mentees || []), selectedEmployee.id]
        };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    setSelectedEmployee(prev => prev ? { 
      ...prev, 
      mentorId: mentorId || undefined, 
      mentorName: mentorName || undefined,
      journeyTimeline: updatedTimeline
    } : null);

    if (!isMockMode) {
      try {
        const { syncEmployeeToGSheet } = await import('../lib/storage');
        // Sync mentee
        const targetEmp = updatedEmployees.find(emp => emp.id === selectedEmployee.id);
        if (targetEmp) await syncEmployeeToGSheet(targetEmp);
        // Sync new mentor
        if (mentorId) {
          const newM = updatedEmployees.find(emp => emp.id === mentorId);
          if (newM) await syncEmployeeToGSheet(newM);
        }
        // Sync old mentor
        if (oldMentorId) {
          const oldM = updatedEmployees.find(emp => emp.id === oldMentorId);
          if (oldM) await syncEmployeeToGSheet(oldM);
        }
      } catch (err) {
        logger.error("Mentor assignment sync error:", err);
      }
    }
    
    setIsMentorModalOpen(false);

    // Persist all affected employees (mentee + mentors) to backend.
    const affected = updatedEmployees.filter(e =>
      e.id === selectedEmployee.id || e.id === mentorId || e.id === oldMentorId
    );
    affected.forEach(emp => {
      data.saveEmployee(emp).catch(err => logger.error('Failed to persist mentor assignment:', err));
    });

    // Automatically send an alert notification when assigned!
    if (mentorName) {
      alert(`Mentor assigned successfully! Auto-sent notification to ${mentorName} regarding assignment as mentor for ${selectedEmployee.name}.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight">Employee Lifecycle</h2>
          <p className="text-sm font-medium text-slate-500 font-sans mt-0.5">Manage employee onboarding checksheets, workstation desk assignments, and exit offboard files.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={async () => {
              const settings = await data.getSettings();
              if (filteredEmployees.length === 0) {
                alert("No employees found matching the current search/filters to export.");
                return;
              }
              exportEmployeeDirectoryToPDF(filteredEmployees, settings, departments, designations);
            }}
            className="flex items-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
          >
            <FileText className="w-4 h-4 text-violet-600" />
            Export PDF
          </button>


          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="flex items-center gap-2 h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
            >
              Update Status ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-600/10 hover:shadow-lg active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Main Grid: Directory left (2/3), Details right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Directory Card */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-xl shadow-slate-100/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, role or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400 w-full sm:max-w-xs"
            />
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 h-10 items-center gap-1 shrink-0 overflow-x-auto">
              {(['All', 'Active', 'All Active', 'Onboarding', 'Probation', 'On Leave', 'Suspended', 'Terminated'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-bold tracking-wider transition-all uppercase whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-white text-slate-800 shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[11px] font-bold font-sans uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role / Dept</th>
                  <th className="px-4 py-3">Joining</th>
                  <th className="px-4 py-3">Seat</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    return (
                      <tr 
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-all ${
                          isSelected ? 'bg-violet-50/40 hover:bg-violet-50/40' : ''
                        }`}
                      >
                                                <td className="px-4 py-3.5">
                          <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={(e) => {
                            e.stopPropagation();
                            setSelectedIds(prev => e.target.checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id));
                          }} />
                        </td>
<td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {emp.personal.profileImage ? (
                              <img 
                                src={emp.personal.profileImage}
                                onError={(e) => {
                                  // Fallback to initial svg if file fails to render or is a local placeholder
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`;
                                }}
                                alt={emp.name} 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {getInitials(emp.name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{emp.id} • {emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-slate-700">{getEmployeeDesignation(emp, designations)}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold font-mono">{getEmployeeDepartment(emp, departments)}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono text-slate-500">{emp.employment.joiningDate}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {emp.employment.seatNumber && emp.employment.seatNumber > 0 ? `S${emp.employment.seatNumber}` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(emp.status).bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(emp.status).dot}`} />
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-sans text-xs italic">
                      No employees match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Employee Lifecycle Details Column */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm h-full flex flex-col justify-between" id="employee-detail-panel">
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-display tracking-tight">{selectedEmployee.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedEmployee.id} • {getEmployeeDesignation(selectedEmployee, designations)}</p>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{getEmployeeDepartment(selectedEmployee, departments)} Department</p>
                    {selectedEmployee.mentorName && (
                      <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Mentor: {selectedEmployee.mentorName}
                      </p>
                    )}
                  </div>
                  {selectedEmployee.status !== 'Terminated' && selectedEmployee.status !== 'Resigned' && (
                    <button
                      onClick={() => handleInitiateExit(selectedEmployee)}
                      className="text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl px-3 py-1.5 font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Initiate Exit
                    </button>
                  )}
                </div>

                {/* Sub-tabs selectors */}
                <div className="flex gap-2 border-b border-slate-100 mt-5 pb-0">
                  <button
                    onClick={() => setDetailsTab('profile')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'profile' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Comprehensive Profile
                  </button>
                  <button
                    onClick={() => setDetailsTab('timeline')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'timeline' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Journey Timeline
                  </button>
                  <button
                    onClick={() => setDetailsTab('onboarding')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'onboarding' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Onboarding Tasks
                  </button>
                  <button
                    onClick={() => setDetailsTab('mentorship')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'mentorship' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Mentorship
                  </button>
                  <button
                    onClick={() => setDetailsTab('documents')}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'documents' 
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Documents
                  </button>
                  <button
                    onClick={() => setDetailsTab('history' as any)}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'history' as any
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setDetailsTab('status_history' as any)}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'status_history' as any
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Status
                  </button>
                  <button
                    onClick={() => setDetailsTab('salary' as any)}
                    className={`pb-2.5 px-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                      detailsTab === 'salary' as any
                        ? 'border-violet-600 text-violet-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Salary
                  </button>
                </div>
              </div>

              {/* Dynamic Tabs Content */}
              {detailsTab === 'profile' && (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2" id="profile-details-view">
                  {/* Section 1: Profile Summary */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                    {selectedEmployee.personal.profileImage ? (
                      <img 
                        src={selectedEmployee.personal.profileImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedEmployee.name)}`;
                        }}
                        alt={selectedEmployee.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-violet-500 shadow"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-lg border-2 border-violet-200">
                        {getInitials(selectedEmployee.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight">{selectedEmployee.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{getEmployeeDesignation(selectedEmployee, designations)} • {getEmployeeDepartment(selectedEmployee, departments)}</p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Joined: {selectedEmployee.employment.joiningDate || '—'} • Tenure: {(() => {
                          if (!selectedEmployee.employment.joiningDate) return '—';
                          const joined = new Date(selectedEmployee.employment.joiningDate);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - joined.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays < 30) return `${diffDays} days tenure`;
                          const diffMonths = Math.floor(diffDays / 30);
                          if (diffMonths < 12) return `${diffMonths} month(s) tenure`;
                          const diffYears = Math.floor(diffMonths / 12);
                          const remMonths = diffMonths % 12;
                          return `${diffYears} year(s) ${remMonths} month(s) tenure`;
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Section 2: Personal Information */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                      Section 2: Personal Information
                    </h5>
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50/40 p-3 rounded-xl border border-slate-100/60 text-xs text-slate-700">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Personal Email</p>
                        <p className="font-semibold">{selectedEmployee.personalEmail || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Date of Birth</p>
                        <p className="font-semibold">{selectedEmployee.dateOfBirth || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Gender</p>
                        <p className="font-semibold">{selectedEmployee.gender || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Nationality</p>
                        <p className="font-semibold">{selectedEmployee.nationality || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">National ID / CNIC</p>
                        <p className="font-semibold font-mono">{selectedEmployee.cnic || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Religion</p>
                        <p className="font-semibold">{selectedEmployee.religion || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Marital Status</p>
                        <p className="font-semibold">{selectedEmployee.maritalStatus || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Blood Group</p>
                        <p className="font-semibold text-rose-600">{selectedEmployee.bloodGroup || '—'}</p>
                      </div>
                    </div>

                    {/* CNIC Document Images */}
                    {(selectedEmployee.cnicFrontImage || selectedEmployee.cnicBackImage) && (
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[10px]">
                        {selectedEmployee.cnicFrontImage && (
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white rounded border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">CNIC Front</p>
                            <img src={selectedEmployee.cnicFrontImage} alt="CNIC Front" className="w-full h-16 object-cover rounded" />
                            <a href={selectedEmployee.cnicFrontImage} target="_blank" rel="noreferrer" className="text-[8px] text-violet-600 font-bold uppercase hover:underline">View File</a>
                          </div>
                        )}
                        {selectedEmployee.cnicBackImage && (
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white rounded border border-slate-100">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">CNIC Back</p>
                            <img src={selectedEmployee.cnicBackImage} alt="CNIC Back" className="w-full h-16 object-cover rounded" />
                            <a href={selectedEmployee.cnicBackImage} target="_blank" rel="noreferrer" className="text-[8px] text-violet-600 font-bold uppercase hover:underline">View File</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Contact & Address */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-violet-600" />
                      Section 3: Contact & Address
                    </h5>
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50/40 p-3 rounded-xl border border-slate-100/60 text-xs text-slate-700">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Work Phone</p>
                        <p className="font-semibold font-mono">{selectedEmployee.phoneWork || selectedEmployee.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Personal Phone</p>
                        <p className="font-semibold font-mono">{selectedEmployee.phonePersonal || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase text-slate-400">Current Address</p>
                        <p className="font-semibold">{selectedEmployee.currentAddress || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase text-slate-400">Permanent Address</p>
                        <p className="font-semibold">{selectedEmployee.permanentAddress || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">City / State</p>
                        <p className="font-semibold">{selectedEmployee.city || '—'}{selectedEmployee.state ? `, ${selectedEmployee.state}` : ''}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Postal Code / Country</p>
                        <p className="font-semibold">{selectedEmployee.postalCode || '—'}{selectedEmployee.country ? ` (${selectedEmployee.country})` : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Emergency Contact */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      Section 4: Emergency Contact
                    </h5>
                    <div className="bg-rose-50/20 border border-rose-100/50 p-3 rounded-xl text-xs text-slate-700 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase text-rose-500/80 font-mono">Kin Name</p>
                        <p className="font-bold text-slate-800">{selectedEmployee.emergencyContactName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-rose-500/80 font-mono">Relationship</p>
                        <p className="font-semibold text-slate-600">{selectedEmployee.emergencyRelationship || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-rose-500/80 font-mono">Kin Phone</p>
                        <p className="font-bold font-mono text-slate-800">{selectedEmployee.emergencyContactPhone || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Employment Details */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-violet-600" />
                      Section 5: Employment Details
                    </h5>
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50/40 p-3 rounded-xl border border-slate-100/60 text-xs text-slate-700">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Employment Type</p>
                        <p className="font-semibold">{selectedEmployee.employmentType || 'Permanent'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Corporate Grade</p>
                        <p className="font-semibold">{selectedEmployee.grade || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Job Category</p>
                        <p className="font-semibold">{selectedEmployee.jobCategory || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Probation term</p>
                        <p className="font-semibold">{selectedEmployee.isProbation ? `Active Probation` : 'Confirmed Permanent'}</p>
                      </div>
                      {selectedEmployee.isProbation && (
                        <>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Probation End Date</p>
                            <p className="font-semibold font-mono">{selectedEmployee.probationEndDate || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Confirmation Date</p>
                            <p className="font-semibold font-mono">{selectedEmployee.confirmationDate || '—'}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Work Location Mode</p>
                        <p className="font-semibold">{selectedEmployee.workLocation || 'Office'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Shift Assignment</p>
                        <p className="font-semibold">{selectedEmployee.shift || 'Morning Shift'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Cost Center</p>
                        <p className="font-semibold font-mono">{selectedEmployee.costCenter || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 font-mono">Payroll Group / Band</p>
                        <p className="font-semibold">{selectedEmployee.payrollGroup || '—'}</p>
                      </div>
                    </div>

                    {/* Relational Org Mapping */}
                    <div className="bg-gradient-to-r from-violet-50 to-indigo-50/50 rounded-2xl border border-violet-100 p-4 space-y-3 mt-3">
                      <div className="flex items-center gap-2 text-violet-800 font-extrabold text-xs">
                        <Layers className="w-4 h-4" />
                        <span>Department & Designation Mapping</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 font-mono">Linked Department</p>
                          <p className="font-bold text-slate-800">{getEmployeeDepartment(selectedEmployee, departments)}</p>
                          {selectedEmployee.departmentId && (() => {
                            const dept = departments.find(d => d.id === selectedEmployee.departmentId);
                            if (dept) {
                              return (
                                <span className="text-[9px] font-mono font-bold text-violet-600 block mt-0.5">
                                  Code: {dept.code} {dept.location ? `• Loc: ${dept.location}` : ''}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 font-mono">Linked Designation</p>
                          <p className="font-bold text-slate-800">{getEmployeeDesignation(selectedEmployee, designations)}</p>
                          {selectedEmployee.designationId && (() => {
                            const dsg = designations.find(d => d.id === selectedEmployee.designationId);
                            if (dsg) {
                              return (
                                <span className="text-[9px] font-mono font-bold text-violet-600 block mt-0.5">
                                  Grade: Level {dsg.level} ({dsg.category})
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        {selectedEmployee.designationId && (() => {
                          const dsg = designations.find(d => d.id === selectedEmployee.designationId);
                          if (dsg && (dsg.reportingToDesignationId || dsg.minSalary)) {
                            const reportsTo = designations.find(d => d.id === dsg.reportingToDesignationId);
                            return (
                              <div className="col-span-2 pt-2 border-t border-violet-100/60 grid grid-cols-2 gap-3 text-[11px]">
                                {reportsTo && (
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 font-mono">Reports To Role</p>
                                    <p className="font-semibold text-slate-600">{reportsTo.name} ({reportsTo.code})</p>
                                  </div>
                                )}
                                {dsg.minSalary && (
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 font-mono">Governing Salary Band</p>
                                    <p className="font-semibold text-slate-600">${dsg.minSalary.toLocaleString()} - ${dsg.maxSalary?.toLocaleString() || '∞'}</p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Education History */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-violet-600" />
                      Section 6: Education History
                    </h5>
                    {!selectedEmployee.educationList || selectedEmployee.educationList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No formal education records registered for this profile.</p>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="bg-slate-50 font-bold text-slate-400 uppercase text-[8px] tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-3 py-2">Degree / Major</th>
                              <th className="px-3 py-2">Institution</th>
                              <th className="px-3 py-2">Year / CGPA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                            {selectedEmployee.educationList.map((edu: any, i: number) => (
                              <tr key={i}>
                                <td className="px-3 py-2 font-bold text-slate-800">
                                  {edu.degree}
                                  {edu.isHighest && <span className="ml-1 px-1.5 py-0.5 bg-violet-100 text-violet-700 font-black uppercase rounded text-[7px] tracking-wide">Highest</span>}
                                </td>
                                <td className="px-3 py-2">{edu.institution} {edu.fieldOfStudy ? `(${edu.fieldOfStudy})` : ''}</td>
                                <td className="px-3 py-2 font-mono">{edu.yearOfGraduation} <span className="text-slate-400">({edu.grade || '—'})</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section 7: Certifications */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      Section 7: Certifications
                    </h5>
                    {!selectedEmployee.certificationsList || selectedEmployee.certificationsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No certifications registered for this profile.</p>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="bg-slate-50 font-bold text-slate-400 uppercase text-[8px] tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-3 py-2">Certification Name</th>
                              <th className="px-3 py-2">Issuer / Date</th>
                              <th className="px-3 py-2 text-right">Document</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                            {selectedEmployee.certificationsList.map((cert: any, i: number) => (
                              <tr key={i}>
                                <td className="px-3 py-2">
                                  <p className="font-bold text-slate-800">{cert.name}</p>
                                  <p className="text-[9px] font-mono text-slate-400">ID: {cert.credentialId || '—'}</p>
                                </td>
                                <td className="px-3 py-2">
                                  <p>{cert.issuingOrganization}</p>
                                  <p className="text-[9px] text-slate-400 font-mono">Issued: {cert.issueDate}</p>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {cert.fileUrl ? (
                                    <a 
                                      href={cert.fileUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[9px] font-bold uppercase tracking-wider text-violet-600 hover:underline bg-violet-50 px-2 py-1 rounded"
                                    >
                                      Download
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 text-[10px]">No file</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section 8: Employment History */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-violet-600" />
                      Section 8: Employment History
                    </h5>
                    {!selectedEmployee.previousEmployersList || selectedEmployee.previousEmployersList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No prior experience logged.</p>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="bg-slate-50 font-bold text-slate-400 uppercase text-[8px] tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-3 py-2">Prior Company & Title</th>
                              <th className="px-3 py-2">Timeline / Reason</th>
                              <th className="px-3 py-2 text-right">Reference Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                            {selectedEmployee.previousEmployersList.map((prev: any, i: number) => (
                              <tr key={i}>
                                <td className="px-3 py-2">
                                  <p className="font-bold text-slate-800">{prev.companyName}</p>
                                  <p className="text-[10px] text-slate-500">{prev.jobTitle}</p>
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  <p className="font-mono">{prev.startDate} to {prev.endDate}</p>
                                  <p className="text-[9px] text-slate-400 italic">{prev.reasonForLeaving ? `Reason: ${prev.reasonForLeaving}` : ''}</p>
                                </td>
                                <td className="px-3 py-2 text-right text-[10px]">
                                  {prev.contactPerson ? (
                                    <div>
                                      <p className="font-bold text-slate-800">{prev.contactPerson}</p>
                                      <p className="text-slate-400 font-mono">{prev.contactPhone || ''}</p>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-mono">None logged</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Tabs Content */}
              {detailsTab === 'timeline' && (
                <div className="space-y-4" id="timeline-tab">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Talent Journey Timeline</h4>
                    <button
                      onClick={() => setShowAddMilestone(!showAddMilestone)}
                      className="text-[10px] font-black text-violet-600 hover:text-violet-800 uppercase tracking-wider flex items-center gap-1 bg-violet-50 hover:bg-violet-100/70 px-2 py-1 rounded"
                    >
                      <Plus className="w-3 h-3" />
                      Add Milestone
                    </button>
                  </div>

                  {showAddMilestone && (
                    <form onSubmit={handleAddTimelineMilestone} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Milestone Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Promoted to Tech Lead"
                          value={milestoneTitle}
                          onChange={(e) => setMilestoneTitle(e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description</label>
                        <input
                          type="text"
                          placeholder="Brief details about the accomplishment..."
                          value={milestoneDesc}
                          onChange={(e) => setMilestoneDesc(e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Journey Stage</label>
                        <select
                          value={milestoneStage}
                          onChange={(e) => setMilestoneStage(e.target.value as any)}
                          className="w-full h-8 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                        >
                          <option value="Recruitment">Recruitment</option>
                          <option value="Onboarding">Onboarding</option>
                          <option value="Performance">Performance Evaluation</option>
                          <option value="Promotion">Promotion & Grade Up</option>
                          <option value="Exit">Offboarding Exit</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddMilestone(false)}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-violet-600 text-white rounded text-[10px] font-bold uppercase shadow-sm"
                        >
                          Save Milestone
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Vertical Journey Timeline List */}
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-5 py-2 max-h-[360px] overflow-y-auto">
                    {/* Default milestones generated from onboarding/exit state */}
                    <TimelineNode
                      title="Applied to Recruitment Pipeline"
                      date={selectedEmployee.employment.joiningDate ? new Date(new Date(selectedEmployee.employment.joiningDate).getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '2026-06-30'}
                      desc="Resume screened and parsed successfully through structural acquisition."
                      stage="Recruitment"
                    />

                    <TimelineNode
                      title="Completed AI Pre-Screening Call"
                      date={selectedEmployee.employment.joiningDate ? new Date(new Date(selectedEmployee.employment.joiningDate).getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '2026-07-04'}
                      desc="Scored high on fundamental parameters. Advanced with automated offer invite."
                      stage="Recruitment"
                    />

                    <TimelineNode
                      title="Recruited & Joined Company"
                      date={selectedEmployee.employment.joiningDate}
                      desc={`Formally hired. Commenced structural onboarding as ${getEmployeeDesignation(selectedEmployee, designations)}.`}
                      stage="Onboarding"
                    />

                    {/* Dynamic customized timeline events */}
                    {selectedEmployee.journeyTimeline?.map((evt) => (
                      <TimelineNode
                        key={evt.id}
                        title={evt.title}
                        date={evt.date}
                        desc={evt.description}
                        stage={evt.stage as any}
                      />
                    ))}

                    {selectedEmployee.onboarding.contractSigned && (
                      <TimelineNode
                        title="Digitally Signed Contract"
                        date={selectedEmployee.employment.joiningDate}
                        desc="Regulatory contract completed and securely archived in GDrive."
                        stage="Onboarding"
                      />
                    )}

                    {selectedEmployee.onboarding.trainingCompleted && (
                      <TimelineNode
                        title="Completed Onboarding Training"
                        date={selectedEmployee.trainingFeedback?.submittedAt || selectedEmployee.employment.joiningDate}
                        desc={`Finished onboarding program evaluated by ${selectedEmployee.trainingFeedback?.trainerName || 'assigned trainer'}.`}
                        stage="Onboarding"
                      />
                    )}

                    {selectedEmployee.status === 'Terminated' && (
                      <TimelineNode
                        title="Exit Formalities Initiated"
                        date={new Date().toISOString().split('T')[0]}
                        desc="Resignation accepted and offboarding checklist triggered."
                        stage="Exit"
                      />
                    )}
                  </div>
                </div>
              )}

              {detailsTab === 'onboarding' && (
                <div className="space-y-4 font-sans" id="onboarding-tab">
                  {/* Template Progress Header */}
                  {selectedEmployee.onboardingTemplateId ? (() => {
                    const template = onboardingTemplates?.find(t => t.id === selectedEmployee.onboardingTemplateId);
                    if (!template) return null;

                    const totalTasks = template.tasks.length;
                    const completedTasksCount = template.tasks.filter(t => 
                      selectedEmployee.onboardingTasksStatus?.[t.id] === 'completed' ||
                      selectedEmployee.onboardingTasksCompleted?.includes(t.id)
                    ).length;
                    const percent = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

                    return (
                      <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-xl space-y-3 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] bg-violet-600/60 border border-violet-500/30 text-violet-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                              Active Blueprint
                            </span>
                            <h4 className="text-xs font-black text-white mt-1.5 font-display tracking-tight">{template.name}</h4>
                          </div>
                          <span className="font-mono text-xs font-extrabold bg-white/10 px-2 py-0.5 rounded-md">
                            {percent}%
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                            <span>Blueprint Progress</span>
                            <span>{completedTasksCount} of {totalTasks} completed</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 transition-all duration-500" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">No Blueprint Assigned</p>
                        <p className="text-[10px] text-amber-700 leading-normal mt-0.5">
                          This employee was not hired using the advanced templates system. Only standard milestones and custom tasks are available.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                      {selectedEmployee.onboardingTemplateId ? 'Blueprint Milestones' : 'Fundamental Milestones'}
                    </h4>
                    <button
                      onClick={() => setShowAddTask(!showAddTask)}
                      className="text-[10px] font-black text-violet-600 hover:text-violet-800 uppercase tracking-wider flex items-center gap-1 bg-violet-50 hover:bg-violet-100/70 px-2 py-1 rounded"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Task
                    </button>
                  </div>

                  {showAddTask && (
                    <form onSubmit={handleAddOnboardingTask} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Task Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Asset Handover (Laptop Setup)"
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Assign Task To</label>
                          <select
                            value={taskAssignedToId}
                            onChange={(e) => setTaskAssignedToId(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs text-slate-700"
                          >
                            <option value="">HR Admin</option>
                            {employees.filter(e => e.status !== 'Terminated' && e.id !== selectedEmployee.id).map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddTask(false)}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-violet-600 text-white rounded text-[10px] font-bold uppercase shadow-sm"
                        >
                          Assign Task
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Standard checklist fields & Configurable advanced GSheet checklist */}
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {/* Render Blueprint Tasks if assigned */}
                    {selectedEmployee.onboardingTemplateId && (() => {
                      const template = onboardingTemplates?.find(t => t.id === selectedEmployee.onboardingTemplateId);
                      if (!template) return null;

                      return (
                        <div className="space-y-2.5">
                          {template.tasks.map(task => {
                            const taskStatus = selectedEmployee.onboardingTasksStatus?.[task.id] || 'pending';
                            const badgeColors = {
                              pending: 'bg-slate-100 text-slate-600 border-slate-200',
                              'in-progress': 'bg-blue-50 text-blue-700 border-blue-100/50',
                              completed: 'bg-emerald-50 text-emerald-700 border-emerald-100/50',
                              overdue: 'bg-rose-50 text-rose-700 border-rose-100/50'
                            };

                            return (
                              <div key={task.id} className="p-3 bg-white border border-slate-200/85 hover:border-slate-300 rounded-2xl flex flex-col gap-2 transition-all shadow-sm shadow-slate-100/50">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-bold text-slate-800 truncate">{task.taskName}</p>
                                      {task.isRequired && (
                                        <span className="text-[8px] bg-rose-100 text-rose-600 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">Required</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-450 leading-normal mt-0.5">{task.description}</p>
                                  </div>

                                  <select
                                    value={taskStatus}
                                    onChange={(e) => handleUpdateTemplateTaskStatus(selectedEmployee.id, task.id, e.target.value as any)}
                                    className="h-7 text-[10px] font-bold border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-violet-500 px-1.5 cursor-pointer text-slate-700"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="overdue">Overdue</option>
                                  </select>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[9px] font-semibold text-slate-400">
                                  <div className="flex items-center gap-2">
                                    <span>Dept: <strong className="text-slate-600 uppercase font-mono">{task.assignedTo}</strong></span>
                                    <span>•</span>
                                    <span>Due: <strong className="text-slate-600">+{task.dueDaysAfterJoining} Days</strong></span>
                                  </div>

                                  {task.autoTrigger && task.triggerCondition && (
                                    <span className="text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                                      ⚡ Auto-triggers: {task.triggerCondition}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Basic fundamental milestones (keep fully editable as requested) */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Fundamental Milestones</p>
                      
                      {/* Signed contract */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          {selectedEmployee.onboarding.contractSigned ? (
                            <CheckSquare className="w-4 h-4 text-violet-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-800">E-Signature Contract</p>
                            <p className="text-[9px] text-slate-400">Archived to Google Drive</p>
                          </div>
                        </div>
                        {!selectedEmployee.onboarding.contractSigned ? (
                          <label className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer border border-indigo-100">
                            Upload
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleContractUpload(selectedEmployee.id, file);
                              }}
                            />
                          </label>
                        ) : (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">Signed</span>
                        )}
                      </div>

                      {/* Welcome email */}
                      <button
                        onClick={() => toggleOnboarding(selectedEmployee.id, 'welcomeEmailSent')}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          {selectedEmployee.onboarding.welcomeEmailSent ? (
                            <CheckSquare className="w-4 h-4 text-violet-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Automated Welcome Email</p>
                            <p className="text-[9px] text-slate-400">Credentials dispatched to {selectedEmployee.email}</p>
                          </div>
                        </div>
                      </button>

                      {/* Training completed */}
                      <button
                        onClick={() => toggleOnboarding(selectedEmployee.id, 'trainingCompleted')}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-100/50 border border-slate-100 rounded-xl text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          {selectedEmployee.onboarding.trainingCompleted ? (
                            <CheckSquare className="w-4 h-4 text-violet-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Onboarding Core Training</p>
                            <p className="text-[9px] text-slate-400">Collect program feedback upon completion</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Advanced configurable checklist (Legacy tasks) */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Custom Delegated Tasks ({onboardingTasks.filter(t => t.employeeId === selectedEmployee.id).length})</p>
                      
                      {onboardingTasks.filter(t => t.employeeId === selectedEmployee.id).length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-100">
                          No delegated onboarding tasks. Click 'Add Custom Task' to assign/delegate milestones.
                        </p>
                      ) : (
                        onboardingTasks.filter(t => t.employeeId === selectedEmployee.id).map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-violet-50/20 border border-violet-100/50 rounded-xl">
                            <button
                              onClick={() => toggleOnboardingTaskComplete(task.id)}
                              className="flex items-start gap-2.5 text-left flex-1"
                            >
                              {task.completed ? (
                                <CheckSquare className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                              )}
                              <div>
                                <p className={`text-xs font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {task.taskName}
                                </p>
                                <p className="text-[9px] text-slate-400 font-mono">
                                  Assignee: {task.assignedToName} • Due: {task.dueDate}
                                </p>
                              </div>
                            </button>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              task.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {task.completed ? 'Done' : 'Pending'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {detailsTab === 'mentorship' && (
                <div className="space-y-5" id="mentorship-tab">
                  {/* Assign Mentor field */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-violet-600">
                        <UserCheck className="w-4.5 h-4.5" />
                        <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800">Assign Program Mentor</h4>
                      </div>
                      <button 
                        onClick={() => setIsMentorModalOpen(true)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        {selectedEmployee.mentorId ? 'Change Mentor' : 'Assign Mentor'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Pairing this employee with an experienced mentor drives professional alignment and speeds up onboarding feedback iterations.
                    </p>
                    
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Current Mentor</label>
                      {selectedEmployee.mentorName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black text-xs">
                            {selectedEmployee.mentorName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{selectedEmployee.mentorName}</p>
                            <p className="text-[9px] text-slate-400">Assigned Mentor</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-500 italic">No Mentor Assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Mentor Dashboard for current employee */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-rose-500" />
                        Mentorship Dashboard
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      If this employee acts as a Mentor, their assigned mentees are logged below. High potential reviews and onboarding tasks can be monitored.
                    </p>

                    {employees.filter(emp => emp.mentorId === selectedEmployee.id && emp.status !== 'Terminated').length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-medium">
                        Not currently assigned as a mentor for any employees.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {employees.filter(emp => emp.mentorId === selectedEmployee.id && emp.status !== 'Terminated').map(mentee => (
                          <div key={mentee.id} className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{mentee.name}</p>
                              <p className="text-[9px] text-slate-400">{getEmployeeDesignation(mentee, designations)} • {getEmployeeDepartment(mentee, departments)}</p>
                            </div>
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black uppercase font-mono tracking-wider">
                              Mentee
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}



              {detailsTab === 'history' as any && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800">History & Changes</h4>
                  </div>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {empHistory.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-medium relative z-10">
                        No history available for this employee.
                      </div>
                    ) : (
                      empHistory.map(h => {
                        const isAdd = h.changeType === 'CREATE';
                        const isDel = h.changeType === 'DELETE';
                        
                        return (
                          <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                              isAdd ? 'bg-emerald-100 text-emerald-600' : isDel ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Activity className="w-4 h-4" />
                            </div>
                            
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold tracking-wider">{h.fieldLabel}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono mt-1 sm:mt-0">
                                  {new Date(h.changedAt).toLocaleDateString()} {new Date(h.changedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg mb-2 overflow-hidden">
                                {isAdd ? (
                                  <span className="text-xs font-bold text-emerald-600 truncate">{h.newValue}</span>
                                ) : isDel ? (
                                  <span className="text-xs font-bold text-rose-600 line-through truncate">{h.oldValue}</span>
                                ) : (
                                  <>
                                    <span className="text-xs text-slate-500 line-through truncate max-w-[40%]">{h.oldValue || '—'}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="text-xs font-bold text-blue-600 truncate max-w-[40%]">{h.newValue}</span>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-50">
                                <p className="text-[9px] text-slate-400 font-mono">By: {h.changedByName}</p>
                                {h.reason && <p className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[60%]">Reason: {h.reason}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {detailsTab === 'status_history' as any && (
                <div className="space-y-5 animate-fade-in">
                  <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800 border-b border-slate-100 pb-2">Status History</h4>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {(!selectedEmployee.statusHistory || selectedEmployee.statusHistory.length === 0) ? (
                      <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-medium relative z-10">
                        No status history available.
                      </div>
                    ) : (
                      selectedEmployee.statusHistory.map((sh, idx) => (
                        <div key={sh.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                          </div>
                          
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 line-through">{sh.oldStatus}</span>
                                <span className="text-xs font-bold text-slate-800">→</span>
                                <span className="text-xs font-bold text-violet-600">{sh.newStatus}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                {new Date(sh.changedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {sh.reason && (
                              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">{sh.reason}</p>
                            )}
                            <p className="text-[9px] text-slate-400 mt-2 font-mono">By: {sh.changedByName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {detailsTab === 'documents' && (
                <div className="space-y-5" id="documents-tab">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider font-display text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-600" />
                        Employee Documents
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Manage and verify compliance documents for this employee.</p>
                      <button 
                        onClick={() => setShowDocUploadModal(true)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Upload
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {documents?.filter(d => d.employeeId === selectedEmployee.id).length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-medium">
                        No documents uploaded for this employee yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {documents?.filter(d => d.employeeId === selectedEmployee.id).map(doc => (
                          <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between hover:border-violet-300 transition-colors">
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-lg ${doc.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{doc.documentTypeLabel}</p>
                                <p className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{doc.fileName}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'Pending Verification' ? 'bg-amber-100 text-amber-700' : doc.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {doc.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="View Document">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailsTab === 'salary' && selectedEmployee && (
                <div className="space-y-4 animate-fade-in">
                  <EmployeeSalary
                    employee={selectedEmployee}
                    onSave={() => {
                      // Refresh logic
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-300 animate-pulse" />
              <p className="text-xs font-semibold text-slate-400 font-sans">No employee selected</p>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Click on any employee from the directory list on the left to review their timeline, manage configurable onboarding checklists, and assign professional mentorship pairs.
              </p>
            </div>
          )}
        </div>
      </div>




      {/* MODAL: UPDATE STATUS */}
      {showStatusUpdateModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in">
            <h3 className="text-lg font-black text-slate-900 font-display mb-2">Change Status</h3>
            <p className="text-xs text-slate-500 mb-4">Update status for {selectedEmployee.name}</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">New Status</label>
                <select
                  value={newStatusUpdate}
                  onChange={(e) => setNewStatusUpdate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium"
                >
                  <option value="">Select New Status</option>
                  <option value="Active">Active</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Probation">Probation</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Retired">Retired</option>
                  <option value="Deceased">Deceased</option>
                  <option value="Contract Expired">Contract Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              

              {newStatusUpdate === 'On Leave' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leave Start</label>
                    <input type="date" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leave End</label>
                    <input type="date" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leave Type</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="Maternity">Maternity</option>
                      <option value="Paternity">Paternity</option>
                      <option value="Sabbatical">Sabbatical</option>
                      <option value="Study">Study</option>
                      <option value="Medical">Medical</option>
                      <option value="Personal">Personal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Suspended' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Suspend Start</label>
                    <input type="date" value={suspensionStartDate} onChange={e => setSuspensionStartDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Suspend End</label>
                    <input type="date" value={suspensionEndDate} onChange={e => setSuspensionEndDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Probation' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Probation Start</label>
                    <input type="date" value={probationStartDate} onChange={e => setProbationStartDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Probation End</label>
                    <input type="date" value={probationEndDate} onChange={e => setProbationEndDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Resigned' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Resign Date</label>
                    <input type="date" value={resignationDate} onChange={e => setResignationDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Last Working</label>
                    <input type="date" value={lastWorkingDate} onChange={e => setLastWorkingDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              )}
              {newStatusUpdate === 'Terminated' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Termination Date</label>
                  <input type="date" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
              {newStatusUpdate === 'Retired' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Retirement Date</label>
                  <input type="date" value={retirementDate} onChange={e => setRetirementDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
              {newStatusUpdate === 'Deceased' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date of Passing</label>
                  <input type="date" value={dateOfPassing} onChange={e => setDateOfPassing(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}
              {newStatusUpdate === 'Contract Expired' && (
                <div className="mt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Contract End</label>
                  <input type="date" value={contractEndDate} onChange={e => setContractEndDate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Reason / Notes</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-xs font-medium"
                  rows={3}
                  placeholder="Reason for status change..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowStatusUpdateModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button 
                onClick={async () => {
                  if (!newStatusUpdate) return;
                  const validTransitions: any = {
                    'Onboarding': ['Active', 'Probation', 'Terminated'],
                    'Probation': ['Active', 'Terminated'],
                    'Active': ['On Leave', 'Suspended', 'Resigned', 'Retired', 'Terminated', 'Contract Expired'],
                    'On Leave': ['Active', 'Terminated', 'Resigned'],
                    'Suspended': ['Active', 'Terminated'],
                    'Resigned': ['Terminated'],
                    'Retired': [],
                    'Deceased': [],
                    'Contract Expired': [],
                    'Terminated': []
                  };
                  
                  if (selectedEmployee.status && validTransitions[selectedEmployee.status] && !validTransitions[selectedEmployee.status].includes(newStatusUpdate)) {
                    alert(`Cannot change status from ${selectedEmployee.status} to ${newStatusUpdate}. Valid transitions are: ${validTransitions[selectedEmployee.status].join(', ') || 'None'}`);
                    return;
                  }
                  

                  const updatedEmp = { 
                    ...selectedEmployee, 
                    status: newStatusUpdate as any,
                    seatNumber: ['On Leave', 'Suspended', 'Resigned', 'Terminated', 'Retired', 'Deceased', 'Contract Expired'].includes(newStatusUpdate) ? 0 : selectedEmployee.seatNumber,
                    currentStatusSince: new Date().toISOString(),
                    leaveStartDate: newStatusUpdate === 'On Leave' ? leaveStartDate : selectedEmployee.leaveStartDate,
                    leaveEndDate: newStatusUpdate === 'On Leave' ? leaveEndDate : selectedEmployee.leaveEndDate,
                    leaveType: newStatusUpdate === 'On Leave' ? leaveType : selectedEmployee.leaveType,
                    suspensionStartDate: newStatusUpdate === 'Suspended' ? suspensionStartDate : selectedEmployee.suspensionStartDate,
                    suspensionEndDate: newStatusUpdate === 'Suspended' ? suspensionEndDate : selectedEmployee.suspensionEndDate,
                    suspensionReason: newStatusUpdate === 'Suspended' ? statusReason : selectedEmployee.suspensionReason,
                    probationStartDate: newStatusUpdate === 'Probation' ? probationStartDate : selectedEmployee.probationStartDate,
                    probationEndDate: newStatusUpdate === 'Probation' ? probationEndDate : selectedEmployee.probationEndDate,
                    resignationDate: newStatusUpdate === 'Resigned' ? resignationDate : selectedEmployee.resignationDate,
                    lastWorkingDate: newStatusUpdate === 'Resigned' ? lastWorkingDate : selectedEmployee.lastWorkingDate,
                    retirementDate: newStatusUpdate === 'Retired' ? retirementDate : selectedEmployee.retirementDate,
                    terminationDate: newStatusUpdate === 'Terminated' ? terminationDate : selectedEmployee.terminationDate,
                    terminationReason: newStatusUpdate === 'Terminated' ? statusReason : selectedEmployee.terminationReason,

                    statusHistory: [
                      {
                        id: `SH-${Date.now()}`,
                        employeeId: selectedEmployee.id,
                        employeeName: selectedEmployee.name,
                        oldStatus: selectedEmployee.status,
                        newStatus: newStatusUpdate,
                        changedBy: 'Admin',
                        changedByName: 'HR Admin',
                        changedAt: new Date().toISOString(),
                        reason: statusReason,
                        notes: ''
                      },
                      ...(selectedEmployee.statusHistory || [])
                    ]
                  };
                  
                  const updatedEmps = employees.map(emp => emp.id === selectedEmployee.id ? updatedEmp : emp);
                  const diffs = data.generateEmployeeDiff(selectedEmployee, updatedEmp, 'currentUser', 'Current User', 'UPDATE', 'TRANSITION', statusReason);
                  if (diffs.length > 0) {
                    // Use Promise.allSettled so one failure doesn't block the rest.
                    await Promise.allSettled(diffs.map(d => data.addEmployeeHistory(d)));
                  }
                  setEmployees(updatedEmps);
                  setSelectedEmployee(updatedEmp);
                  setShowStatusUpdateModal(false);
                  setNewStatusUpdate('');
                  setStatusReason('');
                }} 
                disabled={!newStatusUpdate} 
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK STATUS UPDATE */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in">
            <h3 className="text-lg font-black text-slate-900 font-display mb-4">Bulk Status Update</h3>
            <p className="text-xs text-slate-500 mb-4">You are about to update the status of {selectedIds.length} employees.</p>
            
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium mb-4"
            >
              <option value="">Select New Status</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Probation">Probation</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
              <option value="Resigned">Resigned</option>
              <option value="Retired">Retired</option>
              <option value="Deceased">Deceased</option>
              <option value="Contract Expired">Contract Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
            
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBulkStatusModal(false)} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button 
                onClick={async () => {
                  if (!bulkStatus) return;
                  let allDiffs: any[] = [];
                  const updatedEmps = employees.map(emp => {
                    if (selectedIds.includes(emp.id)) {
                      const updated = { ...emp, status: bulkStatus as any };
                      const diffs = data.generateEmployeeDiff(emp, updated, 'currentUser', 'Current User', 'BULK_UPDATE', 'MANUAL');
                      allDiffs = [...allDiffs, ...diffs];
                      return updated;
                    }
                    return emp;
                  });
                  if (allDiffs.length > 0) {
                    await Promise.allSettled(allDiffs.map(d => data.addEmployeeHistory(d)));
                  }
                  setEmployees(updatedEmps);
                  setShowBulkStatusModal(false);
                  setSelectedIds([]);
                  setBulkStatus('');
                }} 
                disabled={!bulkStatus} 
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD PROFILE DOCUMENT */}
      {showDocUploadModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-violet-600" />
                Upload Document
              </h3>
              <button onClick={() => { setShowDocUploadModal(false); setUploadFile(null); }} className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleProfileDocUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Document Type</label>
                <select
                  required
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 rounded-xl text-sm font-medium"
                >
                  <option value="CNIC_FRONT">CNIC Front</option>
                  <option value="CNIC_BACK">CNIC Back</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="EDUCATION_CERTIFICATE">Education Certificate</option>
                  <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
                  <option value="MEDICAL_REPORT">Medical Report</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select File</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-violet-300 transition-colors bg-slate-50">
                  <input
                    type="file"
                    required
                    id="profileUpload"
                    className="hidden"
                    onChange={e => e.target.files && setUploadFile(e.target.files[0])}
                  />
                  <label htmlFor="profileUpload" className="cursor-pointer">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-violet-500 mx-auto mb-2">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    {uploadFile ? (
                      <p className="text-xs font-bold text-slate-800">{uploadFile.name}</p>
                    ) : (
                      <p className="text-xs font-bold text-violet-600">Click to browse</p>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowDocUploadModal(false); setUploadFile(null); }} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" disabled={!uploadFile} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN MENTOR */}
      {isMentorModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-violet-600" />
                  Assign Mentor
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">Select a mentor for {selectedEmployee.name}</p>
              </div>
              <button onClick={() => setIsMentorModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="py-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Active Employee</label>
                <select
                  value={selectedEmployee.mentorId || ""}
                  onChange={(e) => handleAssignMentor(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 rounded-xl text-sm font-medium transition-all"
                >
                  <option value="">-- No Mentor Assigned --</option>
                  {employees.filter(emp => emp.id !== selectedEmployee.id && emp.employment.status !== 'Terminated').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({getEmployeeDesignation(emp, designations)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
              <button 
                onClick={() => setIsMentorModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl flex flex-col border border-slate-100 animate-scale-in max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-violet-600" />
                  Add New Employee Profile
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">Enter extensive personal, legal, professional, and educational credentials for the centralized corporate directory.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (2-Column Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 flex-1 overflow-hidden min-h-[50vh]">
              {/* Left Column: Vertical Tabs Navigation */}
              <div className="md:col-span-1 border-r border-slate-100 pr-4 space-y-1 overflow-y-auto max-h-[60vh]">
                {[
                  { label: 'Basic Info', desc: 'Identity & Legal Documents' },
                  { label: 'Contact & Address', desc: 'Phones & Residential info' },
                  { label: 'Emergency Contacts', desc: 'Emergency personnel' },
                  { label: 'Social Profiles', desc: 'LinkedIn & GitHub URLs' },
                  { label: 'Employment Details', desc: 'Grade, Shift, Location & Manager' },
                  { label: 'Education History', desc: 'Degrees & Institutions' },
                  { label: 'Certifications', desc: 'Credentials & Cert Files' },
                  { label: 'Work History', desc: 'Previous Employers & Reference' },
                  { label: 'Salary & Compensation', desc: 'Salary Structure & Components' }
                ].map((tab, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAddModalTab(idx)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-0.5 border ${
                      addModalTab === idx
                        ? 'bg-violet-50 border-violet-200 text-violet-900 font-bold shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-transparent text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                        addModalTab === idx ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      {tab.label}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans font-normal truncate pl-5.5">{tab.desc}</span>
                  </button>
                ))}
              </div>

              {/* Right Column: Active Tab Form Fields */}
              <div className="md:col-span-3 overflow-y-auto max-h-[60vh] pr-2 space-y-5">
                {addModalTab === 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">1. Basic Identity & Legal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eliyah Humail"
                          value={newEmpName}
                          onChange={(e) => setNewEmpName(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Work Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. eliyah@humaileli.com"
                          value={newEmpEmail}
                          onChange={(e) => setNewEmpEmail(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Personal Email</label>
                        <input
                          type="email"
                          placeholder="e.g. eliyah.personal@gmail.com"
                          value={newEmpPersonalEmail}
                          onChange={(e) => setNewEmpPersonalEmail(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Date of Birth</label>
                        <input
                          type="date"
                          value={newEmpDob}
                          onChange={(e) => setNewEmpDob(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Gender</label>
                        <select
                          value={newEmpGender}
                          onChange={(e) => setNewEmpGender(e.target.value as any)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Nationality</label>
                        <input
                          type="text"
                          placeholder="e.g. Pakistani"
                          value={newEmpNationality}
                          onChange={(e) => setNewEmpNationality(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">National ID / CNIC</label>
                        <input
                          type="text"
                          placeholder="e.g. 42101-1234567-1"
                          value={newEmpCnic}
                          onChange={(e) => setNewEmpCnic(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Religion</label>
                        <input
                          type="text"
                          placeholder="e.g. Islam"
                          value={newEmpReligion}
                          onChange={(e) => setNewEmpReligion(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Marital Status</label>
                        <select
                          value={newEmpMaritalStatus}
                          onChange={(e) => setNewEmpMaritalStatus(e.target.value as any)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Blood Group</label>
                        <select
                          value={newEmpBloodGroup}
                          onChange={(e) => setNewEmpBloodGroup(e.target.value as any)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                    </div>

                    {/* Document Uploads Row */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Profile Image & Identity Document Uploads</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Profile Image upload block */}
                        <div className="p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-center space-y-2">
                          <label className="text-xs font-bold text-slate-600 block">Profile Avatar</label>
                          <div className="flex flex-col items-center gap-1.5">
                            {newEmpProfileImage ? (
                              <div className="relative">
                                <img src={newEmpProfileImage} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-violet-500" />
                                <button
                                  type="button"
                                  onClick={() => setNewEmpProfileImage('')}
                                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-violet-50 border border-dashed border-violet-300 flex items-center justify-center text-violet-600">
                                <Plus className="w-5 h-5" />
                              </div>
                            )}
                            <label className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase rounded border border-slate-200 shadow-sm cursor-pointer active:scale-95">
                              {isUploadingDoc['profileImage'] ? 'Uploading...' : 'Choose File'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocUpload('profileImage', file);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* CNIC Front Upload */}
                        <div className="p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-center space-y-2">
                          <label className="text-xs font-bold text-slate-600 block">CNIC Front Image</label>
                          <div className="flex flex-col items-center gap-1.5">
                            {newEmpCnicFrontImage ? (
                              <div className="relative">
                                <img src={newEmpCnicFrontImage} alt="CNIC Front" className="w-16 h-10 rounded object-cover border border-slate-300 shadow-sm" />
                                <button
                                  type="button"
                                  onClick={() => setNewEmpCnicFrontImage('')}
                                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-16 h-10 rounded bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                            <label className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase rounded border border-slate-200 shadow-sm cursor-pointer active:scale-95">
                              {isUploadingDoc['cnicFrontImage'] ? 'Uploading...' : 'Choose File'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocUpload('cnicFrontImage', file);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* CNIC Back Upload */}
                        <div className="p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-center space-y-2">
                          <label className="text-xs font-bold text-slate-600 block">CNIC Back Image</label>
                          <div className="flex flex-col items-center gap-1.5">
                            {newEmpCnicBackImage ? (
                              <div className="relative">
                                <img src={newEmpCnicBackImage} alt="CNIC Back" className="w-16 h-10 rounded object-cover border border-slate-300 shadow-sm" />
                                <button
                                  type="button"
                                  onClick={() => setNewEmpCnicBackImage('')}
                                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-16 h-10 rounded bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                            <label className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase rounded border border-slate-200 shadow-sm cursor-pointer active:scale-95">
                              {isUploadingDoc['cnicBackImage'] ? 'Uploading...' : 'Choose File'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocUpload('cnicBackImage', file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {addModalTab === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">2. Contact Numbers & Residential Addresses</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Work Phone Number</label>
                        <input
                          type="text"
                          placeholder="e.g. +92 300 0000000"
                          value={newEmpPhoneWork}
                          onChange={(e) => setNewEmpPhoneWork(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Personal Phone Number</label>
                        <input
                          type="text"
                          placeholder="e.g. +92 321 9876543"
                          value={newEmpPhonePersonal}
                          onChange={(e) => setNewEmpPhonePersonal(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 font-sans">Current Residential Address</label>
                      <textarea
                        rows={2}
                        placeholder="Complete current residential flat, street & area details..."
                        value={newEmpCurrentAddress}
                        onChange={(e) => setNewEmpCurrentAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 font-sans">Permanent Address</label>
                        <button
                          type="button"
                          onClick={() => setNewEmpPermanentAddress(newEmpCurrentAddress)}
                          className="text-[9px] font-bold text-violet-600 hover:underline uppercase"
                        >
                          Copy Current Address
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Complete permanent legal address details..."
                        value={newEmpPermanentAddress}
                        onChange={(e) => setNewEmpPermanentAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">City</label>
                        <input
                          type="text"
                          placeholder="e.g. Karachi"
                          value={newEmpCity}
                          onChange={(e) => setNewEmpCity(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">State / Province</label>
                        <input
                          type="text"
                          placeholder="e.g. Sindh"
                          value={newEmpState}
                          onChange={(e) => setNewEmpState(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Country</label>
                        <input
                          type="text"
                          placeholder="e.g. Pakistan"
                          value={newEmpCountry}
                          onChange={(e) => setNewEmpCountry(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Postal / ZIP Code</label>
                        <input
                          type="text"
                          placeholder="e.g. 74200"
                          value={newEmpPostalCode}
                          onChange={(e) => setNewEmpPostalCode(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addModalTab === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">3. Emergency Kin Contacts</h4>
                    <div className="p-4 bg-rose-50/30 border border-rose-100 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        Next of Kin Registration
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        In case of central workspace or medical emergencies, these details are used immediately. Ensure numbers are reachable.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 font-sans">Kin Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Sarah Humail"
                            value={newEmpEmergencyName}
                            onChange={(e) => setNewEmpEmergencyName(e.target.value)}
                            className="w-full h-10 px-3.5 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 rounded-xl text-xs font-medium text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 font-sans">Kin Phone Number</label>
                          <input
                            type="text"
                            placeholder="e.g. +92 301 2223334"
                            value={newEmpEmergencyPhone}
                            onChange={(e) => setNewEmpEmergencyPhone(e.target.value)}
                            className="w-full h-10 px-3.5 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 rounded-xl text-xs font-medium text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 font-sans">Relationship</label>
                          <input
                            type="text"
                            placeholder="e.g. Spouse / Brother"
                            value={newEmpEmergencyRelationship}
                            onChange={(e) => setNewEmpEmergencyRelationship(e.target.value)}
                            className="w-full h-10 px-3.5 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 rounded-xl text-xs font-medium text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {addModalTab === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">4. Corporate & Professional Social Portfolios</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://linkedin.com/in/eliyah-humail"
                          value={newEmpLinkedin}
                          onChange={(e) => setNewEmpLinkedin(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">GitHub Profile URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://github.com/eliyah-humail"
                          value={newEmpGithub}
                          onChange={(e) => setNewEmpGithub(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Other Portfolios / Social Profiles</label>
                        <input
                          type="text"
                          placeholder="e.g. Portfolio: https://eliyah.dev, Behance: eliyah-design"
                          value={newEmpOtherSocials}
                          onChange={(e) => setNewEmpOtherSocials(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                 {addModalTab === 4 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">5. Employment & Workplace Configurations</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Role / Designation *</label>
                        <select
                          value={newEmpDesignationId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewEmpDesignationId(val);
                            const found = designations.find(d => d.id === val);
                            setNewEmpRole(found ? found.name : '');
                          }}
                          required
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Designation</option>
                          {designations.filter(d => d.isActive).map(dsg => (
                            <option key={dsg.id} value={dsg.id}>
                              {dsg.name} ({dsg.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Department *</label>
                        <select
                          value={newEmpDepartmentId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewEmpDepartmentId(val);
                            const found = departments.find(d => d.id === val);
                            setNewEmpDept(found ? found.name : '');
                          }}
                          required
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Department</option>
                          {departments.filter(d => d.isActive).map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {newEmpDesignationId && newEmpDepartmentId && (() => {
                      const dsg = designations.find(d => d.id === newEmpDesignationId);
                      if (dsg && dsg.departmentId && dsg.departmentId !== newEmpDepartmentId) {
                        const correctDept = departments.find(d => d.id === dsg.departmentId);
                        return (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-amber-800">Designation Warning</p>
                              <p className="text-[10px] text-amber-700 mt-0.5">
                                The role "{dsg.name}" is typically assigned to the <strong>{correctDept?.name || 'correct'}</strong> department, which differs from your selection. You may still proceed with this assignment.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Employment Type</label>
                        <select
                          value={newEmpEmploymentType}
                          onChange={(e) => setNewEmpEmploymentType(e.target.value as any)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Type</option>
                          <option value="Permanent">Permanent</option>
                          <option value="Contract">Contract</option>
                          <option value="Intern">Intern</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Consultant">Consultant</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Corporate Grade</label>
                        <input
                          type="text"
                          placeholder="e.g. Grade-16 / L3"
                          value={newEmpGrade}
                          onChange={(e) => setNewEmpGrade(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Job Category</label>
                        <input
                          type="text"
                          placeholder="e.g. Technical Staff"
                          value={newEmpJobCategory}
                          onChange={(e) => setNewEmpJobCategory(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Joining Date *</label>
                        <input
                          type="date"
                          required
                          value={newEmpJoiningDate}
                          onChange={(e) => setNewEmpJoiningDate(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Base Monthly Salary ($) *</label>
                        <input
                          type="number"
                          required
                          value={newEmpSalary}
                          onChange={(e) => setNewEmpSalary(Number(e.target.value))}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Probation Period Configuration */}
                    <div className="p-3 bg-violet-50/20 border border-violet-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-800">Probation Term Clause</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newEmpIsProbation}
                            onChange={(e) => setNewEmpIsProbation(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                      </div>

                      {newEmpIsProbation && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Probation End Date</label>
                            <input
                              type="date"
                              value={newEmpProbationEndDate}
                              onChange={(e) => setNewEmpProbationEndDate(e.target.value)}
                              className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Auto Confirmation Date</label>
                            <input
                              type="date"
                              value={newEmpConfirmationDate}
                              onChange={(e) => setNewEmpConfirmationDate(e.target.value)}
                              className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Work Location Mode</label>
                        <select
                          value={newEmpWorkLocation}
                          onChange={(e) => setNewEmpWorkLocation(e.target.value as any)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Mode</option>
                          <option value="Office">Office-based</option>
                          <option value="Remote">Remote work</option>
                          <option value="Hybrid">Hybrid schedule</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Shift Assignment</label>
                        <select
                          value={newEmpShift}
                          onChange={(e) => setNewEmpShift(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">Select Shift</option>
                          <option value="Morning">Morning Shift</option>
                          <option value="Evening">Evening Shift</option>
                          <option value="Night">Night Shift</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Office Seat assignment</label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          placeholder="Auto"
                          value={newEmpSeat === 0 ? '' : newEmpSeat}
                          onChange={(e) => setNewEmpSeat(Number(e.target.value))}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Reporting Manager</label>
                        <select
                          value={newEmpReportingManagerId}
                          onChange={(e) => setNewEmpReportingManagerId(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">-- No Manager Assigned --</option>
                          {employees.filter(emp => emp.employment.status !== 'Terminated').map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({getEmployeeDesignation(emp, designations)})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">HR Business Partner (HRBP)</label>
                        <select
                          value={newEmpHrBpId}
                          onChange={(e) => setNewEmpHrBpId(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-700"
                        >
                          <option value="">-- No HRBP Assigned --</option>
                          {employees.filter(emp => getEmployeeDepartment(emp, departments) === 'Human Resources' && emp.status !== 'Terminated').map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 font-sans">Cost Center</label>
                        <input
                          type="text"
                          placeholder="e.g. PK-KHI-ENG"
                          value={newEmpCostCenter}
                          onChange={(e) => setNewEmpCostCenter(e.target.value)}
                          className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 font-sans">Payroll Group Band</label>
                      <input
                        type="text"
                        placeholder="e.g. Executive Staff Band B"
                        value={newEmpPayrollGroup}
                        onChange={(e) => setNewEmpPayrollGroup(e.target.value)}
                        className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        Biometric Punch Code
                        <span className="text-slate-400 font-normal ml-1">(optional)</span>
                      </label>
                      <div className="relative">
                        <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={newEmpPunchCode}
                          onChange={(e) => setNewEmpPunchCode(e.target.value)}
                          placeholder="e.g., 1001, EMP-001, or fingerprint ID"
                          className="w-full pl-10 pr-3.5 h-10 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        This code must match the punch code configured on the biometric device. 
                        If left empty, employee ID will be used as punch code.
                      </p>
                    </div>
                  </div>
                )}

                {addModalTab === 5 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">6. Academic Education History</h4>
                    
                    {/* Add Education sub-form */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Record Academic Degree</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Degree Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Bachelors of Computer Science"
                            value={eduDegree}
                            onChange={(e) => setEduDegree(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">School / Institution</label>
                          <input
                            type="text"
                            placeholder="e.g. FAST NUCES Karachi"
                            value={eduInstitution}
                            onChange={(e) => setEduInstitution(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Field of Study</label>
                          <input
                            type="text"
                            placeholder="e.g. Software Engineering"
                            value={eduFieldOfStudy}
                            onChange={(e) => setEduFieldOfStudy(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Graduation Year</label>
                          <input
                            type="text"
                            placeholder="e.g. 2024"
                            value={eduYearOfGraduation}
                            onChange={(e) => setEduYearOfGraduation(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Grade / CGPA</label>
                          <input
                            type="text"
                            placeholder="e.g. 3.4 / 4.0"
                            value={eduGrade}
                            onChange={(e) => setEduGrade(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                          <input
                            type="date"
                            value={eduStartDate}
                            onChange={(e) => setEduStartDate(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                          <input
                            type="date"
                            value={eduEndDate}
                            onChange={(e) => setEduEndDate(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eduIsHighest}
                            onChange={(e) => setEduIsHighest(e.target.checked)}
                            className="rounded text-violet-600 focus:ring-violet-500"
                          />
                          Is Highest Level of Education
                        </label>
                        <button
                          type="button"
                          onClick={handleAddEducation}
                          className="px-4 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold uppercase"
                        >
                          Add to list
                        </button>
                      </div>
                    </div>

                    {/* Added Education records listing table */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Added Academic Records ({newEmpEducationList.length})</p>
                      {newEmpEducationList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No education records added yet.</p>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="px-3 py-2">Degree / Institute</th>
                                <th className="px-3 py-2">Year / CGPA</th>
                                <th className="px-3 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                              {newEmpEducationList.map((edu) => (
                                <tr key={edu.id}>
                                  <td className="px-3 py-2">
                                    <p className="font-bold text-slate-800">{edu.degree}</p>
                                    <p className="text-[10px] text-slate-400">{edu.institution} {edu.fieldOfStudy ? `(${edu.fieldOfStudy})` : ''}</p>
                                  </td>
                                  <td className="px-3 py-2 font-mono">
                                    <p>{edu.yearOfGraduation}</p>
                                    <p className="text-[10px] text-violet-600 font-bold">{edu.grade || '—'} {edu.isHighest ? '[Highest]' : ''}</p>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setNewEmpEducationList(prev => prev.filter(p => p.id !== edu.id))}
                                      className="text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {addModalTab === 6 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">7. Certifications & Licensure credentials</h4>
                    
                    {/* Add Certification sub-form */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Record Certification Details</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Certification Name</label>
                          <input
                            type="text"
                            placeholder="e.g. AWS Certified Solutions Architect"
                            value={certName}
                            onChange={(e) => setCertName(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Issuing Organization</label>
                          <input
                            type="text"
                            placeholder="e.g. Amazon Web Services (AWS)"
                            value={certIssuer}
                            onChange={(e) => setCertIssuer(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Credential ID</label>
                          <input
                            type="text"
                            placeholder="e.g. AWS-SEC-98213"
                            value={certCredentialId}
                            onChange={(e) => setCertCredentialId(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Date</label>
                          <input
                            type="date"
                            value={certIssueDate}
                            onChange={(e) => setCertIssueDate(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                          <input
                            type="date"
                            value={certExpiryDate}
                            onChange={(e) => setCertExpiryDate(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Certificate File Upload inside Modal */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Certificate PDF/Image</span>
                          <label className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded cursor-pointer active:scale-95 shadow-sm">
                            {isUploadingDoc['certFile'] ? 'Uploading...' : certFileUrl ? 'Uploaded ✓' : 'Upload document'}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocUpload('certFile', file);
                              }}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCertification}
                          className="px-4 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold uppercase"
                        >
                          Add to list
                        </button>
                      </div>
                    </div>

                    {/* Added Certifications listing */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Added Certifications ({newEmpCertificationsList.length})</p>
                      {newEmpCertificationsList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No certifications added yet.</p>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="px-3 py-2">Credential</th>
                                <th className="px-3 py-2">Issuer / Issue Date</th>
                                <th className="px-3 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                              {newEmpCertificationsList.map((cert) => (
                                <tr key={cert.id}>
                                  <td className="px-3 py-2">
                                    <p className="font-bold text-slate-800">{cert.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400">ID: {cert.credentialId || '—'}</p>
                                  </td>
                                  <td className="px-3 py-2">
                                    <p>{cert.issuingOrganization}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">Issued: {cert.issueDate}</p>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setNewEmpCertificationsList(prev => prev.filter(p => p.id !== cert.id))}
                                      className="text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {addModalTab === 7 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">8. Previous Work History & Reference</h4>
                    
                    {/* Add Previous Employer sub-form */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Record Previous Employment</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Systems Limited"
                            value={prevCompany}
                            onChange={(e) => setPrevCompany(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Previous Designation / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Software Engineer"
                            value={prevTitle}
                            onChange={(e) => setPrevTitle(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                          <input
                            type="date"
                            value={prevStartDate}
                            onChange={(e) => setPrevStartDate(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                          <input
                            type="date"
                            value={prevEndDate}
                            onChange={(e) => setPrevEndDate(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Reference Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe (Manager)"
                            value={prevContactPerson}
                            onChange={(e) => setPrevContactPerson(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</label>
                          <input
                            type="text"
                            placeholder="e.g. +92 300 9998887"
                            value={prevContactPhone}
                            onChange={(e) => setPrevContactPhone(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Leaving</label>
                        <input
                          type="text"
                          placeholder="e.g. Better professional growth and research alignment."
                          value={prevReason}
                          onChange={(e) => setPrevReason(e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddPreviousEmployer}
                          className="px-4 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold uppercase"
                        >
                          Add Employer
                        </button>
                      </div>
                    </div>

                    {/* Added Employers List */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Added Work Experience ({newEmpPreviousEmployersList.length})</p>
                      {newEmpPreviousEmployersList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No previous employer records added yet.</p>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="px-3 py-2">Company / Title</th>
                                <th className="px-3 py-2">Timeline</th>
                                <th className="px-3 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                              {newEmpPreviousEmployersList.map((emp) => (
                                <tr key={emp.id}>
                                  <td className="px-3 py-2">
                                    <p className="font-bold text-slate-800">{emp.companyName}</p>
                                    <p className="text-[10px] text-slate-400">{emp.jobTitle}</p>
                                  </td>
                                  <td className="px-3 py-2 font-mono text-slate-500">
                                    {emp.startDate} to {emp.endDate || 'Present'}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setNewEmpPreviousEmployersList(prev => prev.filter(p => p.id !== emp.id))}
                                      className="text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {addModalTab === 8 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">9. Salary & Compensation Structure</h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <EmployeeSalary
                        employee={selectedEmployee || { id: `TEMP-${Date.now()}`, name: newEmpName || 'New Employee', role: newEmpRole || 'Staff', department: newEmpDept || 'General', status: 'Active' } as any}
                        onSave={() => {
                          // In creation mode, the save is handled when the full employee is created
                        }}
                        isReadOnly={false}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic px-2">
                      Note: Salary structure will be linked to this employee once the record is created.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Navigation */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={addModalTab === 0}
                  onClick={() => setAddModalTab(prev => Math.max(0, prev - 1))}
                  className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Previous Tab
                </button>
                {addModalTab < 8 ? (
                  <button
                    type="button"
                    onClick={() => setAddModalTab(prev => Math.min(8, prev + 1))}
                    className="px-4 h-10 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    Next Tab
                  </button>
                ) : null}
              </div>

              {/* Submit trigger button (Visible on all tabs to allow rapid submittal if details are complete) */}
              <button
                type="button"
                onClick={handleAddEmployee}
                className="px-6 h-11 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/15"
              >
                Create Employee Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRAINING FEEDBACK */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-violet-900 font-sans flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-600" />
                Collect Training Satisfaction Feedback
              </h3>
              <button onClick={() => setShowFeedbackModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Training for <span className="font-semibold">{showFeedbackModal.name}</span> is completed! To finalize onboarding, record their evaluation of the training program and mentor.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Trainer / Program Mentor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={feedbackTrainer}
                  onChange={(e) => setFeedbackTrainer(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Trainer Satisfaction Rating (1-5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="text-amber-400 focus:outline-none"
                    >
                      <Star className={`w-6 h-6 ${feedbackRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-sans">Detailed Program Comments / Feedback</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. The design onboarding was extremely interactive and standard UI guidelines were well explained..."
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/15 flex items-center justify-center gap-2"
              >
                Submit Feedback and Complete Onboarding
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineNode({
  title,
  date,
  desc,
  stage
}: {
  key?: string;
  title: string;
  date: string;
  desc?: string;
  stage: 'Recruitment' | 'Onboarding' | 'Performance' | 'Promotion' | 'Exit';
}) {
  const badgeColor = 
    stage === 'Recruitment' ? 'bg-amber-100 text-amber-800' :
    stage === 'Onboarding' ? 'bg-violet-100 text-violet-800' :
    stage === 'Performance' ? 'bg-indigo-100 text-indigo-800' :
    stage === 'Promotion' ? 'bg-emerald-100 text-emerald-800' :
    'bg-rose-100 text-rose-800';

  return (
    <div className="relative group/node">
      {/* Node Bullet */}
      <span className="absolute -left-8 top-1 flex items-center justify-center w-4 h-4 bg-white border-2 border-violet-600 rounded-full group-hover/node:scale-125 transition-transform" />
      
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h5 className="text-xs font-bold text-slate-800 leading-tight">{title}</h5>
          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider font-mono ${badgeColor}`}>
            {stage}
          </span>
        </div>
        <span className="block text-[9px] text-slate-400 font-semibold font-mono">{date}</span>
        {desc && <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}
