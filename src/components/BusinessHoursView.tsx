import React, { useState, useEffect } from 'react';
import type { User, BusinessHours, WeeklySchedule, DaySchedule, Holiday } from '../types';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
import {
  Clock, Plus, Trash2, Calendar, Globe, Sun, Moon, ArrowRight, Save,
  RefreshCw, CheckCircle2, AlertCircle, Building2, Phone, Voicemail,
  GitBranch, Users, Sparkles, X, ChevronRight, Shield
} from 'lucide-react';

interface BusinessHoursViewProps {
  token: string;
  user?: User | null;
}

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, open: '09:00', close: '18:00' },
  tuesday: { enabled: true, open: '09:00', close: '18:00' },
  wednesday: { enabled: true, open: '09:00', close: '18:00' },
  thursday: { enabled: true, open: '09:00', close: '18:00' },
  friday: { enabled: true, open: '09:00', close: '18:00' },
  saturday: { enabled: false, open: '10:00', close: '14:00' },
  sunday: { enabled: false, open: '00:00', close: '00:00' },
};

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export const BusinessHoursView: React.FC<BusinessHoursViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [schedules, setSchedules] = useState<BusinessHours[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Schedule Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleTimezone, setNewScheduleTimezone] = useState('Asia/Kolkata');

  // New Holiday Modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiService.getBusinessHours(token);
      const items: BusinessHours[] = res.items || [];
      setSchedules(items);
      if (items.length > 0) {
        const targetId = selectedId || items[0].id;
        setSelectedId(targetId);
        await loadDetails(targetId);
      } else {
        setSelectedSchedule(null);
      }
    } catch (err: any) {
      console.error('Failed to load business hours:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: string) => {
    try {
      const details = await apiService.getBusinessHoursDetails(token, id);
      setSelectedSchedule(details);
    } catch (err: any) {
      console.error('Failed to fetch schedule details:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSelectSchedule = async (id: string) => {
    setSelectedId(id);
    await loadDetails(id);
  };

  const handleDayChange = (day: string, field: keyof DaySchedule, value: any) => {
    if (!selectedSchedule) return;
    const currentSchedule = { ...(selectedSchedule.schedule || DEFAULT_SCHEDULE) };
    const dayConf = { ...(currentSchedule[day] || { enabled: false, open: '09:00', close: '18:00' }) };
    (dayConf as any)[field] = value;
    currentSchedule[day] = dayConf;
    setSelectedSchedule({
      ...selectedSchedule,
      schedule: currentSchedule
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      setSaving(true);
      const payload = {
        name: selectedSchedule.name,
        timezone: selectedSchedule.timezone,
        schedule: selectedSchedule.schedule,
        open_destination_type: selectedSchedule.open_destination_type,
        open_destination_target: selectedSchedule.open_destination_target,
        closed_destination_type: selectedSchedule.closed_destination_type,
        closed_destination_target: selectedSchedule.closed_destination_target,
        holiday_destination_type: selectedSchedule.holiday_destination_type,
        holiday_destination_target: selectedSchedule.holiday_destination_target,
      };
      await apiService.updateBusinessHours(token, selectedSchedule.id, payload);
      showSuccessModal('Changes Saved', 'Business hours schedule updated successfully!');
      await loadData();
    } catch (err: any) {
      showErrorModal('Save Failed', err.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim()) return;
    try {
      setSaving(true);
      const payload: any = {
        name: newScheduleName.trim(),
        timezone: newScheduleTimezone,
        schedule: DEFAULT_SCHEDULE,
        open_destination_type: 'extension',
        open_destination_target: '1001',
        closed_destination_type: 'voicemail',
        closed_destination_target: '1001',
        holiday_destination_type: 'voicemail',
        holiday_destination_target: '1001',
      };
      if (user?.tenant_id) {
        payload.tenant_id = user.tenant_id;
      } else if (schedules.length > 0 && schedules[0].tenant_id) {
        payload.tenant_id = schedules[0].tenant_id;
      }
      const res = await apiService.createBusinessHours(token, payload);
      showSuccessModal('Schedule Created', `Schedule "${res.name}" has been created!`);
      setShowCreateModal(false);
      setNewScheduleName('');
      await loadData();
      setSelectedId(res.id);
      await loadDetails(res.id);
    } catch (err: any) {
      showErrorModal('Creation Failed', err.message || 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    if (!window.confirm(`Are you sure you want to delete schedule "${selectedSchedule.name}"?`)) return;
    try {
      await apiService.deleteBusinessHours(token, selectedSchedule.id);
      showSuccessModal('Deleted', 'Schedule has been removed.');
      setSelectedId(null);
      await loadData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Failed to delete schedule');
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !holidayName.trim() || !holidayDate) return;
    try {
      await apiService.addHoliday(token, selectedSchedule.id, {
        name: holidayName.trim(),
        holiday_date: holidayDate,
      });
      showSuccessModal('Holiday Added', `Added ${holidayName} on ${holidayDate}`);
      setShowHolidayModal(false);
      setHolidayName('');
      setHolidayDate('');
      await loadDetails(selectedSchedule.id);
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Failed to add holiday date');
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!selectedSchedule) return;
    try {
      await apiService.deleteHoliday(token, selectedSchedule.id, holidayId);
      showSuccessModal('Deleted', 'Holiday exception removed.');
      await loadDetails(selectedSchedule.id);
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Failed to delete holiday');
    }
  };

  const live = selectedSchedule?.live_status;
  const isOpen = live?.status === 'OPEN';
  const isHoliday = live?.status === 'HOLIDAY';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Call Routing & Time Rules</div>
          <h1 className="page-title flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-[#FF5430]" />
            Business Hours & Time Conditions
          </h1>
          <p className="page-sub">
            Automate day, after-hours, and holiday call routing based on live weekly schedules and timezone conditions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadData} className="btn-secondary" title="Refresh Schedules">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        {/* Total Schedules */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Schedules</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF0EC] text-[#FF5430] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value">{schedules.length}</div>
          <div className="stat-trend" style={{ color: '#6B7280' }}>Configured profiles</div>
        </div>

        {/* Live Operational Status */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Status</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isHoliday ? 'bg-amber-50 text-amber-600' :
              isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isOpen ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              isHoliday ? 'bg-amber-500' :
              isOpen ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />
            <span className={`text-xl font-extrabold ${
              isHoliday ? 'text-amber-600' :
              isOpen ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {live?.status || (selectedSchedule ? 'CLOSED' : 'NO PROFILE')}
            </span>
          </div>
          <div className="text-[11px] text-[#6B7280]">
            {selectedSchedule ? `Profile: ${selectedSchedule.name}` : 'Select a profile'}
          </div>
        </div>

        {/* Timezone Clock */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Timezone Clock</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#111827] mt-1 mb-2 truncate">
            {live?.current_time || 'Synchronized'}
          </div>
          <div className="text-[11px] text-[#6B7280] truncate">
            {selectedSchedule?.timezone || 'System Default Timezone'}
          </div>
        </div>

        {/* Holiday Exceptions */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Holiday Exceptions</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value">{selectedSchedule?.holidays?.length || 0}</div>
          <div className="stat-trend" style={{ color: '#6B7280' }}>Special closure dates</div>
        </div>
      </div>

      {/* Main Layout: Schedule Selector & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Schedule Profiles List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF5430]" />
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Operating Profiles ({schedules.length})
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs font-bold text-[#FF5430] hover:text-[#ED6140] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2">
              {schedules.map((s) => {
                const active = s.id === selectedId;
                const sOpen = s.live_status?.status === 'OPEN';
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSchedule(s.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-[#FFF0EC] border-[#FF5430] shadow-sm'
                        : 'bg-[#FFFFFF] border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${active ? 'text-[#111827]' : 'text-[#374151]'}`}>
                          {s.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1">
                        <Globe className="w-3 h-3 text-[#9CA3AF]" />
                        <span className="truncate">{s.timezone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        sOpen
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {sOpen ? 'Open' : 'Closed'}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${active ? 'text-[#FF5430]' : 'text-[#D1D5DB]'}`} />
                    </div>
                  </div>
                );
              })}

              {schedules.length === 0 && !loading && (
                <div className="p-8 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl bg-[#FAFAFA]">
                  <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
                  <div className="text-sm font-bold text-[#111827]">No Schedules Yet</div>
                  <p className="text-xs text-[#6B7280] mt-1 mb-4">
                    Create your first business hours profile to set automatic open & closed call routing.
                  </p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs py-2 px-3">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Schedule</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Schedule Configurator */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSchedule ? (
            <>
              {/* Profile Settings Card */}
              <div className="card space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-[#111827]">{selectedSchedule.name}</h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isHoliday ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {live?.status || 'CLOSED'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Active Route: <strong className="text-[#111827] font-semibold">{live?.active_destination?.type || 'extension'}</strong> &rarr; <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">{live?.active_destination?.target || '1001'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <button
                      onClick={handleDeleteSchedule}
                      className="btn-secondary text-rose-600 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 text-xs px-3 h-9"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="btn-primary text-xs px-4 h-9 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>

                {/* Name & Timezone Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Profile Name</label>
                    <input
                      type="text"
                      value={selectedSchedule.name}
                      onChange={(e) => setSelectedSchedule({ ...selectedSchedule, name: e.target.value })}
                      className="form-control"
                      placeholder="e.g. Sales Team, Technical Support"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Operating Timezone</label>
                    <select
                      value={selectedSchedule.timezone}
                      onChange={(e) => setSelectedSchedule({ ...selectedSchedule, timezone: e.target.value })}
                      className="form-control"
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Weekly Operating Hours Card */}
              <div className="card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF5430]" />
                    <span>Weekly Operating Hours</span>
                  </h3>
                  <span className="text-xs text-[#6B7280]">Toggle open days and specify shift intervals</span>
                </div>

                <div className="divide-y divide-[#F3F4F6]">
                  {DAYS.map(({ key, label }) => {
                    const conf = selectedSchedule.schedule?.[key] || { enabled: false, open: '09:00', close: '18:00' };
                    return (
                      <div key={key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-40">
                          <input
                            type="checkbox"
                            id={`check-${key}`}
                            checked={conf.enabled}
                            onChange={(e) => handleDayChange(key, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded text-[#FF5430] border-gray-300 focus:ring-[#FF5430] cursor-pointer"
                          />
                          <label
                            htmlFor={`check-${key}`}
                            className={`text-sm font-bold cursor-pointer ${conf.enabled ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}
                          >
                            {label}
                          </label>
                        </div>

                        {conf.enabled ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#6B7280] uppercase">Open</span>
                              <input
                                type="time"
                                value={conf.open}
                                onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                                className="px-2.5 py-1.5 border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:border-[#FF5430]"
                              />
                            </div>
                            <span className="text-[#9CA3AF] text-xs font-bold">&ndash;</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#6B7280] uppercase">Close</span>
                              <input
                                type="time"
                                value={conf.close}
                                onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                                className="px-2.5 py-1.5 border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] bg-white focus:outline-none focus:border-[#FF5430]"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold">
                            Closed All Day
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Call Routing Destination Cards */}
              <div className="card space-y-4">
                <div className="border-b border-[#E5E7EB] pb-3">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    <span>Call Routing Destinations</span>
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Define where callers are directed during open shifts, after-hours closures, and recognized public holidays.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Open Shift */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <span>Open Hours Route</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] mb-1">Destination Type</label>
                      <select
                        value={selectedSchedule.open_destination_type}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, open_destination_type: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:border-emerald-600"
                      >
                        <option value="extension">SIP Extension</option>
                        <option value="ivr">IVR Auto Attendant</option>
                        <option value="hunt_group">Ring Group / Queue</option>
                        <option value="conference">Conference Room</option>
                        <option value="voicemail">Voicemail Box</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] mb-1">Target Number / ID</label>
                      <input
                        type="text"
                        value={selectedSchedule.open_destination_target}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, open_destination_target: e.target.value })}
                        placeholder="e.g. 1001 or 6001"
                        className="w-full px-2.5 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Closed / After-Hours */}
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                      <Moon className="w-4 h-4 text-rose-600" />
                      <span>After-Hours Route</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] mb-1">Destination Type</label>
                      <select
                        value={selectedSchedule.closed_destination_type}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, closed_destination_type: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:border-rose-600"
                      >
                        <option value="voicemail">Voicemail Box</option>
                        <option value="ivr">Night IVR Menu</option>
                        <option value="extension">Answering Service / Ext</option>
                        <option value="hunt_group">On-Call Queue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] mb-1">Target Number / ID</label>
                      <input
                        type="text"
                        value={selectedSchedule.closed_destination_target}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, closed_destination_target: e.target.value })}
                        placeholder="e.g. 1001"
                        className="w-full px-2.5 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>

                  {/* Holiday Exception */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Holiday Route</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] mb-1">Destination Type</label>
                      <select
                        value={selectedSchedule.holiday_destination_type || 'voicemail'}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, holiday_destination_type: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:border-amber-600"
                      >
                        <option value="voicemail">Holiday Voicemail</option>
                        <option value="ivr">Holiday Greeting IVR</option>
                        <option value="extension">Emergency Extension</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#374151] mb-1">Target Number / ID</label>
                      <input
                        type="text"
                        value={selectedSchedule.holiday_destination_target || '1001'}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, holiday_destination_target: e.target.value })}
                        placeholder="e.g. 1001"
                        className="w-full px-2.5 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Holiday Calendar Exceptions */}
              <div className="card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Holiday Exceptions ({selectedSchedule.holidays?.length || 0})</span>
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Specific dates when the business is closed, overriding regular weekly shift hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHolidayModal(true)}
                    className="btn-secondary text-xs h-9 px-3 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Holiday</span>
                  </button>
                </div>

                {selectedSchedule.holidays && selectedSchedule.holidays.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedSchedule.holidays.map((h: Holiday) => (
                      <div
                        key={h.id}
                        className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between hover:border-purple-300 transition-all shadow-sm"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#111827]">{h.name}</div>
                          <div className="text-xs text-purple-700 font-mono mt-0.5 font-semibold">{h.holiday_date}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl bg-[#FAFAFA]">
                    <Calendar className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-bold text-[#111827]">No Holidays Configured</div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Add company holidays, festival days, or planned closures to route incoming calls to the holiday greeting.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0EC] text-[#FF5430] flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#111827]">No Schedule Profile Selected</h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
                Select a business hours profile from the left column to edit weekly operating times, after-hours forwarding, and holiday exceptions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Schedule */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '480px', width: '100%', borderRadius: '16px' }}>
            <div className="modal-head">
              <div className="modal-icon">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3>Create Business Hours Profile</h3>
                <p>Define weekly business hours and time condition rules.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule}>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ marginBottom: '7px' }}>Profile Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Office, Support Desk, Sales Team"
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                    className="form-control"
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: '7px' }}>Operating Timezone</label>
                  <select
                    value={newScheduleTimezone}
                    onChange={(e) => setNewScheduleTimezone(e.target.value)}
                    className="form-control"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Holiday */}
      {showHolidayModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '480px', width: '100%', borderRadius: '16px' }}>
            <div className="modal-head">
              <div className="modal-icon" style={{ background: '#FAF5FF', color: '#9333EA' }}>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3>Add Holiday Exception</h3>
                <p>Override normal hours on specific dates.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHolidayModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHoliday}>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ marginBottom: '7px' }}>Holiday Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Year's Day, Independence Day"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className="form-control"
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: '7px' }}>Holiday Date</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: '#9333EA' }}
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
