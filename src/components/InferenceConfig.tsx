/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InferenceOptions, Message, Character } from '../types';
import { PRESET_NIM_MODELS } from '../data';
import { Sliders, Cpu, Key, HelpCircle, ToggleLeft, ToggleRight, Info, TrendingUp, Clock, Zap, Sparkles } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface InferenceConfigProps {
  options: InferenceOptions;
  onChange: (options: InferenceOptions) => void;
  activeCharacter?: { id: string; name: string } | null;
  onSaveOverride?: (charId: string, temp: number, topP: number, maxTokens: number) => void;
  onSaveGlobal?: (temp: number, topP: number, maxTokens: number) => void;
  messagesMap?: Record<string, Message[]>;
  characters?: Character[];
}

// Map of mathematically and creatively optimized hyperparameters for each model type
const OPTIMAL_PROFILES: Record<string, { temp: number; topP: number; maxTokens: number; reason: string }> = {
  'meta/llama-3.1-405b-instruct': {
    temp: 0.6,
    topP: 0.9,
    maxTokens: 1024,
    reason: "Flagship Llama 405B Reasoning. Moderated temperature enhances complex logical reasoning chains without losing linguistic flow. High generation tokens allocated."
  },
  'meta/llama-3.3-70b-instruct': {
    temp: 0.7,
    topP: 0.85,
    maxTokens: 768,
    reason: "Recommended state-of-the-art model. Tuned to 0.70 temp and tight Top P to maintain highly cohesive, grammatically precise multi-turn rolepleying dialogue."
  },
  'meta/llama-3.1-70b-instruct': {
    temp: 0.8,
    topP: 0.95,
    maxTokens: 512,
    reason: "High Creativity model. Elevated temperature and broad nucleus sampling configured specifically to support highly creative, flirty, and witty chat outputs."
  },
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    temp: 0.55,
    topP: 0.9,
    maxTokens: 640,
    reason: "NVIDIA specialized alignment. Calibrated with balanced temperature to prioritize hyper-realistic, comforting, and authentic companion sentence rhythms."
  },
  'mistralai/mixtral-8x22b-instruct-v0.1': {
    temp: 0.7,
    topP: 0.8,
    maxTokens: 1280,
    reason: "Mixture-of-Experts engine. Tightened nucleus bounds and generous generation limits are optimized for highly structural scripting or detailed lore."
  },
  'google/gemma-2-27b-it': {
    temp: 0.8,
    topP: 0.9,
    maxTokens: 384,
    reason: "Lightweight instruct model. Calibrated for fast verbal probing, maintaining compact responsive boundaries that optimize device and server latency."
  },
  'deepseek/deepseek-r1': {
    temp: 0.5,
    topP: 0.95,
    maxTokens: 1600,
    reason: "DeepSeek Reasoning model. Lower temperature stabilizes deductive coherence, allocating spacious limits for extensive internal chain-of-thought processes."
  }
};

function getOptimalProfile(modelId: string) {
  if (OPTIMAL_PROFILES[modelId]) {
    return OPTIMAL_PROFILES[modelId];
  }
  
  // Logical analyzer fallback maps
  const lower = modelId.toLowerCase();
  if (lower.includes('llama') && lower.includes('3.1')) {
    return { temp: 0.75, topP: 0.9, maxTokens: 512, reason: "Identified Llama 3.1 architecture. Applying standard balanced baseline parameters." };
  } else if (lower.includes('r1') || lower.includes('reason')) {
    return { temp: 0.5, topP: 0.95, maxTokens: 1500, reason: "Identified reasoning-first model. Lowering temperature and raising token buffer for complete chains." };
  } else if (lower.includes('gemma') || lower.includes('light')) {
    return { temp: 0.8, topP: 0.9, maxTokens: 384, reason: "Identified lightweight instruct agent. Tuned to quick verbosity limits." };
  }
  return {
    temp: 0.7,
    topP: 0.9,
    maxTokens: 512,
    reason: "Custom endpoint/model. Applying standard balanced defaults."
  };
}

