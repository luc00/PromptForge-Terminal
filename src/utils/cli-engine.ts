export interface PromptOptions {
  input: string;
  targetModel: 'gemini-2.5-pro' | 'claude-3-7-sonnet' | 'gpt-4o-o1' | 'deepseek-r1' | 'flux-midjourney' | 'universal-llm';
  promptStyle: 'system-architect' | 'few-shot' | 'cot-chain' | 'roleplay-agent' | 'creative-art' | 'code-engineer';
  precisionLevel: 'surgical' | 'balanced' | 'concise';
  includeVariables: boolean;
  includeNegativeConstraints: boolean;
  outputLanguage: 'keep-source' | 'en' | 'it' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
}

export interface PromptVariable {
  name: string;
  description: string;
  placeholder: string;
}

export interface GeneratedPrompt {
  id: string;
  timestamp: string;
  title: string;
  detectedLanguage: string;
  detectedDomain: string;
  targetModel: string;
  promptStyle: string;
  summary: string;
  systemInstruction: string;
  userPrompt: string;
  fullPrompt: string;
  variables: PromptVariable[];
  negativeConstraints: string[];
  tuningTips: string[];
  metrics: {
    tokenCount: number;
    charCount: number;
    precisionRating: 'Standard' | 'High-Precision' | 'Millimetric Surgical';
    modelFit: string;
  };
}

export interface CliParsedCommand {
  command:
    | 'forge'
    | 'test'
    | 'export'
    | 'copy'
    | 'clear'
    | 'help'
    | 'models'
    | 'model'
    | 'presets'
    | 'style'
    | 'theme'
    | 'vars'
    | 'guardrails'
    | 'reverse'
    | 'status'
    | 'history'
    | 'lang'
    | 'unknown';
  query: string;
  flags: {
    model?: string;
    style?: string;
    vars?: boolean;
    precision?: string;
    lang?: string;
    format?: string;
  };
  raw: string;
}

/**
 * Parses user terminal command string into structured CLI execution payload
 */
export function parseCliCommand(rawCommand: string): CliParsedCommand {
  const trimmed = rawCommand.trim();
  if (!trimmed) {
    return { command: 'unknown', query: '', flags: {}, raw: '' };
  }

  // Tokenize preserving quotes
  const tokens: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[0]);
  }

  const primary = (tokens[0] || '').toLowerCase();

  let command: CliParsedCommand['command'] = 'unknown';
  let queryStartIndex = 1;

  if (['forge', 'generate', 'create'].includes(primary)) {
    command = 'forge';
  } else if (['reverse', 'decompile', 'asset', 'image', 'img'].includes(primary)) {
    command = 'reverse';
  } else if (
    /^https?:\/\/.+/i.test(trimmed) &&
    (/\.(png|jpe?g|webp|gif|svg|bmp)(\?.*)?$/i.test(trimmed) ||
      /images\.|unsplash|figma|dribbble|artstation|sketchfab/i.test(trimmed))
  ) {
    command = 'reverse';
    queryStartIndex = 0;
  } else if (primary === 'test') {
    command = 'test';
  } else if (primary === 'copy' || primary === 'cp') {
    command = 'copy';
  } else if (primary === 'export') {
    command = 'export';
  } else if (primary === 'clear' || primary === 'cls') {
    command = 'clear';
  } else if (primary === 'help' || primary === 'man') {
    command = 'help';
  } else if (primary === 'models') {
    command = 'models';
  } else if (primary === 'model') {
    command = 'model';
  } else if (primary === 'presets' || primary === 'examples') {
    command = 'presets';
  } else if (primary === 'style') {
    command = 'style';
  } else if (primary === 'theme') {
    command = 'theme';
  } else if (primary === 'vars' || primary === 'variables') {
    command = 'vars';
  } else if (primary === 'guardrails') {
    command = 'guardrails';
  } else if (primary === 'status') {
    command = 'status';
  } else if (primary === 'history') {
    command = 'history';
  } else if (primary === 'lang') {
    command = 'lang';
  } else {
    // If user types prompt directly in any language of the world without typing 'forge'
    command = 'forge';
    queryStartIndex = 0;
  }

  const flags: CliParsedCommand['flags'] = {};
  const queryTokens: string[] = [];

  for (let i = queryStartIndex; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const flagBody = token.slice(2);
      if (flagBody.includes('=')) {
        const [k, v] = flagBody.split('=');
        if (k === 'model') flags.model = v;
        if (k === 'style') flags.style = v;
        if (k === 'precision') flags.precision = v;
        if (k === 'lang') flags.lang = v;
        if (k === 'format') flags.format = v;
      } else {
        if (flagBody === 'vars' || flagBody === 'variables') flags.vars = true;
        if (flagBody === 'claude') flags.model = 'claude-3-7-sonnet';
        if (flagBody === 'gpt' || flagBody === 'openai') flags.model = 'gpt-4o-o1';
        if (flagBody === 'gemini') flags.model = 'gemini-2.5-pro';
        if (flagBody === 'deepseek') flags.model = 'deepseek-r1';
        if (flagBody === 'flux' || flagBody === 'midjourney') flags.model = 'flux-midjourney';
      }
    } else {
      queryTokens.push(token);
    }
  }

  return {
    command,
    query: queryTokens.join(' ').trim(),
    flags,
    raw: trimmed,
  };
}

