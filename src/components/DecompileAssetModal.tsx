import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link,
  Image as ImageIcon,
  Box,
  Layers,
  Camera,
  Layout,
  Sparkles,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { DEMO_ASSETS, type DemoAsset, type GeneratedPrompt } from '../utils/cli-engine';
import { playKeyClick, playTerminalSuccess, playTerminalBlip } from '../utils/audio';

interface DecompileAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptSynthesized: (prompt: GeneratedPrompt, logMessage: string) => void;
  themeAccent: string;
  themeBorder: string;
  themeBg: string;
}

export const DecompileAssetModal: React.FC<DecompileAssetModalProps> = ({
  isOpen,
  onClose,
  onPromptSynthesized,
  themeAccent,
  themeBorder,
  themeBg,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<'auto' | 'ui-ux' | '3d-model' | '2d-art' | 'photography'>('auto');
  const [targetModel, setTargetModel] = useState<'flux-midjourney' | 'claude-3-7-sonnet' | 'gpt-4o-o1' | 'gemini-2.5-pro'>('flux-midjourney');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard escape listener & clipboard paste listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelection(file);
            setActiveTab('upload');
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageData(result);
      setImagePreview(result);
      setUrlInput('');
      setErrorMsg(null);
      playTerminalBlip();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectDemo = (demo: DemoAsset) => {
    playKeyClick();
    setUrlInput(demo.url);
    setImagePreview(demo.url);
    setImageData(null);
    setAssetType(demo.category);
    setTargetModel(demo.targetModel);
    setAdditionalNotes(`Focus: ${demo.description}`);
    setActiveTab('url');
    setErrorMsg(null);
  };

  const handleRunDecompile = async () => {
    const finalUrl = urlInput.trim();
    if (!finalUrl && !imageData) {
      setErrorMsg('Please paste an image URL or attach an image file.');
      return;
    }

    playKeyClick();
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/reverse-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: finalUrl || undefined,
          imageData: imageData || undefined,
          assetType,
          targetModel,
          additionalNotes: additionalNotes.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const generated: GeneratedPrompt = await res.json();
      playTerminalSuccess();
      const logMessage = `[✓] ASSET REVERSE-ENGINEERED:
    Asset Category: ${assetType.toUpperCase()}
    Target Model: ${targetModel.toUpperCase()}
    Decompiled Title: "${generated.title}"
    Tokens: ~${generated.metrics.tokenCount} | Domain: ${generated.detectedDomain}`;

      onPromptSynthesized(generated, logMessage);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reverse-engineer asset.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#080c14] border border-zinc-700 w-full max-w-3xl rounded shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-200 font-mono text-xs">
        {/* Titlebar */}
        <div className="bg-[#0d121c] border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${themeBg} inline-block`} />
            <span className="font-bold text-zinc-100 tracking-wide text-xs">
              MULTIMODAL_DECOMPILER::VISION_TO_PROMPT (0.01mm)
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800/60"
            title="Close (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Quick Demo Previews */}
          <div>
            <div className="text-[11px] text-zinc-400 font-bold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TEST WITH 1-CLICK DEMO ASSETS (UI/UX, 3D, 2D, PHOTOMETRY):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_ASSETS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleSelectDemo(demo)}
                  className={`p-2 rounded bg-zinc-900/90 border text-left hover:border-zinc-500 transition-all flex flex-col justify-between group ${
                    urlInput === demo.url ? themeBorder : 'border-zinc-800'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-semibold mb-1">
                    {demo.categoryLabel}
                  </div>
                  <div className="text-[11px] text-zinc-200 font-bold line-clamp-2">
                    {demo.label}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">
                    → {demo.targetModel.split('-')[0].toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Method Switcher */}
          <div className="flex border-b border-zinc-800 gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                playTerminalBlip();
                setActiveTab('url');
              }}
              className={`pb-2 flex items-center gap-1.5 font-bold text-xs border-b-2 transition-colors ${
                activeTab === 'url'
                  ? `${themeAccent} border-emerald-500`
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>PASTE URL / ASSET LINK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTerminalBlip();
                setActiveTab('upload');
              }}
              className={`pb-2 flex items-center gap-1.5 font-bold text-xs border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? `${themeAccent} border-emerald-500`
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD FILE / DROP / CLIPBOARD</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'url' ? (
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 block font-semibold">
                IMAGE / TEMPLATE / 3D RENDER URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setImagePreview(e.target.value.trim() || null);
                    setImageData(null);
                  }}
                  placeholder="https://... (e.g. Unsplash, Figma screenshot, Dribbble, Artstation, or direct .png/.jpg)"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono text-xs"
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('');
                      setImagePreview(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 px-2 py-1"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 block font-semibold">
                ATTACH FILE OR PASTE DIRECTLY:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                className="border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded p-6 text-center cursor-pointer bg-zinc-950/60 hover:bg-zinc-900/40 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <div className="font-bold text-zinc-300 text-xs mb-1">
                  Click to browse or drag & drop image here
                </div>
                <div className="text-[10px] text-zinc-500">
                  Supports PNG, JPG, WEBP, SVG • You can also press <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded">Ctrl+V</kbd> to paste from clipboard
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail preview if available */}
          {imagePreview && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center gap-3">
              <div className="w-16 h-16 rounded overflow-hidden bg-black border border-zinc-700 shrink-0 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Asset Preview"
                  loading="lazy"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-200 font-bold text-xs truncate">
                  Asset Target Attached
                </div>
                <div className="text-zinc-500 text-[10px] truncate font-mono">
                  {urlInput ? urlInput : 'Local binary image data loaded in memory'}
                </div>
                <div className="text-emerald-400 text-[10px] mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready for Multimodal Computer Vision Analysis</span>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
            {/* Asset Category */}
            <div>
              <label className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
                ASSET MODALITY / DOMAIN:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'auto', label: 'Auto Detect', icon: Sparkles },
                  { id: 'ui-ux', label: 'UI/UX & Web', icon: Layout },
                  { id: '3d-model', label: '3D Render', icon: Box },
                  { id: '2d-art', label: '2D / Vector', icon: Layers },
                  { id: 'photography', label: 'Photometry', icon: Camera },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playKeyClick();
                        setAssetType(item.id as any);
                        if (item.id === 'ui-ux') setTargetModel('claude-3-7-sonnet');
                        if (item.id === '3d-model' || item.id === 'photography' || item.id === '2d-art') {
                          setTargetModel('flux-midjourney');
                        }
                      }}
                      className={`px-2 py-1.5 rounded border text-left flex items-center gap-1.5 text-xs transition-colors ${
                        assetType === item.id
                          ? 'bg-zinc-800 border-zinc-500 text-white font-bold'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target AI Engine */}
            <div>
              <label className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
                REPRODUCTION TARGET AI ENGINE:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'flux-midjourney', label: 'Flux / Midjourney' },
                  { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet' },
                  { id: 'gpt-4o-o1', label: 'GPT-4o / o1' },
                  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      playKeyClick();
                      setTargetModel(m.id as any);
                    }}
                    className={`px-2 py-1.5 rounded border text-center text-xs transition-colors ${
                      targetModel === m.id
                        ? 'bg-zinc-800 border-zinc-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
              ADDITIONAL FOCUS DIRECTIVES (Optional):
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Focus on camera lens focal length, or extract exact Tailwind colors and button variants"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 text-xs"
            />
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-2.5 bg-red-950/80 border border-red-800/80 rounded text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0b0f17] border-t border-zinc-800 px-4 py-3 flex items-center justify-between select-none">
          <div className="text-[11px] text-zinc-500">
            Press <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded">ESC</kbd> to cancel
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleRunDecompile}
              disabled={isProcessing || (!urlInput && !imageData)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold text-xs text-black transition-all disabled:opacity-40 cursor-pointer shadow-lg ${themeBg}`}
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>DECOMPILING ASSET...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>DECOMPILE TO PROMPT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
