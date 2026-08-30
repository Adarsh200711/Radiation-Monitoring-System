import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  AlertTriangle,
  ClipboardCheck,
  Activity,
  Radiation,
  TrendingUp,
  ChevronRight,
  Radio,
  CheckCircle2,
  Plus,
  FileText,
  Clock,
  Play,
  Pause,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { db, subscribeData } from '@/lib/db';
import { telemetry } from '@/lib/telemetry';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import {
  INCIDENT_SEVERITY_COLORS,
  INCIDENT_SEVERITIES,
  INSPECTION_STATUSES,
  ALERT_LEVEL_COLORS,
} from '@/lib/constants';
import { formatRelative, formatDateTime, formatNumber } from '@/lib/format';
import type {
  Notification,
  Incident,
  RadiationReading,
  Zone,
} from '@/types';

interface Stats {
  facilities: number;
  employees: number;
  radiationAlerts: number;
  inspectionsDue: number;
}

interface TrendPoint {
  time: string;
  level: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    facilities: 0,
    employees: 0,
    radiationAlerts: 0,
    inspectionsDue: 0,
  });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'6h' | '24h' | 'all'>('24h');
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [incidentDist, setIncidentDist] = useState<{ name: string; value: number; color: string }[]>([]);
  const [inspectionStats, setInspectionStats] = useState<{ name: string; value: number; color: string }[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [telemetryState, setTelemetryState] = useState(() => telemetry.getState());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [facs, emps, reads, insps, incs, notifs, zns] = await Promise.all([
      db.getFacilities(),
      db.getEmployees(),
      db.getReadings(100),
      db.getInspections(),
      db.getIncidents(),
      db.getNotifications(),
      db.getZones(),
    ]);

    const activeAlerts = reads.filter((r) => r.alert_level === 'warning' || r.alert_level === 'critical').length;
    const dueInspections = insps.filter((i) => i.status === 'scheduled' || i.status === 'overdue').length;

    setStats({
      facilities: facs.length,
      employees: emps.length,
      radiationAlerts: activeAlerts,
      inspectionsDue: dueInspections,
    });
    setZones(zns);
    setRecentIncidents(incs.slice(0, 5));
    setNotifications(notifs.slice(0, 6));

    // Incident distribution
    const dist: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    incs.forEach((i) => {
      dist[i.severity] = (dist[i.severity] ?? 0) + 1;
    });
    const colors: Record<string, string> = {
      low: '#0ea5e9',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    };
    setIncidentDist(
      Object.entries(dist)
        .filter(([, val]) => val > 0)
        .map(([name, value]) => ({
          name: INCIDENT_SEVERITIES[name as keyof typeof INCIDENT_SEVERITIES] || name,
          value,
          color: colors[name] ?? '#64748b',
        })),
    );

    // Inspection stats
    const inspDist: Record<string, number> = {};
    insps.forEach((i) => {
      inspDist[i.status] = (inspDist[i.status] ?? 0) + 1;
    });
    const inspColors: Record<string, string> = {
      scheduled: '#0ea5e9',
      in_progress: '#6366f1',
      completed: '#10b981',
      overdue: '#ef4444',
      cancelled: '#64748b',
    };
    setInspectionStats(
      Object.entries(inspDist).map(([name, value]) => ({
        name: INSPECTION_STATUSES[name as keyof typeof INSPECTION_STATUSES] || name,
        value,
        color: inspColors[name] ?? '#64748b',
      })),
    );

    // Trend points
    let filteredReads = [...reads].reverse();
    if (timeRange === '6h') {
      const sixHoursAgo = Date.now() - 6 * 3600000;
      filteredReads = filteredReads.filter((r) => new Date(r.timestamp).getTime() >= sixHoursAgo);
    } else if (timeRange === '24h') {
      const dayAgo = Date.now() - 24 * 3600000;
      filteredReads = filteredReads.filter((r) => new Date(r.timestamp).getTime() >= dayAgo);
    }
    if (filteredReads.length === 0) filteredReads = reads.slice(0, 15).reverse();

    const points: TrendPoint[] = filteredReads.map((r: RadiationReading) => ({
      time: new Date(r.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      level: Number(r.radiation_level),
    }));
    setTrend(points);

    setLoading(false);
  }, [timeRange]);

  useEffect(() => {
    loadData();
    const unsubDb = subscribeData(loadData);
    const unsubTelemetry = telemetry.subscribe(setTelemetryState);

    return () => {
      unsubDb();
      unsubTelemetry();
    };
  }, [loadData]);

  // Live timer for "seconds ago"
  useEffect(() => {
    const timer = setInterval(() => {
      if (telemetryState.lastUpdated) {
        const diff = Math.floor((Date.now() - telemetryState.lastUpdated) / 1000);
        setSecondsAgo(Math.max(0, diff));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [telemetryState.lastUpdated]);

  const latestZone = zones.find((z) => z.id === telemetryState.latestReading?.zone_id);

  const statCards = [
    {
      label: 'Active Plants',
      value: stats.facilities,
      icon: Building2,
      color: 'sky',
      route: '/facilities',
      subtitle: 'Pressurized & Boiling Water',
    },
    {
      label: 'Monitored Personnel',
      value: stats.employees,
      icon: Users,
      color: 'cyan',
      route: '/employees',
      subtitle: 'Active radiation clearance',
    },
    {
      label: 'Telemetry Alerts',
      value: stats.radiationAlerts,
      icon: AlertTriangle,
      color: 'red',
      route: '/radiation',
      subtitle: stats.radiationAlerts > 0 ? 'Active threshold breaches' : 'Nominal parameters',
    },
    {
      label: 'Pending Audits',
      value: stats.inspectionsDue,
      icon: ClipboardCheck,
      color: 'amber',
      route: '/inspections',
      subtitle: 'Safety reviews scheduled',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  };

  const isLive = telemetryState.status === 'connected' && telemetryState.isStreaming;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Command Center"
        description="Live telemetry bus, automated sensor alarms, occupational dosage monitoring, and plant safety compliance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => telemetry.toggleStream()}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-md transition-all ${
                isLive
                  ? 'bg-emerald-600/90 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isLive ? 'Pause Telemetry' : 'Resume Telemetry'}
            </button>
            <button
              onClick={() => navigate('/radiation')}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-colors"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" /> Telemetry Monitor
            </button>
          </div>
        }
      />

      {/* Real-time System Status Highlights Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: System Status */}
        <Card className="border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                SYSTEM STATUS
              </span>
              <span className="relative flex h-2.5 w-2.5">
                {isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isLive ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-slate-100 flex items-center gap-1.5">
              {isLive ? '🟢 Connected' : '⚪ Stream Paused'}
            </p>
            <p className="mt-1 text-xs text-sky-400/90 font-mono flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> {telemetryState.statusMessage}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Current Reading */}
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                CURRENT READING
              </span>
              {telemetryState.latestReading && (
                <Badge className={ALERT_LEVEL_COLORS[telemetryState.latestReading.alert_level]}>
                  {telemetryState.latestReading.alert_level.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {telemetryState.latestReading ? formatNumber(Number(telemetryState.latestReading.radiation_level)) : '2.150'}
              </span>
              <span className="text-xs text-slate-400 font-mono">mSv/h</span>
            </div>
            <p className="mt-1 text-xs text-slate-400 truncate">
              {latestZone?.zone_name ?? 'Reactor Containment A'}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Last Update */}
        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                LAST TELEMETRY UPDATE
              </span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-lg font-bold font-mono text-slate-100">
              {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Broadcast cycle: every {telemetryState.frequencyMs / 1000}s
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Operations */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                TOTAL TELEMETRY OPS
              </span>
              <Layers className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-2 text-2xl font-black font-mono text-slate-100">
              {telemetryState.totalOperations.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Real-time bus healthy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Operations Action Ribbon */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-200">System Operations & Fast Controls</p>
            <p className="text-[11px] text-slate-400">Direct operational triggers for safety management</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/facilities')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-sky-400" /> Facilities & Zones
            </button>
            <button
              onClick={() => navigate('/exposure')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" /> Log Dosimetry
            </button>
            <button
              onClick={() => navigate('/inspections')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" /> Schedule Audit
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Report Incident
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" /> Export Logs
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <Card
              key={card.label}
              className="cursor-pointer transition-all hover:border-slate-700 hover:scale-[1.01]"
              onClick={() => navigate(card.route)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-100">
                      {loading ? (
                        <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-800" />
                      ) : (
                        card.value
                      )}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner ${c.bg} ${c.border}`}
                  >
                    <card.icon className={`h-6 w-6 ${c.text}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800/80 pt-2.5">
                  <span className="text-slate-500">{card.subtitle}</span>
                  <span className={`flex items-center font-semibold ${c.text}`}>
                    View Details <ChevronRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-400" />
                <CardTitle>Continuous Radiation Telemetry Waveform</CardTitle>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-800/50 p-1">
                {(['6h', '24h', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      timeRange === r
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="radGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  formatter={(value: unknown) => [`${value} mSv/h`, 'Dose Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#radGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Safety Incident Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {incidentDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={incidentDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {incidentDist.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-xs text-slate-500">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mr-2" />
                Zero incidents recorded
              </div>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2.5">
              {incidentDist.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-xs text-slate-400">
                    {d.name} ({d.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents & Alarms Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Incidents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <CardTitle>Recent Incident Reports</CardTitle>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center"
              >
                All Incidents <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentIncidents.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No safety incidents reported. Systems nominal.
              </p>
            ) : (
              recentIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => navigate('/incidents')}
                  className="cursor-pointer flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/60"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      INCIDENT_SEVERITY_COLORS[inc.severity]
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-slate-200">
                        {inc.title}
                      </p>
                      <Badge className={INCIDENT_SEVERITY_COLORS[inc.severity]}>
                        {INCIDENT_SEVERITIES[inc.severity]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                      {inc.description}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {formatDateTime(inc.date)} · {formatRelative(inc.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notifications & System Alarms */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radiation className="h-5 w-5 text-sky-400" />
                <CardTitle>Active System Alarms</CardTitle>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => db.markAllNotificationsRead()}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                All monitoring parameters are in safe operational ranges.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3 ${
                    n.severity === 'critical'
                      ? 'border-red-500/20 bg-red-500/5'
                      : n.severity === 'warning'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-slate-800 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        n.severity === 'critical'
                          ? 'bg-red-400 animate-ping'
                          : n.severity === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-100">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500 font-mono">
                        {formatRelative(n.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      {inspectionStats.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <CardTitle>Inspection & Audit Schedule Overview</CardTitle>
              </div>
              <button
                onClick={() => navigate('/inspections')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center"
              >
                Inspection Center <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={inspectionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {inspectionStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
