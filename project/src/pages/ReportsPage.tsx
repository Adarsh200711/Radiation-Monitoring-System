import { useEffect, useState, useCallback } from 'react';
import { Download, Radiation, Users, ClipboardCheck, AlertTriangle, Search, Filter } from 'lucide-react';
import { db, subscribeData } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, Select } from '@/components/ui/Form';
import { exportToCsv } from '@/lib/csv';
import {
  ALERT_LEVEL_COLORS,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INSPECTION_STATUSES,
} from '@/lib/constants';
import { formatDateTime, formatNumber } from '@/lib/format';
import type {
  RadiationReading,
  Employee,
  ExposureRecord,
  Inspection,
  Incident,
  Zone,
  Facility,
} from '@/types';

type ReportType = 'radiation' | 'exposure' | 'inspection' | 'incident';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('radiation');
  const [zones, setZones] = useState<Zone[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [readings, setReadings] = useState<RadiationReading[]>([]);
  const [exposures, setExposures] = useState<ExposureRecord[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [search, setSearch] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [zns, facs, emps, reads, exps, insps, incs] = await Promise.all([
      db.getZones(),
      db.getFacilities(),
      db.getEmployees(),
      db.getReadings(250),
      db.getExposures(),
      db.getInspections(),
      db.getIncidents(),
    ]);
    setZones(zns);
    setFacilities(facs);
    setEmployees(emps);
    setReadings(reads);
    setExposures(exps);
    setInspections(insps);
    setIncidents(incs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    return subscribeData(loadData);
  }, [loadData]);

  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z]));
  const facMap = Object.fromEntries(facilities.map((f) => [f.id, f]));
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  // Filtered data based on active report
  const filteredReadings = readings.filter((r) => {
    const fac = facMap[r.facility_id];
    const zone = zoneMap[r.zone_id];
    const matchesFac = !facilityFilter || r.facility_id === facilityFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (fac?.name && fac.name.toLowerCase().includes(q)) ||
      (zone?.zone_name && zone.zone_name.toLowerCase().includes(q)) ||
      r.alert_level.toLowerCase().includes(q);
    return matchesFac && matchesSearch;
  });

  const filteredExposures = exposures.filter((r) => {
    const emp = empMap[r.employee_id];
    const zone = zoneMap[r.zone_id];
    const matchesFac = !facilityFilter || (zone && zone.facility_id === facilityFilter);
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (emp?.full_name && emp.full_name.toLowerCase().includes(q)) ||
      (emp?.employee_id && emp.employee_id.toLowerCase().includes(q)) ||
      (zone?.zone_name && zone.zone_name.toLowerCase().includes(q));
    return matchesFac && matchesSearch;
  });

  const filteredInspections = inspections.filter((i) => {
    const fac = facMap[i.facility_id];
    const emp = empMap[i.inspector_id ?? ''];
    const matchesFac = !facilityFilter || i.facility_id === facilityFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      i.inspection_id.toLowerCase().includes(q) ||
      (fac?.name && fac.name.toLowerCase().includes(q)) ||
      (emp?.full_name && emp.full_name.toLowerCase().includes(q)) ||
      i.status.toLowerCase().includes(q);
    return matchesFac && matchesSearch;
  });

  const filteredIncidents = incidents.filter((i) => {
    const fac = facMap[i.facility_id ?? ''];
    const matchesFac = !facilityFilter || i.facility_id === facilityFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      i.incident_id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      (fac?.name && fac.name.toLowerCase().includes(q)) ||
      i.severity.toLowerCase().includes(q);
    return matchesFac && matchesSearch;
  });

  function handleExport() {
    if (activeReport === 'radiation') {
      exportToCsv(
        'radiation_monitoring_report.csv',
        ['Facility', 'Zone', 'Radiation Level (mSv/h)', 'Alert Status', 'Timestamp'],
        filteredReadings.map((r) => [
          facMap[r.facility_id]?.name ?? 'Unknown',
          zoneMap[r.zone_id]?.zone_name ?? 'Unknown',
          r.radiation_level,
          r.alert_level,
          formatDateTime(r.timestamp),
        ]),
      );
    } else if (activeReport === 'exposure') {
      exportToCsv(
        'personnel_exposure_dosimetry_report.csv',
        ['Employee Name', 'Employee ID', 'Department', 'Zone', 'Exposure Dose (mSv)', 'Date'],
        filteredExposures.map((r) => {
          const emp = empMap[r.employee_id];
          return [
            emp?.full_name ?? '',
            emp?.employee_id ?? '',
            emp?.department ?? '',
            zoneMap[r.zone_id]?.zone_name ?? '',
            r.exposure_value,
            r.exposure_date,
          ];
        }),
      );
    } else if (activeReport === 'inspection') {
      exportToCsv(
        'facility_safety_inspections_report.csv',
        ['Inspection ID', 'Nuclear Facility', 'Inspector', 'Date', 'Status', 'Findings', 'Corrective Actions'],
        filteredInspections.map((insp) => [
          insp.inspection_id,
          facMap[insp.facility_id]?.name ?? '',
          empMap[insp.inspector_id ?? '']?.full_name ?? 'Unassigned',
          insp.inspection_date,
          INSPECTION_STATUSES[insp.status],
          insp.findings ?? '',
          insp.corrective_actions ?? '',
        ]),
      );
    } else if (activeReport === 'incident') {
      exportToCsv(
        'nuclear_safety_incidents_report.csv',
        ['Incident ID', 'Title', 'Severity', 'Status', 'Facility', 'Timestamp', 'Description'],
        filteredIncidents.map((inc) => [
          inc.incident_id,
          inc.title,
          INCIDENT_SEVERITIES[inc.severity],
          INCIDENT_STATUSES[inc.status],
          facMap[inc.facility_id ?? '']?.name ?? 'General',
          formatDateTime(inc.date),
          inc.description,
        ]),
      );
    }
  }

  const reports = [
    {
      key: 'radiation' as ReportType,
      label: 'Radiation Telemetry Report',
      icon: Radiation,
      description: 'Sensor streams, zone averages, and threshold breaches',
      color: 'sky',
      count: filteredReadings.length,
    },
    {
      key: 'exposure' as ReportType,
      label: 'Personnel Dosimetry Report',
      icon: Users,
      description: 'Individual occupational radiation dosage logs',
      color: 'cyan',
      count: filteredExposures.length,
    },
    {
      key: 'inspection' as ReportType,
      label: 'Safety Audit Report',
      icon: ClipboardCheck,
      description: 'Containment inspections, findings, and schedule',
      color: 'amber',
      count: filteredInspections.length,
    },
    {
      key: 'incident' as ReportType,
      label: 'Safety Incident Report',
      icon: AlertTriangle,
      description: 'Security breach events, severities, and resolutions',
      color: 'red',
      count: filteredIncidents.length,
    },
  ];

  const colorMap: Record<string, string> = {
    sky: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const getRecordCount = () => {
    if (activeReport === 'radiation') return filteredReadings.length;
    if (activeReport === 'exposure') return filteredExposures.length;
    if (activeReport === 'inspection') return filteredInspections.length;
    return filteredIncidents.length;
  };

  return (
    <div>
      <PageHeader
        title="Regulatory Compliance & Safety Reports"
        description="Generate, filter, and export official nuclear safety and dosimeter compliance logs"
        actions={
          <Button onClick={handleExport} disabled={loading || getRecordCount() === 0}>
            <Download className="h-4 w-4" /> Export CSV Report
          </Button>
        }
      />

      {/* Report type cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((r) => (
          <button
            key={r.key}
            onClick={() => {
              setActiveReport(r.key);
              setSearch('');
            }}
            className={`rounded-xl border p-4 text-left transition-all ${
              activeReport === r.key
                ? `${colorMap[r.color]} ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-950`
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorMap[r.color]}`}>
                <r.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">
                {r.count} records
              </span>
            </div>
            <p className="mt-3 font-semibold text-xs text-slate-100">{r.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{r.description}</p>
          </button>
        ))}
      </div>

      {/* Search & Facility Filter */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report entries..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <Select
            value={facilityFilter}
            onChange={setFacilityFilter}
            options={facilities.map((f) => ({ value: f.id, label: f.name }))}
            placeholder="All Nuclear Facilities"
          />
        </div>
      </div>

      {/* Report preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {reports.find((r) => r.key === activeReport)?.label}
            </CardTitle>
            <span className="text-xs font-mono text-sky-400">
              {loading ? 'Loading...' : `${getRecordCount()} matching logs`}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/50" />
              ))}
            </div>
          ) : getRecordCount() === 0 ? (
            <p className="py-12 text-center text-xs text-slate-500">
              No matching records found for the active filter parameters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80">
                    {activeReport === 'radiation' &&
                      ['Nuclear Facility', 'Monitoring Zone', 'Radiation Level', 'Alert Status', 'Timestamp'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    {activeReport === 'exposure' &&
                      ['Worker Personnel', 'Department', 'Zone', 'Exposure Dose', 'Log Date'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    {activeReport === 'inspection' &&
                      ['Inspection ID', 'Target Facility', 'Inspector', 'Schedule Date', 'Status'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    {activeReport === 'incident' &&
                      ['Incident ID', 'Headline', 'Severity', 'Investigation Status', 'Occurred Date'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {activeReport === 'radiation' &&
                    filteredReadings.slice(0, 60).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-slate-200">{facMap[r.facility_id]?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-300">{zoneMap[r.zone_id]?.zone_name ?? 'Unknown'}</td>
                        <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-100">{formatNumber(Number(r.radiation_level))} mSv/h</td>
                        <td className="px-3 py-2.5">
                          <Badge className={ALERT_LEVEL_COLORS[r.alert_level]}>
                            {r.alert_level.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">{formatDateTime(r.timestamp)}</td>
                      </tr>
                    ))}

                  {activeReport === 'exposure' &&
                    filteredExposures.slice(0, 60).map((r) => {
                      const emp = empMap[r.employee_id];
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2.5 text-xs font-medium text-slate-200">{emp?.full_name ?? 'Worker'} ({emp?.employee_id})</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{emp?.department ?? 'Operations'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-300">{zoneMap[r.zone_id]?.zone_name ?? 'Zone'}</td>
                          <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-100">{formatNumber(Number(r.exposure_value))} mSv</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{r.exposure_date}</td>
                        </tr>
                      );
                    })}

                  {activeReport === 'inspection' &&
                    filteredInspections.slice(0, 60).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-sky-400">{r.inspection_id}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-200">{facMap[r.facility_id]?.name}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-300">{empMap[r.inspector_id ?? '']?.full_name ?? 'Unassigned'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">{r.inspection_date}</td>
                        <td className="px-3 py-2.5">
                          <Badge className={INSPECTION_STATUSES[r.status] ? ALERT_LEVEL_COLORS['normal'] : ''}>
                            {INSPECTION_STATUSES[r.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}

                  {activeReport === 'incident' &&
                    filteredIncidents.slice(0, 60).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-sky-400">{r.incident_id}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-slate-200">{r.title}</td>
                        <td className="px-3 py-2.5">
                          <Badge className={ALERT_LEVEL_COLORS[r.severity === 'critical' ? 'critical' : r.severity === 'high' ? 'warning' : 'normal']}>
                            {INCIDENT_SEVERITIES[r.severity]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-300">{INCIDENT_STATUSES[r.status]}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">{formatDateTime(r.date)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {getRecordCount() > 60 && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Displaying top 60 records. Use 'Export CSV Report' for the complete dataset.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
