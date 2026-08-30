import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ClipboardCheck, Calendar, Search, Filter, CheckCircle } from 'lucide-react';
import { db, subscribeData } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea, Button } from '@/components/ui/Form';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { INSPECTION_STATUSES, INSPECTION_STATUS_COLORS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { Inspection, Facility, Employee, InspectionStatus } from '@/types';

export function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Inspection | null>(null);
  const [inspId, setInspId] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [date, setDate] = useState('');
  const [findings, setFindings] = useState('');
  const [status, setStatus] = useState<InspectionStatus>('scheduled');
  const [corrective, setCorrective] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [insps, facs, emps] = await Promise.all([
      db.getInspections(),
      db.getFacilities(),
      db.getEmployees(),
    ]);
    setInspections(insps);
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
    setInspId(`INS-2026-${String(inspections.length + 1).padStart(3, '0')}`);
    setFacilityId(facilities[0]?.id || '');
    setInspectorId(employees.find((e) => e.role === 'safety_officer')?.id || employees[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setFindings('');
    setStatus('scheduled');
    setCorrective('');
    setModalOpen(true);
  }

  function openEdit(i: Inspection) {
    setEditing(i);
    setInspId(i.inspection_id);
    setFacilityId(i.facility_id);
    setInspectorId(i.inspector_id ?? '');
    setDate(i.inspection_date);
    setFindings(i.findings ?? '');
    setStatus(i.status);
    setCorrective(i.corrective_actions ?? '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!inspId || !facilityId || !date) {
      alert('Please fill in required fields: Inspection ID, Facility, and Date');
      return;
    }

    try {
      const inspectionData = {
        ...(editing ? { id: editing.id } : {}),
        inspection_id: inspId,
        facility_id: facilityId,
        inspector_id: inspectorId?.trim() ? inspectorId : null,
        inspection_date: date,
        findings: findings?.trim() || null,
        status,
        corrective_actions: corrective?.trim() || null,
      };
      await db.saveInspection(inspectionData);
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      await load();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Failed to save inspection. Please try again.');
    }
  }

  async function handleQuickStatus(id: string, newStatus: InspectionStatus) {
    await db.saveInspection({ id, status: newStatus });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this inspection audit record? This action cannot be undone.')) return;
    try {
      await db.deleteInspection(id);
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert('Failed to delete inspection. Please try again.');
    }
  }

  const filteredInspections = inspections.filter((i) => {
    const fac = facilities.find((f) => f.id === i.facility_id);
    const emp = employees.find((e) => e.id === i.inspector_id);
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      i.inspection_id.toLowerCase().includes(q) ||
      (i.findings && i.findings.toLowerCase().includes(q)) ||
      (fac?.name && fac.name.toLowerCase().includes(q)) ||
      (emp?.full_name && emp.full_name.toLowerCase().includes(q));

    const matchesStatus = !statusFilter || i.status === statusFilter;
    const matchesFacility = !facilityFilter || i.facility_id === facilityFilter;

    return matchesSearch && matchesStatus && matchesFacility;
  });

  const columns: Column<Inspection>[] = [
    {
      key: 'id',
      header: 'Inspection ID',
      render: (i) => <span className="font-mono text-xs font-semibold text-sky-400">{i.inspection_id}</span>,
    },
    {
      key: 'facility',
      header: 'Nuclear Facility',
      render: (i) => {
        const f = facilities.find((f) => f.id === i.facility_id);
        return <span className="font-medium text-xs text-slate-200">{f?.name ?? 'Unknown Facility'}</span>;
      },
    },
    {
      key: 'inspector',
      header: 'Safety Inspector',
      render: (i) => {
        const e = employees.find((e) => e.id === i.inspector_id);
        return <span className="text-xs text-slate-300">{e?.full_name ?? 'Unassigned Inspector'}</span>;
      },
    },
    {
      key: 'date',
      header: 'Schedule Date',
      render: (i) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-500" /> {formatDate(i.inspection_date)}
        </span>
      ),
    },
    {
      key: 'findings',
      header: 'Findings / Notes',
      render: (i) => (
        <div className="max-w-xs">
          <p className="line-clamp-2 text-xs text-slate-400">{i.findings ?? '—'}</p>
          {i.corrective_actions && (
            <p className="mt-0.5 text-[10px] text-amber-400 line-clamp-1">
              Action: {i.corrective_actions}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <Badge className={INSPECTION_STATUS_COLORS[i.status]}>
          {INSPECTION_STATUSES[i.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <div className="flex items-center justify-end gap-1">
          {i.status !== 'completed' && (
            <button
              onClick={() => handleQuickStatus(i.id, 'completed')}
              title="Mark as Completed"
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

  const statusCounts = inspections.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader
        title="Safety Audits & Inspections"
        description="Schedule routine maintenance audits, log containment inspections, and track corrective safety actions"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Schedule Inspection
          </Button>
        }
      />

      {/* Status summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(INSPECTION_STATUSES).map(([key, label]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${
              statusFilter === key ? 'border-sky-500/50 bg-sky-500/5' : 'hover:border-slate-700'
            }`}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-slate-500" />
                <p className="text-xs text-slate-400">{label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-100">
                {statusCounts[key] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, plant, findings, or inspector..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(INSPECTION_STATUSES).map(([value, label]) => ({ value, label }))}
            placeholder="All Statuses"
          />
          <Select
            value={facilityFilter}
            onChange={setFacilityFilter}
            options={facilities.map((f) => ({ value: f.id, label: f.name }))}
            placeholder="All Facilities"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredInspections}
        loading={loading}
        emptyMessage="No inspections found matching the filter criteria"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Safety Inspection' : 'Schedule New Inspection'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Inspection Audit ID" value={inspId} onChange={setInspId} required />
            <Input label="Inspection Date" type="date" value={date} onChange={setDate} required />
            <Select
              label="Target Nuclear Facility"
              value={facilityId}
              onChange={setFacilityId}
              options={facilities.map((f) => ({ value: f.id, label: f.name }))}
              placeholder="Select facility"
              required
            />
            <Select
              label="Assigned Safety Inspector"
              value={inspectorId}
              onChange={setInspectorId}
              options={[
                ...employees
                  .filter(e => e.role === 'safety_officer')
                  .map((e) => ({ value: e.id, label: `${e.full_name} (${e.designation})` })),
                ...employees
                  .filter(e => e.role !== 'safety_officer')
                  .map((e) => ({ value: e.id, label: `${e.full_name} (${e.designation})` }))
              ]}
              placeholder="Select inspector"
            />
          </div>
          <Select
            label="Audit Progress Status"
            value={status}
            onChange={(v) => setStatus(v as InspectionStatus)}
            options={Object.entries(INSPECTION_STATUSES).map(([value, label]) => ({ value, label }))}
          />
          <TextArea label="Inspection Findings & Observations" value={findings} onChange={setFindings} placeholder="Document findings, structural integrity, telemetry checks..." rows={3} />
          <TextArea label="Corrective Safety Actions" value={corrective} onChange={setCorrective} placeholder="Mandated corrective actions, maintenance schedules..." rows={2} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Schedule Inspection'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
