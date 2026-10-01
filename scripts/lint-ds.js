import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('design-system')) {
        getAllFiles(filePath, fileList);
      }
    } else if (/\.(tsx?|css)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getAllFiles(srcDir);
let violations = 0;

console.log(`🔍 Auditing ${files.length} source files for Design System enforcement...`);

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Check for inline style hex colors or non-token style overrides
    if (/#([0-9A-Fa-f]{3,8})\b/.test(line) && !file.endsWith('TerrixLogo.tsx')) {
      console.warn(`⚠️  [Hex Color] ${path.relative(srcDir, file)}:${index + 1}: ${line.trim()}`);
      violations++;
    }
  });
});

console.log(`\n✅ Audit complete. Total warnings flagged: ${violations}`);
process.exit(0);
