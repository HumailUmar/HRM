import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/src/lib/storage';
import { refreshDataAdapter } from '@/src/services';
import { 
  Cloud, CheckCircle, AlertCircle, RefreshCw, 
  FolderOpen, FileSpreadsheet, ArrowRight, ArrowLeft,
  Check, X, Loader2, FolderPlus, Home
} from 'lucide-react';

interface GoogleSheetsSetupWizardProps {
  accessToken: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

type WizardStep = 'intro' | 'select-folder' | 'create-folder' | 'preview-sheets' | 'creating' | 'complete';

export default function GoogleSheetsSetupWizard({ accessToken, onComplete, onCancel }: GoogleSheetsSetupWizardProps) {
  const [settings] = useState(getSettings());
  const [step, setStep] = useState<WizardStep>('intro');
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{
    current: number;
    total: number;
    message: string;
  }>({ current: 0, total: 0, message: '' });
  const [createdSheetId, setCreatedSheetId] = useState<string>('');
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [foldersLoaded, setFoldersLoaded] = useState(false);

  // All available sheets
  const allSheets = [
    { name: 'HumailEli_Employees', description: 'Employee records with all personal and employment details' },
    { name: 'HumailEli_Attendance', description: 'Daily attendance logs with check-in/out times' },
    { name: 'HumailEli_Payroll', description: 'Monthly payroll calculations and salary records' },
    { name: 'HumailEli_Leaves', description: 'Leave requests, balances, and approvals' },
    { name: 'HumailEli_Recruitment', description: 'Candidate pipeline and recruitment data' },
    { name: 'HumailEli_Documents', description: 'Employee documents and verification status' },
    { name: 'HumailEli_Departments', description: 'Department structure and hierarchy' },
    { name: 'HumailEli_Designations', description: 'Job titles, levels, and categories' },
    { name: 'HumailEli_Performance_Reviews', description: 'Performance review data and scores' },
    { name: 'HumailEli_Performance_Goals', description: 'Employee performance goals and progress' },
    { name: 'HumailEli_Training_Modules', description: 'Training courses and modules' },
    { name: 'HumailEli_Training_Assignments', description: 'Training assignments and completions' },
    { name: 'HumailEli_Succession', description: 'Succession planning and talent pipeline' },
    { name: 'HumailEli_Onboarding_Tasks', description: 'Onboarding checklists and task tracking' },
    { name: 'HumailEli_Org_Chart', description: 'Organizational chart structure' },
    { name: 'HumailEli_WhatsApp_Messages', description: 'WhatsApp message history' },
    { name: 'HumailEli_WhatsApp_Templates', description: 'WhatsApp message templates' },
    { name: 'HumailEli_Interview_Schedule', description: 'Interview scheduling and feedback' },
    { name: 'HumailEli_Leave_Policies', description: 'Leave policies and accrual rules' },
    { name: 'HumailEli_Shifts', description: 'Shift definitions and schedules' },
    { name: 'HumailEli_Shift_Assignments', description: 'Employee shift assignments' },
    { name: 'HumailEli_Currencies', description: 'Currency exchange rates' },
    { name: 'HumailEli_Tax_Rules', description: 'Tax calculation rules' },
    { name: 'HumailEli_Statutory_Deductions', description: 'Statutory deduction rules' },
  ];

  const [selectedSheets, setSelectedSheets] = useState<string[]>(() => allSheets.map(s => s.name));

  // Load folders on mount or step transition
  useEffect(() => {
    if ((step === 'select-folder' || step === 'create-folder') && !foldersLoaded) {
      loadFolders();
      setFoldersLoaded(true);
    }
    // Reset flag when leaving folder steps
    if (step !== 'select-folder' && step !== 'create-folder') {
      setFoldersLoaded(false);
    }
  }, [step]);

  const loadFolders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/drive/folders?accessToken=${encodeURIComponent(accessToken)}`);
      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
      } else {
        setError(data.error || 'Failed to load folders');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Please enter a folder name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/drive/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          folderName: newFolderName.trim(),
          parentFolderId: selectedFolder || undefined
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Select the newly created folder
        setSelectedFolder(data.folderId);
        setNewFolderName('');
        // Refresh folder list and go to preview
        await loadFolders();
        setStep('preview-sheets');
      } else {
        setError(data.error || 'Failed to create folder');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSheets = async () => {
    setStep('creating');
    setIsLoading(true);
    setCreationStatus({ 
      current: 0, 
      total: selectedSheets.length, 
      message: 'Creating spreadsheet and generating tables...' 
    });

    try {
      const response = await fetch('/api/sheets/create-in-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          spreadsheetName: `${settings.companySettings?.companyName || 'Humail Eli'} - HRM Database`,
          folderId: selectedFolder || undefined,
          sheetsToCreate: selectedSheets.length > 0 ? selectedSheets : undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCreatedSheetId(data.spreadsheetId);
        setCreatedSheetUrl(data.spreadsheetUrl);
        
        // Save to settings
        const updatedSettings = {
          ...settings,
          googleSheetId: data.spreadsheetId,
          isMockMode: false,
          storageType: 'google-sheets' as const
        };
        saveSettings(updatedSettings);
        refreshDataAdapter();
        
        setCreationStatus({
          current: data.totalSheets,
          total: data.totalSheets,
          message: `✅ Created ${data.totalSheets} sheets successfully!`
        });
        
        setStep('complete');
      } else {
        throw new Error(data.error || 'Failed to create sheets');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create sheets');
      setStep('preview-sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSheetSelection = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const selectAllSheets = () => {
    if (selectedSheets.length === allSheets.length) {
      setSelectedSheets([]);
    } else {
      setSelectedSheets(allSheets.map(s => s.name));
    }
  };

  // ===== STEP: Intro =====
  if (step === 'intro') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-8 max-w-xl w-full mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
            <Cloud className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">Set Up Google Sheets</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto font-sans leading-relaxed">
              We'll automatically initialize a Google Spreadsheet with all required HR databases, including proper headers, formats, and structural limits.
            </p>
          </div>
          
          <div className="bg-slate-50/80 rounded-xl p-5 text-left border border-slate-100/60 space-y-3 shadow-inner">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">What will be created:</p>
            <ul className="text-xs text-slate-600 space-y-2.5 font-sans font-medium">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                24+ interconnected database sheets
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                Automatic schema structures & column headers
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                Auto-save Spreadsheet ID to settings config
              </li>
            </ul>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('select-folder')}
              className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100/50 flex items-center justify-center gap-2"
            >
              Next: Select Destination Folder
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== STEP: Select Folder =====
  if (step === 'select-folder' || step === 'create-folder') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-8 max-w-xl w-full mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <button onClick={() => setStep('intro')} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">Choose Destination Folder</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Select a Google Drive location for your HR database.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'select-folder' && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="text-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Scanning Google Drive folders...</p>
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FolderOpen className="w-12 h-12 mx-auto text-slate-200 mb-2.5" />
                  <p className="text-xs font-semibold text-slate-500">No Drive folders found</p>
                  <p className="text-[10px] text-slate-400 mt-1">Create a new folder below to organize your files.</p>
                </div>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setStep('preview-sheets');
                    }}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border transition-all text-left ${
                      selectedFolder === folder.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-100'
                        : 'border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedFolder === folder.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-700 font-sans flex-1 truncate">{folder.name}</span>
                    {selectedFolder === folder.id && (
                      <Check className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                    )}
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setStep('create-folder')}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-xs font-bold text-slate-600 font-sans"
            >
              <FolderPlus className="w-4 h-4 text-slate-400" />
              Create New Folder
            </button>
          </div>
        )}

        {step === 'create-folder' && (
          <div className="space-y-4 bg-slate-50/50 p-5 border border-slate-100 rounded-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">New Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Humail Eli HRM Database"
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setStep('select-folder')}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={isLoading || !newFolderName.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating Folder...
                  </>
                ) : (
                  'Create & Select Folder'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            {selectedFolder ? '✓ Folder Selected' : 'Root Directory'}
          </span>
          <button
            onClick={() => setStep('preview-sheets')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
          >
            Skip Folder Selection <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ===== STEP: Preview Sheets =====
  if (step === 'preview-sheets') {
    const total = allSheets.length;
    const selected = selectedSheets.length;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <button onClick={() => setStep('select-folder')} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">Database Tables Schema</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Customize database tables to initialize in your spreadsheet.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">{selected} of {total} Selected</span>
          <button
            onClick={selectAllSheets}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
          >
            {selected === total ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {allSheets.map((sheet) => {
            const isSelected = selectedSheets.includes(sheet.name);
            return (
              <button
                key={sheet.name}
                onClick={() => toggleSheetSelection(sheet.name)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-100'
                    : 'border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-800 font-sans truncate">{sheet.name}</p>
                  <p className="text-[10px] text-slate-400 font-sans truncate mt-0.5">{sheet.description}</p>
                </div>
                {isSelected ? (
                  <CheckCircle className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                ) : (
                  <div className="w-4 h-4 border-2 border-slate-200 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => setStep('select-folder')}
            className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Back
          </button>
          <button
            onClick={handleCreateSheets}
            disabled={isLoading || selectedSheets.length === 0}
            className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building Spreadsheet...
              </>
            ) : (
              <>
                Initialize Database ({selected} Tables)
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ===== STEP: Creating Progress =====
  if (step === 'creating') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-10 max-w-md w-full mx-auto space-y-6 text-center">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-slate-900 font-sans">Initializing Cloud Database</h2>
          <p className="text-xs text-slate-500 font-medium font-sans max-w-xs mx-auto leading-relaxed">
            Please wait while we establish your spreadsheet container, generate sheet mapping layouts, and load proper system indexes.
          </p>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/40">
          <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse w-4/5"></div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
          Status: {creationStatus.message}
        </p>
      </div>
    );
  }

  // ===== STEP: Complete =====
  if (step === 'complete') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-10 max-w-lg w-full mx-auto space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">Setup Completed!</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">
            Your HRM cloud database is fully generated and ready.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100 font-sans text-xs space-y-2.5 shadow-inner">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-slate-400 font-medium">Main Spreadsheet:</span>
            <a
              href={createdSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-bold truncate max-w-[240px]"
            >
              Open Google Spreadsheet ↗
            </a>
          </div>
          <div className="flex items-center gap-2 justify-between border-t border-slate-100 pt-2.5">
            <span className="text-slate-400 font-medium">Tables Initialized:</span>
            <span className="font-bold text-slate-700 font-mono">{creationStatus.total} Sheets</span>
          </div>
          <div className="flex items-center gap-2 justify-between border-t border-slate-100 pt-2.5">
            <span className="text-slate-400 font-medium">Spreadsheet ID:</span>
            <span className="font-mono text-[10px] text-slate-500 select-all font-semibold max-w-[240px] truncate">{createdSheetId}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (createdSheetUrl) {
                window.open(createdSheetUrl, '_blank');
              }
            }}
            className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-100/50 flex items-center justify-center gap-2"
          >
            Open Sheets Workspace
          </button>
          <button
            onClick={onComplete}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100/50"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return null;
}
