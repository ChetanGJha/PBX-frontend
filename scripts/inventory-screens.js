import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compDir = path.resolve(__dirname, '../src/components');

const screens = [
  { screen: 'App Shell & Router', file: 'src/App.tsx' },
  { screen: 'Login Screen', file: 'src/components/LoginScreen.tsx' },
  { screen: 'Sidebar Navigation', file: 'src/components/Sidebar.tsx' },
  { screen: 'Topbar Header', file: 'src/components/Topbar.tsx' },
  { screen: 'Dashboard', file: 'src/components/DashboardView.tsx' },
  { screen: 'Auth & Security', file: 'src/components/AuthView.tsx' },
  { screen: 'Tenants Registry', file: 'src/components/TenantsView.tsx' },
  { screen: 'Global Users', file: 'src/components/UsersView.tsx' },
  { screen: 'SIP Extensions', file: 'src/components/ExtensionsView.tsx' },
  { screen: 'SIP Trunks & Gateways', file: 'src/components/TrunksView.tsx' },
  { screen: 'DID Inventory', file: 'src/components/DidsView.tsx' },
  { screen: 'Call Routing', file: 'src/components/RoutingView.tsx' },
  { screen: 'Call Queues', file: 'src/components/QueuesView.tsx' },
  { screen: 'Hunt Groups', file: 'src/components/HuntGroupsView.tsx' },
  { screen: 'IVR Flows', file: 'src/components/IvrView.tsx' },
  { screen: 'Voicemail Management', file: 'src/components/VoicemailView.tsx' },
  { screen: 'Call Forwarding', file: 'src/components/CallForwardingView.tsx' },
  { screen: 'Audio Prompts', file: 'src/components/AudioView.tsx' },
  { screen: 'SMTP & Email Settings', file: 'src/components/EmailSettingsView.tsx' },
  { screen: 'Conference Rooms', file: 'src/components/ConferencesView.tsx' },
  { screen: 'Call Block Rules', file: 'src/components/CallBlockView.tsx' },
  { screen: 'Contacts Directory', file: 'src/components/ContactsView.tsx' },
  { screen: 'Business Hours', file: 'src/components/BusinessHoursView.tsx' },
  { screen: 'CDR & Reports', file: 'src/components/ReportsView.tsx' },
  { screen: 'Help & Documentation', file: 'src/components/HelpView.tsx' },
  { screen: 'FreeSWITCH Console', file: 'src/components/XmlCurlConsole.tsx' },
  { screen: 'XmlCurl Tester', file: 'src/components/XmlCurlTester.tsx' },
  { screen: 'Gateways View', file: 'src/components/GatewaysView.tsx' },
];

console.log('| Screen | File | Migrated | Raw Violations (Hex/Inline/!important/px) |');
console.log('|---|---|---|---|');

screens.forEach((s) => {
  const filePath = path.resolve(__dirname, '..', s.file);
  if (!fs.existsSync(filePath)) {
    console.log(`| ${s.screen} | \`${s.file}\` | No | File not found |`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  let hexCount = (content.match(/#([0-9A-Fa-f]{3,8})\b/g) || []).length;
  let inlineCount = (content.match(/style=\{\{/g) || []).length;
  let importantCount = (content.match(/!important/g) || []).length;
  let totalViolations = hexCount + inlineCount + importantCount;

  const isMigrated = ['src/App.tsx', 'src/components/LoginScreen.tsx', 'src/components/Sidebar.tsx', 'src/components/Topbar.tsx', 'src/components/DashboardView.tsx', 'src/components/AuthView.tsx'].includes(s.file);

  console.log(`| ${s.screen} | \`${s.file}\` | ${isMigrated ? 'Yes' : 'No'} | ${totalViolations} (${hexCount} hex, ${inlineCount} inline, ${importantCount} !imp) |`);
});
