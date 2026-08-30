import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Radiation, AlertTriangle, TrendingUp, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { db, subscribeData } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, Button, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatNumber, formatDate } from '@/lib/format';
import type { Employee, ExposureRecord, Zone, Facility } from '@/types';

const ANNUAL_LIMIT = 20; // 20 mSv standard safety limit

export function ExposurePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [records, setRecords] = useState<ExposureRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExposureRecord | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [exposureVal, setExposureVal] = useState('');
  const [exposureDate, setExposureDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [emps, zns, facs, recs] = await Promise.all([
      db.getEmployees(),
      db.getZones(),
      db.getFacilities(),
      db.getExposures(),
    ]);
    setEmployees(emps);
    setZones(zns);
    setFacilities(facs);
    setRecords(recs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return subscribeData(load);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEmployeeId(employees[0]?.id || '');
    setZoneId(zones[0]?.id || '');
    setExposureVal('1.250');
    setExposureDate(new Date().toISOString().split('T')[0]);
    setModalOpen(true);
  }

  function openEdit(r: ExposureRecord) {
    setEditing(r);
    setEmployeeId(r.employee_id);
    setZoneId(r.zone_id);
    setExposureVal(String(r.exposure_value));
    setExposureDate(r.exposure_date);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!employeeId || !zoneId || !exposureVal || !exposureDate) {
      alert('Please fill in all required fields: Worker, Zone, Exposure Value, and Date');
      return;
    }

    try {
      await db.saveExposure({
        ...(editing ? { id: editing.id } : {}),
        employee_id: employeeId,
        zone_id: zoneId,
        exposure_value: parseFloat(exposureVal) || 0,
        exposure_date: exposureDate,
      });
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      await load();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving exposure record:', error);
      alert('Failed to save exposure record. Please try again.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this exposure dosimetry record? This action cannot be undone.')) return;
    try {
      await db.deleteExposure(id);
      await new Promise(resolve => setTimeout(resolve, 50));
      await load();
    } catch (error) {
      console.error('Error deleting exposure record:', error);
      alert('Failed to delete exposure record. Please try again.');
    }
  }

  // Calculate cumulative exposure per employee
  const exposureByEmployee: Record<string, number> = {};
  records.forEach((r) => {
    exposureByEmployee[r.employee_id] =
      (exposureByEmployee[r.employee_id] ?? 0) + Number(r.exposure_value);
  });

  const filteredRecords = records.filter((r) => {
    const emp = employees.find((e) => e.id === r.employee_id);
    const zone = zones.find((z) => z.id === r.zone_id);
    const matchesEmp = !selectedEmployee || r.employee_id === selectedEmployee;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (emp?.full_name && emp.full_name.toLowerCase().includes(q)) ||
      (emp?.employee_id && emp.employee_id.toLowerCase().includes(q)) ||
      (zone?.zone_name && zone.zone_name.toLowerCase().includes(q));

    return matchesEmp && matchesSearch;
  });

  // Monthly chart data
  const monthlyData: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    const month = new Date(r.exposure_date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    monthlyData[month] = (monthlyData[month] ?? 0) + Number(r.exposure_value);
  });
  const chartData = Object.entries(monthlyData).map(([month, value]) => ({
    month,
    exposure: Math.round(value * 1000) / 1000,
  }));

  // Violations (>= 80% of 20 mSv = >= 16 mSv)
  const violations = employees.filter(
    (e) => (exposureByEmployee[e.id] ?? 0) >= ANNUAL_LIMIT * 0.8,
  );

  const columns: Column<ExposureRecord>[] = [
    {
      key: 'employee',
      header: 'Worker / Personnel',
      render: (r) => {
        const emp = employees.find((e) => e.id === r.employee_id);
        return (
          <div>
            <p className="font-semibold text-xs text-slate-100">{emp?.full_name ?? 'Unknown'}</p>
            <p className="text-[11px] font-mono text-sky-400">{emp?.employee_id}</p>
          </div>
        );
      },
    },
    {
      key: 'zone',
      header: 'Exposure Location',
      render: (r) => {
        const zone = zones.find((z) => z.id === r.zone_id);
        const fac = facilities.find((f) => f.id === zone?.facility_id);
        return (
          <div>
            <p className="text-xs text-slate-200">{zone?.zone_name ?? 'Unknown Zone'}</p>
            <p className="text-[11px] text-slate-500">{fac?.name ?? ''}</p>
          </div>
        );
      },
    },
    {
      key: 'exposure',
      header: 'Recorded Dose',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-100">
          {formatNumber(Number(r.exposure_value))} mSv
        </span>
      ),
    },
    {
      key: 'cumulative',
      header: 'Cumulative Total',
      render: (r) => {
        const total = exposureByEmployee[r.employee_id] ?? 0;
        const isNear = total >= ANNUAL_LIMIT * 0.8;
        return (
          <span
            className={`font-mono text-xs font-semibold ${
              total >= ANNUAL_LIMIT ? 'text-red-400' : isNear ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {formatNumber(total)} / {ANNUAL_LIMIT} mSv
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'Log Date',
      render: (r) => <span className="text-xs text-slate-400">{formatDate(r.exposure_date)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(r)}
            title="Edit"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
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
        title="Occupational Radiation Exposure Tracking"
        description="Monitor individual cumulative radiation dosage, evaluate dosimeter logs, and enforce safety limits"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Log Exposure Dose
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
                <Radiation className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Dosimetry Logs</p>
                <p className="text-2xl font-bold text-slate-100">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Annual Regulatory Limit</p>
                <p className="text-2xl font-bold text-slate-100">{ANNUAL_LIMIT} mSv/yr</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Near or Exceeded Limit (80%+)</p>
                <p className="text-2xl font-bold text-slate-100">{violations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="mb-6 border-red-500/30 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-red-400">Annual Exposure Threshold Warnings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {violations.map((e) => {
              const exposure = exposureByEmployee[e.id] ?? 0;
              const pct = (exposure / ANNUAL_LIMIT) * 100;
              return (
                <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-slate-900/80 border border-red-500/20 p-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-200">{e.full_name}</p>
                    <p className="text-[11px] text-slate-400">{e.employee_id} · {e.department} ({e.designation})</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className={`font-mono text-xs font-bold ${pct >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatNumber(exposure)} / {ANNUAL_LIMIT} mSv
                    </span>
                    <Badge className={pct >= 100 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                      {pct >= 100 ? 'Limit Exceeded' : `${Math.round(pct)}% threshold`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>Monthly Exposure Dosage Distribution</CardTitle>
            <Select
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              options={employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }))}
              placeholder="All Monitored Employees"
            />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: unknown) => [`${v} mSv`, 'Total Dose']}
                />
                <Bar dataKey="exposure" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-xs text-slate-500">
              No exposure records match the active filter.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search & Records table */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name, ID, or zone..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRecords}
        loading={loading}
        emptyMessage="No exposure records logged"
      />

      {/* Exposure Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Exposure Dosimetry Log' : 'Log Radiation Exposure Dose'}
      >
        <div className="space-y-4">
          <Select
            label="Worker / Personnel"
            value={employeeId}
            onChange={setEmployeeId}
            options={employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id} - ${e.department})` }))}
            required
          />
          <Select
            label="Monitoring Zone"
            value={zoneId}
            onChange={setZoneId}
            options={zones.map((z) => {
              const f = facilities.find((fac) => fac.id === z.facility_id);
              return { value: z.id, label: `${z.zone_name} (${f?.name || 'Facility'})` };
            })}
            required
          />
          <Input
            label="Dosimeter Reading Value (mSv)"
            type="number"
            value={exposureVal}
            onChange={setExposureVal}
            placeholder="e.g. 1.250"
            required
          />
          <Input
            label="Date of Exposure"
            type="date"
            value={exposureDate}
            onChange={setExposureDate}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Record Dose'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
