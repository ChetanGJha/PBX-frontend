import React, { useState } from 'react';
import {
  Button,
  Input,
  FormField,
  Select,
  Textarea,
  Checkbox,
  Radio,
  Switch,
  Badge,
  Card,
  Modal,
  Alert,
  Spinner,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableHeader,
  Pagination,
  Tabs,
  Breadcrumb,
  Drawer,
  Tooltip,
  Avatar,
  Divider,
  Heading,
  Text,
  SearchInput,
  ConfirmDialog,
  StatCard,
  StatusPill,
} from './ui';
import { Phone, Users, Shield, Plus } from 'lucide-react';

export const DesignSystemShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', backgroundColor: 'var(--pbx-bg-canvas)' }}>
      <div style={{ marginBottom: '32px' }}>
        <Heading level={1}>Design System Showcase</Heading>
        <Text variant="secondary" style={{ marginTop: '8px' }}>
          Interactive catalog of all enterprise UI primitives, design tokens, and components.
        </Text>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
        items={[
          { id: 'buttons', label: 'Buttons & Inputs' },
          { id: 'typography', label: 'Typography & Badges' },
          { id: 'surfaces', label: 'Cards & Overlays' },
          { id: 'tables', label: 'Tables & Navigation' },
          { id: 'patterns', label: 'Patterns & Feedback' },
        ]}
      />

      <Divider margin="24px 0" />

      {activeTab === 'buttons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Button Variants</Heading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="primary" isLoading>Loading</Button>
              <Button variant="primary" leftIcon={<Plus size={16} />}>With Icon</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </Card>

          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Form Inputs & Controls</Heading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <FormField label="Standard Text Input" hint="Helper text goes here" required>
                <Input placeholder="Enter value..." />
              </FormField>

              <FormField label="Error Input" error="This field is required">
                <Input placeholder="Invalid input..." error />
              </FormField>

              <FormField label="Select Dropdown">
                <Select>
                  <option value="1">Option 1 - Enabled</option>
                  <option value="2">Option 2 - Standby</option>
                  <option value="3">Option 3 - Disabled</option>
                </Select>
              </FormField>

              <FormField label="Textarea Input">
                <Textarea placeholder="Multi-line message area..." />
              </FormField>
            </div>

            <Divider margin="20px 0" />

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Switch checked={switchChecked} onChange={setSwitchChecked} label="Toggle Switch" />
              <Checkbox checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} label="Checkbox Option" />
              <Radio checked label="Radio Option" />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'typography' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Headings & Typography Scale</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Heading level={1}>Heading Level 1 (28px ExtraBold)</Heading>
              <Heading level={2}>Heading Level 2 (22px Bold)</Heading>
              <Heading level={3}>Heading Level 3 (18px Bold)</Heading>
              <Heading level={4}>Heading Level 4 (15px SemiBold)</Heading>
              <Heading level={5}>Heading Level 5 (13px Uppercase)</Heading>
            </div>
          </Card>

          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Status Badges & Pills</Heading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <Badge variant="primary">Primary Badge</Badge>
              <Badge variant="success">Success Badge</Badge>
              <Badge variant="warning">Warning Badge</Badge>
              <Badge variant="danger">Danger Badge</Badge>
              <Badge variant="info">Info Badge</Badge>
              <Badge variant="neutral">Neutral Badge</Badge>
              <StatusPill status={true} trueText="Active Extension" />
              <StatusPill status={false} falseText="Disabled Extension" />
            </div>
          </Card>

          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Avatars & Tooltips</Heading>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Avatar name="Admin User" size="sm" />
              <Avatar name="John Doe" size="md" />
              <Avatar name="Super Admin" size="lg" />
              <Tooltip content="Helper tooltip prompt">
                <Button variant="secondary" size="sm">Hover for Tooltip</Button>
              </Tooltip>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'surfaces' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Card Container & Overlays</Heading>
            <Text variant="secondary" style={{ marginBottom: '20px' }}>
              Modal dialogs feature focus trapping, ESC key listener, background blur, and return-focus.
            </Text>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Button variant="primary" onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>Open Confirm Dialog</Button>
            </div>
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal Dialog"
            subtitle="Accessible modal overlay with focus trap"
            footer={
              <>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>Save Changes</Button>
              </>
            }
          >
            <Text>This is an accessible modal dialog adhering to WCAG 2.1 standards.</Text>
          </Modal>

          <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Side Drawer Panel">
            <Text>Drawer panel content goes here.</Text>
          </Drawer>

          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
            title="Delete Extension?"
            message="Are you sure you want to remove extension 1001? This action cannot be undone."
          />
        </div>
      )}

      {activeTab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Data Table & Pagination</Heading>
            <Breadcrumb items={[{ label: 'Home' }, { label: 'Platform' }, { label: 'Tenants' }]} />

            <Table style={{ marginTop: '16px' }}>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="id" currentSortKey="id" sortOrder="asc">Extension</SortableHeader>
                  <TableCell header>User</TableCell>
                  <TableCell header>Domain</TableCell>
                  <TableCell header>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>1001</TableCell>
                  <TableCell>John Doe</TableCell>
                  <TableCell>pbx.company.com</TableCell>
                  <TableCell><StatusPill status={true} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>1002</TableCell>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell>pbx.company.com</TableCell>
                  <TableCell><StatusPill status={false} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Pagination currentPage={currentPage} totalPages={5} onPageChange={setCurrentPage} />
          </Card>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Stat Cards & Search</Heading>
            <div style={{ marginBottom: '20px' }}>
              <SearchInput value={searchValue} onChange={setSearchValue} placeholder="Search extensions..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <StatCard title="Active Extensions" value="142" icon={<Phone size={20} />} trend="SIP & WebRTC" />
              <StatCard title="Registered Users" value="89" icon={<Users size={20} />} trend="Domain Users" />
              <StatCard title="Security Score" value="98%" icon={<Shield size={20} />} trend="Hardened" />
            </div>
          </Card>

          <Card>
            <Heading level={3} style={{ marginBottom: '16px' }}>Alerts, Loaders & Skeletons</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Alert variant="info" title="System Notice">
                FreeSWITCH media server is running in high performance mode.
              </Alert>
              <Alert variant="success" title="Backup Complete">
                Database snapshot successfully completed.
              </Alert>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                <Spinner size={24} />
                <Skeleton height="32px" width="200px" />
              </div>

              <EmptyState title="No Recordings Found" description="Try adjusting your filter criteria or date range." />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