/**
 * Calculates estimated token count based on multilingual char heuristics
 */
export function estimatePromptTokens(text: string): number {
  if (!text) return 0;
  
  // Test for CJK characters
  const cjkChars = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  // Test for Arabic/Persian/Hebrew
  const rtlChars = (text.match(/[\u0600-\u06ff\u0590-\u05ff]/g) || []).length;
  const regularChars = text.length - cjkChars - rtlChars;

  // CJK characters average ~1.5 tokens each
  // RTL average ~1 token per 2 chars
  // Latin / alphanumeric average ~4 chars per token
  const estimated = Math.ceil((regularChars / 4) + (cjkChars * 1.5) + (rtlChars / 2));
  return Math.max(1, estimated);
}

/**
 * Formats a generated prompt for various export standards
 */
export function formatPromptForExport(
  prompt: GeneratedPrompt,
  format: 'markdown' | 'xml' | 'json' | 'cli'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(prompt, null, 2);

    case 'xml':
      return `<ai_system_prompt version="millimetric-2.4" model="${prompt.targetModel}">
  <metadata>
    <title>${prompt.title}</title>
    <domain>${prompt.detectedDomain}</domain>
    <language>${prompt.detectedLanguage}</language>
    <precision>${prompt.metrics.precisionRating}</precision>
  </metadata>

  <system_instructions>
<![CDATA[
${prompt.systemInstruction}
]]>
  </system_instructions>

  <user_template>
<![CDATA[
${prompt.userPrompt}
]]>
  </user_template>

  <guardrails>
${prompt.negativeConstraints.map(c => `    <rule>${c}</rule>`).join('\n')}
  </guardrails>
</ai_system_prompt>`;

    case 'cli':
      return `# Generated by PromptForge CLI
# Model: ${prompt.targetModel} | Precision: ${prompt.metrics.precisionRating}
curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{
    "model": "${prompt.targetModel}",
    "messages": [
      {"role": "system", "content": ${JSON.stringify(prompt.systemInstruction)}},
      {"role": "user", "content": ${JSON.stringify(prompt.userPrompt)}}
    ],
    "temperature": 0.2
  }'`;

    case 'markdown':
    default:
      return `# ${prompt.title}
*Synthesized with PromptForge Terminal :: Precision: ${prompt.metrics.precisionRating}*
*Target Model:* \`${prompt.targetModel}\` | *Domain:* \`${prompt.detectedDomain}\` | *Origin Language:* \`${prompt.detectedLanguage}\`

---

## 🎯 Architecture Summary
${prompt.summary}

---

## ⚙️ System Instructions (Master Persona & Rules)
\`\`\`markdown
${prompt.systemInstruction}
\`\`\`

---

## 📝 User Trigger / Prompt Template
\`\`\`markdown
${prompt.userPrompt}
\`\`\`

${prompt.variables.length > 0 ? `---
## 🧩 Dynamic Variables
${prompt.variables.map(v => `- \`{{${v.name}}}\`: ${v.description} (e.g. \`${v.placeholder}\`)`).join('\n')}
` : ''}

${prompt.negativeConstraints.length > 0 ? `---
## 🚫 Negative Constraints & Anti-Hallucination Boundaries
${prompt.negativeConstraints.map(c => `- ${c}`).join('\n')}
` : ''}

---
## 💡 Performance Tuning Tips
${prompt.tuningTips.map(t => `- ${t}`).join('\n')}
`;
  }
}

/**
 * Global Multilingual Presets representing real-world high value prompts
 */
