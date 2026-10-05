import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Plus, Edit2, Trash2, Mail, Building, PhoneCall } from 'lucide-react';
import { ListPageLayout } from './layout';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Input,
  FormField,
  Modal,
} from './ui';
import { DataTable, FilterBar } from './patterns';

interface ContactsViewProps {
  token: string;
  user?: User | null;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    phone_primary: '',
    phone_mobile: '',
    email: '',
    notes: '',
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async (query = '') => {
    try {
      setLoading(true);
      const [cData, tData] = await Promise.allSettled([
        apiService.getContacts(token, query),
        apiService.getTenants(token)
      ]);
      if (cData.status === 'fulfilled') setContacts(cData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(search);
  }, [token, search]);

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({
      first_name: '',
      last_name: '',
      organization: '',
      phone_primary: '',
      phone_mobile: '',
      email: '',
      notes: '',
      tenant_id: user?.tenant_id || (tenants[0]?.id || '')
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingContact(c);
    setFormData({
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      organization: c.organization || '',
      phone_primary: c.phone_primary || '',
      phone_mobile: c.phone_mobile || '',
      email: c.email || '',
      notes: c.notes || '',
      tenant_id: c.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tenant_id: formData.tenant_id || null
      };

      if (editingContact) {
        await apiService.updateContact(token, editingContact.id, payload);
        showSuccessModal('Contact Updated', `${payload.first_name} ${payload.last_name || ''} saved`);
      } else {
        await apiService.createContact(token, payload);
        showSuccessModal('Contact Created', `${payload.first_name} added to directory`);
      }
      setShowModal(false);
      loadData(search);
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete contact "${name}"?`)) return;
    try {
      await apiService.deleteContact(token, id);
      showSuccessModal('Deleted', `Contact "${name}" removed`);
      loadData(search);
    } catch (err: any) {
      showErrorModal('Failed', err.message || 'Could not delete contact');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Contact Name',
      sortable: true,
      render: (c: any) => (
        <Inline gap="3" align="center">
          <div className="w-8 h-8 rounded-full bg-[var(--pbx-accent-light)] text-[var(--pbx-accent-primary)] font-bold flex items-center justify-center text-xs">
            {c.first_name ? c.first_name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="font-bold text-[var(--pbx-text-primary)]">{c.first_name} {c.last_name || ''}</div>
            {c.notes && <div className="text-xs text-[var(--pbx-text-muted)]">{c.notes}</div>}
          </div>
        </Inline>
      ),
    },
    {
      key: 'organization',
      header: 'Company / Org',
      render: (c: any) => (
        c.organization ? (
          <Inline gap="1" align="center" className="text-xs text-[var(--pbx-text-secondary)]">
            <Building size={12} className="text-[var(--pbx-text-muted)]" /> {c.organization}
          </Inline>
        ) : '—'
      ),
    },
    {
      key: 'phone_primary',
      header: 'Primary Phone',
      render: (c: any) => (
        <a href={`tel:${c.phone_primary}`} className="font-mono font-bold text-[var(--pbx-accent-primary)] flex items-center gap-1 hover:underline">
          <PhoneCall size={12} /> {c.phone_primary}
        </a>
      ),
    },
    {
      key: 'phone_mobile',
      header: 'Mobile Phone',
      render: (c: any) => (
        c.phone_mobile ? (
          <span className="font-mono text-xs text-[var(--pbx-text-secondary)]">{c.phone_mobile}</span>
        ) : '—'
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (c: any) => (
        c.email ? (
          <a href={`mailto:${c.email}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
            <Mail size={12} /> {c.email}
          </a>
        ) : '—'
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Contacts Directory"
      subtitle="Centralized directory of enterprise contacts, customers, and partners."
      eyebrow="ENTERPRISE PHONEBOOK"
      actions={
        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
          Add Contact
        </Button>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, organization, or phone..."
          actions={
            <div className="text-xs text-[var(--pbx-text-muted)]">
              Showing <span className="font-bold text-[var(--pbx-text-primary)]">{contacts.length}</span> contacts
            </div>
          }
        />
      }
    >
      <DataTable
        columns={columns}
        data={contacts}
        isLoading={loading}
        emptyTitle="No contacts found"
        emptyDescription='Click "Add Contact" to populate your directory.'
        actions={(c: any) => (
          <Inline gap="2" justify="center" wrap={false}>
            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)} title="Edit">
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id, `${c.first_name} ${c.last_name || ''}`)} title="Delete">
              <Trash2 size={14} className="text-rose-600" />
            </Button>
          </Inline>
        )}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingContact ? 'Edit Contact' : 'New Contact'}
        subtitle="Add phone numbers and details to directory"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{editingContact ? 'Update Contact' : 'Save Contact'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="4">
            <Grid cols={2} gap="4">
              <FormField label="First Name" required>
                <Input
                  required
                  placeholder="e.g. John"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </FormField>
              <FormField label="Last Name">
                <Input
                  placeholder="e.g. Doe"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </FormField>
            </Grid>

            <FormField label="Company / Organization">
              <Input
                placeholder="e.g. Acme Corp"
                value={formData.organization}
                onChange={e => setFormData({ ...formData, organization: e.target.value })}
              />
            </FormField>

            <Grid cols={2} gap="4">
              <FormField label="Primary Phone" required>
                <Input
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone_primary}
                  onChange={e => setFormData({ ...formData, phone_primary: e.target.value })}
                />
              </FormField>
              <FormField label="Mobile Phone">
                <Input
                  placeholder="+1 (555) 111-2222"
                  value={formData.phone_mobile}
                  onChange={e => setFormData({ ...formData, phone_mobile: e.target.value })}
                />
              </FormField>
            </Grid>

            <FormField label="Email Address">
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>

            <FormField label="Notes">
              <Input
                placeholder="Optional notes or department"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </FormField>
          </Stack>
        </form>
      </Modal>
    </ListPageLayout>
  );
};
