import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Activity, Radio, AlertTriangle, RefreshCw, Plus, ShieldAlert } from 'lucide-react';
import { db, subscribeData } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, Button, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { ALERT_LEVEL_COLORS, ALERT_LEVEL_DOT } from '@/lib/constants';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format';
import type { Facility, Zone, RadiationReading, AlertLevel } from '@/types';

export function RadiationPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [alertFilter, setAlertFilter] = useState('');
  const [readings, setReadings] = useState<RadiationReading[]>([]);
  const [liveReadings, setLiveReadings] = useState<Record<string, RadiationReading>>({});
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Manual reading modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualFacility, setManualFacility] = useState('');
  const [manualZone, setManualZone] = useState('');
  const [manualLevel, setManualLevel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [facs, zns, reads] = await Promise.all([
      db.getFacilities(),
      db.getZones(),
      db.getReadings(120),
    ]);
    setFacilities(facs);
    setZones(zns);
    setReadings(reads);

    const latest: Record<string, RadiationReading> = {};
    reads.forEach((r: RadiationReading) => {
      if (!latest[r.zone_id]) latest[r.zone_id] = r;
    });
    setLiveReadings(latest);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return subscribeData(load);
  }, [load]);

  // Live simulation - generate readings periodically and persist
  useEffect(() => {
    if (!simulating || zones.length === 0) return;

    const interval = setInterval(async () => {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const limit = zone.radiation_limit;
      const rand = Math.random();
      let level: number;
      let alertLevel: AlertLevel;

      if (rand < 0.08) {
        level = limit * (1.1 + Math.random() * 0.5);
        alertLevel = 'critical';
      } else if (rand < 0.25) {
        level = limit * (0.7 + Math.random() * 0.3);
        alertLevel = 'warning';
      } else {
        level = limit * (0.1 + Math.random() * 0.5);
        alertLevel = 'normal';
      }

      const rounded = Math.round(level * 1000) / 1000;
      await db.addReading({
        facility_id: zone.facility_id,
        zone_id: zone.id,
        radiation_level: rounded,
        unit: 'mSv/h',
        alert_level: alertLevel,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [simulating, zones]);

  async function handleManualSubmit() {
    if (!manualFacility || !manualZone || !manualLevel) return;
    const zoneObj = zones.find((z) => z.id === manualZone);
    const numLevel = parseFloat(manualLevel) || 0;
    const limit = zoneObj?.radiation_limit || 5.0;

    let alertLevel: AlertLevel = 'normal';
    if (numLevel >= limit) {
      alertLevel = 'critical';
    } else if (numLevel >= limit * 0.7) {
      alertLevel = 'warning';
    }

    await db.addReading({
      facility_id: manualFacility,
      zone_id: manualZone,
      radiation_level: numLevel,
      unit: 'mSv/h',
      alert_level: alertLevel,
      timestamp: new Date().toISOString(),
    });

    setManualModalOpen(false);
    setManualLevel('');
  }

  const filteredZones = selectedFacility
    ? zones.filter((z) => z.facility_id === selectedFacility)
    : zones;

  const modalFilteredZones = manualFacility
    ? zones.filter((z) => z.facility_id === manualFacility)
    : zones;

  const chartData = readings
    .filter((r) => !selectedZone || r.zone_id === selectedZone)
    .filter((r) => !selectedFacility || r.facility_id === selectedFacility)
    .slice(0, 50)
    .reverse()
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      level: Number(r.radiation_level),
      alert: r.alert_level,
    }));

  const alertReadings = readings.filter((r) => {
    if (alertFilter) return r.alert_level === alertFilter;
    return r.alert_level !== 'normal';
  });

  const selectedZoneObj = zones.find((z) => z.id === selectedZone);

  return (
    <div>
      <PageHeader
        title="Live Radiation Telemetry"
        description="Real-time sensor streams, automated limit breach detection, and critical alarms"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setManualFacility(facilities[0]?.id || '');
                setManualZone(zones[0]?.id || '');
                setManualModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Log Manual Reading
            </Button>
            <button
              onClick={() => setSimulating(!simulating)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-lg transition-colors ${
                simulating
                  ? 'bg-red-600 text-white shadow-red-500/20 hover:bg-red-500'
                  : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-500'
              }`}
            >
              <Radio className={`h-4 w-4 ${simulating ? 'animate-pulse' : ''}`} />
              {simulating ? 'Halt Telemetry Simulation' : 'Start Live Telemetry Stream'}
            </button>
          </div>
        }
      />

      {/* Zone Gauge Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-32 p-4">
                <div className="h-full w-full animate-pulse rounded bg-slate-800/50" />
              </CardContent>
            </Card>
          ))
        ) : (
          filteredZones.map((zone) => {
            const reading = liveReadings[zone.id];
            const level = reading ? Number(reading.radiation_level) : 0;
            const alert = reading?.alert_level ?? 'normal';
            const pct = Math.min((level / zone.radiation_limit) * 100, 100);

            return (
              <Card
                key={zone.id}
                className={`transition-all ${
                  alert === 'critical'
                    ? 'border-red-500/40 bg-red-500/5'
                    : alert === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'hover:border-slate-700'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200 truncate">{zone.zone_name}</p>
                      <p className="text-[11px] text-slate-400">Limit: {zone.radiation_limit} mSv/h</p>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${ALERT_LEVEL_DOT[alert]} ${
                        simulating ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-bold font-mono text-slate-100">
                        {formatNumber(level)}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">mSv/h</span>
                    </div>
                    <Badge className={ALERT_LEVEL_COLORS[alert]}>
                      {alert.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        alert === 'critical'
                          ? 'bg-red-500'
                          : alert === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-500">
                    {Math.round(pct)}% of safety limit
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-400" />
              <CardTitle>Radiation Level Waveform</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedFacility}
                onChange={(v) => {
                  setSelectedFacility(v);
                  setSelectedZone('');
                }}
                options={facilities.map((f) => ({ value: f.id, label: f.name }))}
                placeholder="All Facilities"
              />
              <Select
                value={selectedZone}
                onChange={setSelectedZone}
                options={filteredZones.map((z) => ({ value: z.id, label: z.zone_name }))}
                placeholder="All Zones"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: unknown) => [`${val} mSv/h`, 'Level']}
                />
                {selectedZoneObj && (
                  <ReferenceLine
                    y={selectedZoneObj.radiation_limit}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label={{
                      value: `Max Limit (${selectedZoneObj.radiation_limit} mSv/h)`,
                      fill: '#ef4444',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#0ea5e9' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-xs text-slate-500">
              No radiation telemetry points available for selected criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert log */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <CardTitle>Telemetry Alert History</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={alertFilter}
                onChange={setAlertFilter}
                options={[
                  { value: 'warning', label: 'Warning Only' },
                  { value: 'critical', label: 'Critical Only' },
                ]}
                placeholder="All Alert Levels"
              />
              <button
                onClick={load}
                title="Refresh Readings"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {alertReadings.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              <Activity className="mx-auto mb-2 h-6 w-6 text-slate-600" />
              Zero active alarms — all sensor readings within normal radiation threshold.
            </p>
          ) : (
            alertReadings.slice(0, 15).map((r) => {
              const zone = zones.find((z) => z.id === r.zone_id);
              const fac = facilities.find((f) => f.id === r.facility_id);
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    r.alert_level === 'critical'
                      ? 'border-red-500/30 bg-red-500/10'
                      : 'border-amber-500/30 bg-amber-500/10'
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 flex-shrink-0 ${
                      r.alert_level === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {zone?.zone_name ?? 'Unknown Zone'} — {fac?.name ?? 'Plant'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Radiation: <span className="font-mono font-bold text-white">{formatNumber(Number(r.radiation_level))} mSv/h</span> · Recorded {formatDateTime(r.timestamp)}
                    </p>
                  </div>
                  <Badge className={ALERT_LEVEL_COLORS[r.alert_level]}>
                    {r.alert_level.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">{formatRelative(r.timestamp)}</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Manual Reading Modal */}
      <Modal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Log Calibrated Sensor Reading"
      >
        <div className="space-y-4">
          <Select
            label="Facility"
            value={manualFacility}
            onChange={(v) => {
              setManualFacility(v);
              const matchingZones = zones.filter((z) => z.facility_id === v);
              if (matchingZones[0]) setManualZone(matchingZones[0].id);
            }}
            options={facilities.map((f) => ({ value: f.id, label: f.name }))}
            required
          />
          <Select
            label="Zone"
            value={manualZone}
            onChange={setManualZone}
            options={modalFilteredZones.map((z) => ({ value: z.id, label: `${z.zone_name} (Limit: ${z.radiation_limit} mSv/h)` }))}
            required
          />
          <Input
            label="Measured Radiation Level (mSv/h)"
            type="number"
            value={manualLevel}
            onChange={setManualLevel}
            placeholder="e.g. 2.450"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setManualModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualSubmit}>Submit Reading</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
