import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Archive, X, PlusCircle, Trash2 as TrashIcon, Eye } from 'lucide-react';
import { PerformanceReviewTemplate, ReviewTemplateSection, ReviewQuestion } from '../types';
import { getPerformanceReviewTemplates, savePerformanceReviewTemplates } from '../lib/storage';

export default function ReviewTemplates() {
  const [templates, setTemplates] = useState<PerformanceReviewTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PerformanceReviewTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PerformanceReviewTemplate | null>(null);
  const [sections, setSections] = useState<ReviewTemplateSection[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{ sectionIndex: number; questionIndex: number } | null>(null);

  // Load templates on mount
  useEffect(() => {
    setTemplates(getPerformanceReviewTemplates());
  }, []);

  // Open modal for new template
  const handleCreateNew = () => {
    const newTemplate: PerformanceReviewTemplate = {
      id: '',
      name: '',
      description: '',
      typeId: '',
      sections: [],
      fields: [],
      isActive: true,
    };
    setEditingTemplate(newTemplate);
    setSections([]);
    setIsOpen(true);
  };

  // Open modal for editing – ensure sections have questions array
  const handleEdit = (template: PerformanceReviewTemplate) => {
    setEditingTemplate(template);
    const safeSections = (template.sections || []).map(section => ({
      ...section,
      questions: section.questions || []
    }));
    setSections(safeSections);
    setIsOpen(true);
  };

  // Open modal for preview
  const handlePreview = (template: PerformanceReviewTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  // Save template
  const handleSave = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) {
      alert('Template name is required.');
      return;
    }

    const templateToSave = {
      ...editingTemplate,
      sections: sections,
      updatedAt: new Date().toISOString(),
      id: editingTemplate.id || `tmpl-${Date.now()}`
    };

    const currentTemplates = getPerformanceReviewTemplates();
    let updated;
    if (editingTemplate.id) {
      updated = currentTemplates.map(t => t.id === templateToSave.id ? templateToSave : t);
    } else {
      updated = [...currentTemplates, templateToSave];
    }

    setTemplates(updated);
    savePerformanceReviewTemplates(updated);
    setIsOpen(false);
    setEditingTemplate(null);
    setSections([]);
    alert(`Template "${templateToSave.name}" saved successfully!`);
  };

  // Archive/Activate
  const handleArchive = (id: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
    setTemplates(updated);
    savePerformanceReviewTemplates(updated);
  };

  // Section management
  const addSection = () => {
    const newSection: ReviewTemplateSection = {
      id: `sec-${Date.now()}`,
      templateId: editingTemplate?.id || '',
      name: '',
      description: '',
      weight: 0,
      scoringScaleId: 'scale-1-5',
      questions: [] // always initialize questions array
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: keyof ReviewTemplateSection, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  // --- Question Management ---
  const addQuestion = (sectionIndex: number) => {
    const newQuestion: ReviewQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      description: '',
      category: 'Skills',
      isRequired: true,
      maxScore: 5,
      defaultScore: undefined
    };
    const updated = [...sections];
    // Ensure questions array exists
    if (!updated[sectionIndex].questions) {
      updated[sectionIndex].questions = [];
    }
    updated[sectionIndex].questions = [...updated[sectionIndex].questions, newQuestion];
    setSections(updated);
    setEditingQuestion({ sectionIndex, questionIndex: updated[sectionIndex].questions.length - 1 });
  };

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const updated = [...sections];
    if (updated[sectionIndex].questions) {
      updated[sectionIndex].questions = updated[sectionIndex].questions.filter((_, i) => i !== questionIndex);
      setSections(updated);
    }
    if (editingQuestion && editingQuestion.sectionIndex === sectionIndex && editingQuestion.questionIndex === questionIndex) {
      setEditingQuestion(null);
    }
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, field: keyof ReviewQuestion, value: any) => {
    const updated = [...sections];
    if (updated[sectionIndex].questions && updated[sectionIndex].questions[questionIndex]) {
      updated[sectionIndex].questions[questionIndex] = { ...updated[sectionIndex].questions[questionIndex], [field]: value };
      setSections(updated);
    }
  };

  const startEditingQuestion = (sectionIndex: number, questionIndex: number) => {
    setEditingQuestion({ sectionIndex, questionIndex });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Review Templates</h2>
        <button onClick={handleCreateNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          <Plus size={20} /> Create New Template
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Description</th>
              <th className="p-4 font-semibold text-slate-700">Sections</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="p-4 text-slate-900 font-medium">{t.name}</td>
                <td className="p-4 text-slate-600">{t.description}</td>
                <td className="p-4 text-slate-600">{t.sections?.length || 0}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.isActive ? 'Active' : 'Archived'}</span></td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(t)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={18} /></button>
                  <button onClick={() => handlePreview(t)} className="text-slate-400 hover:text-indigo-600"><Eye size={18} /></button>
                  <button onClick={() => handleArchive(t.id)} className="text-slate-400 hover:text-amber-600"><Archive size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create/Edit */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingTemplate?.id ? 'Edit' : 'Create'} Template</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Template Name *"
                className="w-full p-2 border rounded-lg"
                value={editingTemplate?.name || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate!, name: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="w-full p-2 border rounded-lg"
                value={editingTemplate?.description || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate!, description: e.target.value })}
              />

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Sections ({sections.length})</h4>
                  <button onClick={addSection} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm">
                    <PlusCircle size={16} /> Add Section
                  </button>
                </div>

                {sections.map((section, idx) => (
                  <div key={idx} className="p-4 border rounded-lg mb-4 bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Section Name"
                          className="w-full p-1.5 border rounded bg-white"
                          value={section.name}
                          onChange={e => updateSection(idx, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          className="w-full p-1.5 border rounded bg-white"
                          value={section.description}
                          onChange={e => updateSection(idx, 'description', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Weight %"
                          className="w-24 p-1.5 border rounded bg-white"
                          value={section.weight}
                          onChange={e => updateSection(idx, 'weight', Number(e.target.value))}
                        />
                      </div>
                      <button onClick={() => removeSection(idx)} className="text-rose-500 hover:text-rose-700 p-1">
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    {/* Questions Section */}
                    <div className="mt-4 border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-sm text-slate-700">Questions ({section.questions?.length || 0})</h5>
                        <button
                          onClick={() => addQuestion(idx)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                        >
                          <PlusCircle size={14} /> Add Question
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(section.questions || []).map((q, qi) => (
                          <div key={qi} className="p-3 border rounded-lg bg-white">
                            {editingQuestion && editingQuestion.sectionIndex === idx && editingQuestion.questionIndex === qi ? (
                              // Inline edit form
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Question text"
                                  className="w-full p-1.5 border rounded"
                                  value={q.question}
                                  onChange={e => updateQuestion(idx, qi, 'question', e.target.value)}
                                />
                                <input
                                  type="text"
                                  placeholder="Description (optional)"
                                  className="w-full p-1.5 border rounded"
                                  value={q.description || ''}
                                  onChange={e => updateQuestion(idx, qi, 'description', e.target.value)}
                                />
                                <div className="flex flex-wrap gap-3 items-center">
                                  <select
                                    className="p-1.5 border rounded"
                                    value={q.category}
                                    onChange={e => updateQuestion(idx, qi, 'category', e.target.value as any)}
                                  >
                                    {['Skills', 'Behavior', 'Goals', 'Leadership', 'Communication', 'Teamwork', 'Innovation', 'Customer Focus'].map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <label className="flex items-center gap-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={q.isRequired}
                                      onChange={e => updateQuestion(idx, qi, 'isRequired', e.target.checked)}
                                    /> Required
                                  </label>
                                  <label className="flex items-center gap-1 text-sm">
                                    Max Score:
                                    <input
                                      type="number"
                                      className="w-16 p-1 border rounded"
                                      value={q.maxScore}
                                      onChange={e => updateQuestion(idx, qi, 'maxScore', Number(e.target.value))}
                                    />
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingQuestion(null)}
                                    className="text-sm bg-slate-200 px-3 py-1 rounded"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display question
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{q.question}</p>
                                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded">Category: {q.category}</span>
                                    {q.isRequired && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded">Required</span>}
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Max Score: {q.maxScore}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditingQuestion(idx, qi)}
                                    className="text-slate-400 hover:text-indigo-600"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => removeQuestion(idx, qi)}
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <TrashIcon size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleSave} className="w-full bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-700">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview */}
      {isPreviewOpen && previewTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-900">Preview: {previewTemplate.name}</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg mb-4 text-center font-medium">
              🔍 PREVIEW MODE - This is what employees will see. Responses will NOT be saved.
            </div>

            <div className="space-y-6">
              {(previewTemplate.sections || []).map((section, idx) => (
                <div key={idx} className="border p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-lg text-slate-800">{section.name} ({section.weight}%)</h4>
                  </div>
                  <p className="text-slate-600 mb-4">{section.description}</p>
                  
                  <div className="space-y-4">
                    {(section.questions || []).length > 0 ? (
                      (section.questions || []).map((q, qi) => (
                        <div key={qi} className="border-b pb-2">
                          <p className="font-medium">{qi+1}. {q.question}</p>
                          <p className="text-sm text-slate-500">{q.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Category: {q.category}</span>
                            <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded">Max Score: {q.maxScore}</span>
                            {q.isRequired && <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded">Required</span>}
                          </div>
                          <div className="mt-2 flex gap-2">
                            {[...Array(q.maxScore)].map((_, i) => (
                              <span key={i} className="w-8 h-8 border rounded flex items-center justify-center text-sm text-slate-400"> {i+1} </span>
                            ))}
                            <span className="text-xs text-slate-400 ml-2 self-center">(Select rating)</span>
                          </div>
                          <div className="mt-2">
                            <textarea placeholder="Comments..." className="w-full p-2 border rounded-lg text-sm bg-slate-50" rows={2}></textarea>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500 italic">No questions defined for this section.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setIsPreviewOpen(false)} className="w-full mt-6 bg-slate-800 text-white p-2 rounded-lg font-bold hover:bg-slate-900">
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
