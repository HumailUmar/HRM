import React, { useState, useEffect } from 'react';
import { EmployeeDocument, Employee, Department, Designation } from '../types';
import { getEmployeeDocuments, saveEmployeeDocuments, getEmployees } from '../lib/storage';
import { 
  Upload, File, Trash2, Download, Eye, CheckCircle, XCircle, 
  Clock, Search, Filter, Plus, FileText, Image, FileArchive,
  AlertCircle, RefreshCw, ExternalLink
} from 'lucide-react';

interface DocumentsProps {
  documents: EmployeeDocument[];
  setDocuments: (docs: EmployeeDocument[]) => void;
  employees: Employee[];
  designations: Designation[];
}

const DOCUMENT_TYPES = [
  { value: 'CNIC_FRONT', label: 'CNIC Front' },
  { value: 'CNIC_BACK', label: 'CNIC Back' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'PROFILE_IMAGE', label: 'Profile Image' },
  { value: 'EDUCATION_CERTIFICATE', label: 'Education Certificate' },
  { value: 'EMPLOYMENT_CONTRACT', label: 'Employment Contract' },
  { value: 'NDA', label: 'NDA' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'PERFORMANCE_REVIEW', label: 'Performance Review' },
  { value: 'TRAINING_CERTIFICATE', label: 'Training Certificate' },
  { value: 'MEDICAL_REPORT', label: 'Medical Report' },
  { value: 'POLICE_CLEARANCE', label: 'Police Clearance' },
  { value: 'EXPERIENCE_LETTER', label: 'Experience Letter' },
  { value: 'BANK_DETAILS', label: 'Bank Details' },
  { value: 'TAX_DOCUMENT', label: 'Tax Document' },
  { value: 'OTHER', label: 'Other' },
];

export default function Documents({ documents, setDocuments, employees, designations }: DocumentsProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('OTHER');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getToken = () => localStorage.getItem('google_access_token') || '';

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedEmployee) {
      alert('Please select an employee first.');
      return;
    }
    if (!file) return;

    setUploading(true);
    try {
      const accessToken = getToken();
      if (!accessToken) {
        alert('Please sign in with Google to upload documents.');
        setUploading(false);
        return;
      }

      // Get the employee's name
      const emp = employees.find(e => e.id === selectedEmployee);
      const employeeName = emp ? emp.name : 'Unknown';

      // Upload to Google Drive via backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accessToken', accessToken);
      formData.append('folderId', ''); // optional folder ID
      formData.append('documentType', selectedType);
      formData.append('documentTypeLabel', DOCUMENT_TYPES.find(t => t.value === selectedType)?.label || selectedType);
      formData.append('employeeId', selectedEmployee);
      formData.append('employeeName', employeeName);

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Create document record
      const newDoc: EmployeeDocument = {
        id: `DOC-${Date.now()}`,
        employeeId: selectedEmployee,
        employeeName: employeeName,
        documentType: selectedType as any,
        documentTypeLabel: DOCUMENT_TYPES.find(t => t.value === selectedType)?.label || selectedType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: data.fileUrl || `https://drive.google.com/uc?export=view&id=${data.fileId}`,
        driveFileId: data.fileId,
        uploadedBy: 'currentUser', // replace with actual user from auth
        uploadedByName: 'Current User',
        uploadedAt: new Date().toISOString(),
        isVerified: false,
        status: 'Pending Verification',
        notes: '',
        tags: [],
        version: 1,
      };

      // Save to local storage
      const updated = [...documents, newDoc];
      setDocuments(updated);
      saveEmployeeDocuments(updated);
      alert('Document uploaded successfully!');

    } catch (error: any) {
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this document?')) {
      const updated = documents.filter(d => d.id !== id);
      setDocuments(updated);
      saveEmployeeDocuments(updated);
    }
  };

  const handleVerify = (id: string) => {
    const updated = documents.map(d => 
      d.id === id ? { ...d, isVerified: true, status: 'Verified' as const } : d
    );
    setDocuments(updated);
    saveEmployeeDocuments(updated);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesEmployee = !selectedEmployee || doc.employeeId === selectedEmployee;
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesSearch = !searchTerm || 
      (doc.fileName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.employeeName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEmployee && matchesType && matchesStatus && matchesSearch;
  });

  // Group by employee for better display
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const key = doc.employeeId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, EmployeeDocument[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Employee Documents</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
            disabled={uploading}
          >
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Document
          </button>
          <input
            id="fileInput"
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFileUpload(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500">Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500">Document Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          >
            {DOCUMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          >
            <option value="all">All Types</option>
            {DOCUMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-500">Search</label>
          <input
            type="text"
            placeholder="Search by name or file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {Object.entries(groupedDocs).map(([employeeId, docs]) => {
          const emp = employees.find(e => e.id === employeeId);
          return (
            <div key={employeeId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{emp?.name || employeeId}</span>
                  <span className="text-sm text-slate-500 ml-2">({docs.length} documents)</span>
                </div>
                <button
                  onClick={() => setSelectedEmployee(employeeId)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Upload for this employee
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {docs.map(doc => (
                  <div key={doc.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                        {doc.fileType?.startsWith('image/') ? <Image className="w-5 h-5" /> : 
                         doc.fileType?.includes('pdf') ? <FileText className="w-5 h-5" /> :
                         <FileArchive className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 truncate">{doc.fileName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                            doc.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-slate-500">
                          <span>{doc.employeeName}</span>
                          <span>{doc.documentTypeLabel}</span>
                          <span>{Number(doc.fileSize) ? (doc.fileSize / 1024).toFixed(1) : '0.0'} KB</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!doc.isVerified && doc.status !== 'Rejected' && (
                        <button
                          onClick={() => handleVerify(doc.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Verify"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={doc.fileUrl + '&download=1'}
                        download={doc.fileName}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(groupedDocs).length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
            <Upload className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>No documents found. Upload a document to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
