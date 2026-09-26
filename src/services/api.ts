import type { Tenant, Extension, User, SystemStatus } from '../types';

let API_BASE_URL = 'http://localhost:8000';

export const getApiBaseUrl = () => API_BASE_URL;
export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url.replace(/\/$/, '');
};

const getHeaders = (token?: string | null, isForm = false) => {
  const headers: Record<string, string> = {};
  if (!isForm) {
    headers['Content-Type'] = 'application/json';
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // System Health
  async checkHealth(): Promise<SystemStatus> {
    try {
      const hRes = await fetch(`${API_BASE_URL}/health`);
      const hData = await hRes.json();
      const rRes = await fetch(`${API_BASE_URL}/ready`);
      const rData = await rRes.json();
      return {
        healthy: hRes.ok && hData.status === 'healthy',
        ready: rRes.ok && rData.status === 'ready',
        database: rData.components?.database || 'disconnected',
        redis: rData.components?.redis || 'disconnected',
      };
    } catch {
      return { healthy: false, ready: false, database: 'disconnected', redis: 'disconnected' };
    }
  },

  // Auth
  async seedSuperAdmin(payload: { username: string; email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/seed-superadmin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to seed super admin');
    }
    return res.json();
  },

  async login(payload: { username_or_email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Authentication failed');
    }
    return res.json() as Promise<{ access_token: string; user: User }>;
  },

  async getMe(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Invalid token');
    return res.json() as Promise<User>;
  },

  // Tenants
  async getTenants(token: string): Promise<Tenant[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/tenants`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch tenants');
    return res.json();
  },

  async createTenant(token: string, payload: { name: string; domain: string; sip_domain: string }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tenants`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create tenant');
    }
    return res.json() as Promise<Tenant>;
  },

  async toggleTenantStatus(token: string, id: string, enabled: boolean) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tenants/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async deleteTenant(token: string, id: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tenants/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete tenant');
    }
  },

  // Extensions
  async getExtensions(token: string): Promise<Extension[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch extensions');
    return res.json();
  },

  async createExtension(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create extension');
    }
    return res.json();
  },

  async resetExtensionPassword(token: string, extensionId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/${extensionId}/reset-password`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to reset password');
    return res.json();
  },

  async updateExtensionSettings(token: string, extensionId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/${extensionId}/settings`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // DIDs
  async getDids(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dids`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch DIDs');
    return res.json();
  },

  async createDid(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dids`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create DID');
    }
    return res.json();
  },

  async assignDid(token: string, didId: string, tenantId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dids/${didId}/assign`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ tenant_id: tenantId }),
    });
    if (!res.ok) throw new Error('Failed to assign DID');
    return res.json();
  },

  async unassignDid(token: string, didId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dids/${didId}/unassign`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to unassign DID');
    return res.json();
  },

  // Routing Rules CRUD
  async getRoutes(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/routing`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  async createRoute(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/routing`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create route');
    }
    return res.json();
  },

  async deleteRoute(token: string, routeId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/routing/${routeId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete route');
  },

  // Queues CRUD
  async getQueues(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/queues`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch queues');
    return res.json();
  },

  async createQueue(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/queues`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create queue');
    }
    return res.json();
  },

  async updateQueue(token: string, queueId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/queues/${queueId}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update queue');
    return res.json();
  },

  async deleteQueue(token: string, queueId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/queues/${queueId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete queue');
  },

  // Reports Endpoints
  async getCdrReport(token: string, tenantId?: string, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/api/v1/reports/cdr?call_type=all`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch CDR report');
    return res.json();
  },

  async getInternalReport(token: string, tenantId?: string, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/api/v1/reports/internal?`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch internal report');
    return res.json();
  },

  async getOutboundReport(token: string, tenantId?: string, startDate?: string, endDate?: string) {
    let url = `${API_BASE_URL}/api/v1/reports/outbound?`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch outbound report');
    return res.json();
  },

  async getRecordingsReport(token: string, tenantId?: string) {
    let url = `${API_BASE_URL}/api/v1/reports/recordings?`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch recordings');
    return res.json();
  },

  // Audio Files Endpoints
  async getAudioFiles(token: string, tenantId?: string) {
    let url = `${API_BASE_URL}/api/v1/audio?`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch audio files');
    return res.json();
  },

  async uploadAudioFile(token: string, formData: FormData) {
    const res = await fetch(`${API_BASE_URL}/api/v1/audio/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload audio file');
    return res.json();
  },

  // Hunt Groups, IVR, Trunks, Gateways, Users
  async getHuntGroups(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/hunt-groups`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch hunt groups');
    return res.json();
  },
  async createHuntGroup(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/hunt-groups`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create hunt group');
    return res.json();
  },
  async getIvrs(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch IVRs');
    return res.json();
  },
  async getIvrDetails(token: string, ivrId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr/${ivrId}`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch IVR details');
    return res.json();
  },
  async createIvr(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create IVR');
    return res.json();
  },
  async updateIvr(token: string, ivrId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr/${ivrId}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update IVR');
    return res.json();
  },
  async deleteIvr(token: string, ivrId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr/${ivrId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete IVR');
  },
  async getIvrNodes(token: string, ivrId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr/${ivrId}/nodes`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch IVR key nodes');
    return res.json();
  },
  async upsertIvrNode(token: string, ivrId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr/${ivrId}/nodes`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save DTMF key action');
    return res.json();
  },
  async deleteIvrNode(token: string, ivrId: string, nodeId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ivr/${ivrId}/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete DTMF key action');
  },
  async getTrunks(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/trunks`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch trunks');
    return res.json();
  },
  async createTrunk(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/trunks`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create trunk');
    return res.json();
  },
  async getGateways(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/gateways`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch gateways');
    return res.json();
  },
  async assignGateway(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/gateways/assign`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to assign gateway');
    return res.json();
  },
  async getUsers(token: string, tenantId?: string): Promise<User[]> {
    const url = tenantId ? `${API_BASE_URL}/api/v1/users?tenant_id=${tenantId}` : `${API_BASE_URL}/api/v1/users`;
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  async createUser(token: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },
  async deleteUser(token: string, userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete user');
  },
  async testXmlCurl(domain: string, user: string): Promise<string> {
    const body = new URLSearchParams();
    body.append('section', 'directory');
    body.append('domain', domain);
    body.append('user', user);
    const res = await fetch(`${API_BASE_URL}/freeswitch/xml`, {
      method: 'POST',
      headers: getHeaders(null, true),
      body: body.toString(),
    });
    return res.text();
  },

  // ─── Call Forwarding ────────────────────────────────────────────────────────
  async getCallForwardingAll(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/call-forwarding/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch call forwarding rules');
    return res.json();
  },

  async getExtensionForwarding(token: string, extensionId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/${extensionId}/forwarding`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch extension forwarding');
    return res.json();
  },

  async updateExtensionForwarding(token: string, extensionId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/${extensionId}/forwarding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update extension forwarding');
    return res.json();
  },

  // ─── Voicemail Boxes ────────────────────────────────────────────────────────
  async getVoicemailBoxesAll(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/voicemail-boxes/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch voicemail boxes');
    return res.json();
  },

  async getExtensionVoicemail(token: string, extensionId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/${extensionId}/voicemail`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch extension voicemail');
    return res.json();
  },

  async updateExtensionVoicemail(token: string, extensionId: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/v1/extensions/${extensionId}/voicemail`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update extension voicemail');
    return res.json();
  },

  // ─── Sub-Admin Permissions ──────────────────────────────────────────────────
  async updateUserPermissions(token: string, userId: string, allowed_modules: string[]) {
    const res = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ allowed_modules }),
    });
    if (!res.ok) throw new Error('Failed to update user permissions');
    return res.json();
  },

};
