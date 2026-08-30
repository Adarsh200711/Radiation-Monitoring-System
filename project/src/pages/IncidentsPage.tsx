import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Filter, Search, CheckCircle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { db, subscribeData } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea, Button } from '@/components/ui/Form';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_COLORS,
  INCIDENT_STATUSES,
  INCIDENT_STATUS_COLORS,
} from '@/lib/constants';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { Incident, Facility, Employee, IncidentSeverity, IncidentStatus } from '@/types';

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [incId, setIncId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('low');
  const [reportedBy, setReportedBy] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [status, setStatus] = useState<IncidentStatus>('open');

  const load = useCallback(async () => {
    setLoading(true);
    const [incs, facs, emps] = await Promise.all([
      db.getIncidents(),
      db.getFacilities(),
      db.getEmployees(),
    ]);
    setIncidents(incs);
    setFacilities(facs);
    setEmployees(emps);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return subscribeData(load);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setIncId(`INC-2026-${String(incidents.length + 1).padStart(3, '0')}`);
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setReportedBy(employees[0]?.id || '');
    setFacilityId(facilities[0]?.id || '');
    setStatus('open');
    setModalOpen(true);
  }

  function openEdit(i: Incident) {
    setEditing(i);
    setIncId(i.incident_id);
    setTitle(i.title);
    setDescription(i.description);
    setSeverity(i.severity);
    setReportedBy(i.reported_by ?? '');
    setFacilityId(i.facility_id ?? '');
    setStatus(i.status);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!incId || !title || !description) return;
    await db.saveIncident({
      ...(editing ? { id: editing.id } : {}),
      incident_id: incId,
      title,
      description,
      severity,
      reported_by: reportedBy || null,
      facility_id: facilityId || null,
      status,
    });
    setModalOpen(false);
  }

  async function handleQuickStatus(id: string, newStatus: IncidentStatus) {
    await db.saveIncident({ id, status: newStatus });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this incident report?')) return;
    await db.deleteIncident(id);
  }

  const filteredIncidents = incidents.filter((i) => {
    const fac = facilities.find((f) => f.id === i.facility_id);
    const emp = employees.find((e) => e.id === i.reported_by);
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      i.incident_id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      (fac?.name && fac.name.toLowerCase().includes(q)) ||
      (emp?.full_name && emp.full_name.toLowerCase().includes(q));

    const matchesSeverity = !severityFilter || i.severity === severityFilter;
    const matchesStatus = !statusFilter || i.status === statusFilter;
    const matchesFacility = !facilityFilter || i.facility_id === facilityFilter;

    return matchesSearch && matchesSeverity && matchesStatus && matchesFacility;
  });

  const severityColors: Record<string, string> = {
    low: '#0ea5e9',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };

  const distData = Object.entries(INCIDENT_SEVERITIES).map(([key, label]) => ({
    name: label,
    value: incidents.filter((i) => i.severity === key).length,
    color: severityColors[key],
  }));

  const columns: Column<Incident>[] = [
    {
      key: 'id',
      header: 'Incident ID',
      render: (i) => <span className="font-mono text-xs font-semibold text-sky-400">{i.incident_id}</span>,
    },
    {
      key: 'title',
      header: 'Title & Summary',
      render: (i) => {
        const fac = facilities.find((f) => f.id === i.facility_id);
        const reporter = employees.find((e) => e.id === i.reported_by);
        return (
          <div className="max-w-md">
            <p className="font-semibold text-xs text-slate-100">{i.title}</p>
            <p className="line-clamp-1 text-xs text-slate-400">{i.description}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Plant: <span className="text-slate-400">{fac?.name ?? 'General'}</span> · Reported by: <span className="text-slate-400">{reporter?.full_name ?? 'Automated'}</span>
            </p>
          </div>
        );
      },
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (i) => (
        <Badge className={INCIDENT_SEVERITY_COLORS[i.severity]}>
          {INCIDENT_SEVERITIES[i.severity]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <Badge className={INCIDENT_STATUS_COLORS[i.status]}>
          {INCIDENT_STATUSES[i.status]}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Occurred',
      render: (i) => (
        <div>
          <p className="text-xs text-slate-300">{formatDateTime(i.date)}</p>
          <p className="text-[10px] text-slate-500">{formatRelative(i.date)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <div className="flex items-center justify-end gap-1">
          {i.status !== 'resolved' && i.status !== 'closed' && (
            <button
              onClick={() => handleQuickStatus(i.id, 'resolved')}
              title="Mark as Resolved"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => openEdit(i)}
            title="Edit"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(i.id)}
            title="Delete"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Safety Incidents & Breaches"
        description="Report radiation threshold violations, containment breaches, sensor failures, and mitigation actions"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Report Safety Incident
          </Button>
        }
      />

      {/* Analytics */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Severity Distribution Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(INCIDENT_SEVERITIES).map(([key, label]) => {
                const count = incidents.filter((i) => i.severity === key).length;
                return (
                  <div
                    key={key}
                    onClick={() => setSeverityFilter(severityFilter === key ? '' : key)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                      INCIDENT_SEVERITY_COLORS[key as IncidentSeverity]
                    } ${severityFilter === key ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-950' : ''}`}
                  >
                    <AlertTriangle className="mb-2 h-5 w-5" />
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs">{label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Proportions</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={distData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={38}
                    paddingAngle={2}
                  >
                    {distData.map((entry) => (
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
              <div className="flex h-[160px] items-center justify-center text-xs text-slate-500">
                No incidents reported
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, ID, or plant..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            options={Object.entries(INCIDENT_SEVERITIES).map(([value, label]) => ({ value, label }))}
            placeholder="All Severities"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(INCIDENT_STATUSES).map(([value, label]) => ({ value, label }))}
            placeholder="All Statuses"
          />
          <Select
            value={facilityFilter}
            onChange={setFacilityFilter}
            options={facilities.map((f) => ({ value: f.id, label: f.name }))}
            placeholder="All Plants"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredIncidents}
        loading={loading}
        emptyMessage="No safety incidents matching the selected criteria"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Safety Incident Report' : 'File New Safety Incident Report'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Incident ID" value={incId} onChange={setIncId} required />
            <Select
              label="Threat Severity"
              value={severity}
              onChange={(v) => setSeverity(v as IncidentSeverity)}
              options={Object.entries(INCIDENT_SEVERITIES).map(([value, label]) => ({ value, label }))}
            />
            <Select
              label="Nuclear Facility Location"
              value={facilityId}
              onChange={setFacilityId}
              options={facilities.map((f) => ({ value: f.id, label: f.name }))}
              placeholder="Select facility"
            />
            <Select
              label="Reporting Safety Officer"
              value={reportedBy}
              onChange={setReportedBy}
              options={employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.department})` }))}
              placeholder="Select reporting personnel"
            />
          </div>
          <Input label="Incident Headline / Summary" value={title} onChange={setTitle} placeholder="Brief summary of incident" required />
          <TextArea label="Detailed Incident Description & Mitigation" value={description} onChange={setDescription} placeholder="Comprehensive description of the event, containment actions taken, and status..." rows={4} required />
          <Select
            label="Investigation Status"
            value={status}
            onChange={(v) => setStatus(v as IncidentStatus)}
            options={Object.entries(INCIDENT_STATUSES).map(([value, label]) => ({ value, label }))}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Submit Report'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
