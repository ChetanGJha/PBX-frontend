import React, { useState, useEffect } from 'react';
import type { User, BusinessHours, WeeklySchedule, DaySchedule, Holiday } from '../types';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
import {
  Clock, Plus, Trash2, Calendar,
  Globe, Sun, Moon, ArrowRight, Save
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

export const BusinessHoursView: React.FC<BusinessHoursViewProps> = ({ token }) => {
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
      const payload = {
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

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const live = selectedSchedule?.live_status;
  const isOpen = live?.status === 'OPEN';
  const isHoliday = live?.status === 'HOLIDAY';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-400" />
            Business Hours & Time Conditions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automate day/night call handling, weekly operating schedules, and holiday routing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Schedules</div>
            <div className="text-xl font-bold text-white">{schedules.length}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className={`p-3 rounded-lg ${
            isHoliday ? 'bg-amber-500/10 text-amber-400' :
            isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isOpen ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Live Status</div>
            <div className={`text-base font-bold flex items-center gap-1.5 ${
              isHoliday ? 'text-amber-400' :
              isOpen ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
              {live?.status || 'UNKNOWN'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Timezone Clock</div>
            <div className="text-sm font-semibold text-white">
              {live?.current_time ? `${live.current_time} (${selectedSchedule?.timezone || 'UTC'})` : 'Synced'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Holidays Configured</div>
            <div className="text-xl font-bold text-white">{selectedSchedule?.holidays?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Main Content: Schedule Selector & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Schedule Selector List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Profiles ({schedules.length})
          </div>
          {schedules.map((s) => {
            const active = s.id === selectedId;
            const sOpen = s.live_status?.status === 'OPEN';
            return (
              <div
                key={s.id}
                onClick={() => handleSelectSchedule(s.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  active
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">{s.name}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {s.timezone}
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && !loading && (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-sm text-slate-500">
              No schedules yet. Click "Add Schedule" above.
            </div>
          )}
        </div>

        {/* Selected Schedule Editor */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSchedule ? (
            <>
              {/* Profile Config Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {selectedSchedule.name}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        isHoliday ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {live?.status || 'CLOSED'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Currently routing calls to: <strong className="text-indigo-400">{live?.active_destination?.type || 'extension'} ({live?.active_destination?.target || '1001'})</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteSchedule}
                      className="px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg border border-rose-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                    <button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Schedule Name</label>
                    <input
                      type="text"
                      value={selectedSchedule.name}
                      onChange={(e) => setSelectedSchedule({ ...selectedSchedule, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Timezone</label>
                    <select
                      value={selectedSchedule.timezone}
                      onChange={(e) => setSelectedSchedule({ ...selectedSchedule, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Matrix */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Weekly Operating Hours
                </h3>

                <div className="divide-y divide-slate-800/80">
                  {days.map((day) => {
                    const conf = selectedSchedule.schedule?.[day] || { enabled: false, open: '09:00', close: '18:00' };
                    return (
                      <div key={day} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-36">
                          <input
                            type="checkbox"
                            id={`check-${day}`}
                            checked={conf.enabled}
                            onChange={(e) => handleDayChange(day, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                          />
                          <label htmlFor={`check-${day}`} className={`text-sm font-medium capitalize cursor-pointer ${
                            conf.enabled ? 'text-white' : 'text-slate-500'
                          }`}>
                            {day}
                          </label>
                        </div>

                        {conf.enabled ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={conf.open}
                              onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-slate-500 text-xs">to</span>
                            <input
                              type="time"
                              value={conf.close}
                              onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Closed all day</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Destination Routing Cards */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  Call Routing Destinations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Open Destination */}
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                      <Sun className="w-4 h-4" />
                      During Open Hours
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Destination Type</label>
                      <select
                        value={selectedSchedule.open_destination_type}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, open_destination_type: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="extension">Extension</option>
                        <option value="ivr">IVR Auto Attendant</option>
                        <option value="hunt_group">Ring Group / Queue</option>
                        <option value="conference">Conference Room</option>
                        <option value="voicemail">Voicemail Box</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target Number / ID</label>
                      <input
                        type="text"
                        value={selectedSchedule.open_destination_target}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, open_destination_target: e.target.value })}
                        placeholder="e.g. 1001 or 6001"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Closed Destination */}
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                      <Moon className="w-4 h-4" />
                      After-Hours / Closed
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Destination Type</label>
                      <select
                        value={selectedSchedule.closed_destination_type}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, closed_destination_type: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="voicemail">Voicemail Box</option>
                        <option value="ivr">Night IVR Menu</option>
                        <option value="extension">Answering Service / Ext</option>
                        <option value="hunt_group">On-Call Queue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target Number / ID</label>
                      <input
                        type="text"
                        value={selectedSchedule.closed_destination_target}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, closed_destination_target: e.target.value })}
                        placeholder="e.g. 1001"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Holiday Destination */}
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      Holiday Exception
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Destination Type</label>
                      <select
                        value={selectedSchedule.holiday_destination_type || 'voicemail'}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, holiday_destination_type: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="voicemail">Holiday Voicemail</option>
                        <option value="ivr">Holiday Greeting IVR</option>
                        <option value="extension">Emergency Extension</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target Number / ID</label>
                      <input
                        type="text"
                        value={selectedSchedule.holiday_destination_target || '1001'}
                        onChange={(e) => setSelectedSchedule({ ...selectedSchedule, holiday_destination_target: e.target.value })}
                        placeholder="e.g. 1001"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Holidays Exception Calendar */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    Holiday Exceptions ({selectedSchedule.holidays?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowHolidayModal(true)}
                    className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Holiday
                  </button>
                </div>

                {selectedSchedule.holidays && selectedSchedule.holidays.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedSchedule.holidays.map((h: Holiday) => (
                      <div
                        key={h.id}
                        className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-white">{h.name}</div>
                          <div className="text-xs text-purple-400 font-mono mt-0.5">{h.holiday_date}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No holiday exceptions defined yet. On public holidays, calls route to the holiday destination.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              Select a schedule from the left panel to configure its operating hours and routing destinations.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Schedule */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Business Hours Profile</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Support, Main Office"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Timezone</label>
                <select
                  value={newScheduleTimezone}
                  onChange={(e) => setNewScheduleTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-600/30"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Holiday Exception</h3>
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Year's Day, Independence Day"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium shadow-md shadow-purple-600/30"
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
