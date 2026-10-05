import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themeCssPath = path.resolve(__dirname, '../src/design-system/theme.css');
const themeCssContent = fs.readFileSync(themeCssPath, 'utf8');

// Collect all tsx/ts files in src/
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allSrcFiles = getAllFiles(path.resolve(__dirname, '../src'));
const indexHtmlPath = path.resolve(__dirname, '../index.html');
if (fs.existsSync(indexHtmlPath)) allSrcFiles.push(indexHtmlPath);

const srcContentCombined = allSrcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Find all CSS class selectors like .login-screen-wrap, .btn-primary, .auth-card, etc.
const matches = themeCssContent.match(/\.([a-zA-Z0-9_-]+)/g) || [];
const uniqueClasses = [...new Set(matches.map(m => m.substring(1)))];

const usedClasses = [];
const unusedClasses = [];

uniqueClasses.forEach(cls => {
  // Check if class is present in JSX className or string literals or index.html
  const regex = new RegExp(`\\b${cls}\\b`);
  if (regex.test(srcContentCombined)) {
    usedClasses.push(cls);
  } else {
    unusedClasses.push(cls);
  }
});

console.log(`Total CSS classes found in theme.css: ${uniqueClasses.length}`);
console.log(`Used classes (${usedClasses.length}):`, usedClasses.sort().join(', '));
console.log(`Unused classes (${unusedClasses.length}):`, unusedClasses.sort().join(', '));
