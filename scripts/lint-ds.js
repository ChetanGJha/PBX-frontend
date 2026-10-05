import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');

// Active Migrated Views & Components to strictly audit:
const MIGRATED_VIEWS = [
  'src/components/BusinessHoursView.tsx',
  'src/components/HelpView.tsx',
  'src/components/AuthView.tsx',
  'src/components/DashboardView.tsx',
  'src/components/XmlCurlConsole.tsx',
  'src/components/XmlCurlTester.tsx',
  'src/components/TrunksView.tsx',
  'src/components/DidsView.tsx',
  'src/components/ExtensionsView.tsx',
  'src/components/QueuesView.tsx',
  'src/components/VoicemailView.tsx',
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(tsx?|css)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getAllFiles(srcDir);
let violations = [];

files.forEach((file) => {
  const relPath = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');

  // Audit migrated views specifically
  if (!MIGRATED_VIEWS.includes(relPath)) {
    return;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    // 1. Inline style object style={{
    if (/style=\{\{/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Inline Style {{...}}', text: line.trim() });
    }
    // 2. Raw hex colors (e.g. #020617, #FFFFFF)
    if (/#([0-9A-Fa-f]{3,8})\b/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Raw Hex Color', text: line.trim() });
    }
    // 3. Raw px spacing
    if (/\b(padding|margin|gap|borderRadius|border-radius)\b.*?\b\d+px\b/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Raw px spacing', text: line.trim() });
    }
    // 4. Invalid CSS Variable Tokens
    if (/var\(--pbx-accent-(primary|light)\)/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Invalid CSS Variable Token', text: line.trim() });
    }
    // 5. !important override
    if (/!important/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: '!important', text: line.trim() });
    }
  });
});

console.log(`🔍 Design System Guardrail Audit: Checked application screens & components.`);
if (violations.length > 0) {
  console.error(`\n❌ Found ${violations.length} Design System violations:\n`);
  violations.forEach((v) => {
    console.error(`  [${v.rule}] ${v.file}:${v.line} -> ${v.text}`);
  });
  process.exit(1);
} else {
  console.log('✅ 0 violations found! Design System guardrails strictly satisfied.\n');
  process.exit(0);
}

