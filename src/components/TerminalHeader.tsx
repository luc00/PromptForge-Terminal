import React from 'react';
import { Terminal, Volume2, VolumeX, Eye, HelpCircle, Server } from 'lucide-react';
import { playTerminalBlip } from '../utils/audio';

interface TerminalHeaderProps {
  scanlines: boolean;
  setScanlines: (fn: (prev: boolean) => boolean) => void;
  soundOn: boolean;
  toggleSound: () => void;
  onOpenHelp: () => void;
  serverStatus: 'online' | 'connecting' | 'offline';
  promptCount: number;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  scanlines,
  setScanlines,
  soundOn,
  toggleSound,
  onOpenHelp,
  serverStatus,
  promptCount,
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur select-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Terminal Window dots and Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide text-zinc-100">
              PROMPT_FORGE<span className="text-emerald-400">::</span>TERMINAL
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline font-mono">v2.4.0</span>
          </div>
        </div>

        {/* Global Node & Status Information */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline text-zinc-500">NODE:</span>
            <span className="text-zinc-300">GLOBAL-ANYLANG</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : serverStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-400'
              }`}
            />
            <span className="text-zinc-300 uppercase">{serverStatus}</span>
          </div>

          {promptCount > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-zinc-500">
              <span>SYNTHESIZED:</span>
              <span className="text-emerald-400 font-semibold">{promptCount}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
            <button
              onClick={() => {
                playTerminalBlip();
                setScanlines(s => !s);
              }}
              aria-label="Toggle CRT Scanlines"
              title="Toggle CRT Scanline Texture"
              className={`p-1.5 rounded transition-colors ${
                scanlines ? 'text-emerald-400 bg-emerald-950/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                toggleSound();
                playTerminalBlip();
              }}
              aria-label={soundOn ? 'Mute terminal audio' : 'Enable terminal audio'}
              title={soundOn ? 'Mute Audio' : 'Enable Audio'}
              className={`p-1.5 rounded transition-colors ${
                soundOn ? 'text-emerald-400 bg-emerald-950/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                playTerminalBlip();
                onOpenHelp();
              }}
              aria-label="Open command documentation"
              title="CLI Manual & Documentation"
              className="p-1.5 rounded text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
