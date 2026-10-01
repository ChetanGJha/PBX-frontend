import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');

// Explicit allowed exceptions:
const EXCEPTIONS = [
  'src/components/TerrixLogo.tsx',
  'src/components/ToastProvider.tsx', // Protected baseline file (State/Context)
  'src/components/DesignSystemShowcase.tsx', // Design system showcase catalog
];

// Design system implementation paths (primitives & tokens)
const DS_PATHS = [
  'src/design-system',
  'src/components/ui',
  'src/components/layout',
  'src/components/patterns',
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

  if (EXCEPTIONS.includes(relPath)) {
    return;
  }

  const isDSImplementation = DS_PATHS.some((p) => relPath.startsWith(p));
  if (isDSImplementation) {
    return;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    // 1. Hex colors
    if (/#([0-9A-Fa-f]{3,8})\b/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Hex Color', text: line.trim() });
    }
    // 2. rgb / rgba / hsl / hsla
    if (/\b(rgba?|hsla?)\s*\(/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'RGB/HSL Color', text: line.trim() });
    }
    // 3. inline style={{
    if (/style=\{\{/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Inline Style', text: line.trim() });
    }
    // 4. !important
    if (/!important/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: '!important', text: line.trim() });
    }
    // 5. px values in padding/margin/gap/border-radius
    if (/\b(padding|margin|gap|borderRadius|border-radius)\b.*?\b\d+px\b/.test(line)) {
      violations.push({ file: relPath, line: lineNum, rule: 'Raw px spacing', text: line.trim() });
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

