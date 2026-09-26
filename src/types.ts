export interface Tenant {
  id: string;
  name: string;
  domain: string;
  sip_domain: string;
  timezone: string;
  enabled: boolean;
  max_extensions: number;
  max_concurrent_calls: number;
  created_at: string;
}

export interface Extension {
  id: string;
  tenant_id: string;
  extension_number: string;
  display_name: string;
  email?: string;
  caller_id_name?: string;
  caller_id_number?: string;
  outbound_caller_id?: string;
  enabled: boolean;
  webrtc_enabled: boolean;
  no_answer_timeout: number;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  tenant_id?: string;
  tenant_domain?: string;
  sip_domain?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface SystemStatus {
  healthy: boolean;
  ready: boolean;
  database: 'connected' | 'disconnected' | 'unknown';
  redis: 'connected' | 'disconnected' | 'unknown';
}