export const GLOBAL_PRESETS = [
  {
    lang: 'English',
    flag: '🇺🇸',
    label: 'Senior Full-Stack Code Reviewer',
    description: 'Zero-tolerance code reviewer specialized in memory leaks, race conditions, OWASP Top 10 security, and TypeScript architecture',
    model: 'claude-3-7-sonnet' as const,
    style: 'code-engineer' as const,
  },
  {
    lang: 'Italiano',
    flag: '🇮🇹',
    label: 'Financial Statements & Cash Flow Auditor',
    description: 'Analisi meticolosa bilanci civilistici e rendiconti finanziari con indici di liquidità e alert su flussi di cassa',
    model: 'claude-3-7-sonnet' as const,
    style: 'system-architect' as const,
  },
  {
    lang: 'Español',
    flag: '🇪🇸',
    label: 'High-Conversion Copywriting Agent',
    description: 'Generador de páginas de aterrizaje con framework PAS (Problema-Agitación-Solución), storytelling persuasivo y micro-copys de checkout',
    model: 'gemini-2.5-pro' as const,
    style: 'roleplay-agent' as const,
  },
  {
    lang: '日本語',
    flag: '🇯🇵',
    label: 'Flux / Midjourney Architectural Photography',
    description: '東京のミニマリスト近代建築、8K、ハッセルブラッドH6D-100c撮影、ゴールデンアワーの光と陰影の超精密指定',
    model: 'flux-midjourney' as const,
    style: 'creative-art' as const,
  },
  {
    lang: 'Français',
    flag: '🇫🇷',
    label: 'Academic Research & Thesis Synthesizer',
    description: 'Extraction rigoureuse de méthodologie académique, validation d’hypothèses statistiques et méta-analyse comparative sans extrapolation',
    model: 'deepseek-r1' as const,
    style: 'cot-chain' as const,
  },
  {
    lang: 'Deutsch',
    flag: '🇩🇪',
    label: 'GDPR / DSGVO Cloud Compliance Auditor',
    description: 'Militärisch präziser DSGVO-Compliance-Prüfer für Cloud-Infrastrukturen, Auftragsverarbeitungsverträge (AVV) und Löschkonzepte',
    model: 'gemini-2.5-pro' as const,
    style: 'system-architect' as const,
  },
  {
    lang: 'العربية',
    flag: '🇦🇪',
    label: 'Financial Risk & Portfolio Strategist',
    description: 'نموذج تحليلي دقيق لتقييم تقلبات الأسهم وصناديق الاستثمار مع قياس مؤشر شارب ونقاط الدعم والمقاومة',
    model: 'gpt-4o-o1' as const,
    style: 'cot-chain' as const,
  },
];

export interface DemoAsset {
  id: string;
  category: 'ui-ux' | '3d-model' | '2d-art' | 'photography';
  categoryLabel: string;
  label: string;
  url: string;
  targetModel: 'claude-3-7-sonnet' | 'flux-midjourney' | 'gpt-4o-o1' | 'gemini-2.5-pro';
  description: string;
}

export const DEMO_ASSETS: DemoAsset[] = [
  {
    id: 'demo-ui',
    category: 'ui-ux',
    categoryLabel: 'UI/UX Template',
    label: 'Cyberpunk Telemetry Dashboard UI',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    targetModel: 'claude-3-7-sonnet',
    description: 'Decompile into React + Tailwind CSS design system with accessibility contrast, metric sparklines, and dark HUD layout.',
  },
  {
    id: 'demo-3d',
    category: '3d-model',
    categoryLabel: '3D Model & Mesh',
    label: 'Hard-Surface Sci-Fi Autonomous Mesh',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    targetModel: 'flux-midjourney',
    description: 'Decompile into 3D CAD/Blender/Octane render specifications: polygon bevels, PBR metallic shaders, emissive cyan conduits.',
  },
  {
    id: 'demo-2d',
    category: '2d-art',
    categoryLabel: '2D Art / Vector',
    label: 'Neo-Tokyo Anime Vector Illustration',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    targetModel: 'flux-midjourney',
    description: 'Decompile into 2D vector prompt: clean stroke weights, vibrant retrowave neon color palette, cel-shading, dynamic angle.',
  },
  {
    id: 'demo-photo',
    category: 'photography',
    categoryLabel: 'Photometry / Lens',
    label: 'Hasselblad 8K Concrete Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    targetModel: 'flux-midjourney',
    description: 'Decompile into optical camera prompt: 50mm f/1.4 prime lens, golden hour volumetric chiaroscuro, natural film grain ISO 100.',
  },
];
