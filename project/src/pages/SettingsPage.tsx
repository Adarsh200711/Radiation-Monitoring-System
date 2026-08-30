import { useState, useEffect } from 'react';
import { User, Shield, Bell, Save, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { db, type SystemSettings } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Button } from '@/components/ui/Form';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';

export function SettingsPage() {
  const { profile, updateCurrentProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Threshold and notification settings
  const [settings, setSettings] = useState<SystemSettings>(() => db.getSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    // Sync profile changes to input fields
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone ?? '');
    }
  }, [profile?.full_name, profile?.phone]);

  async function handleSaveProfile() {
    if (!fullName) {
      alert('Please enter a full name');
      return;
    }
    setProfileSaving(true);
    try {
      await updateCurrentProfile({
        full_name: fullName,
        phone: phone || null,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) {
      console.error('Profile save error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  }

  function handleSaveSettings() {
    db.saveSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  function handleFactoryReset() {
    db.resetToFactoryDefaults();
    setSettings(db.getSettings());
    setResetConfirm(false);
    alert('System database has been reset to factory seed data.');
  }

  return (
    <div>
      <PageHeader
        title="System Configuration & Settings"
        description="Manage your security clearance profile, radiation threshold limits, and automated alert preferences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-sky-400" />
              <CardTitle>Personnel Clearance Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-700 text-lg font-bold text-white shadow-lg shadow-sky-500/20">
                {profile?.full_name?.charAt(0) ?? 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-100">{profile?.full_name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={ROLE_COLORS[profile?.role ?? 'employee']}>
                    {ROLE_LABELS[profile?.role ?? 'employee']}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-500">{profile?.phone ?? 'Active'}</span>
                </div>
              </div>
            </div>

            <Input label="Full Legal Name" value={fullName} onChange={setFullName} required />
            <Input label="Direct Telephone / Extension" value={phone} onChange={setPhone} placeholder="555-0100" />

            <Button onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? (
                <>Saving...</>
              ) : profileSaved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" /> Profile Updated
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Safety Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <CardTitle>Radiation Safety Thresholds</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Warning Alert Threshold (% of zone max limit)
                </label>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {settings.warningThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={settings.warningThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, warningThreshold: Number(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Critical Alarm Threshold (% of zone max limit)
                </label>
                <span className="font-mono text-xs font-bold text-red-400">
                  {settings.criticalThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="120"
                value={settings.criticalThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, criticalThreshold: Number(e.target.value) })
                }
                className="w-full accent-red-500"
              />
            </div>

            <Input
              label="Annual Occupational Exposure Limit (mSv)"
              type="number"
              value={String(settings.exposureLimit)}
              onChange={(val) =>
                setSettings({ ...settings, exposureLimit: parseFloat(val) || 20 })
              }
            />

            <Button onClick={handleSaveSettings}>
              {settingsSaved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" /> Thresholds Applied
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Thresholds
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-400" />
              <CardTitle>Notification & Alert Channels</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3.5">
              <div>
                <p className="text-xs font-semibold text-slate-200">Email Safety Bulletins</p>
                <p className="text-[11px] text-slate-400">
                  Dispatch email notifications when warnings or critical incidents occur
                </p>
              </div>
              <button
                onClick={() => {
                  const updated = { ...settings, emailAlerts: !settings.emailAlerts };
                  setSettings(updated);
                  db.saveSettings(updated);
                }}
                className={`relative h-5 w-10 rounded-full transition-colors ${
                  settings.emailAlerts ? 'bg-sky-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.emailAlerts ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3.5">
              <div>
                <p className="text-xs font-semibold text-slate-200">Real-time Push Alerts</p>
                <p className="text-[11px] text-slate-400">
                  Instant sound and banner alarms for critical radiation threshold breaches
                </p>
              </div>
              <button
                onClick={() => {
                  const updated = { ...settings, pushAlerts: !settings.pushAlerts };
                  setSettings(updated);
                  db.saveSettings(updated);
                }}
                className={`relative h-5 w-10 rounded-full transition-colors ${
                  settings.pushAlerts ? 'bg-sky-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.pushAlerts ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Database & Diagnostics */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-red-400">Database & System Maintenance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-300">
              Reset the local telemetry and operational store back to official baseline seed data (4 nuclear stations, 10 zones, 12 staff, telemetry streams, and incident reports).
            </p>

            {resetConfirm ? (
              <div className="flex items-center gap-2 pt-2">
                <Button variant="danger" size="sm" onClick={handleFactoryReset}>
                  <RotateCcw className="h-3.5 w-3.5" /> Confirm Database Reset
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setResetConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setResetConfirm(true)}>
                <RotateCcw className="h-3.5 w-3.5" /> Factory Reset Database
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
