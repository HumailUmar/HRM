import React, { useState, useEffect } from 'react';
import { 
  Brain, Sparkles, Shield, Zap, 
  CheckCircle, AlertCircle, Key,
  ChevronDown, ChevronRight, Server,
  Globe, Cpu, BarChart3
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { getAuthHeaders } from '../../lib/auth';
import { AppSettings } from '../../types';

interface AIConfigurationProps {
  settings: AppSettings;
  onSettingsChange?: () => void;
}

type AIProvider = 'gemini' | 'anthropic' | 'openai' | 'custom' | 'none';

interface AITrustLevel {
  feature: string;
  withoutAI: {
    accuracy: number; // 0-100
    description: string;
  };
  withAI: {
    accuracy: number;
    description: string;
  };
  enabled: boolean;
}

export default function AIConfiguration({ settings, onSettingsChange }: AIConfigurationProps) {
  const data = useData();
  const [provider, setProvider] = useState<AIProvider>(
    (settings.ai.provider as AIProvider) || 'none'
  );
  const [aiFeatures, setAiFeatures] = useState({
    resumeParsing: settings.ai.enableResumeParsing ?? false,
    screening: settings.ai.enableScreening ?? false,
    jdMatching: settings.ai.enableJDMatching ?? false,
    analytics: settings.ai.enableAnalytics ?? false,
  });
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const trustLevels: AITrustLevel[] = [
    {
      feature: 'Resume Parsing & Scoring',
      withoutAI: {
        accuracy: 65,
        description: 'Keyword matching, experience years, education level extraction'
      },
      withAI: {
        accuracy: 92,
        description: 'Contextual understanding, semantic skill matching, role fit analysis'
      },
      enabled: aiFeatures.resumeParsing
    },
    {
      feature: 'Candidate Screening',
      withoutAI: {
        accuracy: 55,
        description: 'Questionnaire scoring, basic keyword detection, structured response analysis'
      },
      withAI: {
        accuracy: 88,
        description: 'Natural language understanding, sentiment analysis, behavioral assessment'
      },
      enabled: aiFeatures.screening
    },
    {
      feature: 'JD-Candidate Matching',
      withoutAI: {
        accuracy: 70,
        description: 'Skill count matching, experience years comparison, education verification'
      },
      withAI: {
        accuracy: 94,
        description: 'Semantic job description understanding, cultural fit analysis, potential prediction'
      },
      enabled: aiFeatures.jdMatching
    },
    {
      feature: 'Recruitment Analytics',
      withoutAI: {
        accuracy: 75,
        description: 'Statistical analysis, basic trend detection, historical pattern matching'
      },
      withAI: {
        accuracy: 91,
        description: 'Predictive hiring analytics, talent pool insights, churn prediction'
      },
      enabled: aiFeatures.analytics
    }
  ];

  const providerOptions = [
    { value: 'none', label: 'No AI (Core Logic Only)', icon: <Cpu className="w-4 h-4" /> },
    { value: 'gemini', label: 'Google Gemini AI', icon: <Sparkles className="w-4 h-4 text-blue-500" /> },
    { value: 'anthropic', label: 'Anthropic Claude', icon: <Brain className="w-4 h-4 text-purple-500" /> },
    { value: 'openai', label: 'OpenAI GPT', icon: <Zap className="w-4 h-4 text-emerald-500" /> },
    { value: 'custom', label: 'Custom API Endpoint', icon: <Server className="w-4 h-4 text-slate-500" /> },
  ];

  const providerModels = {
    gemini: 'Gemini 2.0 Flash',
    anthropic: 'Claude 3.5 Sonnet',
    openai: 'GPT-4 Turbo',
    custom: 'Custom Model',
    none: '—'
  };

  const providerPricing = {
    gemini: '~$0.002/1K tokens (Free tier available)',
    anthropic: '~$0.003/1K tokens (Free credits available)',
    openai: '~$0.01/1K tokens (Free credits available)',
    custom: 'Contact provider for pricing',
    none: '—'
  };

  const handleSave = async () => {
    const updatedSettings: AppSettings = {
      ...settings,
      ai: {
        ...settings.ai,
        provider,
        enableResumeParsing: aiFeatures.resumeParsing,
        enableScreening: aiFeatures.screening,
        enableJDMatching: aiFeatures.jdMatching,
        enableAnalytics: aiFeatures.analytics,
      }
    };
    await data.saveSettings(updatedSettings);
    if (onSettingsChange) onSettingsChange();
    alert('AI Configuration saved successfully!');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: getAuthHeaders('json'),
        body: JSON.stringify({ provider })
      });
      const data = await response.json();
      setTestStatus({
        success: data.success,
        message: data.message || (data.success ? '✅ Connection successful!' : '❌ Connection failed')
      });
    } catch (error: any) {
      setTestStatus({
        success: false,
        message: `❌ Connection failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'text-emerald-600';
    if (accuracy >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getAccuracyBarWidth = (accuracy: number) => {
    return `${accuracy}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">AI & Trust Configuration</h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Configure AI providers, view feature trust levels, and enable AI-powered enhancements.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Level Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Feature Trust Levels
          </h4>
          <span className="text-[10px] text-slate-400">Without AI vs With AI</span>
        </div>

        <div className="space-y-4">
          {trustLevels.map((level, idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{level.feature}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {level.enabled ? '🤖 AI Enhanced' : '⚙️ Core Logic'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Without AI</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-slate-400`}
                          style={{ width: getAccuracyBarWidth(level.withoutAI.accuracy) }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${getAccuracyColor(level.withoutAI.accuracy)}`}>
                        {level.withoutAI.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">With AI</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-indigo-600`}
                          style={{ width: getAccuracyBarWidth(level.withAI.accuracy) }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${getAccuracyColor(level.withAI.accuracy)}`}>
                        {level.withAI.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-600 font-bold">
                    +{level.withAI.accuracy - level.withoutAI.accuracy}%
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={() => setAiFeatures({
                        ...aiFeatures,
                        [['resumeParsing', 'screening', 'jdMatching', 'analytics'][idx]]: !level.enabled
                      })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Enable AI
                  </label>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                {level.enabled ? level.withAI.description : level.withoutAI.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Provider Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-indigo-600" />
          AI Provider Configuration
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Select AI Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {providerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              AI credentials are configured securely by an administrator on the server and are never stored in this browser.
            </div>
          </div>



          {provider !== 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">Model</p>
                <p className="text-sm font-bold text-slate-700">{providerModels[provider]}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold">Pricing</p>
                <p className="text-sm text-slate-600">{providerPricing[provider]}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || provider !== 'gemini'}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Testing...
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Test Connection
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>

          {testStatus && (
            <div className={`p-3 rounded-xl text-xs ${
              testStatus.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {testStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Summary of AI Features */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-indigo-600" />
          AI Integration Summary
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Status</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                provider === 'gemini' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {provider === 'gemini' ? 'Server configured' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {provider === 'gemini'
                ? 'Gemini credentials are maintained on the server.'
                : 'Core logic only — no AI features'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">AI Features</span>
              <span className="text-xs font-bold text-slate-700">
                {Object.values(aiFeatures).filter(Boolean).length} of 4 enabled
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(aiFeatures).map(([key, enabled]) => (
                <span key={key} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  enabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-400'
                }`}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-[10px] text-amber-700 font-medium flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Even without AI, the system uses proven scoring algorithms. AI enhances accuracy but is optional. 
            You can switch AI on/off per feature.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
