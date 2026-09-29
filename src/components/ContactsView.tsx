import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Contact, Plus, Edit2, Trash2, Search, X, Mail, Building, PhoneCall } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Enterprise Phonebook</div>
          <h1 className="page-title">Contacts Directory</h1>
          <p className="page-sub">Centralized directory of enterprise contacts, customers, and partners.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div style={{ position: 'relative', width: 340 }}>
          <Search style={{ width: 14, height: 14, color: '#94A3B8', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, organization, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Showing <span className="text-slate-900 font-bold">{contacts.length}</span> contacts
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact Name</th>
                <th>Company / Org</th>
                <th>Primary Phone</th>
                <th>Mobile</th>
                <th>Email</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 84, 48, 0.1)', color: 'var(--orange, #FF5430)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                        {c.first_name ? c.first_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {c.first_name} {c.last_name || ''}
                        </div>
                        {c.notes && <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.organization ? (
                      <span style={{ fontSize: 12, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Building size={12} color="#94A3B8" /> {c.organization}
                      </span>
                    ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td>
                    <a
                      href={`tel:${c.phone_primary}`}
                      style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--orange, #FF5430)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                      title="Click to dial"
                    >
                      <PhoneCall size={12} /> {c.phone_primary}
                    </a>
                  </td>
                  <td>
                    {c.phone_mobile ? (
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>
                        {c.phone_mobile}
                      </span>
                    ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: '#3B82F6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> {c.email}
                      </a>
                    ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id, `${c.first_name} ${c.last_name || ''}`)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                    No contacts found. Click "Add Contact" to populate your directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: 520 }}>
            <div className="modal-head">
              <div className="modal-icon"><Contact size={20} /></div>
              <div>
                <h3>{editingContact ? 'Edit Contact' : 'New Contact'}</h3>
                <p>Add phone numbers and details to directory</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Doe"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Primary Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone_primary}
                      onChange={e => setFormData({ ...formData, phone_primary: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="form-label">Mobile Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 111-2222"
                      value={formData.phone_mobile}
                      onChange={e => setFormData({ ...formData, phone_mobile: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes or department"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingContact ? 'Update Contact' : 'Save Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
