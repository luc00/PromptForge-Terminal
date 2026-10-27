import React, { useState } from 'react';
import { X, Play, Loader2, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GeneratedPrompt } from '../utils/cli-engine';
import { playTerminalSuccess, playKeyClick, playTerminalBlip } from '../utils/audio';

interface DryRunTerminalModalProps {
  prompt: GeneratedPrompt;
  isOpen: boolean;
  onClose: () => void;
}

export const DryRunTerminalModal: React.FC<DryRunTerminalModalProps> = ({
  prompt,
  isOpen,
  onClose,
}) => {
  const [testInput, setTestInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRunning) return;

    setIsRunning(true);
    setError(null);
    setOutput(null);
    playKeyClick();

    try {
      const res = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: prompt.systemInstruction,
          userPrompt: prompt.userPrompt,
          testInput: testInput.trim(),
          model: prompt.targetModel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setOutput(data.output);
      setDuration(data.durationMs);
      playTerminalSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute dry run');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[90vh]">
        {/* Terminal Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-zinc-100">
              DRY_RUN_SANDBOX<span className="text-emerald-400">::</span>{prompt.title}
            </span>
          </div>

          <button
            onClick={() => {
              playTerminalBlip();
              onClose();
            }}
            aria-label="Close test sandbox"
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Active Prompt Info */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded p-3 text-zinc-300 space-y-1">
            <div className="text-zinc-400 text-[11px]">ACTIVE SYSTEM CONTRACT:</div>
            <div className="text-emerald-300 font-semibold line-clamp-2">
              {prompt.systemInstruction.slice(0, 180)}...
            </div>
          </div>

          {/* Input Formulation */}
          <form onSubmit={handleRunTest} className="space-y-2">
            <label htmlFor="dry-run-input" className="block text-zinc-400 font-semibold">
              TEST PAYLOAD / VARIABLE INJECTION (Optional):
            </label>
            <textarea
              id="dry-run-input"
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              placeholder="e.g. Paste a real balance sheet, sample code with a bug, or an essay to test prompt compliance..."
              rows={3}
              className="w-full bg-[#07090e] border border-zinc-800 rounded p-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono text-xs resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTestInput('');
                  setOutput(null);
                  setError(null);
                }}
                className="px-3 py-1.5 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                CLEAR
              </button>

              <button
                type="submit"
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SIMULATING...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>EXECUTE TEST (GEMINI 3.8)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test Output Monitor */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">EXECUTION_ERROR: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-1">
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SIMULATED MODEL OUTPUT</span>
                </div>
                {duration && (
                  <span className="text-zinc-500 font-mono">EXEC_TIME: {duration}ms</span>
                )}
              </div>

              <div className="p-3 bg-[#07090e] border border-zinc-800/80 rounded max-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono text-zinc-300 leading-relaxed">
                {output}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/80 border-t border-zinc-800 px-4 py-2 flex justify-between items-center text-[11px] text-zinc-500">
          <span>Live API Test Execution via Server Bridge</span>
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
