import React, { useState } from 'react';
import {
  Copy,
  Check,
  Play,
  Download,
  Share2,
  FileCode,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { GeneratedPrompt } from '../utils/cli-engine';
import { formatPromptForExport } from '../utils/cli-engine';
import { playTerminalSuccess, playTerminalBlip } from '../utils/audio';

interface PromptViewerProps {
  prompt: GeneratedPrompt;
  onOpenDryRun: () => void;
}

export const PromptViewer: React.FC<PromptViewerProps> = ({ prompt, onOpenDryRun }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'full' | 'system' | 'user' | 'variables'>('full');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      playTerminalSuccess();
      setCopiedFormat(label);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    playTerminalBlip();
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDisplayedContent = () => {
    switch (activeTab) {
      case 'system':
        return prompt.systemInstruction;
      case 'user':
        return prompt.userPrompt;
      case 'variables':
        return prompt.variables.length > 0
          ? JSON.stringify(prompt.variables, null, 2)
          : '// No variables defined in this prompt template.';
      case 'full':
      default:
        return prompt.fullPrompt;
    }
  };

  const contentToDisplay = getDisplayedContent();
  const lines = contentToDisplay.split('\n');

  return (
    <div className="border border-zinc-800/90 bg-zinc-950/80 rounded-lg overflow-hidden shadow-2xl font-mono text-xs">
      {/* Top Meta Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-emerald-400 font-bold text-sm tracking-wide">
              {prompt.title}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{prompt.detectedDomain}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-cyan-400 font-semibold">{prompt.detectedLanguage}</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed max-w-2xl">
            {prompt.summary}
          </p>
        </div>

        {/* Precision metrics */}
        <div className="flex items-center gap-3 text-[11px] bg-zinc-950/80 border border-zinc-800/80 px-3 py-1.5 rounded">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-500">PRECISION:</span>
            <span className="text-amber-300 font-bold tracking-wider">
              {prompt.metrics.precisionRating}
            </span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <span className="text-zinc-500">TOKENS:</span>
            <span className="text-emerald-400 font-semibold">~{prompt.metrics.tokenCount}</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <span className="text-zinc-500">MODEL:</span>
            <span className="text-zinc-200">{prompt.targetModel}</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs & Action Toolbar */}
      <div className="bg-zinc-950/90 border-b border-zinc-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Tab switcher */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              playTerminalBlip();
              setActiveTab('full');
            }}
            className={`px-3 py-1 rounded text-[11px] transition-colors border ${
              activeTab === 'full'
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-medium'
                : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            Complete Prompt
          </button>

          <button
            type="button"
            onClick={() => {
              playTerminalBlip();
              setActiveTab('system');
            }}
            className={`px-3 py-1 rounded text-[11px] transition-colors border ${
              activeTab === 'system'
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-medium'
                : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            System Instruction
          </button>

          <button
            type="button"
            onClick={() => {
              playTerminalBlip();
              setActiveTab('user');
            }}
            className={`px-3 py-1 rounded text-[11px] transition-colors border ${
              activeTab === 'user'
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-medium'
                : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            User Trigger Template
          </button>

          {prompt.variables.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playTerminalBlip();
                setActiveTab('variables');
              }}
              className={`px-3 py-1 rounded text-[11px] transition-colors border ${
                activeTab === 'variables'
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-medium'
                  : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              Variables ({prompt.variables.length})
            </button>
          )}
        </div>

        {/* Actions: Copy, Run Dry Test, Export */}
        <div className="flex items-center gap-2">
          {/* In-Terminal Test */}
          <button
            type="button"
            onClick={() => {
              playTerminalBlip();
              onOpenDryRun();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer font-semibold"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>TEST PROMPT IN CLI</span>
          </button>

          {/* Copy button */}
          <button
            type="button"
            onClick={() => copyToClipboard(prompt.fullPrompt, 'full')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            {copiedFormat === 'full' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY</span>
              </>
            )}
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            type="button"
            onClick={() =>
              downloadFile(
                formatPromptForExport(prompt, 'markdown'),
                `${prompt.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_prompt.md`,
                'text/markdown'
              )
            }
            title="Download as Markdown"
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(formatPromptForExport(prompt, 'cli'), 'cli')}
            title="Copy as cURL command"
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code / Prompt Body with Line Numbers */}
      <div className="max-h-[460px] overflow-y-auto p-4 bg-[#07090e] font-mono text-zinc-300 selection:bg-emerald-800 selection:text-white">
        <div className="space-y-0.5">
          {lines.map((line, idx) => {
            const isXmlTag = line.trim().startsWith('<') && line.trim().endsWith('>');
            const isHeading = line.trim().startsWith('#');
            const hasVariable = line.includes('{{') && line.includes('}}');

            return (
              <div key={idx} className="flex items-start hover:bg-zinc-900/40 px-1 py-0.5 rounded group">
                <span className="w-10 select-none text-right pr-4 text-zinc-600 group-hover:text-zinc-400 text-[11px]">
                  {idx + 1}
                </span>
                <span
                  className={`flex-1 whitespace-pre-wrap break-words leading-relaxed ${
                    isXmlTag
                      ? 'text-cyan-400 font-semibold'
                      : isHeading
                      ? 'text-emerald-400 font-bold'
                      : hasVariable
                      ? 'text-amber-200'
                      : 'text-zinc-300'
                  }`}
                >
                  {line || ' '}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guardrails & Tuning Tips Footer */}
      {(prompt.negativeConstraints.length > 0 || prompt.tuningTips.length > 0) && (
        <div className="border-t border-zinc-800/80 bg-zinc-950/90 p-3 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Negative Guardrails */}
          {prompt.negativeConstraints.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>ZERO-HALLUCINATION GUARDRAILS:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-zinc-400 pl-4 list-disc">
                {prompt.negativeConstraints.map((constraint, i) => (
                  <li key={i}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Tuning Recommendations */}
          {prompt.tuningTips.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>PERFORMANCE TUNING TIPS:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-zinc-400 pl-4 list-disc">
                {prompt.tuningTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
