import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, Sparkles, CornerDownLeft, Globe2 } from 'lucide-react';
import { GLOBAL_PRESETS, type PromptOptions } from '../utils/cli-engine';
import { playKeyClick, playTerminalBlip } from '../utils/audio';

interface TerminalCommandPromptProps {
  onExecute: (query: string) => void;
  isLoading: boolean;
  setOptions: React.Dispatch<React.SetStateAction<PromptOptions>>;
}

export const TerminalCommandPrompt: React.FC<TerminalCommandPromptProps> = ({
  onExecute,
  isLoading,
  setOptions,
}) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([
    'forge "Voglio un prompt per analizzare bilanci aziendali con alert sui flussi di cassa"',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed || isLoading) return;

    // Add to history
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)]);
    setHistoryIndex(-1);

    onExecute(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playKeyClick();
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setCommand(history[prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Escape') {
      setCommand('');
      setHistoryIndex(-1);
    }
  };

  const handleSelectPreset = (preset: (typeof GLOBAL_PRESETS)[0]) => {
    playTerminalBlip();
    setCommand(preset.description);
    setOptions(prev => ({
      ...prev,
      targetModel: preset.model,
      promptStyle: preset.style,
    }));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Global Language Quick-Launch Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-zinc-400 select-none no-scrollbar">
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0">
          <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>GLOBAL PRESETS:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-nowrap">
          {GLOBAL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelectPreset(preset)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer"
            >
              <span>{preset.flag}</span>
              <span className="font-medium">{preset.lang}</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">· {preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Terminal Command Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#07090e] border border-zinc-800/90 rounded-lg p-3 sm:p-4 shadow-xl focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* CLI Prompt Symbol */}
          <div className="flex items-center gap-2 text-emerald-400 font-bold shrink-0 select-none">
            <span className="text-zinc-500 hidden sm:inline">user@promptforge:~$</span>
            <span className="text-emerald-400 font-bold text-sm">$</span>
          </div>

          {/* Interactive Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder='Scrivi ciò che vuoi creare in qualsiasi lingua... (es: "bot di trading", "cyberpunk scene 8k", "code reviewer")'
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono text-xs sm:text-sm py-1.5 tracking-wide"
            />
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            {command && (
              <button
                type="button"
                onClick={() => setCommand('')}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2 py-1"
              >
                CLEAR
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !command.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:shadow-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>SYNTHESIZE</span>
                  <CornerDownLeft className="w-3 h-3 text-black/70" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Helper hints */}
        <div className="mt-2.5 pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2 select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[10px]">⏎ ENTER</kbd> Synthesize
            </span>
            <span className="hidden sm:inline">
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[10px]">↑/↓</kbd> History
            </span>
            <span className="hidden sm:inline">
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[10px]">ESC</kbd> Reset
            </span>
          </div>

          <div className="flex items-center gap-1 text-zinc-400">
            <span>Input: </span>
            <span className="text-emerald-400 font-semibold">Tutte le lingue del mondo</span>
            <span>· Output: </span>
            <span className="text-amber-300 font-semibold">Millimetric Precision</span>
          </div>
        </div>
      </form>
    </div>
  );
};
