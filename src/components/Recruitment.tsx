import { useData } from '../contexts/DataContext';
import { logger } from '../lib/logger';
import { getAuthHeaders } from '../lib/auth';
import { getOnboardingTasks, saveOnboardingTasks } from '../lib/storage';
import { useState, useMemo, useEffect, DragEvent, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import JobDescriptions from './JobDescriptions';
import RecruitmentAnalyticsDashboard from './RecruitmentAnalyticsDashboard';
import JDMatching from './JDMatching';
import StageTemplates from './StageTemplates';
import InterviewPanels from './InterviewPanels';
import ScorecardsList from './ScorecardsList';
import { HireCandidateModal } from './HireCandidateModal';
import { Candidate, AppSettings, JobDescription, Employee, LegacyOnboardingTask, OnboardingTemplate, JDResumeMatch, StageTemplate, InterviewPanel, EvaluationScorecard, User, Department, Designation } from '../types';
import { calculateMatch } from '../utils/matchingAlgorithm';
import { getNextId } from '../lib/idHelper';
import { getInitials } from '../utils/safeText';
import { SCREENING_QUESTIONS } from '../lib/mockData';
import { Upload, FileText, CheckCircle, Search, Sliders, AlertCircle, PhoneCall, MessageCircle, Star, Sparkles, Filter, X, Play, RefreshCw, FolderOpen, ArrowRight, ArrowLeft, Video, Send, UserPlus } from 'lucide-react';

interface RecruitmentProps {
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
  settings: AppSettings;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  onboardingTemplates?: OnboardingTemplate[];
  jobDescriptions?: JobDescription[];
  setJobDescriptions?: (jds: JobDescription[]) => void;
  user: User | null;
  departments: Department[];
  designations: Designation[];
}

export default function Recruitment({
  candidates,
  setCandidates,
  settings,
  employees,
  setEmployees,
  onboardingTemplates,
  jobDescriptions = [],
  setJobDescriptions,
  user,
  departments,
  designations
}: RecruitmentProps) {
  const data = useData();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'jds' | 'matching' | 'stage_templates' | 'interview_panels' | 'scorecards' | 'analytics'>('pipeline');
  
  const canAccess = (tab: string) => {
    const roles = ["HR", "Admin"];
    return roles.includes(user?.role || "Employee");
  };
  const [hireCandidate, setHireCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minExpYears, setMinExpYears] = useState(settings.recruitmentRules?.minExperienceYears ?? 3);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>([]);
  const [interviewPanels, setInterviewPanels] = useState<InterviewPanel[]>([]);
  const [scorecards, setScorecards] = useState<EvaluationScorecard[]>([]);
  const [jdMatches, setJdMatches] = useState<JDResumeMatch[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const [stages, panels, scores, matches] = await Promise.all([
        data.getStageTemplates(),
        data.getInterviewPanels(),
        data.getScorecards(),
        data.getJDMatches()
      ]);
      setStageTemplates(stages);
      setInterviewPanels(panels);
      setScorecards(scores);
      setJdMatches(matches);
    }
    loadData();
  }, [data]);

  const handleSetStageTemplates = async (newTemplates: StageTemplate[]) => {
    await data.saveStageTemplates(newTemplates);
    setStageTemplates(newTemplates);
  };
  
  const handleSetInterviewPanels = async (newPanels: InterviewPanel[]) => {
    await data.saveInterviewPanels(newPanels);
    setInterviewPanels(newPanels);
  };
  
  const handleSetScorecards = async (newScorecards: EvaluationScorecard[]) => {
    await data.saveScorecards(newScorecards);
    setScorecards(newScorecards);
  };

  
  const activeJd = useMemo(() => {
    return jobDescriptions.find(j => j.id === selectedJdId) || null;
  }, [selectedJdId, jobDescriptions]);

  const [activeScreeningTab, setActiveScreeningTab] = useState<'chatbot' | 'video' | 'voice' | 'scorecard'>('chatbot');

  const persistCandidates = async (nextCandidates: Candidate[]) => {
    setCandidates(nextCandidates);
    try {
      await data.saveCandidates(nextCandidates);
    } catch (error) {
      logger.error('Failed to persist candidates:', error);
    }
  };

  const persistEmployees = async (nextEmployees: Employee[]) => {
    setEmployees(nextEmployees);
    try {
      await data.saveEmployees(nextEmployees);
    } catch (error) {
      logger.error('Failed to persist employees:', error);
    }
  };
  
  // Chatbot State
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; content: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [isEvaluatingChat, setIsEvaluatingChat] = useState(false);
  
  // Video Response State
  const [videoResponseFile, setVideoResponseFile] = useState<string | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState("Not Uploaded");
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isEvaluatingVideo, setIsEvaluatingVideo] = useState(false);

  // Sync state if settings change (e.g. from Company Policies page)
  useEffect(() => {
    if (settings.recruitmentRules) {
      setMinExpYears(settings.recruitmentRules.minExperienceYears ?? 3);
    }
  }, [settings.recruitmentRules]);

  // Reset screening states when selected candidate changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput("");
    setIsChatTyping(false);
    setVideoResponseFile(null);
    setVideoUploadProgress(0);
    setVideoStatus("Not Uploaded");
    setIsPlayingVideo(false);
    setActiveScreeningTab('chatbot');
  }, [selectedCandidateId]);

  // Drag & Drop / Upload Simulation State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; status: string }[]>([]);
  const [isParsingPipeline, setIsParsingPipeline] = useState(false);

  // Drag Candidate card state
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);

  const [targetSkills, setTargetSkills] = useState<{ name: string; required: boolean }[]>([
    { name: "Recruiting", required: true },
    { name: "Payroll", required: true },
    { name: "Labor Law", required: true },
    { name: "Excel", required: false },
    { name: "Compliance", required: false },
    { name: "Sourcing", required: false },
    { name: "Onboarding", required: false },
    { name: "Talent Acquisition", required: false },
  ]);

  const [isScreeningCallActive, setIsScreeningCallActive] = useState(false);

  // Onboarding Conversion Modal States
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [candidateToConvert, setCandidateToConvert] = useState<Candidate | null>(null);

  // Toggle Target Skills
  const toggleSkillRequirement = (skillName: string) => {
    setTargetSkills(targetSkills.map(s => 
      s.name === skillName ? { ...s, required: !s.required } : s
    ));
  };

  // Drag & Drop File Upload
  const handleFileDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) return;
    simulateUpload(files.map(f => f.name));
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = (e.target.files ? Array.from(e.target.files) : []) as File[];
    if (files.length === 0) return;
    simulateUpload(files.map(f => f.name));
  };

  // Simulate file upload progress
  const simulateUpload = (filenames: string[]) => {
    const newUploads = filenames.map(name => ({ name, progress: 0, status: "Uploading..." }));
    setUploadingFiles(newUploads);

    filenames.forEach((name, idx) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 25;
        setUploadingFiles(prev => prev.map((item, i) => 
          i === idx ? { ...item, progress: currentProgress, status: currentProgress >= 100 ? "Uploaded" : "Uploading..." } : item
        ));

        if (currentProgress >= 100) {
          clearInterval(interval);
          if (idx === filenames.length - 1) {
            setTimeout(() => {
              handleRunParserPipeline(filenames);
            }, 600);
          }
        }
      }, 150);
    });
  };

  // Bulk parser simulation
  const handleRunParserPipeline = (filenames: string[]) => {
    setIsParsingPipeline(true);
    setTimeout(() => {
      const mockParsedCandidates: Candidate[] = filenames.map((file, i) => {
        const cleanName = file.replace(/(_resume|_cv|\.pdf|\.docx)/gi, '').replace(/[_-]/g, ' ');
        const formattedName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        const skillsPool = ["Recruiting", "Payroll", "Compliance", "Labor Law", "Excel", "Talent Acquisition", "Onboarding", "Conflict Resolution"];
        const numSkills = 3 + Math.floor(Math.random() * 3);
        const assignedSkills: string[] = [];
        for (let s = 0; s < numSkills; s++) {
          const sName = skillsPool[Math.floor(Math.random() * skillsPool.length)];
          if (!assignedSkills.includes(sName)) assignedSkills.push(sName);
        }

        const exp = 2 + Math.floor(Math.random() * 6); // 2-7 years

        return {
          id: `CAN-P${Math.floor(100 + Math.random() * 900)}`,
          name: formattedName || "New Parsed Candidate",
          email: `${formattedName.toLowerCase().replace(/\s/g, '.')}@example.com`,
          phone: `+92 300 ${Math.floor(1000000 + Math.random() * 9000000)}`,
          skills: assignedSkills,
          experienceYears: exp,
          resumeFileName: file,
          status: 'Parsed'
        };
      });

      let currentMatches = [...jdMatches];
      
      const processedCandidates = mockParsedCandidates.map(cand => {
        if (activeJd) {
          const matchResult = calculateMatch(activeJd, cand);
          currentMatches.push(matchResult);
          
          const threshold = activeJd.matchingConfig?.autoShortlist ? (activeJd.matchingConfig?.strongMatchThreshold || 80) : 1000;
          if (matchResult.overallScore >= threshold) {
             return { ...cand, status: 'Shortlisted' } as Candidate;
          }
        }
        return cand;
      });

      const updated = [...processedCandidates, ...candidates];
      void persistCandidates(updated);
      
      if (activeJd) {
         setJdMatches(currentMatches);
         data.saveJDMatches(currentMatches);
      }

      mockParsedCandidates.forEach(cand => {
        data.addSheetLog("HumailEli_Recruitment_Parser", "SYNC", {
          name: cand.name,
          email: cand.email,
          skills: cand.skills.join(", "),
          experience: `${cand.experienceYears} Years`,
          status: cand.status
        });
      });

      setUploadingFiles([]);
      setIsParsingPipeline(false);
      alert(`Bulk Resume Parser extracted ${filenames.length} files. Key metadata populated to New stage!`);
    }, 1000);
  };

  // Match shortlisting filter criteria
  const handleAutoShortlist = () => {
    let shortlistedCount = 0;
    const requiredSkillNames = targetSkills.filter(s => s.required).map(s => s.name);

    const updated = candidates.map(cand => {
      if (cand.status === 'Applied' || cand.status === 'Parsed') {
        
        if (activeJd) {
          let totalWeight = 0;
          let earnedWeight = 0;
          
          activeJd.requirements.forEach(req => {
            totalWeight += req.weight;
            if (req.category === 'Skill') {
              if (cand.skills.some(s => s.toLowerCase().includes(req.name.toLowerCase()))) {
                earnedWeight += req.weight;
              }
            } else if (req.category === 'Experience') {
              if (cand.experienceYears >= (req.minValue || 0)) {
                earnedWeight += req.weight;
              }
            }
          });
          
          let newScore = cand.matchScore;
          if (totalWeight > 0) {
            newScore = Math.round((earnedWeight / totalWeight) * 100);
          }
          
          // Require at least 50% match to automatically shortlist based on JD
          if (newScore >= 50) {
            shortlistedCount++;
            return { ...cand, status: 'Shortlisted', matchScore: newScore } as Candidate;
          }
          return { ...cand, matchScore: newScore }; // Keep updated match score
        } else {
          // Fallback old logic
          const hasMinExp = cand.experienceYears >= minExpYears;
          const hasSkills = requiredSkillNames.length === 0 || 
                            cand.skills.some(skill => requiredSkillNames.includes(skill));

          if (hasMinExp && hasSkills) {
            shortlistedCount++;
            return { ...cand, status: 'Shortlisted' } as Candidate;
          }
        }
      }
      return cand;
    });

    void persistCandidates(updated);
    if (activeJd) {
        alert(`Shortlist run complete! ${shortlistedCount} candidates shortlisted based on the active Job Description "${activeJd.title}".`);
    } else {
        alert(`Shortlist run complete! Extracted experience and essential skills targets matched. Qualified candidates moved to Shortlisted.`);
    }
  };

  // Chatbot screening flow helpers
  const startChatScreening = () => {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate) return;

    const initialMsg = {
      sender: 'ai' as const,
      content: activeJd 
        ? `Hello ${candidate.name}! I am Eli, your AI Recruitment Specialist. I'll be conducting your screening for the ${activeJd.title} role in ${activeJd.department}. Our first question from our structured evaluation: ${activeJd.evaluationDimensions[0]?.questions[0]?.question || 'Can you tell me about your relevant experience?'}`
        : `Hello ${candidate.name}! I am Eli, your AI Recruitment Specialist here at Humail Eli. I'm excited to guide you through this interactive screening chat for the position of ${candidate.skills[0] || 'Specialist'}. To start off, could you tell me why you're interested in joining our team, and how your previous ${candidate.experienceYears} years of experience align with this role?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([initialMsg]);
  };

  const handleSendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!chatInput.trim() || !candidate) return;

    const userMsg = {
      sender: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatTyping(true);

    try {
      // Attempt live Express server connection
      const response = await fetch("/api/chat-screen", {
        method: "POST",
        headers: getAuthHeaders('json'),
        body: JSON.stringify({
          messages: updatedMessages,
          candidateName: candidate.name,
          candidateRole: candidate.skills[0] || "Specialist",
          candidateExperience: candidate.experienceYears,
          apiKey: settings.ai.apiKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg = {
          sender: 'ai' as const,
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, aiMsg]);
      } else {
        // Fallback mock questionnaire
        throw new Error("Server not configured or offline");
      }
    } catch (err) {
      // Mock conversation questions sequential fallback
      setTimeout(() => {
        const questionPool = [
          `That is very interesting! Can you elaborate on a challenging project you successfully delivered? What specific skills did you rely on?`,
          `Great. At Humail Eli, team collaboration and cultural compliance are extremely important to us. How do you handle conflicts in remote team settings?`,
          `Understood. Finally, what are your salary and career growth expectations for this role over the next 2 years?`,
          `Thank you! I have collected your responses. You can now proceed to evaluate your transcript and generate your screener scorecard.`
        ];
        
        // Count user messages to select next question
        const userMsgCount = updatedMessages.filter(m => m.sender === 'user').length;
        const replyText = questionPool[Math.min(userMsgCount - 1, questionPool.length - 1)];

        const aiMsg = {
          sender: 'ai' as const,
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }, 1200);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleEvaluateChatTranscript = async () => {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate || chatMessages.length < 3) return;

    setIsEvaluatingChat(true);
    const fullTranscript = chatMessages.map(m => `${m.sender.toUpperCase()}: ${m.content}`).join("\n\n");

    try {
      const response = await fetch("/api/evaluate-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          candidateName: candidate.name,
          candidateRole: candidate.skills[0] || "Specialist",
          apiKey: settings.ai.apiKey
        })
      });

      let score = 82;
      let summary = "Strong responses focusing on development lifecycle. Articulated structural variables and conflict resolution guidelines perfectly.";

      if (response.ok) {
        const data = await response.json();
        score = data.score ?? 82;
        summary = data.summary ?? summary;
      } else {
        // Mock fallback evaluate score
        score = 75 + Math.floor(Math.random() * 20); // 75-95
      }

      const updatedCandidates = candidates.map(c => {
        if (c.id === candidate.id) {
          const chatbotScore = score;
          const voiceScore = c.screeningTotalScore ?? 0;
          const videoScore = c.videoScore ?? 0;
          
          let count = 1;
          let sum = chatbotScore;
          if (voiceScore > 0) { count++; sum += voiceScore; }
          if (videoScore > 0) { count++; sum += videoScore; }
          const combinedScore = Math.round(sum / count);

          return {
            ...c,
            chatbotScore,
            chatbotTranscript: fullTranscript,
            combinedScore
          };
        }
        return c;
      });

      void persistCandidates(updatedCandidates);
      alert(`AI Chatbot evaluation complete! Screener Score: ${score}/100. ${summary}`);
    } catch (err) {
      logger.error(err);
    } finally {
      setIsEvaluatingChat(false);
    }
  };

  // Video Upload screening
  const handleVideoResponseUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    setVideoResponseFile(file.name);
    setVideoStatus("Uploading...");
    
    // Simulate high-fidelity visual progress bars
    let progress = 0;
    const interval = setInterval(async () => {
      progress += 20;
      setVideoUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setVideoStatus("Uploaded");
        isEvaluatingVideo && setIsEvaluatingVideo(true);

        try {
          // Read video as base64 to send to API
          const base64Video = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Call evaluate-video
          const res = await fetch("/api/evaluate-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: base64Video,
              candidateName: candidate.name,
              candidateRole: candidate.skills[0] || "Specialist",
              apiKey: settings.ai?.apiKey
            })
          });

          let score = 85;
          let summary = "Excellent verbal structures and eye contact. Communicates skills effectively.";

          if (res.ok) {
            const data = await res.json();
            if (!data.success) {
              alert("AI Video analysis failed: " + data.error);
              return;
            }
            score = data.score ?? 85;
            summary = data.summary ?? summary;
          } else {
             const errData = await res.json().catch(() => ({}));
             alert("AI Video analysis failed: " + (errData.error || res.statusText));
             return;
          }

          const updatedCandidates = candidates.map(c => {
            if (c.id === candidate.id) {
              const chatbotScore = c.chatbotScore ?? 0;
              const voiceScore = c.screeningTotalScore ?? 0;
              const videoScore = score;
              
              let count = 1;
              let sum = videoScore;
              if (chatbotScore > 0) { count++; sum += chatbotScore; }
              if (voiceScore > 0) { count++; sum += voiceScore; }
              const combinedScore = Math.round(sum / count);

              return {
                ...c,
                videoScore,
                videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // mock player clip
                combinedScore
              };
            }
            return c;
          });

          void persistCandidates(updatedCandidates);
          alert(`AI Video response analysis finished! Video score: ${score}/100. ${summary}`);
        } catch (err) {
          logger.error(err);
        } finally {
          setIsEvaluatingVideo(false);
        }
      }
    }, 250);
  };

  // Automated Candidate Hiring & Employee conversion
  const handleConvertCandidateToEmployee = async (candId: string, templateId: string) => {
    const candidate = candidates.find(c => c.id === candId);
    if (!candidate) return;

    const template = onboardingTemplates?.find(t => t.id === templateId);
    if (!template) {
      alert("Onboarding template blueprint not found!");
      return;
    }

    // 1. Move Candidate status to 'Hired'
    const updatedCandidates = candidates.map(c => 
      c.id === candId ? { ...c, status: 'Hired' as const } : c
    );
    void persistCandidates(updatedCandidates);

    // 2. Map candidate data to Employee
    const occupiedSeats = employees.filter(e => e.status !== 'Terminated').map(e => e.employment.seatNumber);
    let assignedSeat = 1;
    for (let s = 1; s <= 30; s++) {
      if (!occupiedSeats.includes(s)) {
        assignedSeat = s;
        break;
      }
    }

    const newEmpId = await getNextId('employee', 'EMP-');
    
    // Initialize advanced onboarding tasks status mapping
    const tasksStatus: { [taskId: string]: 'pending' | 'in-progress' | 'completed' | 'overdue' } = {};
    template.tasks.forEach(t => {
      tasksStatus[t.id] = 'pending';
    });

    const newEmployee: Employee = {
      id: newEmpId,
      name: candidate.name,
      email: candidate.email,
      status: 'Active',
      personal: {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        profileImage: '',
        cnic: '',
        gender: 'Prefer not to say',
        dateOfBirth: '',
        currentAddress: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: ''
      },
      employment: {
        designationId: '',
        departmentId: template.department && template.department !== 'General' ? template.department : 'Engineering',
        role: 'Employee',
        reportingManagerId: '',
        joiningDate: new Date().toISOString().split('T')[0],
        seatNumber: assignedSeat,
        workLocation: 'Remote',
        employmentType: 'Permanent',
        status: 'Active'
      },
      compensation: {
        currency: 'USD',
        payGradeId: '',
        salaryStructure: {
          id: `SAL-${Date.now()}`,
          employeeId: newEmpId,
          components: [],
          totalMonthly: 4500,
          totalAnnual: 4500 * 12,
          ctc: 4500 * 13,
          currency: 'USD',
          effectiveFrom: new Date().toISOString().split('T')[0],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          employerContributions: { pf: 0, esi: 0, gratuity: 0 }
        }
      },
      onboarding: {
        contractSigned: false,
        trainingAssigned: false,
        trainingCompleted: false,
        welcomeEmailSent: false,
        feedbackSubmitted: false,
        templateId: template.id,
        tasksStatus: tasksStatus as any,
        tasksCompleted: []
      },
      exit: null,
      journeyTimeline: [
        {
          id: `EVT-${Date.now()}-1`,
          stage: 'Recruitment',
          date: new Date().toISOString().split('T')[0],
          title: "Hired via Automated Screener",
          description: `Passed pre-screening with combined scorecard evaluation of ${candidate.combinedScore || 85}%.`
        },
        {
          id: `EVT-${Date.now()}-joined`,
          stage: 'Recruitment',
          date: new Date().toISOString().split('T')[0],
          title: "Joined through Recruitment Pipeline",
          description: `Officially joined Humail Eli through the recruitment channel under blueprint "${template.name}".`
        },
        {
          id: `EVT-${Date.now()}-2`,
          stage: 'Onboarding',
          date: new Date().toISOString().split('T')[0],
          title: "Onboarding Commenced",
          description: `Dispatched advanced onboarding blueprint checklists and locked desk seat #${assignedSeat}.`
        }
      ]
    };

    // Also trigger legacy onboarding task creation for compatibility
    const legacyOnboardingTasks: LegacyOnboardingTask[] = template.tasks.map((task, idx) => ({
      id: `TASK-${Date.now()}-${idx}`,
      employeeId: newEmpId,
      employeeName: candidate.name,
      taskName: task.taskName,
      dueDate: new Date(Date.now() + 86400000 * task.dueDaysAfterJoining).toISOString().split('T')[0],
      assignedToId: "",
      assignedToName: task.assignedTo,
      completed: false
    }));

    // Persist the new employee and onboarding tasks.
    void persistEmployees([newEmployee, ...employees]);
    const existingTasks = getOnboardingTasks();
    saveOnboardingTasks([...legacyOnboardingTasks, ...existingTasks]);

    if (!settings.isMockMode) {
      try {
        const { syncEmployeeToGSheet, syncOnboardingTaskToGSheet } = await import('../lib/storage');
        await syncEmployeeToGSheet(newEmployee);
        for (const task of legacyOnboardingTasks) {
          await syncOnboardingTaskToGSheet(task);
        }
      } catch (err) {
        logger.error("GSheets sync error during conversion:", err);
      }
    }

    data.addSheetLog("HumailEli_Employees", "INSERT", {
      id: newEmployee.id,
      name: newEmployee.name,
      status: "Onboarding",
      seatNumber: assignedSeat,
      templateId: template.id
    });

    alert(`CONGRATULATIONS!\nCandidate ${candidate.name} is officially hired under the "${template.name}" blueprint.\n\nCreated new employee profile (${newEmployee.id}), allocated seat #${assignedSeat}, and scheduled ${template.tasks.length} advanced onboarding checklist tasks automatically.`);
    setSelectedCandidateId(null);
    setShowConvertModal(false);
    setCandidateToConvert(null);
  };

  // AI Voice screening call trigger
  const handleStartAIScreening = (candId: string) => {
    const candidate = candidates.find(c => c.id === candId);
    if (!candidate) return;

    setIsScreeningCallActive(true);
    setTimeout(() => {
      const scores: { [key: string]: number } = {};
      let total = 0;

      if (activeJd && activeJd.evaluationDimensions.length > 0) {
        let maxTotal = 0;
        activeJd.evaluationDimensions.forEach(dim => {
            const score = 3 + Math.floor(Math.random() * 3); // 3 to 5 out of 5
            scores[dim.id as any] = score;
            total += score * dim.weight;
            maxTotal += 5 * dim.weight;
        });
        total = Math.round((total / maxTotal) * 100);
      } else {
        SCREENING_QUESTIONS.forEach(q => {
          const baseMin = candidate.experienceYears >= 5 ? 7 : 5;
          const score = baseMin + Math.floor(Math.random() * (11 - baseMin));
          scores[q.index] = score;
          total += score;
        });
      }

      const updatedCand: Candidate = {
        ...candidate,
        status: 'Screened',
        screeningScores: scores,
        screeningTotalScore: total
      };

      const updated = candidates.map(c => c.id === candId ? updatedCand : c);
      void persistCandidates(updated);
      setIsScreeningCallActive(false);

      data.addSheetLog(settings.googleSheets.recruitmentSheet || 'Recruitment', "UPDATE", {
        candidateId: updatedCand.id,
        name: updatedCand.name,
        screeningScore: `${total}/100`,
        status: updatedCand.status
      });

      alert(`AI automated screening call completed! Evaluated structural variables. Score: ${total}/100`);
    }, 1500);
  };

  // WhatsApp Invite simulation logged to Sheet
  const handleSendWhatsAppInvite = async (candId: string) => {
    const candidate = candidates.find(c => c.id === candId);
    if (!candidate || !candidate.screeningTotalScore) return;

    // Load template from recruitmentRules setting
    const templateName = "Interview_Invitation"; // Should be configurable
    
    // Check if configured for real API
    const isConfigured = settings.whatsApp.phoneNumberId && settings.whatsApp.accessToken;

    if (isConfigured) {
      const confirmed = window.confirm(`Send real WhatsApp interview invitation to ${candidate.name} via WhatsApp API?`);
      if (!confirmed) return;

      try {
        const response = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: getAuthHeaders('json'),
          body: JSON.stringify({
            phoneNumberId: settings.whatsApp.phoneNumberId,
            accessToken: settings.whatsApp.accessToken,
            to: candidate.phone.replace(/[^0-9]/g, ''),
            templateName: templateName,
            components: [
              { type: 'body', parameters: [{ type: 'text', text: candidate.name }] } // Simplified for demo
            ]
          })
        });

        if (response.ok) {
          alert("Message sent via WhatsApp API!");
          // Log to storage (would need a storage function)
        } else {
          throw new Error("Failed to send");
        }
      } catch (error) {
        alert("Failed to send via API, falling back to simulation.");
      }
    }

    // Fallback/Simulated functionality
    const template = settings.recruitmentRules?.whatsAppMessageTemplate || 
      "Dear {name},\n\nCongratulations! Based on your AI screening results, you have been selected for the next round.\n\nInterview Date: {date}\nInterview Time: {time}\nInterviewer: {interviewer}\n\nPlease confirm your availability.\n\nBest regards,\n{company_name} HR Team";

    const formattedMessage = template
      .replace(/{name}/g, candidate.name)
      .replace(/{date}/g, "2026-07-21")
      .replace(/{time}/g, "11:00 AM")
      .replace(/{interviewer}/g, "Sarah Jenkins")
      .replace(/{company_name}/g, settings.companySettings?.companyName || "Humail Eli");

    const confirmed = window.confirm(
      `Send automated WhatsApp interview invitation to ${candidate.name} at ${candidate.phone}?\n\nMessage Preview:\n----------------------------------------\n${formattedMessage}\n----------------------------------------`
    );
    if (!confirmed) return;

    const updatedCand: Candidate = {
      ...candidate,
      status: 'Invited',
      whatsappSent: true
    };

    const updated = candidates.map(c => c.id === candId ? updatedCand : c);
    void persistCandidates(updated);

    data.addSheetLog(settings.googleSheets.recruitmentSheet || 'Recruitment', "INSERT", {
      candidateId: updatedCand.id,
      name: updatedCand.name,
      email: updatedCand.email,
      phone: updatedCand.phone,
      screeningScore: `${updatedCand.screeningTotalScore}/100`,
      inviteSent: "WhatsApp",
      messageBody: formattedMessage,
      timestamp: new Date().toISOString()
    });

    alert(`WhatsApp template message dispatched successfully to ${candidate.phone}!\n\nLogged row sync to Sheet: "${settings.googleSheets.recruitmentSheet || 'Recruitment'}"`);
  };

  // Filter candidates list for search term
  const searchedCandidates = useMemo(() => {
    return candidates.filter(cand => 
      cand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [candidates, searchTerm]);

  // Map to Kanban Columns
  const columns = useMemo(() => {
    return [
      { id: 'New', title: 'New Candidates', statuses: ['Applied', 'Parsed'], color: 'from-blue-500 to-indigo-500' },
      { id: 'Shortlisted', title: 'Shortlisted', statuses: ['Shortlisted'], color: 'from-amber-500 to-orange-500' },
      { id: 'Screening', title: 'AI Screening', statuses: ['Screened'], color: 'from-violet-500 to-purple-500' },
      { id: 'Interview', title: 'Interviewing', statuses: ['Invited'], color: 'from-emerald-500 to-teal-500' },
      { id: 'Rejected', title: 'Rejected Pool', statuses: ['Rejected'], color: 'from-rose-500 to-pink-500' },
    ];
  }, []);

  // Drag and Drop Card movement logic
  const handleCardDragStart = (candId: string) => {
    setDraggedCandidateId(candId);
  };

  const handleCardDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleCardDrop = (columnId: string) => {
    if (!draggedCandidateId) return;

    // Determine target status
    let targetStatus: Candidate['status'] = 'Applied';
    if (columnId === 'New') targetStatus = 'Parsed';
    else if (columnId === 'Shortlisted') targetStatus = 'Shortlisted';
    else if (columnId === 'Screening') targetStatus = 'Screened';
    else if (columnId === 'Interview') targetStatus = 'Invited';
    else if (columnId === 'Rejected') targetStatus = 'Rejected';

    const updated = candidates.map(c => {
      if (c.id === draggedCandidateId) {
        data.addSheetLog(settings.googleSheets.recruitmentSheet || 'Recruitment', "UPDATE", {
          candidateId: c.id,
          name: c.name,
          previousStatus: c.status,
          newStatus: targetStatus
        });
        return { ...c, status: targetStatus } as Candidate;
      }
      return c;
    });

    void persistCandidates(updated);
    setDraggedCandidateId(null);
  };

  const moveCandidateManual = (candId: string, direction: 'left' | 'right') => {
    const candidate = candidates.find(c => c.id === candId);
    if (!candidate) return;

    const columnOrder = ['New', 'Shortlisted', 'Screening', 'Interview', 'Rejected'];
    // Find current column index
    let currentCol = 'New';
    if (candidate.status === 'Shortlisted') currentCol = 'Shortlisted';
    else if (candidate.status === 'Screened') currentCol = 'Screening';
    else if (candidate.status === 'Invited') currentCol = 'Interview';
    else if (candidate.status === 'Rejected') currentCol = 'Rejected';

    let idx = columnOrder.indexOf(currentCol);
    if (direction === 'left' && idx > 0) idx--;
    if (direction === 'right' && idx < columnOrder.length - 1) idx++;

    const nextCol = columnOrder[idx];
    let nextStatus: Candidate['status'] = 'Applied';
    if (nextCol === 'New') nextStatus = 'Parsed';
    else if (nextCol === 'Shortlisted') nextStatus = 'Shortlisted';
    else if (nextCol === 'Screening') nextStatus = 'Screened';
    else if (nextCol === 'Interview') nextStatus = 'Invited';
    else if (nextCol === 'Rejected') nextStatus = 'Rejected';

    const updated = candidates.map(c => {
      if (c.id === candId) {
        data.addSheetLog(settings.googleSheets.recruitmentSheet || 'Recruitment', "UPDATE", {
          candidateId: c.id,
          name: c.name,
          newStatus: nextStatus
        });
        return { ...c, status: nextStatus } as Candidate;
      }
      return c;
    });

    void persistCandidates(updated);
  };

  const selectedCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandidateId) || null;
  }, [candidates, selectedCandidateId]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex border-b border-slate-200">
        {canAccess('pipeline') && (
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'pipeline' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Pipeline
          </button>
        )}
        {canAccess('jds') && (
          <button
            onClick={() => setActiveTab('jds')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'jds' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Job Descriptions
          </button>
        )}
        {canAccess('matching') && (
          <button
            onClick={() => setActiveTab('matching')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'matching' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            JD Matching
          </button>
        )}
        {canAccess('stage_templates') && (
          <button
            onClick={() => setActiveTab('stage_templates')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'stage_templates' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Stage Templates
          </button>
        )}
        {canAccess('interview_panels') && (
          <button
            onClick={() => setActiveTab('interview_panels')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'interview_panels' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Interview Panel
          </button>
        )}
        {canAccess('scorecards') && (
          <button
            onClick={() => setActiveTab('scorecards')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'scorecards' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Scorecards
          </button>
        )}
        {canAccess('analytics') && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'analytics' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Analytics
          </button>
        )}
      </div>

      {activeTab === 'pipeline' && (
      <>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
            Recruitment Funnel
          </h2>
          <p className="text-sm font-medium text-slate-500 font-sans mt-0.5">
            Interactively drag candidates through stages, extract parameters via bulk parsing, and trigger automated screening evaluations.
          </p>
        </div>
      </div>

      {/* Top action forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulk resume parser drag and drop zone */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-xl shadow-slate-100/40 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
                <FolderOpen className="w-4 h-4 text-violet-600" />
                Upload Resumes Folder (PDF / ZIP)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Drag files in to trigger the simulated NLP parsing pipeline.</p>
            </div>
          </div>

          <div
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('resume-picker-input')?.click()}
            className={`flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] ${
              isDraggingFile ? 'border-violet-600 bg-violet-50/20' : 'border-slate-200 hover:border-violet-400 hover:bg-slate-50/30'
            }`}
          >
            <input 
              type="file" 
              id="resume-picker-input" 
              multiple 
              accept=".pdf,.docx,.zip" 
              className="hidden" 
              onChange={handleFileInput} 
            />
            <Upload className="w-8 h-8 text-violet-600 mb-2.5 animate-bounce" />
            <p className="text-xs font-bold text-slate-700">Drop your resume archive or single files</p>
            <p className="text-[10px] text-slate-400 mt-1">Accepts PDF, DOCX, ZIP files. Mock extraction loads candidate metadata.</p>
          </div>

          {uploadingFiles.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              {uploadingFiles.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                  <span className="truncate max-w-[250px]">{item.name}</span>
                  <span className="text-violet-600">{item.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {isParsingPipeline && (
            <div className="mt-3.5 p-3 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center gap-2 text-xs font-semibold text-violet-800 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" /> Calling API resume parser...
            </div>
          )}
        </div>

        {/* Match auto filter setup */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-xl shadow-slate-100/40 flex flex-col justify-between">
          
          {jobDescriptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-2">Active Job Description</label>
              <select
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4"
              >
                <option value="">-- Legacy Manual Filter Mode --</option>
                {jobDescriptions.filter(j => j.isActive).map(j => (
                  <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                ))}
              </select>
            </div>
          )}

          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-display">
              <Filter className="w-4 h-4 text-violet-600" />
              Automated Match Settings
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              {activeJd ? 'Candidates will be ranked based on JD requirements.' : 'Establish parameters to trigger mass parsing shortlist.'}
            </p>
          </div>

          {!activeJd && (
          <div className="space-y-4">

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 font-sans">
                <span>Minimum Work Experience</span>
                <span className="font-mono text-violet-600">{minExpYears} Years</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={8} 
                value={minExpYears} 
                onChange={(e) => setMinExpYears(Number(e.target.value))} 
                className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-violet-600" 
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Skills Checked</span>
              <div className="grid grid-cols-2 gap-1.5 h-20 overflow-y-auto border border-slate-100 bg-slate-50 p-2 rounded-xl">
                {targetSkills.map(skill => (
                  <button
                    key={skill.name}
                    onClick={() => toggleSkillRequirement(skill.name)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all text-left truncate flex items-center gap-1 ${
                      skill.required ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{skill.required ? '✓' : '+'}</span>
                    <span className="truncate">{skill.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}
          <button
            onClick={handleAutoShortlist}
            className="w-full mt-4 h-10 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98]"
          >
            <Play className="w-3 h-3 fill-white" />
            Trigger Bulk Shortlist
          </button>
        </div>

      </div>

      {/* Kanban Board Container */}
      <div className="space-y-4">
        {/* Search controls inside board */}
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Kanban by candidate or skill..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/60 transition-all text-slate-800 placeholder-slate-400 w-full"
          />
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 overflow-x-auto pb-4">
          
          {columns.map((col) => {
            // Find candidates in this column
            const colCandidates = searchedCandidates.filter(c => col.statuses.includes(c.status)).sort((a, b) => (b.matchScore || b.screeningTotalScore || 0) - (a.matchScore || a.screeningTotalScore || 0));

            return (
              <div 
                key={col.id}
                onDragOver={handleCardDragOver}
                onDrop={() => handleCardDrop(col.id)}
                className="bg-slate-100/50 border border-slate-200/50 rounded-2xl p-4 flex flex-col min-h-[450px] transition-all hover:bg-slate-100/80"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2.5">
                  <span className="flex items-center gap-1.5 font-bold text-xs text-slate-700 uppercase tracking-wider">
                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${col.color}`} />
                    {col.title}
                  </span>
                  <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                    {colCandidates.length}
                  </span>
                </div>

                {/* Candidate card stack */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colCandidates.map((cand) => {
                    const initials = getInitials(cand.name);
                    const isSelected = selectedCandidateId === cand.id;
                    const activeMatch = jdMatches.find(m => m.candidateId === cand.id && m.jobId === activeJd?.id);
                    const matchScore = activeMatch ? activeMatch.overallScore : (cand.matchScore || cand.screeningTotalScore || 0);
                    const matchLevel = activeMatch ? activeMatch.matchLevel : null;

                    return (
                      <div
                        key={cand.id}
                        draggable
                        onDragStart={() => handleCardDragStart(cand.id)}
                        onClick={() => setSelectedCandidateId(isSelected ? null : cand.id)}
                        className={`bg-white p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg relative group ${
                          isSelected ? 'ring-2 ring-violet-500 border-transparent bg-violet-50/10' : 'border-slate-200/60 hover:border-slate-300'
                        }`}
                      >
                        {cand.status === 'Invited' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setHireCandidate(cand); }}
                            className="absolute top-2 left-2 bg-emerald-50 text-emerald-700 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100"
                            title="Hire Candidate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Match Score & Badge in top right */}
                        {matchScore > 0 && (
                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            <div className="w-7 h-7 flex items-center justify-center text-[8px] font-mono font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full">
                              {matchScore}%
                            </div>
                            {matchLevel && (
                              <div className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                matchLevel.includes('Strong') ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                matchLevel.includes('Good') ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                matchLevel.includes('Potential') ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                'text-rose-700 bg-rose-50 border-rose-200'
                              }`}>
                                {matchLevel.split(' ')[0]}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {/* Card Head */}
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 font-display uppercase">
                              {initials}
                            </div>
                            <div className="min-w-0 pr-6">
                              <h4 className="text-xs font-bold text-slate-800 truncate leading-none">{cand.name}</h4>
                              <span className="text-[9px] font-mono text-slate-400 mt-1 block">{cand.experienceYears} Years Exp</span>
                            </div>
                          </div>

                          {/* Skills pill list */}
                          <div className="flex flex-wrap gap-1">
                            {cand.skills.slice(0, 3).map(s => (
                              <span key={s} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono">
                                {s}
                              </span>
                            ))}
                            {cand.skills.length > 3 && (
                              <span className="text-[8px] text-slate-400 font-bold font-sans self-center">+{cand.skills.length - 3}</span>
                            )}
                          </div>

                          {/* Quick manual buttons for testing/iframe/mobile compatibility */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveCandidateManual(cand.id, 'left'); }}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Advance stage</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveCandidateManual(cand.id, 'right'); }}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                              title="Move Right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                  {colCandidates.length === 0 && (
                    <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 text-slate-300 min-h-[140px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Empty stage</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* Selected candidate side-drawer details / scoring card */}
      {selectedCandidate && (
        <div id="candidate-screening-workspace" className="p-6 bg-white border border-slate-200 shadow-xl rounded-2xl space-y-6 animate-scale-in">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">
                  ACTIVE CANDIDATE SCREENING
                </span>
                {selectedCandidate.status === 'Hired' && (
                  <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase">
                    Hired & Active
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-1.5">{selectedCandidate.name}</h3>
              <p className="text-xs text-slate-500 font-sans">{selectedCandidate.email} • {selectedCandidate.phone} • {selectedCandidate.experienceYears} Years Exp</p>
            </div>
            <button 
              onClick={() => setSelectedCandidateId(null)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMN 1: INTERACTIVE PRE-SCREENING METHODS (8 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">PRE-SCREENING WORKSPACE</h4>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setActiveScreeningTab('chatbot')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeScreeningTab === 'chatbot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    AI Chatbot
                  </button>
                  <button
                    onClick={() => setActiveScreeningTab('video')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeScreeningTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    AI Video
                  </button>
                  <button
                    onClick={() => setActiveScreeningTab('voice')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeScreeningTab === 'voice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    AI Voice Call
                  </button>
                  <button
                    onClick={() => setActiveScreeningTab('scorecard')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      activeScreeningTab === 'scorecard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Scorecard
                  </button>
                </div>
              </div>

              {/* Chatbot Screening Panel */}
              {activeScreeningTab === 'chatbot' && (
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-8 text-center space-y-4">
                      <MessageCircle className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">AI Chat Screening Simulator</h5>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Deploy our intelligent chatbot screener to chat with the candidate, assess essential skills, and automatically extract structured scorecard evaluations.
                        </p>
                      </div>
                      <button
                        onClick={startChatScreening}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Begin AI Chat Screening
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[320px]">
                      {/* Message log */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                                msg.sender === 'user'
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                              }`}
                            >
                              <p className="leading-relaxed">{msg.content}</p>
                              <span className={`text-[9px] block mt-1 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                        {isChatTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl px-4 py-2.5 text-xs shadow-sm rounded-tl-none">
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Eli is writing...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendChatMessage} className="bg-white border-t border-slate-200 p-2 flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type simulated candidate response..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}

                  {chatMessages.length >= 3 && (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100/50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs text-indigo-900 font-bold">Dialogue threshold reached!</span>
                      </div>
                      <button
                        onClick={handleEvaluateChatTranscript}
                        disabled={isEvaluatingChat}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {isEvaluatingChat ? "Evaluating..." : "Generate Screener Scorecard"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Video Screening Panel */}
              {activeScreeningTab === 'video' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-4 bg-slate-50/50">
                    <Video className="w-10 h-10 text-indigo-500 mx-auto animate-pulse" />
                    <div>
                      <h5 className="text-sm font-bold text-slate-800">Candidate Video Response Portal</h5>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Ask candidate to upload video answers or a recorded pitch to screen communication metrics and language structures automatically.
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <label className="cursor-pointer bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Upload className="w-4 h-4 text-indigo-500" />
                        Upload Simulated Video Answer (.mp4, .mov)
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleVideoResponseUpload}
                        />
                      </label>
                      {videoResponseFile && (
                        <p className="text-xs text-indigo-600 font-semibold mt-2">
                          File: {videoResponseFile} ({videoStatus})
                        </p>
                      )}
                    </div>

                    {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                      <div className="w-full max-w-xs mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 transition-all duration-200"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {selectedCandidate.videoScore && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h6 className="text-xs font-bold text-emerald-900">AI Video Insights Logged</h6>
                        <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                          Evaluated: <strong>Score {selectedCandidate.videoScore}/100</strong>. High confidence markers, excellent focal alignment, fluid technical speech structures.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voice Screening Panel */}
              {activeScreeningTab === 'voice' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3.5">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-bold text-slate-800">Trigger Automated Screening Voice Call</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Dial standardized call lines instantly. The AI Voice Agent will proceed to read technical assessment queries and compute scores on response transcripts.
                    </p>
                    <button
                      onClick={() => handleStartAIScreening(selectedCandidate.id)}
                      disabled={isScreeningCallActive}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      {isScreeningCallActive ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dialing Standardized Call...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="w-3.5 h-3.5" /> Launch AI Voice Screen
                        </>
                      )}
                    </button>
                  </div>

                  {selectedCandidate.screeningScores && (
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Voice Question Breakdown</h5>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto border border-slate-100 bg-white p-3 rounded-lg text-[10px] font-mono">
                        {activeJd && activeJd.evaluationDimensions.length > 0 ? (
                            activeJd.evaluationDimensions.map(dim => {
                              const sc = selectedCandidate.screeningScores?.[dim.id as any] ?? 0;
                              return (
                                <div key={dim.id} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                  <span className="font-sans font-medium text-slate-600 truncate max-w-[220px]">{dim.name} ({dim.weight}%)</span>
                                  <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded">{sc}/5</span>
                                </div>
                              );
                            })
                        ) : (
                            SCREENING_QUESTIONS.map(q => {
                              const sc = selectedCandidate.screeningScores?.[q.index] ?? 0;
                              return (
                                <div key={q.index} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                  <span className="font-sans font-medium text-slate-600 truncate max-w-[220px]">{q.index}. {q.question}</span>
                                  <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded">{sc}/10</span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COLUMN 2: COMBINED SCORECARD & CONVERSION PORTAL (5 cols) */}
            <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">COMBINED SCORECARD</h4>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-4">
                {/* Single scores list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">AI Chatbot Screener:</span>
                    <span className="font-bold font-mono text-slate-700">
                      {selectedCandidate.chatbotScore ? `${selectedCandidate.chatbotScore}%` : 'Awaiting'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">AI Video Response:</span>
                    <span className="font-bold font-mono text-slate-700">
                      {selectedCandidate.videoScore ? `${selectedCandidate.videoScore}%` : 'Awaiting'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">AI Voice Agent call:</span>
                    <span className="font-bold font-mono text-slate-700">
                      {selectedCandidate.screeningTotalScore ? `${selectedCandidate.screeningTotalScore}%` : 'Awaiting'}
                    </span>
                  </div>
                </div>

                {/* Combined Ring Display */}
              {/* Scorecard Panel */}
              {activeScreeningTab === 'scorecard' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3.5">
                    <h5 className="text-xs font-bold text-slate-800 font-display">Evaluate: {selectedCandidate.status}</h5>
                    {(() => {
                      const templateId = activeJd?.stageTemplates?.[selectedCandidate.status];
                      const template = stageTemplates.find(t => t.id === templateId);
                      
                      if (!template) {
                        return (
                          <div className="text-sm text-slate-500 py-4 text-center">
                            No scorecard template assigned to this stage for this job description.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {template.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                              <p className="text-xs font-bold text-slate-700">{idx + 1}. {q.question}</p>
                              <select className="w-full h-8 px-2 border border-slate-200 rounded text-xs">
                                <option value="">Select Score (1-5)...</option>
                                {[1,2,3,4,5].map(score => (
                                  <option key={score} value={score}>{score} - {q.scoringRubric?.[score as 1|2|3|4|5] || '...'}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                          
                          <div className="border-t border-slate-200 pt-4 space-y-2">
                            <label className="text-xs font-bold text-slate-700">Recommendation</label>
                            <select className="w-full h-8 px-2 border border-slate-200 rounded text-xs">
                              <option value="Advance">Advance</option>
                              <option value="Consider">Consider</option>
                              <option value="Reject">Reject</option>
                            </select>
                          </div>

                          <div className="border-t border-slate-200 pt-4">
                            <button 
                              onClick={() => {
                                const newScorecard = {
                                  id: `sc_${Date.now()}`,
                                  candidateId: selectedCandidate.id,
                                  jobId: activeJd?.id || '',
                                  stageId: selectedCandidate.status,
                                  interviewerId: 'user',
                                  interviewerName: 'Current Interviewer',
                                  scores: {},
                                  dimensionScores: {},
                                  overallScore: 85,
                                  recommendation: 'Advance',
                                  comments: 'Good performance overall.',
                                  submittedAt: new Date().toISOString(),
                                  submittedBy: 'Current Interviewer'
                                };
                                const updatedScorecards = [...scorecards, newScorecard as any];
                                handleSetScorecards(updatedScorecards);
                                alert('Scorecard submitted successfully!');
                              }}
                              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                            >
                              Submit Scorecard
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">WEIGHTED COMBINED SCORE</span>
                    <span className="text-[10px] text-slate-400">Average of active evaluations</span>
                  </div>
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-500 shadow-sm shadow-indigo-600/10">
                    <span className="text-sm font-extrabold font-mono text-indigo-700">
                      {selectedCandidate.combinedScore ? `${selectedCandidate.combinedScore}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conversion / Hiring actions */}
              {selectedCandidate.status !== 'Hired' ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setCandidateToConvert(selectedCandidate);
                      const activeTemplates = onboardingTemplates?.filter(t => t.isActive) || [];
                      setSelectedTemplateId(activeTemplates.length > 0 ? activeTemplates[0].id : '');
                      setShowConvertModal(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Hire & Initialize Onboarding
                  </button>
                  <p className="text-[10px] text-slate-400 leading-normal text-center">
                    Confirms hiring credentials. Automatically builds a full Employee workspace, reserves a workspace seat, and schedules advanced onboarding task list synced with Google Sheets.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Candidate Hired & Converted to Employee
                  </span>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Onboarding workspace active in Employees management panel.
                  </p>
                </div>
              )}
            </div>

          </div>
          {/* Hire Modal */}
          {hireCandidate && (
            <HireCandidateModal
              candidate={hireCandidate}
              onClose={() => setHireCandidate(null)}
              onHire={() => {
                const updated = candidates.map(c => c.id === hireCandidate.id ? {...c, status: 'Hired'} : c);
                void persistCandidates(updated as Candidate[]);
                data.saveCandidates(updated as Candidate[]);
                data.addSheetLog(settings.googleSheets.recruitmentSheet || 'Recruitment', "UPDATE", { candidateId: hireCandidate.id, name: hireCandidate.name, newStatus: 'Hired' });
              }}
            />
          )}
        </div>
      )}

      {/* Onboarding Template Selection Modal */}
      <AnimatePresence>
        {showConvertModal && candidateToConvert && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-display">Initialize Advanced Onboarding</h3>
                  <p className="text-slate-400 text-[10px]">Select blueprint and map automated steps for {candidateToConvert.name}.</p>
                </div>
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-violet-50 border border-violet-100/50 rounded-xl flex items-start gap-2">
                  <UserPlus className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-violet-900">Workspace Initialization</p>
                    <p className="text-[10px] text-violet-700 leading-normal mt-0.5">
                      This will automatically convert the candidate, allocate a virtual workstation desk, and set status to Onboarding.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Onboarding Template Blueprint</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full h-10 px-2 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-xs text-slate-700"
                  >
                    <option value="">-- Choose active template --</option>
                    {onboardingTemplates?.filter(t => t.isActive).map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tmpl.tasks.length} tasks)</option>
                    ))}
                  </select>
                </div>

                {selectedTemplateId && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 animate-fade-in">
                    <p className="text-[10px] font-bold uppercase text-slate-400 font-mono">Blueprint Summary</p>
                    <p className="text-xs font-black text-slate-800">
                      {onboardingTemplates?.find(t => t.id === selectedTemplateId)?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {onboardingTemplates?.find(t => t.id === selectedTemplateId)?.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-violet-600 font-semibold mt-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{onboardingTemplates?.find(t => t.id === selectedTemplateId)?.tasks.length} tasks will be pre-allocated</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedTemplateId) {
                      alert("Please select a template!");
                      return;
                    }
                    handleConvertCandidateToEmployee(candidateToConvert.id, selectedTemplateId);
                  }}
                  disabled={!selectedTemplateId}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-300 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Confirm &amp; Hire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </>
      )}
      {activeTab === 'jds' && canAccess('jds') && setJobDescriptions && (
        <JobDescriptions
          jobDescriptions={jobDescriptions}
          setJobDescriptions={setJobDescriptions}
          employees={employees}
          stageTemplates={stageTemplates}
          departments={departments}
          designations={designations}
        />
      )}
      {activeTab === 'matching' && canAccess('matching') && (
        <JDMatching />
      )}

      {activeTab === 'stage_templates' && canAccess('stage_templates') && (
        <StageTemplates 
          templates={stageTemplates} 
          setTemplates={handleSetStageTemplates} 
        />
      )}

      {activeTab === 'interview_panels' && canAccess('interview_panels') && (
        <InterviewPanels 
          panels={interviewPanels} 
          setPanels={handleSetInterviewPanels} 
          candidates={candidates}
        />
      )}

      {activeTab === 'scorecards' && canAccess('scorecards') && (
        <ScorecardsList 
          scorecards={scorecards} 
          candidates={candidates}
        />
      )}
      {activeTab === 'analytics' && canAccess('analytics') && (
        <RecruitmentAnalyticsDashboard 
          candidates={candidates}
          jobDescriptions={jobDescriptions || []}
          stageTemplates={stageTemplates}
          scorecards={scorecards}
          interviewPanels={interviewPanels}
        />
      )}
    </div>
  );
}
