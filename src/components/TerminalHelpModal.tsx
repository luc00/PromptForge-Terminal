import React from 'react';
import { X, Terminal, Globe, Code2, ShieldAlert, Cpu } from 'lucide-react';
import { playTerminalBlip } from '../utils/audio';

interface TerminalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalHelpModal: React.FC<TerminalHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-zinc-100">
              PROMPT_FORGE<span className="text-emerald-400">::</span>MANUAL & CLI_REFERENCE
            </span>
          </div>

          <button
            onClick={() => {
              playTerminalBlip();
              onClose();
            }}
            aria-label="Close help manual"
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-zinc-300">
          {/* Universal Language Support */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Globe className="w-4 h-4" />
              <span>UNIVERSAL MULTILINGUAL SYNTHESIZER</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              PromptForge automatically parses queries in <strong>any language in the world</strong> (Italiano, English, Español, Français, Deutsch, 日本語, 中文, العربية, etc.). The AI meta-architect understands cultural nuances, technical jargon, and domain boundaries, synthesizing a prompt calibrated to 0.01mm precision.
            </p>
          </div>

          {/* Commands Reference */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Code2 className="w-4 h-4" />
              <span>CLI COMMANDS & USAGE</span>
            </div>
            <div className="bg-[#07090e] border border-zinc-800/80 rounded p-3 space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-emerald-400">$ forge "your concept in any language"</span>
                <span className="text-zinc-500 block">Synthesize prompt (also works without typing 'forge')</span>
              </div>
              <div>
                <span className="text-emerald-400">$ test "sample payload"</span>
                <span className="text-zinc-500 block">Run test execution simulation on the current active prompt</span>
              </div>
              <div>
                <span className="text-emerald-400">$ export --format=markdown|json|xml|cli</span>
                <span className="text-zinc-500 block">Export or copy synthesized prompt structure</span>
              </div>
              <div>
                <span className="text-emerald-400">$ clear</span>
                <span className="text-zinc-500 block">Clear terminal session output log</span>
              </div>
              <div>
                <span className="text-emerald-400">$ help</span>
                <span className="text-zinc-500 block">Display this manual</span>
              </div>
            </div>
          </div>

          {/* CLI Flags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>AVAILABLE CLI FLAGS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                <code className="text-amber-300">--model=claude|gpt|gemini|deepseek|flux</code>
                <div className="text-zinc-400 text-[10px] mt-0.5">Target model optimization</div>
              </div>
              <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                <code className="text-amber-300">--style=architect|cot|code|art</code>
                <div className="text-zinc-400 text-[10px] mt-0.5">Architecture scaffolding</div>
              </div>
              <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                <code className="text-amber-300">--vars</code>
                <div className="text-zinc-400 text-[10px] mt-0.5">Inject dynamic {`{{variables}}`}</div>
              </div>
              <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                <code className="text-amber-300">--precision=surgical</code>
                <div className="text-zinc-400 text-[10px] mt-0.5">Zero-tolerance boundary rules</div>
              </div>
            </div>
          </div>

          {/* Prompt Engineering Constitution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>THE 0.01mm MILLIMETRIC STANDARD</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Every synthesized prompt incorporates:
              <br />1. Unambiguous Identity & Operational Scope
              <br />2. Zero-Hallucination Negative Constraints
              <br />3. Explicit Input/Output contracts (JSON / XML schemas)
              <br />4. Model-specific tokens (Thinking triggers, lens optics for Flux, XML tags for Claude)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/80 border-t border-zinc-800 px-4 py-2 flex justify-between items-center text-[11px] text-zinc-500">
          <span>PromptForge Global Synthesis Protocol</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 hover:underline"
          >
            [CLOSE ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
