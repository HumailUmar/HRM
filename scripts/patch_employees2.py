import re

with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

state_code = """
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
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
"""

content = content.replace("  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);", "  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);\n" + state_code)

button_code = """                      <button 
                        onClick={() => setShowDocUploadModal(true)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Upload
                      </button>
                    </div>
"""

content = content.replace("                    </div>\n                  </div>\n\n                  <div className=\"space-y-3\">\n                    {documents?.filter", button_code + "                  </div>\n\n                  <div className=\"space-y-3\">\n                    {documents?.filter")

modal_code = """
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
"""

content = content.replace("      {/* MODAL: ASSIGN MENTOR */}", modal_code + "\n      {/* MODAL: ASSIGN MENTOR */}")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
