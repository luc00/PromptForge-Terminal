import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCliCommand,
  estimatePromptTokens,
  formatPromptForExport,
  GLOBAL_PRESETS,
  type GeneratedPrompt,
} from './cli-engine';

test('parseCliCommand correctly identifies forge command and arguments', () => {
  const result = parseCliCommand('forge "crea un bot di trading" --model=claude --vars');
  assert.equal(result.command, 'forge');
  assert.equal(result.query, 'crea un bot di trading');
  assert.equal(result.flags.model, 'claude');
  assert.equal(result.flags.vars, true);
});

test('parseCliCommand defaults bare queries to forge command', () => {
  const result = parseCliCommand('Genera un prompt per analisi bilanci civilistici --precision=surgical');
  assert.equal(result.command, 'forge');
  assert.ok(result.query.includes('Genera un prompt'));
  assert.equal(result.flags.precision, 'surgical');
});

test('parseCliCommand handles utility commands like clear, help, test, export, copy, theme, model', () => {
  const helpResult = parseCliCommand('help');
  assert.equal(helpResult.command, 'help');

  const clearResult = parseCliCommand('clear');
  assert.equal(clearResult.command, 'clear');

  const copyResult = parseCliCommand('copy');
  assert.equal(copyResult.command, 'copy');

  const modelResult = parseCliCommand('model claude');
  assert.equal(modelResult.command, 'model');
  assert.equal(modelResult.query, 'claude');

  const themeResult = parseCliCommand('theme amber');
  assert.equal(themeResult.command, 'theme');
  assert.equal(themeResult.query, 'amber');

  const testResult = parseCliCommand('test "Here is sample data to evaluate"');
  assert.equal(testResult.command, 'test');
  assert.equal(testResult.query, 'Here is sample data to evaluate');

  const exportResult = parseCliCommand('export --format=json');
  assert.equal(exportResult.command, 'export');
  assert.equal(exportResult.flags.format, 'json');

  const reverseResult = parseCliCommand('reverse "https://example.com/asset.png"');
  assert.equal(reverseResult.command, 'reverse');
  assert.equal(reverseResult.query, 'https://example.com/asset.png');

  const bareUrlResult = parseCliCommand('https://images.unsplash.com/photo-1551288049.jpg');
  assert.equal(bareUrlResult.command, 'reverse');
  assert.equal(bareUrlResult.query, 'https://images.unsplash.com/photo-1551288049.jpg');
});

test('estimatePromptTokens estimates tokens for Latin and multilingual scripts', () => {
  const latinText = 'A quick brown fox jumps over the lazy dog';
  const tokens = estimatePromptTokens(latinText);
  assert.ok(tokens > 5 && tokens < 25);

  const cjkText = '東京のミニマリスト近代建築、8K、光と影';
  const cjkTokens = estimatePromptTokens(cjkText);
  assert.ok(cjkTokens > 0);

  const emptyTokens = estimatePromptTokens('');
  assert.equal(emptyTokens, 0);
});

test('formatPromptForExport formats markdown, xml, json and cli curl', () => {
  const samplePrompt: GeneratedPrompt = {
    id: 'test-123',
    timestamp: '2026-10-26T10:00:00Z',
    title: 'Financial Auditor',
    detectedLanguage: 'Italiano',
    detectedDomain: 'Finance',
    targetModel: 'claude-3-7-sonnet',
    promptStyle: 'system-architect',
    summary: 'A meticulous auditor system prompt',
    systemInstruction: 'You are a senior financial auditor...',
    userPrompt: 'Analyze the following cash flows: {{cashflow_data}}',
    fullPrompt: 'You are a senior financial auditor...',
    variables: [
      { name: 'cashflow_data', description: 'Raw cash flow statement', placeholder: 'Q1 Revenues: $2M' }
    ],
    negativeConstraints: ['Never make assumptions on unrecorded liabilities'],
    tuningTips: ['Use temperature 0.1 for deterministic audit findings'],
    metrics: {
      tokenCount: 420,
      charCount: 1600,
      precisionRating: 'Millimetric Surgical',
      modelFit: 'Claude 3.7 Sonnet Extended Thinking'
    }
  };

  const md = formatPromptForExport(samplePrompt, 'markdown');
  assert.ok(md.includes('# Financial Auditor'));
  assert.ok(md.includes('{{cashflow_data}}'));

  const json = formatPromptForExport(samplePrompt, 'json');
  const parsed = JSON.parse(json);
  assert.equal(parsed.id, 'test-123');

  const xml = formatPromptForExport(samplePrompt, 'xml');
  assert.ok(xml.includes('<ai_system_prompt'));
  assert.ok(xml.includes('<title>Financial Auditor</title>'));

  const cli = formatPromptForExport(samplePrompt, 'cli');
  assert.ok(cli.includes('curl https://api.openai.com/v1/chat/completions'));
});

test('GLOBAL_PRESETS includes diverse real-world global languages', () => {
  assert.ok(GLOBAL_PRESETS.length >= 6);
  const langs = GLOBAL_PRESETS.map(p => p.lang);
  assert.ok(langs.includes('Italiano'));
  assert.ok(langs.includes('English'));
  assert.ok(langs.includes('日本語'));
  assert.ok(langs.includes('Español'));
});
