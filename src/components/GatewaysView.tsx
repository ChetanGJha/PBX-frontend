import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Link as LinkIcon } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Grid } from './layout/Stack';
import {
  Button,
  Select,
  Input,
  Badge,
  Modal,
  FormField
} from './ui';
import { DataTable } from './patterns';

interface GatewaysViewProps {
  token: string;
  user?: User | null;
}

export const GatewaysView: React.FC<GatewaysViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [gateways, setGateways] = useState<any[]>([]);
  const [trunks, setTrunks] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    tenant_id: '',
    gateway_id: '',
    direction: 'inbound_outbound',
    priority: 1,
    caller_id_policy: 'tenant_default',
    allow_outbound: true,
    accept_inbound: true,
    allow_international: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [gData, tData, sData] = await Promise.allSettled([
        apiService.getGateways(token),
        apiService.getTenants(token),
        apiService.getTrunks(token)
      ]);
      if (gData.status === 'fulfilled') setGateways(gData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (sData.status === 'fulfilled') setTrunks(sData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.assignGateway(token, assignForm);
      setShowAssignModal(false);
      showSuccessModal('Gateway Assigned', 'SIP Trunk / Gateway has been successfully assigned to tenant.');
      loadData();
    } catch (err: any) {
      showErrorModal('Assignment Failed', err.message || 'Gateway assignment failed.');
    }
  };

  const availableTrunksAndGateways = [
    ...trunks.map(t => ({ id: t.id, name: `${t.name} (${t.host}) [SIP Trunk]` })),
    ...gateways.map(g => ({ id: g.id, name: `${g.name} (${g.proxy}) [Sofia Gateway]` }))
  ];

  const columns = [
    { key: 'name', header: 'Gateway / Trunk Name', sortable: true, render: (g: any) => <strong className="text-[var(--pbx-text-primary)]">{g.name}</strong> },
    { key: 'proxy', header: 'SIP Proxy / Host', render: (g: any) => <code className="code-box">{g.proxy}</code> },
    { key: 'tenant_name', header: 'Assigned Tenant', render: (g: any) => g.tenant_name ? <Badge variant="warning">{g.tenant_name}</Badge> : <Badge variant="neutral">GLOBAL TRUNK</Badge> },
    { key: 'codecs', header: 'Codecs' },
    { key: 'register', header: 'Registration', render: (g: any) => g.register ? <Badge variant="success">REGISTERED</Badge> : <Badge variant="neutral">STATIC IP</Badge> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">ONLINE</Badge> },
  ];

  return (
    <PageContainer
      title="SIP Trunks & Gateway Assignments"
      subtitle="Assign carrier SIP trunks to tenants and specify inbound/outbound priority rules"
      eyebrow="FreeSWITCH Sofia Core"
      actions={
        user?.role === 'SUPER_ADMIN' ? (
          <Button variant="primary" onClick={() => setShowAssignModal(true)} leftIcon={<LinkIcon size={16} />}>
            Assign SIP Trunk to Tenant
          </Button>
        ) : undefined
      }
    >
      <Stack gap="6">
        <DataTable
          columns={columns}
          data={gateways}
          isLoading={loading}
          emptyTitle="No gateways configured"
        />
      </Stack>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign SIP Trunk / Gateway to Tenant"
        subtitle="Select provider SIP Trunk and configure tenant routing bounds"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssign}>Save Assignment</Button>
          </>
        }
      >
        <form onSubmit={handleAssign}>
          <Stack gap="4">
            <Grid cols={2} gap="4">
              <FormField label="Target Tenant">
                <Select
                  value={assignForm.tenant_id}
                  onChange={(e) => setAssignForm({ ...assignForm, tenant_id: e.target.value })}
                >
                  <option value="">-- Select Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="SIP Trunk Provider / Gateway">
                <Select
                  value={assignForm.gateway_id}
                  onChange={(e) => setAssignForm({ ...assignForm, gateway_id: e.target.value })}
                >
                  <option value="">-- Select SIP Trunk Provider --</option>
                  {availableTrunksAndGateways.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Call Direction">
                <Select
                  value={assignForm.direction}
                  onChange={(e) => setAssignForm({ ...assignForm, direction: e.target.value })}
                >
                  <option value="inbound_outbound">Inbound & Outbound</option>
                  <option value="inbound_only">Inbound Only</option>
                  <option value="outbound_only">Outbound Only</option>
                </Select>
              </FormField>

              <FormField label="Priority Level (1 = Highest)">
                <Input
                  type="number"
                  value={String(assignForm.priority)}
                  onChange={e => setAssignForm({ ...assignForm, priority: parseInt(e.target.value) || 1 })}
                />
              </FormField>
            </Grid>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
};
