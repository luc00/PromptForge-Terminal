import React from 'react';
import { Cpu, Layers, Sliders, Hash, ShieldAlert } from 'lucide-react';
import type { PromptOptions } from '../utils/cli-engine';
import { playKeyClick } from '../utils/audio';

interface ModelSelectorBarProps {
  options: PromptOptions;
  setOptions: React.Dispatch<React.SetStateAction<PromptOptions>>;
  disabled?: boolean;
}

export const ModelSelectorBar: React.FC<ModelSelectorBarProps> = ({
  options,
  setOptions,
  disabled = false,
}) => {
  const models = [
    { id: 'claude-3-7-sonnet', label: 'Claude 3.7', desc: 'XML Tags & Thinking' },
    { id: 'gpt-4o-o1', label: 'GPT-4o / o1', desc: 'Reasoning & Schemas' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Massive Context' },
    { id: 'deepseek-r1', label: 'DeepSeek R1', desc: 'Math & CoT Proofs' },
    { id: 'flux-midjourney', label: 'Flux / MJ v6', desc: 'Optics & Photometry' },
    { id: 'universal-llm', label: 'Universal Core', desc: 'Open LLM Standard' },
  ] as const;

  const styles = [
    { id: 'system-architect', label: 'System Master' },
    { id: 'cot-chain', label: 'Chain of Thought' },
    { id: 'code-engineer', label: 'Code Engineer' },
    { id: 'roleplay-agent', label: 'Agent Persona' },
    { id: 'creative-art', label: 'Visual Directing' },
    { id: 'few-shot', label: 'Few-Shot Scaffold' },
  ] as const;

  return (
    <div className="bg-zinc-950/70 border-b border-zinc-800/80 p-3 sm:px-4 text-xs font-mono space-y-3">
      {/* Target Model Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400 shrink-0 w-32">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold tracking-wider text-zinc-300">TARGET_AI:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {models.map(m => {
            const active = options.targetModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  playKeyClick();
                  setOptions(prev => ({
                    ...prev,
                    targetModel: m.id,
                    promptStyle: m.id === 'flux-midjourney' ? 'creative-art' : prev.promptStyle,
                  }));
                }}
                className={`px-2.5 py-1 rounded transition-all text-left flex items-center gap-1.5 border ${
                  active
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-semibold'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>{m.label}</span>
                <span className="text-[10px] text-zinc-500 hidden md:inline">({m.desc})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Architecture & Precision row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-zinc-900">
        {/* Prompt Style selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-zinc-400 shrink-0 w-32">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-zinc-300">ARCHITECTURE:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {styles.map(s => {
              const active = options.promptStyle === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    playKeyClick();
                    setOptions(prev => ({ ...prev, promptStyle: s.id }));
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors border ${
                    active
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 font-medium'
                      : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Precision Level & Switches */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Precision Meter */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/60 rounded px-2 py-1">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-zinc-400">TOLERANCE:</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                playKeyClick();
                setOptions(prev => ({
                  ...prev,
                  precisionLevel:
                    prev.precisionLevel === 'surgical'
                      ? 'balanced'
                      : prev.precisionLevel === 'balanced'
                      ? 'concise'
                      : 'surgical',
                }));
              }}
              className="text-[11px] text-amber-300 font-bold hover:underline capitalize"
            >
              {options.precisionLevel === 'surgical' ? '0.01mm SURGICAL' : options.precisionLevel}
            </button>
          </div>

          {/* Variables Toggle */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              playKeyClick();
              setOptions(prev => ({ ...prev, includeVariables: !prev.includeVariables }));
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              options.includeVariables
                ? 'bg-zinc-800/80 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <Hash className="w-3 h-3" />
            <span>VARIABLES {'{{var}}'}</span>
            <span className="text-[10px] ml-0.5 font-bold">
              [{options.includeVariables ? 'ON' : 'OFF'}]
            </span>
          </button>

          {/* Negative Guardrails Toggle */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              playKeyClick();
              setOptions(prev => ({
                ...prev,
                includeNegativeConstraints: !prev.includeNegativeConstraints,
              }));
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              options.includeNegativeConstraints
                ? 'bg-zinc-800/80 border-red-500/50 text-red-300'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>GUARDRAILS</span>
            <span className="text-[10px] ml-0.5 font-bold">
              [{options.includeNegativeConstraints ? 'ON' : 'OFF'}]
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
