import re

with open("src/components/JobDescriptions.tsx", "r") as f:
    content = f.read()

# Replace currentStep < 5
content = content.replace("currentStep < 5 ?", "currentStep < 6 ?")

matching_step = """
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-800 font-display">Matching Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dimension Weights (%)</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Skills</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.skillWeight || 40} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), skillWeight: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Experience</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.experienceWeight || 30} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), experienceWeight: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Education</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.educationWeight || 20} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), educationWeight: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Certifications</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.certificationWeight || 10} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), certificationWeight: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scoring Thresholds</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Strong Match</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.strongMatchThreshold || 80} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), strongMatchThreshold: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Good Match</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.goodMatchThreshold || 65} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), goodMatchThreshold: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Potential Match</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.potentialMatchThreshold || 50} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), potentialMatchThreshold: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-700">Weak Match</label>
                          <input type="number" min="0" max="100" value={jdForm.matchingConfig?.weakMatchThreshold || 35} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), weakMatchThreshold: Number(e.target.value)}})} className="w-16 h-8 text-sm px-2 border rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Automation & AI</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={jdForm.matchingConfig?.useAI || false} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), useAI: e.target.checked}})} className="w-5 h-5 rounded text-indigo-600" />
                        <div>
                          <span className="block text-sm font-bold text-slate-800">Use AI Matching</span>
                          <span className="block text-[10px] text-slate-500">Enable Gemini semantic matching.</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={jdForm.matchingConfig?.autoShortlist || false} onChange={e => setJdForm({...jdForm, matchingConfig: {...(jdForm.matchingConfig as any), autoShortlist: e.target.checked}})} className="w-5 h-5 rounded text-indigo-600" />
                        <div>
                          <span className="block text-sm font-bold text-slate-800">Auto-Shortlist</span>
                          <span className="block text-[10px] text-slate-500">Auto-move Strong Matches.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                </div>
              )}
"""

content = content.replace("            </div>\n            <div className=\"p-5 border-t border-slate-100 bg-slate-50 flex justify-between rounded-b-2xl\">", matching_step + "            </div>\n            <div className=\"p-5 border-t border-slate-100 bg-slate-50 flex justify-between rounded-b-2xl\">")

with open("src/components/JobDescriptions.tsx", "w") as f:
    f.write(content)
