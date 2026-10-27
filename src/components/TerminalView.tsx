import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Volume2,
  VolumeX,
  Eye,
  Cpu,
  Layers,
  Copy,
  Check,
  Play,
  Download,
  FileCode,
  Globe2,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  CornerDownLeft,
  Trash2,
  Sliders,
  Paperclip,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import {
  parseCliCommand,
  formatPromptForExport,
  estimatePromptTokens,
  GLOBAL_PRESETS,
  type PromptOptions,
  type GeneratedPrompt,
} from '../utils/cli-engine';
import {
  playKeyClick,
  playTerminalSuccess,
  playTerminalBlip,
  toggleTerminalSound,
  isSoundEnabled,
} from '../utils/audio';
import { DecompileAssetModal } from './DecompileAssetModal';

type TerminalTheme = 'matrix' | 'amber' | 'cyan' | 'mono';

interface TerminalEntry {
  id: string;
  type: 'command' | 'log' | 'prompt' | 'test-result' | 'system' | 'help' | 'table';
  text?: string;
  prompt?: GeneratedPrompt;
  timestamp?: string;
}

export const TerminalView: React.FC = () => {
  const [theme, setTheme] = useState<TerminalTheme>('matrix');
  const [scanlines, setScanlines] = useState(true);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDecompilerOpen, setIsDecompilerOpen] = useState(false);

  const [options, setOptions] = useState<PromptOptions>({
    input: '',
    targetModel: 'claude-3-7-sonnet',
    promptStyle: 'system-architect',
    precisionLevel: 'surgical',
    includeVariables: true,
    includeNegativeConstraints: true,
    outputLanguage: 'keep-source',
  });

  const mainRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial seed prompt
  const initialPrompt: GeneratedPrompt = {
    id: 'seed-01',
    timestamp: new Date().toISOString(),
    title: 'Senior Full-Stack Code Reviewer & Security Sentinel',
    detectedLanguage: 'English (Universal)',
    detectedDomain: 'Systems Architecture & Cloud Security',
    targetModel: 'claude-3-7-sonnet',
    promptStyle: 'code-engineer',
    summary:
      'Zero-tolerance code reviewer specialized in memory safety, race conditions, OWASP Top 10 vulnerabilities, and scalable TypeScript/Node architecture with 0.01mm mathematical precision.',
    systemInstruction: `<role_and_identity>
You are the Principal Systems Architect and Lead Security Sentinel.
Your mandate is to inspect codebases, merge requests, and system architectures with surgical precision, identifying security vulnerabilities, race conditions, memory leaks, and contract violations before deployment.
</role_and_identity>

<strict_rules_and_constraints>
1. Zero Speculation Standard: Base all architectural critiques strictly on provided source code or verified runtime invariants. If source context is incomplete, explicitly flag "[MISSING_CODE_ARTIFACT: file/function]".
2. Tone & Conciseness: Surgical, authoritative, direct. Omit pleasantries, preambles, and conversational filler.
3. Proof & Reproduction: Every flagged vulnerability must include an exact line reference, exploit condition, and minimal hardened patch.
4. Output Schema:
   - EXECUTIVE SUMMARY (Critical / High / Medium / Low severity counts)
   - VULNERABILITY MATRIX (CWE ID, impact, reproduction vector)
   - HARDENED REFACTOR SNIPPETS (Complete runnable drop-in replacements)
   - CI/CD STATIC AUDIT RULES (Lint or SAST rules to prevent regressions)
</strict_rules_and_constraints>

<output_contract>
Return structured Markdown conforming strictly to industry DevSecOps standards.
</output_contract>`,
    userPrompt: `Execute security and architectural audit on the following payload:

Source Code / Architecture:
{{source_code}}

Target Runtime & Framework:
{{runtime_target: "Node.js 22 LTS / TypeScript 5.5"}}

Security Threat Model:
{{threat_model: "Public Internet-facing API / Zero-Trust"}}`,
    fullPrompt: `<role_and_identity>
You are the Principal Systems Architect and Lead Security Sentinel.
Your mandate is to inspect codebases, merge requests, and system architectures with surgical precision, identifying security vulnerabilities, race conditions, memory leaks, and contract violations before deployment.
</role_and_identity>

<strict_rules_and_constraints>
1. Zero Speculation Standard: Base all architectural critiques strictly on provided source code or verified runtime invariants. If source context is incomplete, explicitly flag "[MISSING_CODE_ARTIFACT: file/function]".
2. Tone & Conciseness: Surgical, authoritative, direct. Omit pleasantries, preambles, and conversational filler.
3. Proof & Reproduction: Every flagged vulnerability must include an exact line reference, exploit condition, and minimal hardened patch.
4. Output Schema:
   - EXECUTIVE SUMMARY (Critical / High / Medium / Low severity counts)
   - VULNERABILITY MATRIX (CWE ID, impact, reproduction vector)
   - HARDENED REFACTOR SNIPPETS (Complete runnable drop-in replacements)
   - CI/CD STATIC AUDIT RULES (Lint or SAST rules to prevent regressions)
</strict_rules_and_constraints>

<output_contract>
Return structured Markdown conforming strictly to industry DevSecOps standards.
</output_contract>

---

### USER TEMPLATE:
Execute security and architectural audit on the following payload:

Source Code / Architecture:
{{source_code}}

Target Runtime & Framework:
{{runtime_target: "Node.js 22 LTS / TypeScript 5.5"}}

Security Threat Model:
{{threat_model: "Public Internet-facing API / Zero-Trust"}}`,
    variables: [
      {
        name: 'source_code',
        description: 'Raw source code snippet, diff, or system architecture payload to be reviewed',
        placeholder: 'Insert code or PR diff here...',
      },
      {
        name: 'runtime_target',
        description: 'Target programming language runtime and library ecosystem',
        placeholder: 'Node.js 22 LTS / TypeScript 5.5',
      },
      {
        name: 'threat_model',
        description: 'Operational security exposure and trust boundary level',
        placeholder: 'Public Internet-facing API / Zero-Trust',
      },
    ],
    negativeConstraints: [
      'Never dismiss or ignore unchecked error returns or unbounded buffer allocations.',
      'Never use placeholder comments ("// rest of code here") in remediation blocks.',
      'Never open response with conversational preambles ("Sure!", "Here is your review").',
    ],
    tuningTips: [
      'Use Claude 3.7 Sonnet with temperature 0.15 for maximum deterministic audit fidelity.',
      'Enable Extended Thinking (budget >= 4000 tokens) for complex race condition tracing.',
      'Enclose input source snippets inside explicit XML tags to prevent prompt injection.',
    ],
    metrics: {
      tokenCount: 420,
      charCount: 2050,
      precisionRating: 'Millimetric Surgical',
      modelFit: 'Claude 3.7 Sonnet (XML Tagging & Extended Reasoning)',
    },
  };

  const [activePrompt, setActivePrompt] = useState<GeneratedPrompt>(initialPrompt);

  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 'boot-1',
      type: 'system',
      text: `================================================================================
PROMPTFORGE GLOBAL CLI :: MILLIMETRIC AI PROMPT ARCHITECT v2.4.0
================================================================================
[*] Node: Global Multi-Lingual Socket (0.0.0.0:3000)
[*] Universal Natural Language Parser: READY (English, Italian, Spanish, Japanese, etc.)
[*] Target AI Engine: CLAUDE-3.7-SONNET (Extended Thinking & XML Tags)
[*] Standard: 0.01mm Surgical Precision (Zero conversational fluff, hard schemas)
--------------------------------------------------------------------------------
Type what you want to engineer in ANY WORLD LANGUAGE, or use CLI commands:
- 'forge <query>' : synthesize millimetric prompt (or type your query directly)
- 'reverse <url>' : decompile image, photo, UI/UX template, or 3D/2D model link
- 'reverse'       : open multimodal asset attachment dialog
- 'test <payload>': run live diagnostic simulation of the active prompt
- 'model <name>'  : switch target model (claude | gpt | gemini | deepseek | flux | universal)
- 'copy'          : copy active prompt to clipboard
- 'presets'       : display multilingual preset table
- 'help'          : command manual & CLI options reference
================================================================================`,
    },
    {
      id: 'boot-prompt',
      type: 'prompt',
      prompt: initialPrompt,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Keep terminal buffer scrolled to bottom only when new user entries are added
  useEffect(() => {
    if (entries.length > 2 && mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [entries.length, isLoading]);

  const addEntry = (entry: Omit<TerminalEntry, 'id'>) => {
    setEntries(prev => [...prev, { ...entry, id: `entry-${Date.now()}-${Math.random()}` }]);
  };

  const handleCopyPrompt = async (promptToCopy: GeneratedPrompt) => {
    try {
      await navigator.clipboard.writeText(promptToCopy.fullPrompt);
      playTerminalSuccess();
      setCopiedId(promptToCopy.id);
      addEntry({
        type: 'log',
        text: `[✓] COPIED TO CLIPBOARD: ${promptToCopy.metrics.charCount} characters (~${promptToCopy.metrics.tokenCount} tokens) ready for ${promptToCopy.targetModel}.`,
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      addEntry({ type: 'log', text: `[!] Failed to access system clipboard.` });
    }
  };

  const handleDownload = (promptToDownload: GeneratedPrompt, format: 'markdown' | 'json' | 'xml' | 'cli') => {
    playTerminalBlip();
    const content = formatPromptForExport(promptToDownload, format);
    const mime = format === 'json' ? 'application/json' : 'text/plain';
    const ext = format === 'json' ? 'json' : format === 'xml' ? 'xml' : format === 'cli' ? 'sh' : 'md';
    const filename = `${promptToDownload.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_prompt.${ext}`;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addEntry({
      type: 'log',
      text: `[✓] EXPORTED: File saved as ${filename} (${content.length} bytes).`,
    });
  };

  const runTestPrompt = async (targetPrompt: GeneratedPrompt, testPayload?: string) => {
    playKeyClick();
    addEntry({
      type: 'log',
      text: `[*] EXECUTING DRY-RUN SANDBOX VIA GLOBAL SERVER BRIDGE...
[payload]: "${testPayload || '(empty diagnostic payload)'}"`,
    });

    try {
      const res = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: targetPrompt.systemInstruction,
          userPrompt: targetPrompt.userPrompt,
          testInput: testPayload || '',
          model: targetPrompt.targetModel,
        }),
      });

      const data = await res.json();
      playTerminalSuccess();
      addEntry({
        type: 'test-result',
        text: `┌── [TEST EXECUTION MONITOR :: LATENCY: ${data.durationMs || 84}ms] ──────────────────────────
${data.output}
└─────────────────────────────────────────────────────────────────────────────────────────────`,
      });
    } catch (err: any) {
      addEntry({
        type: 'log',
        text: `[!] TEST RUN FAILED: ${err?.message || 'Server connection error'}`,
      });
    }
  };

  const handleExecuteCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    playKeyClick();
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)]);
    setHistoryIndex(-1);
    setCommandInput('');

    // Echo command in terminal output
    addEntry({
      type: 'command',
      text: `user@promptforge:~$ ${trimmed}`,
      timestamp: new Date().toLocaleTimeString(),
    });

    const parsed = parseCliCommand(trimmed);

    // 1. CLEAR COMMAND
    if (parsed.command === 'clear') {
      setEntries([]);
      return;
    }

    // 2. HELP COMMAND
    if (parsed.command === 'help') {
      addEntry({
        type: 'help',
        text: `┌── [PROMPTFORGE MANUAL & COMMAND REFERENCE] ──────────────────────────────────────────┐
│                                                                                       │
│  GENERAL SYNTAX:                                                                      │
│    forge "<prompt query in any language>" [--model=<name>] [--style=<style>]          │
│    (or simply type your query directly without the 'forge' keyword)                   │
│                                                                                       │
│  CONTROL COMMANDS:                                                                    │
│    model <claude|gpt|gemini|deepseek|flux|universal> : Switch target AI model         │
│    style <architect|cot|code|agent|art|few-shot>     : Switch prompt architecture     │
│    theme <matrix|amber|cyan|mono>                    : Switch CRT phosphor theme      │
│    reverse [image/3d/ui URL]                         : Decompile asset into prompt    │
│    vars <on|off>                                     : Toggle {{variables}} injection │
│    guardrails <on|off>                               : Toggle zero-hallucination rules│
│    test [optional payload]                           : Run diagnostic dry-run sandbox │
│    copy                                              : Copy active prompt to clipboard│
│    export <md|json|xml|cli>                          : Export prompt in chosen format │
│    presets                                           : List global multilingual presets│
│    clear                                             : Clear terminal screen          │
│                                                                                       │
│  SUPPORTED WORLD LANGUAGES:                                                           │
│    ALL. The universal parser automatically detects English, Italian, Spanish,         │
│    Japanese, Arabic, German, French, Chinese, Russian, Portuguese, etc., applying     │
│    model-specific 0.01mm prompt engineering standards.                                │
└───────────────────────────────────────────────────────────────────────────────────────┘`,
      });
      return;
    }

    // 2.5 REVERSE-ENGINEER COMMAND
    if (parsed.command === 'reverse') {
      const url = parsed.query || '';
      if (!url) {
        setIsDecompilerOpen(true);
        addEntry({
          type: 'log',
          text: `[*] OPENING MULTIMODAL DECOMPILER (Attach image, photo, 3D/2D model, or paste URL)...`,
        });
        return;
      }

      setIsLoading(true);
      addEntry({
        type: 'log',
        text: `[*] INGESTING REMOTE ASSET: "${url}"
[*] RUNNING MULTIMODAL COMPUTER VISION DECOMPILER...`,
      });

      try {
        const res = await fetch('/api/reverse-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: url,
            assetType: 'auto',
            targetModel: options.targetModel,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP error ${res.status}`);
        }

        const generated: GeneratedPrompt = await res.json();
        setActivePrompt(generated);
        playTerminalSuccess();

        addEntry({
          type: 'log',
          text: `[✓] ASSET REVERSE-ENGINEERED:
    Title: "${generated.title}"
    Target Engine: ${generated.targetModel}
    Domain: ${generated.detectedDomain}
    Precision: ${generated.metrics.precisionRating} (0.01mm)
    Tokens: ~${generated.metrics.tokenCount}`,
        });

        addEntry({
          type: 'prompt',
          prompt: generated,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (err: any) {
        addEntry({
          type: 'log',
          text: `[!] REVERSE DECOMPILE FAILED: ${err?.message || 'Server error'}`,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. COPY COMMAND
    if (parsed.command === 'copy') {
      handleCopyPrompt(activePrompt);
      return;
    }

    // 4. TEST COMMAND
    if (parsed.command === 'test') {
      await runTestPrompt(activePrompt, parsed.query);
      return;
    }

    // 5. EXPORT COMMAND
    if (parsed.command === 'export') {
      const format = (parsed.flags.format || parsed.query || 'markdown').toLowerCase() as any;
      handleDownload(activePrompt, ['json', 'xml', 'cli'].includes(format) ? format : 'markdown');
      return;
    }

    // 6. THEME COMMAND
    if (parsed.command === 'theme') {
      const targetTheme = parsed.query.toLowerCase();
      if (['matrix', 'amber', 'cyan', 'mono'].includes(targetTheme)) {
        setTheme(targetTheme as TerminalTheme);
        addEntry({ type: 'log', text: `[✓] Phosphor color theme set to: ${targetTheme.toUpperCase()}` });
      } else {
        addEntry({ type: 'log', text: `[!] Available themes: matrix | amber | cyan | mono` });
      }
      return;
    }

    // 7. MODEL COMMAND
    if (parsed.command === 'model') {
      const m = parsed.query.toLowerCase();
      const modelMap: Record<string, PromptOptions['targetModel']> = {
        claude: 'claude-3-7-sonnet',
        'claude-3-7-sonnet': 'claude-3-7-sonnet',
        gpt: 'gpt-4o-o1',
        'gpt-4o-o1': 'gpt-4o-o1',
        gemini: 'gemini-2.5-pro',
        'gemini-2.5-pro': 'gemini-2.5-pro',
        deepseek: 'deepseek-r1',
        'deepseek-r1': 'deepseek-r1',
        flux: 'flux-midjourney',
        midjourney: 'flux-midjourney',
        'flux-midjourney': 'flux-midjourney',
        universal: 'universal-llm',
        'universal-llm': 'universal-llm',
      };
      if (modelMap[m]) {
        setOptions(prev => ({ ...prev, targetModel: modelMap[m] }));
        addEntry({ type: 'log', text: `[✓] Target AI Model changed to: ${modelMap[m].toUpperCase()}` });
      } else {
        addEntry({
          type: 'log',
          text: `[!] Unknown model. Choose: claude | gpt | gemini | deepseek | flux | universal`,
        });
      }
      return;
    }

    // 8. PRESETS COMMAND
    if (parsed.command === 'presets') {
      addEntry({
        type: 'table',
        text: `┌── [GLOBAL MULTILINGUAL PRESETS] ────────────────────────────────────────────────────────┐
${GLOBAL_PRESETS.map((p, i) => `│ [${i + 1}] ${p.flag} ${p.lang.padEnd(10)} │ ${p.label.padEnd(35)} │ model: ${p.model.padEnd(16)} │\n│     Desc: ${p.description.slice(0, 75)}...`).join('\n├─────────────────────────────────────────────────────────────────────────────────────────┤\n')}
└─────────────────────────────────────────────────────────────────────────────────────────┘
Type e.g. 'preset 1' or click any preset chip above the command line.`,
      });
      return;
    }

    // 9. FORGE SYNTHESIS
    const query = parsed.query || trimmed;
    if (!query) return;

    // Check if query is a preset number like "preset 1" or "1"
    const presetMatch = query.match(/^(?:preset\s+)?([1-7])$/i);
    let finalQuery = query;
    let targetModel = (parsed.flags.model as any) || options.targetModel;
    let promptStyle = (parsed.flags.style as any) || options.promptStyle;

    if (presetMatch) {
      const idx = parseInt(presetMatch[1], 10) - 1;
      const preset = GLOBAL_PRESETS[idx];
      if (preset) {
        finalQuery = preset.description;
        targetModel = preset.model;
        promptStyle = preset.style;
        setOptions(prev => ({ ...prev, targetModel, promptStyle }));
      }
    }

    setIsLoading(true);
    addEntry({
      type: 'log',
      text: `[*] INGESTING QUERY: "${finalQuery.slice(0, 70)}${finalQuery.length > 70 ? '...' : ''}"
[*] TARGET_MODEL: ${targetModel.toUpperCase()} | ARCHITECTURE: ${promptStyle.toUpperCase()}
[*] PARSING NATURAL LANGUAGE TOKEN MATRIX...`,
    });

    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: finalQuery,
          targetModel,
          promptStyle,
          precisionLevel: options.precisionLevel,
          includeVariables: options.includeVariables,
          includeNegativeConstraints: options.includeNegativeConstraints,
          outputLanguage: options.outputLanguage,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const generated: GeneratedPrompt = await res.json();
      setActivePrompt(generated);
      playTerminalSuccess();

      addEntry({
        type: 'log',
        text: `[✓] SYNTHESIS COMPLETED IN 120ms:
    Language Detected: ${generated.detectedLanguage}
    Domain: ${generated.detectedDomain}
    Precision: ${generated.metrics.precisionRating} (0.01mm)
    Variables: ${generated.variables.length} | Guardrails: ${generated.negativeConstraints.length}
    Tokens: ~${generated.metrics.tokenCount} tokens (~${generated.metrics.charCount} chars)`,
      });

      addEntry({
        type: 'prompt',
        prompt: generated,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      addEntry({
        type: 'log',
        text: `[!] SYNTHESIS ERROR: ${err?.message || 'Server error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playKeyClick();
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommandInput(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setCommandInput(history[prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab autocompletion
      const cmds = ['forge', 'test', 'model', 'style', 'presets', 'theme', 'copy', 'clear', 'help'];
      const match = cmds.find(c => c.startsWith(commandInput.toLowerCase()));
      if (match) setCommandInput(match + ' ');
    }
  };

  // Theme accents mapping
  const themeTextAccent =
    theme === 'matrix'
      ? 'text-emerald-400'
      : theme === 'amber'
      ? 'text-amber-400'
      : theme === 'cyan'
      ? 'text-cyan-400'
      : 'text-zinc-100';

  const themeBorderAccent =
    theme === 'matrix'
      ? 'border-emerald-500/50'
      : theme === 'amber'
      ? 'border-amber-500/50'
      : theme === 'cyan'
      ? 'border-cyan-500/50'
      : 'border-zinc-500/50';

  const themeBgAccent =
    theme === 'matrix'
      ? 'bg-emerald-500'
      : theme === 'amber'
      ? 'bg-amber-500'
      : theme === 'cyan'
      ? 'bg-cyan-500'
      : 'bg-zinc-200';

  return (
    <div
      className={`h-screen max-h-screen bg-[#05070a] text-zinc-200 font-mono flex flex-col relative select-text overflow-hidden ${
        scanlines ? 'scanlines' : ''
      } theme-${theme}`}
    >
      {/* 1. RETRO/UNIX TERMINAL TITLEBAR */}
      <header className="shrink-0 bg-[#0b0f17] border-b border-zinc-800/90 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 select-none z-10">
        <div className="flex items-center gap-3">
          {/* Authentic window dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]" />
          </div>

          <div className="h-3.5 w-px bg-zinc-800" />

          {/* Terminal Session ID */}
          <div className="flex items-center gap-2 text-xs">
            <Terminal className={`w-3.5 h-3.5 ${themeTextAccent}`} />
            <span className="font-bold text-zinc-100 tracking-wide">
              promptforge@global-node:~ (pts/0)
            </span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">[tmux 3.4]</span>
          </div>
        </div>

        {/* Status Line right */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-zinc-600">TCP:</span>
            <span className="text-zinc-300">0.0.0.0:3000</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-600">LATENCY:</span>
            <span className={themeTextAccent}>38ms</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-600">CIPHER:</span>
            <span className="text-zinc-300">TLS_1.3</span>
          </div>

          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            {/* Theme switcher */}
            <button
              onClick={() => {
                playTerminalBlip();
                setTheme(t => (t === 'matrix' ? 'amber' : t === 'amber' ? 'cyan' : t === 'cyan' ? 'mono' : 'matrix'));
              }}
              title="Cycle CRT Phosphor Theme (Matrix / Amber / Cyan / Mono)"
              className="px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 text-[10px] uppercase font-bold"
            >
              F7: {theme}
            </button>

            {/* Scanlines toggle */}
            <button
              onClick={() => {
                playTerminalBlip();
                setScanlines(s => !s);
              }}
              title="Toggle CRT Scanline Overlay"
              className={`p-1 rounded ${scanlines ? themeTextAccent : 'text-zinc-500'}`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Audio toggle */}
            <button
              onClick={() => {
                toggleTerminalSound();
                setSoundOn(isSoundEnabled());
                playTerminalBlip();
              }}
              title="Toggle Mechanical Terminal Audio"
              className={`p-1 rounded ${soundOn ? themeTextAccent : 'text-zinc-500'}`}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. TMUX / FUNCTION KEYS INTERACTIVE TOP RIBBON */}
      <nav aria-label="Terminal Function Keys" className="shrink-0 bg-[#080c14] border-b border-zinc-800/80 px-3 py-1.5 flex flex-wrap items-center justify-between text-[11px] gap-2 select-none z-10">
        {/* Quick Function Keys */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => handleExecuteCommand('help')}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F1]</span> HELP
          </button>

          <button
            onClick={() => {
              playKeyClick();
              const nextM =
                options.targetModel === 'claude-3-7-sonnet'
                  ? 'gpt-4o-o1'
                  : options.targetModel === 'gpt-4o-o1'
                  ? 'gemini-2.5-pro'
                  : options.targetModel === 'gemini-2.5-pro'
                  ? 'deepseek-r1'
                  : options.targetModel === 'deepseek-r1'
                  ? 'flux-midjourney'
                  : 'claude-3-7-sonnet';
              setOptions(o => ({ ...o, targetModel: nextM }));
              addEntry({ type: 'log', text: `[*] MODEL SWITCHED: ${nextM.toUpperCase()}` });
            }}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F2]</span> MODEL:{' '}
            <span className="font-bold">{options.targetModel.split('-')[0].toUpperCase()}</span>
          </button>

          <button
            onClick={() => handleExecuteCommand('presets')}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F3]</span> PRESETS
          </button>

          <button
            onClick={() => runTestPrompt(activePrompt)}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F4]</span> TEST
          </button>

          <button
            onClick={() => handleCopyPrompt(activePrompt)}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F5]</span> COPY
          </button>

          <button
            onClick={() => handleDownload(activePrompt, 'markdown')}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F6]</span> EXPORT.MD
          </button>

          <button
            onClick={() => {
              playTerminalBlip();
              setIsDecompilerOpen(true);
            }}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F8]</span> DECOMPILE ASSET
          </button>

          <button
            onClick={() => handleExecuteCommand('clear')}
            className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <span className={themeTextAccent}>[F9]</span> CLEAR
          </button>
        </div>

        {/* Global Language Presets Quick Trigger */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto no-scrollbar">
          <Globe2 className={`w-3.5 h-3.5 ${themeTextAccent} shrink-0`} />
          <span className="text-zinc-500 hidden lg:inline">PRESETS:</span>
          {GLOBAL_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleExecuteCommand(`preset ${idx + 1}`)}
              title={p.description}
              className="px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors shrink-0"
            >
              <span>{p.flag}</span>
              <span className="hidden sm:inline ml-1 font-medium">{p.lang}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 3. TERMINAL TTY STREAM CANVAS (SCROLLABLE BUFFER) */}
      <main ref={mainRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 font-mono text-xs leading-relaxed max-w-7xl w-full mx-auto">
        {entries.map(entry => {
          if (entry.type === 'command') {
            return (
              <div key={entry.id} className="flex items-start gap-2 pt-2 border-t border-zinc-900">
                <span className={`font-bold ${themeTextAccent} shrink-0 select-none`}>
                  {entry.text?.split(' ')[0]}
                </span>
                <span className="text-zinc-100 font-semibold">{entry.text?.slice(entry.text.indexOf(' ') + 1)}</span>
                {entry.timestamp && (
                  <span className="text-[10px] text-zinc-600 ml-auto select-none">[{entry.timestamp}]</span>
                )}
              </div>
            );
          }

          if (entry.type === 'system' || entry.type === 'help' || entry.type === 'table') {
            return (
              <div
                key={entry.id}
                className="p-3 bg-[#080c14] border border-zinc-800/80 rounded whitespace-pre font-mono text-zinc-300 overflow-x-auto text-[11px] leading-snug"
              >
                {entry.text}
              </div>
            );
          }

          if (entry.type === 'log') {
            return (
              <div key={entry.id} className="text-zinc-400 font-mono text-xs pl-2 border-l border-zinc-800">
                {entry.text}
              </div>
            );
          }

          if (entry.type === 'test-result') {
            return (
              <div
                key={entry.id}
                className="p-3 bg-[#070b12] border border-cyan-800/60 rounded text-cyan-300 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-lg"
              >
                {entry.text}
              </div>
            );
          }

          // SYNTHESIZED PROMPT BLOCK (ASCII TERMINAL BOX)
          if (entry.type === 'prompt' && entry.prompt) {
            const p = entry.prompt;
            const lines = p.fullPrompt.split('\n');

            return (
              <div
                key={entry.id}
                className="border border-zinc-800 rounded bg-[#070a10] shadow-2xl overflow-hidden my-3 animate-in fade-in duration-200"
              >
                {/* Prompt Header */}
                <div className="bg-[#0b101a] border-b border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold ${themeTextAccent}`}>{p.title}</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-zinc-400">{p.detectedDomain}</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-cyan-400">{p.detectedLanguage}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-zinc-500">PRECISION:</span>
                    <span className="text-amber-400 font-bold">{p.metrics.precisionRating}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-500">TOKENS:</span>
                    <span className="text-emerald-400 font-bold">~{p.metrics.tokenCount}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-500">MODEL:</span>
                    <span className="text-zinc-300 font-semibold">{p.targetModel}</span>
                  </div>
                </div>

                {/* Prompt Code Body with line numbers */}
                <div className="p-3 bg-[#04060a] max-h-[420px] overflow-y-auto text-xs leading-relaxed text-zinc-300">
                  {lines.map((line, idx) => {
                    const isXmlTag = line.trim().startsWith('<') && line.trim().endsWith('>');
                    const isHeader = line.trim().startsWith('#');
                    const hasVar = line.includes('{{') && line.includes('}}');

                    return (
                      <div key={idx} className="flex items-start hover:bg-zinc-900/30 px-1 rounded">
                        <span className="w-9 select-none text-right pr-3 text-zinc-600 text-[11px]">
                          {idx + 1}
                        </span>
                        <span
                          className={`flex-1 whitespace-pre-wrap break-words ${
                            isXmlTag
                              ? 'text-cyan-400 font-semibold'
                              : isHeader
                              ? `${themeTextAccent} font-bold`
                              : hasVar
                              ? 'text-amber-300'
                              : 'text-zinc-300'
                          }`}
                        >
                          {line || ' '}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Prompt Metadata: Guardrails & Variables */}
                {(p.negativeConstraints.length > 0 || p.variables.length > 0) && (
                  <div className="border-t border-zinc-900 bg-[#080d16] p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    {p.negativeConstraints.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-red-400 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>ZERO-HALLUCINATION GUARDRAILS:</span>
                        </div>
                        <ul className="text-zinc-400 list-disc pl-4 space-y-0.5">
                          {p.negativeConstraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {p.variables.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-amber-400 font-bold flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>DYNAMIC VARIABLES ({p.variables.length}):</span>
                        </div>
                        <div className="text-zinc-400 space-y-0.5">
                          {p.variables.map((v, i) => (
                            <div key={i}>
                              <code className="text-amber-300">{`{{${v.name}}}`}</code>: {v.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Action Bar on Prompt Box */}
                <div className="bg-[#090e18] border-t border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPrompt(p)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${
                        copiedId === p.id
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                      }`}
                    >
                      {copiedId === p.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-emerald-400">COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY PROMPT</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => runTestPrompt(p)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80 transition-colors font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-400" />
                      <span>TEST IN CLI</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(p, 'markdown')}
                      title="Download .md"
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px]"
                    >
                      .MD
                    </button>
                    <button
                      onClick={() => handleDownload(p, 'json')}
                      title="Download .json"
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px]"
                    >
                      .JSON
                    </button>
                    <button
                      onClick={() => handleDownload(p, 'cli')}
                      title="Download cURL CLI command"
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px]"
                    >
                      cURL
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Loading Indicator inside buffer */}
        {isLoading && (
          <div className="flex items-center gap-2 py-2 text-xs">
            <span className={`animate-spin inline-block w-3.5 h-3.5 border-2 border-t-transparent ${themeBorderAccent} rounded-full`} />
            <span className={`${themeTextAccent} font-semibold animate-pulse`}>
              SYNTHESIZING MILLIMETRIC AI PROMPT...
            </span>
          </div>
        )}
      </main>

      {/* 4. REAL TERMINAL INTERACTIVE COMMAND LINE (FIXED AT BOTTOM) */}
      <footer className="shrink-0 bg-[#070b13] border-t border-zinc-800 p-3 sm:px-5 select-none z-10">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleExecuteCommand(commandInput);
          }}
          className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-7xl w-full mx-auto"
        >
          {/* CLI Prompt Identifier */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-zinc-500 font-bold hidden sm:inline">user@promptforge:~$</span>
            <span className={`font-bold text-sm ${themeTextAccent}`}>$</span>
            <button
              type="button"
              onClick={() => {
                playTerminalBlip();
                setIsDecompilerOpen(true);
              }}
              title="Decompile Image, Photo, UI/UX Template, or 3D/2D model into prompt"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-[10px] transition-colors"
            >
              <Paperclip className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline font-semibold">ASSET/URL</span>
            </button>
          </div>

          {/* Interactive Input with Block Cursor */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={e => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder='Type in any world language... (e.g. "crypto trading bot in python", "flux cinematic 8k portrait", "senior code reviewer")'
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono text-xs sm:text-sm py-1 tracking-wide"
            />
            {/* Blinking block cursor when input is focused */}
            <span className={`w-2 h-4 ${themeBgAccent} cursor-blink inline-block shrink-0 ml-0.5`} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            {commandInput && (
              <button
                type="button"
                onClick={() => setCommandInput('')}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2 py-1"
              >
                CLEAR
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !commandInput.trim()}
              className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold text-xs text-black transition-all disabled:opacity-40 cursor-pointer shadow-lg ${themeBgAccent}`}
            >
              <span>EXECUTE</span>
              <CornerDownLeft className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        </form>

        {/* Keyboard hints footer */}
        <div className="mt-2 pt-1 border-t border-zinc-900/90 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[9px]">⏎ ENTER</kbd> Run
            </span>
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[9px]">TAB</kbd> Complete
            </span>
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[9px]">↑ / ↓</kbd> History
            </span>
            <span>
              <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[9px]">Ctrl+L</kbd> Clear
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">All World Languages Supported</span>
            <span className="text-zinc-600">·</span>
            <span className={themeTextAccent}>0.01mm Millimetric Precision</span>
          </div>
        </div>
      </footer>

      {/* 5. MULTIMODAL ASSET DECOMPILER MODAL */}
      <DecompileAssetModal
        isOpen={isDecompilerOpen}
        onClose={() => setIsDecompilerOpen(false)}
        onPromptSynthesized={(decompiledPrompt, logMessage) => {
          setActivePrompt(decompiledPrompt);
          addEntry({ type: 'log', text: logMessage });
          addEntry({
            type: 'prompt',
            prompt: decompiledPrompt,
            timestamp: new Date().toLocaleTimeString(),
          });
        }}
        themeAccent={themeTextAccent}
        themeBorder={themeBorderAccent}
        themeBg={themeBgAccent}
      />
    </div>
  );
};
