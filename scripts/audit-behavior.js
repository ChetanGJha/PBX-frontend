import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compDir = path.resolve(__dirname, '../src/components');

const views = [
  'App.tsx',
  'LoginScreen.tsx',
  'Sidebar.tsx',
  'Topbar.tsx',
  'DashboardView.tsx',
  'AuthView.tsx',
  'TenantsView.tsx',
  'UsersView.tsx',
  'ExtensionsView.tsx',
  'TrunksView.tsx',
  'DidsView.tsx',
  'RoutingView.tsx',
  'QueuesView.tsx',
  'HuntGroupsView.tsx',
  'IvrView.tsx',
  'VoicemailView.tsx',
  'CallForwardingView.tsx',
  'AudioView.tsx',
  'EmailSettingsView.tsx',
  'ConferencesView.tsx',
  'CallBlockView.tsx',
  'ContactsView.tsx',
  'BusinessHoursView.tsx',
  'ReportsView.tsx',
  'HelpView.tsx',
  'XmlCurlConsole.tsx',
  'XmlCurlTester.tsx',
  'GatewaysView.tsx',
];

console.log('| View | Base api.* Calls | Current api.* Calls | Base (States/Effects/Handlers) | Current (States/Effects/Handlers) | Logic Changed |');
console.log('|---|---|---|---|---|---|');

views.forEach(v => {
  const relPath = v === 'App.tsx' ? 'src/App.tsx' : `src/components/${v}`;
  let baseContent = '';
  try {
    baseContent = execSync(`git show 2474d9f:${relPath}`, { encoding: 'utf8' });
  } catch (e) {
    baseContent = '';
  }

  const currPath = path.resolve(__dirname, '..', relPath);
  let currContent = fs.existsSync(currPath) ? fs.readFileSync(currPath, 'utf8') : '';

  // Extract api calls
  const extractApi = (txt) => {
    const matches = txt.match(/apiService\.[a-zA-Z0-9_]+\([^\)]*\)/g) || [];
    return [...new Set(matches)].sort().join(', ');
  };

  const baseApi = extractApi(baseContent);
  const currApi = extractApi(currContent);

  // Counts
  const getCounts = (txt) => {
    const states = (txt.match(/useState/g) || []).length;
    const effects = (txt.match(/useEffect/g) || []).length;
    const handlers = (txt.match(/const handle[A-Za-z0-9_]+/g) || []).length;
    return `${states}/${effects}/${handlers}`;
  };

  const baseCounts = getCounts(baseContent);
  const currCounts = getCounts(currContent);

  const logicChanged = baseApi !== currApi ? 'YES (API mismatch!)' : 'No';

  console.log(`| \`${v}\` | \`${baseApi || 'None'}\` | \`${currApi || 'None'}\` | ${baseCounts} | ${currCounts} | ${logicChanged} |`);
});
