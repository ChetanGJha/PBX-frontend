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
  allowed_modules?: string[];
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


export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  [key: string]: DaySchedule;
}

export interface Holiday {
  id: string;
  business_hours_id: string;
  name: string;
  holiday_date: string;
  created_at?: string;
}

export interface BusinessHoursLiveStatus {
  status: 'OPEN' | 'CLOSED' | 'HOLIDAY';
  holiday_name?: string;
  current_time: string;
  current_date: string;
  timezone: string;
  active_destination: {
    type: string;
    target: string;
  };
}

export interface BusinessHours {
  id: string;
  tenant_id: string;
  name: string;
  timezone: string;
  schedule: WeeklySchedule;
  open_destination_type: string;
  open_destination_target: string;
  closed_destination_type: string;
  closed_destination_target: string;
  holiday_destination_type?: string;
  holiday_destination_target?: string;
  created_at: string;
  updated_at: string;
  tenant_name?: string;
  holiday_count?: number;
  holidays?: Holiday[];
  live_status?: BusinessHoursLiveStatus;
}


export interface SmtpSettings {
  id?: string;
  tenant_id?: string | null;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
  use_tls?: boolean;
  configured: boolean;
  is_using_global_fallback: boolean;
  updated_at?: string;
}

export interface SmtpTestPayload {
  to_email: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
  use_tls?: boolean;
  tenant_id?: string;
}
