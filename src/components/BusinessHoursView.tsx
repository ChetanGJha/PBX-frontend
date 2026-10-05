import React, { useState, useEffect } from 'react';
import type { User, BusinessHours, WeeklySchedule, DaySchedule, Holiday } from '../types';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
import {
  Clock, Plus, Trash2, Calendar, Globe, Sun, Moon, Save,
  RefreshCw, ChevronRight
} from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Card,
  Input,
  Select,
  FormField,
  Badge,
  Modal,
  Checkbox
} from './ui';

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

  const handleDirectDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete operating profile "${name}"?`)) return;
    try {
      await apiService.deleteBusinessHours(token, id);
      showSuccessModal('Profile Deleted', `Operating profile "${name}" was successfully removed.`);
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedSchedule(null);
      }
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
    <PageContainer
      title="Business Hours & Time Conditions"
      subtitle="Automate day, after-hours, and holiday call routing based on live weekly schedules and timezone conditions."
      eyebrow="Call Routing & Time Rules"
      actions={
        <Inline gap="3">
          <Button variant="secondary" onClick={loadData} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />}>
            Add Schedule
          </Button>
        </Inline>
      }
    >
      <Stack gap="6">
        {/* KPI Stats */}
        <Grid cols={4} gap="4">
          <Card padding="md">
            <Inline gap="4" align="center">
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--pbx-radius-xl)', backgroundColor: 'var(--pbx-color-primary-50)', color: 'var(--pbx-action-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pbx-text-primary)' }}>{schedules.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)', fontWeight: 500 }}>Configured Profiles</div>
              </div>
            </Inline>
          </Card>

          <Card padding="md">
            <Inline gap="4" align="center">
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--pbx-radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                backgroundColor: isHoliday ? '#FEF3C7' : isOpen ? '#D1FAE5' : '#FEE2E2',
                color: isHoliday ? '#D97706' : isOpen ? '#059669' : '#DC2626'
              }}>
                {isOpen ? <Sun size={22} /> : <Moon size={22} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Badge variant={isHoliday ? 'warning' : isOpen ? 'success' : 'danger'}>
                  {live?.status || (selectedSchedule ? 'CLOSED' : 'NO PROFILE')}
                </Badge>
                <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedSchedule ? `Profile: ${selectedSchedule.name}` : 'Select a profile'}
                </div>
              </div>
            </Inline>
          </Card>

          <Card padding="md">
            <Inline gap="4" align="center">
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--pbx-radius-xl)', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Globe size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--pbx-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {live?.current_time || 'Synchronized'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedSchedule?.timezone || 'System Timezone'}
                </div>
              </div>
            </Inline>
          </Card>

          <Card padding="md">
            <Inline gap="4" align="center">
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--pbx-radius-xl)', backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pbx-text-primary)' }}>
                  {selectedSchedule?.holidays?.length || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)', fontWeight: 500 }}>Holiday Exceptions</div>
              </div>
            </Inline>
          </Card>
        </Grid>

        {/* Main Layout */}
        <Grid cols={12} gap="6">
          {/* Left Column: Profiles List */}
          <div style={{ gridColumn: 'span 4' }}>
            <Card title="Operating Profiles" padding="md">
              <Stack gap="3">
                {schedules.map((s) => {
                  const active = s.id === selectedId;
                  const sOpen = s.live_status?.status === 'OPEN';
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => handleSelectSchedule(s.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        borderRadius: 'var(--pbx-radius-xl)',
                        border: active ? '1px solid var(--pbx-action-primary)' : '1px solid var(--pbx-border-default)',
                        backgroundColor: active ? 'var(--pbx-color-primary-50)' : 'var(--pbx-bg-surface)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        outline: 'none',
                        cursor: 'pointer',
                        boxShadow: 'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = 'var(--pbx-focus-ring)'; }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <Stack gap="1" style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--pbx-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Globe size={12} /> {s.timezone}
                        </div>
                      </Stack>

                      <Inline gap="2" align="center" wrap={false} style={{ flexShrink: 0 }}>
                        <Badge variant={sOpen ? 'success' : 'neutral'}>
                          {sOpen ? 'Open' : 'Closed'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectDelete(s.id, s.name);
                          }}
                        >
                          <Trash2 size={13} style={{ color: 'var(--pbx-color-danger-600)' }} />
                        </Button>
                        <ChevronRight size={16} style={{ color: active ? 'var(--pbx-action-primary)' : 'var(--pbx-text-muted)' }} />
                      </Inline>
                    </button>
                  );
                })}

                {schedules.length === 0 && !loading && (
                  <div style={{ padding: '32px 16px', textAlign: 'center', border: '1px dashed var(--pbx-border-default)', borderRadius: 'var(--pbx-radius-xl)', backgroundColor: 'var(--pbx-bg-subtle)' }}>
                    <Stack gap="4" align="center">
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--pbx-bg-surface)', border: '1px solid var(--pbx-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pbx-text-muted)', margin: '0 auto' }}>
                        <Clock size={22} />
                      </div>
                      <Stack gap="1">
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pbx-text-primary)' }}>No Schedules Yet</div>
                        <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)' }}>Create your first operating profile</div>
                      </Stack>
                      <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                        Create Schedule
                      </Button>
                    </Stack>
                  </div>
                )}
              </Stack>
            </Card>
          </div>

          {/* Right Column: Schedule Details */}
          <div style={{ gridColumn: 'span 8' }}>
            {selectedSchedule ? (
              <Stack gap="6">
                <Card padding="md">
                  <Stack gap="5">
                    <div style={{ paddingBottom: '12px', marginBottom: '8px', borderBottom: '1px solid var(--pbx-border-default)' }}>
                      <Inline justify="between" align="center">
                        <Stack gap="2">
                          <Inline gap="3" align="center">
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pbx-text-primary)', margin: 0 }}>{selectedSchedule.name}</h2>
                            <Badge variant={isHoliday ? 'warning' : isOpen ? 'success' : 'danger'}>
                              {live?.status || 'CLOSED'}
                            </Badge>
                          </Inline>
                          <p style={{ fontSize: '12px', color: 'var(--pbx-text-muted)', margin: 0 }}>
                            Active Route: <strong style={{ color: 'var(--pbx-text-primary)' }}>{live?.active_destination?.type || 'extension'}</strong> &rarr; <code style={{ fontFamily: 'var(--pbx-font-mono)', fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--pbx-radius-sm)', backgroundColor: 'var(--pbx-bg-subtle)', border: '1px solid var(--pbx-border-default)', color: 'var(--pbx-text-primary)', fontWeight: 500 }}>{live?.active_destination?.target || '1001'}</code>
                          </p>
                        </Stack>

                        <Inline gap="2" align="center">
                          <Button variant="danger" size="sm" onClick={handleDeleteSchedule}>
                            Delete
                          </Button>
                          <Button variant="primary" size="sm" onClick={handleSaveSchedule} isLoading={saving} leftIcon={<Save size={14} />}>
                            Save Changes
                          </Button>
                        </Inline>
                      </Inline>
                    </div>

                    <Grid cols={2} gap="4">
                      <FormField label="Profile Name">
                        <Input
                          value={selectedSchedule.name}
                          onChange={(e) => setSelectedSchedule({ ...selectedSchedule, name: e.target.value })}
                        />
                      </FormField>

                      <FormField label="Operating Timezone">
                        <Select
                          value={selectedSchedule.timezone}
                          onChange={(e) => setSelectedSchedule({ ...selectedSchedule, timezone: e.target.value })}
                        >
                          {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </Select>
                      </FormField>
                    </Grid>
                  </Stack>
                </Card>

                {/* Weekly Schedule */}
                <Card title="Weekly Operating Hours" padding="md">
                  <div style={{ borderRadius: 'var(--pbx-radius-xl)', border: '1px solid var(--pbx-border-default)', overflow: 'hidden' }}>
                    {/* Shared 4-Column Grid Layout for Header & Day Rows */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px 140px', alignItems: 'center', gap: '16px', padding: '12px 16px', backgroundColor: 'var(--pbx-bg-subtle)', borderBottom: '1px solid var(--pbx-border-default)', fontSize: '11px', fontWeight: 700, color: 'var(--pbx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <span>Day</span>
                      <span style={{ textAlign: 'center' }}>Open Time</span>
                      <span></span>
                      <span style={{ textAlign: 'center' }}>Close Time</span>
                    </div>

                    {/* Day Rows */}
                    <div style={{ backgroundColor: 'var(--pbx-bg-surface)' }}>
                      {DAYS.map(({ key, label }, idx) => {
                        const conf = selectedSchedule.schedule?.[key] || { enabled: false, open: '09:00', close: '18:00' };
                        const isLast = idx === DAYS.length - 1;
                        return (
                          <div
                            key={key}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 140px 32px 140px',
                              alignItems: 'center',
                              gap: '16px',
                              padding: '12px 16px',
                              minHeight: '52px',
                              borderBottom: isLast ? 'none' : '1px solid var(--pbx-border-default)',
                            }}
                          >
                            <Checkbox
                              label={label}
                              checked={conf.enabled}
                              onChange={(e) => handleDayChange(key, 'enabled', e.target.checked)}
                            />

                            {conf.enabled ? (
                              <>
                                <Input
                                  type="time"
                                  value={conf.open}
                                  onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                                  style={{ height: '36px', textAlign: 'center' }}
                                />
                                <span style={{ textAlign: 'center', fontSize: '12px', color: 'var(--pbx-text-muted)', fontWeight: 600 }}>to</span>
                                <Input
                                  type="time"
                                  value={conf.close}
                                  onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                                  style={{ height: '36px', textAlign: 'center' }}
                                />
                              </>
                            ) : (
                              <div style={{ gridColumn: '2 / 5', display: 'flex', justifyContent: 'flex-end' }}>
                                <Badge variant="neutral">Closed All Day</Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Call Routing Destinations */}
                <Card title="Call Routing Destinations" padding="md">
                  <Grid cols={3} gap="4">
                    <Card padding="md" style={{ backgroundColor: 'rgba(236, 253, 245, 0.5)', border: '1px solid #A7F3D0' }}>
                      <Stack gap="4">
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '4px' }}>
                          <Sun size={14} /> Open Hours Route
                        </div>
                        <FormField label="Type">
                          <Select
                            value={selectedSchedule.open_destination_type}
                            onChange={(e) => setSelectedSchedule({ ...selectedSchedule, open_destination_type: e.target.value })}
                          >
                            <option value="extension">SIP Extension</option>
                            <option value="ivr">IVR Auto Attendant</option>
                            <option value="hunt_group">Ring Group / Queue</option>
                            <option value="conference">Conference Room</option>
                            <option value="voicemail">Voicemail Box</option>
                          </Select>
                        </FormField>
                        <FormField label="Target">
                          <Input
                            value={selectedSchedule.open_destination_target}
                            onChange={(e) => setSelectedSchedule({ ...selectedSchedule, open_destination_target: e.target.value })}
                          />
                        </FormField>
                      </Stack>
                    </Card>

                    <Card padding="md" style={{ backgroundColor: 'rgba(255, 241, 242, 0.5)', border: '1px solid #FECDD3' }}>
                      <Stack gap="4">
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9F1239', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '4px' }}>
                          <Moon size={14} /> After-Hours Route
                        </div>
                        <FormField label="Type">
                          <Select
                            value={selectedSchedule.closed_destination_type}
                            onChange={(e) => setSelectedSchedule({ ...selectedSchedule, closed_destination_type: e.target.value })}
                          >
                            <option value="voicemail">Voicemail Box</option>
                            <option value="ivr">Night IVR Menu</option>
                            <option value="extension">Extension</option>
                            <option value="hunt_group">Queue</option>
                          </Select>
                        </FormField>
                        <FormField label="Target">
                          <Input
                            value={selectedSchedule.closed_destination_target}
                            onChange={(e) => setSelectedSchedule({ ...selectedSchedule, closed_destination_target: e.target.value })}
                          />
                        </FormField>
                      </Stack>
                    </Card>

                    <Card padding="md" style={{ backgroundColor: 'rgba(254, 243, 199, 0.5)', border: '1px solid #FDE68A' }}>
                      <Stack gap="4">
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '4px' }}>
                          <Calendar size={14} /> Holiday Route
                        </div>
                        <FormField label="Type">
                          <Select
                            value={selectedSchedule.holiday_destination_type || 'voicemail'}
                            onChange={(e) => setSelectedSchedule({ ...selectedSchedule, holiday_destination_type: e.target.value })}
                          >
                            <option value="voicemail">Holiday Voicemail</option>
                            <option value="ivr">Holiday Greeting IVR</option>
                            <option value="extension">Emergency Ext</option>
                          </Select>
                        </FormField>
                        <FormField label="Target">
                          <Input
                            value={selectedSchedule.holiday_destination_target || '1001'}
                            onChange={(e) => setSelectedSchedule({ ...selectedSchedule, holiday_destination_target: e.target.value })}
                          />
                        </FormField>
                      </Stack>
                    </Card>
                  </Grid>
                </Card>

                {/* Holidays */}
                <Card
                  title={`Holiday Exceptions (${selectedSchedule.holidays?.length || 0})`}
                  padding="md"
                  actions={
                    <Button variant="secondary" size="sm" onClick={() => setShowHolidayModal(true)} leftIcon={<Plus size={14} />}>
                      Add Holiday
                    </Button>
                  }
                >
                  {selectedSchedule.holidays && selectedSchedule.holidays.length > 0 ? (
                    <Grid cols={3} gap="3">
                      {selectedSchedule.holidays.map((h: Holiday) => (
                        <Card key={h.id} padding="md">
                          <Inline justify="between" align="center">
                            <Stack gap="1">
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pbx-text-primary)' }}>{h.name}</div>
                              <div style={{ fontSize: '12px', fontFamily: 'var(--pbx-font-mono)', color: '#7E22CE', fontWeight: 600 }}>{h.holiday_date}</div>
                            </Stack>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteHoliday(h.id)}>
                              <Trash2 size={13} style={{ color: 'var(--pbx-color-danger-600)' }} />
                            </Button>
                          </Inline>
                        </Card>
                      ))}
                    </Grid>
                  ) : (
                    <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--pbx-text-muted)' }}>
                      No company holidays added yet.
                    </div>
                  )}
                </Card>
              </Stack>
            ) : (
              <Card padding="lg">
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <Stack gap="3" align="center">
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--pbx-bg-subtle)', border: '1px solid var(--pbx-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pbx-text-muted)', margin: '0 auto' }}>
                      <Clock size={24} />
                    </div>
                    <Stack gap="1">
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--pbx-text-primary)' }}>No Schedule Profile Selected</div>
                      <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)' }}>Select a schedule profile from the left column to view or edit details.</div>
                    </Stack>
                  </Stack>
                </div>
              </Card>
            )}
          </div>
        </Grid>
      </Stack>

      {/* Modal: Create Schedule */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Business Hours Profile"
        subtitle="Define weekly business hours and time condition rules."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSchedule} isLoading={saving}>Create Profile</Button>
          </>
        }
      >
        <form onSubmit={handleCreateSchedule}>
          <Stack gap="4">
            <FormField label="Profile Name" required>
              <Input
                required
                placeholder="e.g. Main Office, Support Desk"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
              />
            </FormField>

            <FormField label="Operating Timezone" required>
              <Select
                value={newScheduleTimezone}
                onChange={(e) => setNewScheduleTimezone(e.target.value)}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </FormField>
          </Stack>
        </form>
      </Modal>

      {/* Modal: Add Holiday */}
      <Modal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title="Add Holiday Exception"
        subtitle="Override normal hours on specific dates."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowHolidayModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddHoliday}>Add Holiday</Button>
          </>
        }
      >
        <form onSubmit={handleAddHoliday}>
          <Stack gap="4">
            <FormField label="Holiday Name" required>
              <Input
                required
                placeholder="e.g. New Year's Day"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
              />
            </FormField>

            <FormField label="Holiday Date" required>
              <Input
                type="date"
                required
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
              />
            </FormField>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
};