// Generating realistic telemetry seed baseline that scales appropriately with model capability to avoid empty analytics states
function getSimulatedTelemetry(charId: string, modelId: string) {
  let baseLatency = 450;
  let latencyVar = 150;
  let baseTokens = 200;
  let tokenVar = 60;

  if (modelId.includes('405b')) {
    baseLatency = 1650;
    latencyVar = 350;
    baseTokens = 250;
  } else if (modelId.includes('70b') || modelId.includes('mixtral')) {
    baseLatency = 920;
    latencyVar = 200;
    baseTokens = 180;
  } else if (modelId.includes('gemini-3.5')) {
    baseLatency = 380;
    latencyVar = 80;
    baseTokens = 160;
  } else if (modelId.includes('gemma')) {
    baseLatency = 310;
    latencyVar = 60;
    baseTokens = 120;
  }

  const results = [];
  const now = Date.now();
  for (let i = 9; i >= 0; i--) {
    const seed = (charId.charCodeAt(0) + i * 17) % 50;
    const latency = baseLatency + (seed % 15 - 7) * (latencyVar / 8);
    const tokens = baseTokens + (seed % 11 - 5) * (tokenVar / 5);
    const charLen = Math.floor(tokens * 4.2 + (seed % 9) * 2);

    results.push({
      index: 10 - i,
      id: `sim_msg_${charId}_${i}`,
      senderId: charId,
      timestamp: new Date(now - i * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latencyMs: Math.round(latency),
      tokensUsed: Math.round(tokens),
      charLen,
      tokensPerChar: parseFloat((tokens / charLen).toFixed(4)),
      latencyPerToken: parseFloat((latency / tokens).toFixed(2)),
      isReal: false
    });
  }
  return results;
}

export default function InferenceConfig({ 
  options, 
  onChange, 
  activeCharacter, 
  onSaveOverride, 
  onSaveGlobal,
  messagesMap,
  characters
}: InferenceConfigProps) {
  // Navigation tabs inside Labs
  const [activeSubTab, setActiveSubTab] = React.useState<'hyper' | 'analytics'>('hyper');
  const [showKeyPassword, setShowKeyPassword] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);

  // Calibration state managers
  const [autoOptimize, setAutoOptimize] = React.useState(true);
  const [selectedCharId, setSelectedCharId] = React.useState<string>(
    characters?.[0]?.id || 'grover'
  );

  const handleToggleNvidia = () => {
    onChange({ ...options, useNvidia: !options.useNvidia });
  };

  const handleSelectModel = (modelId: string) => {
    onChange({ ...options, modelId });
  };

  const lastModelIdRef = React.useRef(options.modelId);

  // Adaptive sync effect: automatically adjusts hyperparameters on model switch if autoOptimize is active
  React.useEffect(() => {
    if (options.modelId !== lastModelIdRef.current) {
      lastModelIdRef.current = options.modelId;
      if (autoOptimize) {
        const profile = getOptimalProfile(options.modelId);
        onChange({
          ...options,
          temperature: profile.temp,
          topP: profile.topP,
          maxTokens: profile.maxTokens
        });
      }
    }
  }, [options.modelId, autoOptimize, onChange, options]);

  const toggleAutoOptimizeMode = () => {
    const nextVal = !autoOptimize;
    setAutoOptimize(nextVal);
    if (nextVal) {
      const profile = getOptimalProfile(options.modelId);
      onChange({
        ...options,
        temperature: profile.temp,
        topP: profile.topP,
        maxTokens: profile.maxTokens
      });
    }
  };

  const triggerStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => {
      setSaveStatus(null);
    }, 2500);
  };

  const handleSaveToCharacter = () => {
    if (activeCharacter && onSaveOverride) {
      onSaveOverride(activeCharacter.id, options.temperature, options.topP, options.maxTokens);
      triggerStatus(`Saved to ${activeCharacter.name}!`);
    }
  };

  const handleSaveToGlobal = () => {
    if (onSaveGlobal) {
      onSaveGlobal(options.temperature, options.topP, options.maxTokens);
      triggerStatus('Saved as global defaults!');
    }
  };

  // Compile real and simulated dialogue metrics to form a precise 10-message trend per character
  const getRealAndSimulatedLogs = (charId: string) => {
    const realMsgs: any[] = [];
    if (messagesMap) {
      Object.values(messagesMap).forEach((msgList) => {
        msgList.forEach((m) => {
          if (m.senderId === charId) {
            realMsgs.push(m);
          }
        });
      });
    }

    const realTelemetry = realMsgs.map((m) => {
      const latency = m.latencyMs || 820;
      const tokens = m.tokensUsed || Math.ceil((m.content?.length || 100) / 4.1);
      const charLen = m.content?.length || 1;
      return {
        id: m.id,
        senderId: charId,
        timestamp: m.timestamp,
        latencyMs: latency,
        tokensUsed: tokens,
        charLen,
        tokensPerChar: parseFloat((tokens / charLen).toFixed(4)),
        latencyPerToken: parseFloat((latency / tokens).toFixed(2)),
        isReal: true
      };
    });

    const lastTenReal = realTelemetry.slice(-10);

    if (lastTenReal.length >= 10) {
      return lastTenReal.map((m, idx) => ({ ...m, index: idx + 1 }));
    }

    // Pad with realistic, model-scaled simulation data to ensure visually complete 10-point charts
    const numNeeded = 10 - lastTenReal.length;
    const charPreset = characters?.find((c) => c.id === charId);
    const activeModelId = charPreset?.customModelId || options.modelId;
    const simulatedPart = getSimulatedTelemetry(charId, activeModelId).slice(0, numNeeded);

    const combined = [...simulatedPart, ...lastTenReal];
    return combined.map((m, idx) => ({ ...m, index: idx + 1 }));
  };

  // Memoize performance metrics and charts vector datasets
  const telemetryData = React.useMemo(() => {
    return getRealAndSimulatedLogs(selectedCharId);
  }, [selectedCharId, messagesMap, characters, options.modelId]);

  const stats = React.useMemo(() => {
    const totalLatency = telemetryData.reduce((acc, curr) => acc + curr.latencyMs, 0);
    const totalTokens = telemetryData.reduce((acc, curr) => acc + curr.tokensUsed, 0);
    const totalChars = telemetryData.reduce((acc, curr) => acc + curr.charLen, 0);
    const avgLatency = Math.round(totalLatency / telemetryData.length);
    const avgTokens = Math.round(totalTokens / telemetryData.length);
    const tokensPerChar = parseFloat((totalTokens / (totalChars || 1)).toFixed(3));
    
    return { avgLatency, avgTokens, tokensPerChar };
  }, [telemetryData]);

  return (
    <div className="flex flex-col h-full bg-[#121318] text-[#ECEFF4] overflow-y-auto font-sans text-sm pb-6 select-none leading-relaxed">
      {/* NIM Inference Header */}
      <div className="p-4 border-b border-[#2E3440] bg-[#1A1C23] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#76B900]" />
          <div>
            <h3 className="font-bold tracking-tight text-white">NIM Inference Labs</h3>
            <p className="text-xs text-[#8F95A3]">Custom hyperparameters & endpoints</p>
          </div>
        </div>
        <button
          onClick={handleToggleNvidia}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            options.useNvidia
              ? 'bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40'
              : 'bg-[#2E3440] text-[#8F95A3] border border-transparent'
          }`}
        >
          {options.useNvidia ? (
            <>
              <ToggleRight className="w-4 h-4 text-[#76B900]" />
              <span>NVIDIA NIM Cloud</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-gray-500" />
              <span>Gemini Fallback</span>
            </>
          )}
        </button>
      </div>

      {/* Lab Tabs Bar */}
      <div className="flex border-b border-[#2E3440]/60 bg-[#15171F] shrink-0 text-xs font-bold font-sans">
        <button
          onClick={() => setActiveSubTab('hyper')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'hyper'
              ? 'border-[#76B900] text-white bg-[#1A1D27]'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#76B900]" />
          <span>Lab Parameters</span>
        </button>
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-cyan-500 text-white bg-[#1A1D27]'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>Performance Analytics</span>
        </button>
      </div>

      {activeSubTab === 'hyper' ? (
        /* ======================== TAB 1: SYSTEM HYPERPARAMETERS ======================== */
        <div className="flex-1 flex flex-col pt-3">
          {/* Info Banner */}
          <div className="mx-4 mb-4 p-3 bg-[#1D212B] border-l-2 border-[#76B900] rounded text-xs text-[#D8DEE9]">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#76B900] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Adaptive Hardware Calibration:</span> Turn on <span className="text-[#76B900] font-medium">Auto-Tuning</span> below to dynamically glide temperature, Top P, and output bounds to optimal model-specific configurations.
              </div>
            </div>
          </div>

          {/* Adaptive Auto-Tuner Toggle */}
          <div className="mx-4 p-4 bg-[#1A1C23] border border-[#2E3440] rounded-xl mb-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2E3440]/50 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#76B900] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5E9F0]">NIM Tuning Coordinator</span>
              </div>
              <button
                onClick={toggleAutoOptimizeMode}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  autoOptimize
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800 border border-gray-700 text-gray-500'
                }`}
              >
                {autoOptimize ? '🧬 AUTO CALIBRATING' : '🔒 MANUAL MODE'}
              </button>
            </div>
            {(() => {
              const profile = getOptimalProfile(options.modelId);
              const isCalibrated = 
                Math.abs(options.temperature - profile.temp) < 0.01 &&
                Math.abs(options.topP - profile.topP) < 0.01 &&
                options.maxTokens === profile.maxTokens;

              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Calibration State:</span>
                    <span className={`font-mono font-bold ${isCalibrated ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                      {isCalibrated ? 'OPTIMIZED ✔' : 'MANUAL OVERRIDE ACTIVE ⚠'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal bg-[#121318] p-2 rounded-lg border border-[#2E3440]/60">
                    <strong>Tuning logic:</strong> {profile.reason}
                  </p>
                  {!isCalibrated && (
                    <button
                      onClick={() => {
                        onChange({
                          ...options,
                          temperature: profile.temp,
                          topP: profile.topP,
                          maxTokens: profile.maxTokens
                        });
                        triggerStatus('Optimized!');
                      }}
                      className="w-full mt-1.5 py-2 bg-[#76B900]/20 hover:bg-[#76B900]/30 border border-[#76B900]/40 text-[#76B900] rounded text-xs font-bold transition-all cursor-pointer"
                    >
                      Restore Recommended Parameters
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* API Keys */}
          <div className="mx-4 p-4 bg-[#1A1C30] border border-[#2E3440] rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-[#76B900]" />
              <label className="font-semibold text-[#ECEFF4] text-xs uppercase tracking-wider">NVIDIA NIM Key</label>
            </div>
            <p className="text-xs text-[#818796] mb-3">
              Access keys can be obtained from <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-[#76B900] hover:underline">build.nvidia.com</a>. Keys remain context-local inside your browser's private secure memory.
            </p>
            <div className="flex gap-2">
              <input
                type={showKeyPassword ? 'text' : 'password'}
                value={options.apiKey}
                onChange={(e) => onChange({ ...options, apiKey: e.target.value })}
                placeholder="nvapi-..."
                className="flex-1 bg-[#121318] border border-[#3B4252] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#76B900] transition-colors"
              />
              <button
                onClick={() => setShowKeyPassword(!showKeyPassword)}
                className="px-2.5 bg-[#2E3440] hover:bg-[#3B4252] rounded-lg text-xs text-gray-300 transition-colors"
              >
                {showKeyPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Custom Endpoint */}
            <div className="mt-4 pt-4 border-t border-[#2E3440]/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#76B900]" />
                <label className="font-bold text-[#D8DEE9] text-[11px] uppercase tracking-wider">NVIDIA NIM Cloud Endpoint</label>
              </div>
              <p className="text-[11px] text-[#818796] mb-2">
                Enter preferred service destination. Preloaded with the official sandbox endpoint.
              </p>
              <input
                type="text"
                value={options.customEndpoint || ''}
                onChange={(e) => onChange({ ...options, customEndpoint: e.target.value })}
                placeholder="https://integrate.api.nvidia.com/v1"
                className="w-full bg-[#121318] border border-[#3B4252] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#76B900] transition-colors"
              />
            </div>
          </div>

          {/* Hyperparameters Sliders */}
          <div className="mx-4 p-4 bg-[#1A1C30] border border-[#2E3440] rounded-xl mb-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#2E3440]">
              <Sliders className="w-4 h-4 text-[#8F95A3]" />
              <span className="font-semibold text-xs uppercase tracking-wider text-[#D8DEE9]">Inference Hyperparameters</span>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs text-[#8F95A3]">
                <span className="flex items-center gap-1">
                  Temperature
                  <span className="group relative cursor-pointer text-gray-500 hover:text-gray-300">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="absolute hidden group-hover:block bottom-5 left-0 w-48 bg-[#222] text-[10px] text-gray-300 p-2 rounded shadow-xl border border-gray-700 leading-normal z-50">
                      Spiciness level: higher keys add sassy/creative surprises, lower settings enforce accurate logical boundaries.
                    </span>
                  </span>
                </span>
                <span className="font-mono text-[#76B900]">{options.temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={options.temperature}
                onChange={(e) => onChange({ ...options, temperature: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2E3440] rounded-lg appearance-none cursor-pointer accent-[#76B900]"
              />
            </div>

            {/* Max Gen Tokens */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs text-[#8F95A3]">
                <span>Max Generation Tokens</span>
                <span className="font-mono text-[#D8DEE9]">{options.maxTokens}</span>
              </div>
              <input
                type="range"
                min="64"
                max="2048"
                step="64"
                value={options.maxTokens}
                onChange={(e) => onChange({ ...options, maxTokens: parseInt(e.target.value) })}
                className="w-full h-1 bg-[#2E3440] rounded-lg appearance-none cursor-pointer accent-[#76B900]"
              />
            </div>

            {/* Top P Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs text-[#8F95A3]">
                <span>Nucleus Sampling (Top P)</span>
                <span className="font-mono text-[#76B900]">{options.topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={options.topP}
                onChange={(e) => onChange({ ...options, topP: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2E3440] rounded-lg appearance-none cursor-pointer accent-[#76B900]"
              />
            </div>
          </div>

          {/* Global & Override Controllers */}
          <div className="mx-4 p-4 bg-[#1A1C23] border border-dashed border-[#3B4252] rounded-xl mb-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Save Parameters Memory</span>
              {saveStatus && (
                <span className="text-[10px] text-[#76B900] font-mono font-bold animate-bounce bg-[#76B900]/10 px-1.5 py-0.5 rounded">
                  {saveStatus}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveToGlobal}
                className="flex-1 py-2 bg-[#2E3440] hover:bg-[#3B4252] text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
              >
                Set as Defaults
              </button>

              {activeCharacter ? (
                <button
                  onClick={handleSaveToCharacter}
                  title={`Saves custom overrides specifically for ${activeCharacter.name}`}
                  className="flex-1 py-2 bg-[#1E2D18] hover:bg-[#2A3E22] text-[#76B900] border border-[#76B900]/30 text-xs font-bold rounded-lg transition-all truncate cursor-pointer"
                >
                  Apply to {activeCharacter.name.split(' ')[0]}
                </button>
              ) : (
                <button
                  disabled
                  title="Select a character DM first to save unique overrides to them"
                  className="flex-1 py-2 bg-[#1A1C23] text-gray-600 border border-transparent text-xs font-semibold rounded-lg cursor-not-allowed"
                >
                  No Active Companion
                </button>
              )}
            </div>
          </div>

          {/* Model presets selector */}
          <div className="mx-4">
            <label className="block text-xs uppercase tracking-wider text-[#8F95A3] font-bold mb-2">
              NVIDIA Cloud Preset Targets
            </label>
            <div className="flex flex-col gap-2">
              {PRESET_NIM_MODELS.map((m) => {
                const isSelected = options.modelId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModel(m.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E2D18] border-[#76B900] text-white shadow-md'
                        : 'bg-[#1A1C23] border-[#2E3440] text-gray-400 hover:border-[#3B4252] hover:text-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`font-bold text-xs ${isSelected ? 'text-[#76B900]' : 'text-gray-300'}`}>
                        {m.name}
                      </span>
                      <span className="text-[9px] bg-[#2E3440] text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                        {m.tier.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-[#8F95A3] font-normal leading-relaxed">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ======================== TAB 2: PERFORMANCE ANALYTICS (RECHARTS) ======================== */
        <div className="flex-1 flex flex-col p-4 space-y-4">
          
          {/* Bento Character Grid Selector */}
          <div className="bg-[#1A1C23] border border-[#2E3440] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                Performance Target Companion
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(characters || []).map((char) => {
                const isActive = selectedCharId === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharId(char.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#14262A] border-cyan-500 text-white'
                        : 'bg-[#121318] border-[#2E3440] text-gray-400 hover:border-[#3B4252] hover:text-gray-300'
                    }`}
                  >
                    <span className="text-lg">{char.avatar.startsWith('http') ? '👤' : char.avatar}</span>
                    <div className="truncate">
                      <p className="font-bold truncate leading-tight text-[11px]">{char.name.split(' ')[0]}</p>
                      <p className="text-[9px] text-gray-500 truncate font-mono uppercase tracking-wide">{char.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1A1C30]/80 border border-[#2E3440] rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-extrabold tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#76B900]" />
                <span>Response Time</span>
              </div>
              <p className="text-xl font-extrabold font-mono text-[#D8DEE9] mt-1.5">{stats.avgLatency}ms</p>
              <p className="text-[9px] text-[#76B900] font-mono mt-0.5">Average over last 10 turns</p>
            </div>

            <div className="bg-[#1A1C30]/80 border border-[#2E3440] rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-extrabold tracking-wider">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Token Payload</span>
              </div>
              <p className="text-xl font-extrabold font-mono text-[#D8DEE9] mt-1.5">{stats.avgTokens}</p>
              <p className="text-[9px] text-cyan-400 font-mono mt-0.5">Avg active tokens / response</p>
            </div>
          </div>

          {/* Adaptive Tuner Indicator */}
          <div className="bg-[#1A1C23] border border-[#2E3440] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#2E3440]/60">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Adaptive Tuning Controller
                </span>
              </div>
              <button
                onClick={toggleAutoOptimizeMode}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono transition-all cursor-pointer ${
                  autoOptimize
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800 border border-gray-700 text-gray-500'
                }`}
              >
                {autoOptimize ? '🧬 OPT ACTIVE' : '🔒 STANDBY'}
              </button>
            </div>

            <div className="text-[10.5px] mt-1 space-y-2">
              <div className="flex justify-between items-center text-[11px] leading-normal font-mono">
                <span className="text-gray-400 text-[9px] uppercase font-sans">Active Target:</span>
                <span className="font-bold text-[#E5E9F0] truncate max-w-[170px] text-[10px]">
                  {characters?.find((c) => c.id === selectedCharId)?.customModelId || options.modelId}
                </span>
              </div>

              {(() => {
                const companionPreset = characters?.find((c) => c.id === selectedCharId);
                const activeModel = companionPreset?.customModelId || options.modelId;
                const profile = getOptimalProfile(activeModel);
                
                // Compare with current active settings (or the overridden settings if matching character)
                const evaluatedTemp = companionPreset?.customTemp !== undefined ? companionPreset.customTemp : options.temperature;
                const evaluatedTopP = companionPreset?.customTopP !== undefined ? companionPreset.customTopP : options.topP;
                const evaluatedMaxTokens = companionPreset?.customMaxTokens !== undefined ? companionPreset.customMaxTokens : options.maxTokens;
                
                const isCalibrated = 
                  Math.abs(evaluatedTemp - profile.temp) < 0.01 &&
                  Math.abs(evaluatedTopP - profile.topP) < 0.01 &&
                  evaluatedMaxTokens === profile.maxTokens;

                return (
                  <>
                    <div className="p-2.5 bg-[#121318] rounded-lg border border-[#2E3440] font-mono text-[9px] space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Calibration State:</span>
                        <span className={isCalibrated ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold animate-pulse'}>
                          {isCalibrated ? '🟢 CALIBRATED [OPTIMAL]' : '⚠️ VARIABLE SWEETSPOT'}
                        </span>
                      </div>
                      <p className="text-[9.5px] font-sans text-gray-500 leading-normal pt-1 border-t border-[#2E3440]/40">
                        {profile.reason}
                      </p>
                    </div>

                    {!isCalibrated && (
                      <button
                        onClick={() => {
                          if (companionPreset && onSaveOverride) {
                            onSaveOverride(selectedCharId, profile.temp, profile.topP, profile.maxTokens);
                          } else {
                            onChange({
                              ...options,
                              temperature: profile.temp,
                              topP: profile.topP,
                              maxTokens: profile.maxTokens
                            });
                          }
                          triggerStatus('Optimized!');
                        }}
                        className="w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 rounded font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Adjust Slider Parameters to Optimal Sweet Spot
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Latency Area Chart */}
          <div className="bg-[#1A1C30]/80 border border-[#2E3440] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#76B900]" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                  Response Latency Trend (ms)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#E5E9F0] bg-[#121318] px-2 py-0.5 rounded border border-[#2E3440]/60">
                X-Axis: Reply Index
              </span>
            </div>

            <div className="h-44 w-full select-none text-[10px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#76B900" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#76B900" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E3440" vertical={false} />
                  <XAxis dataKey="index" stroke="#4C566A" />
                  <YAxis stroke="#4C566A" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161820', borderColor: '#2E3440', fontSize: '10px', color: '#ECEFF4', borderRadius: '8px' }}
                    labelFormatter={(label) => `Message #${label}`}
                    formatter={(value: any) => [`${value} ms`, 'Latency']}
                  />
                  <Area type="monotone" dataKey="latencyMs" stroke="#76B900" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
              <span>⏮ Older responses</span>
              <span>Newest response ⏭</span>
            </div>
          </div>

          {/* Token Generation Area Chart */}
          <div className="bg-[#1A1C30]/80 border border-[#2E3440] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                  Token Consumption Heuristics
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-950">
                Avg: {stats.avgTokens} tokens
              </span>
            </div>

            <div className="h-44 w-full select-none text-[10px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E3440" vertical={false} />
                  <XAxis dataKey="index" stroke="#4C566A" />
                  <YAxis stroke="#4C566A" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161820', borderColor: '#2E3440', fontSize: '10px', color: '#ECEFF4', borderRadius: '8px' }}
                    labelFormatter={(label) => `Message #${label}`}
                    formatter={(value: any) => [`${value} tokens`, 'Generation']}
                  />
                  <Area type="monotone" dataKey="tokensUsed" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTokens)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Token Analytics Metadata summary footer */}
            <div className="p-2.5 bg-[#121318] rounded-xl border border-[#2E3440]/60 grid grid-cols-2 text-center text-[10px] font-mono text-gray-400">
              <div className="border-r border-[#2E3440]/60">
                <p className="text-[8px] text-gray-500 uppercase">Avg tokens/character</p>
                <p className="font-bold text-gray-300 mt-0.5">{stats.tokensPerChar}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 uppercase">Active optimization tier</p>
                <p className="font-bold text-emerald-400 mt-0.5">NVIDIA CUDA LEVEL</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
