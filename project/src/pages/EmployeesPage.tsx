import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Mail, Phone, Building, Filter } from 'lucide-react';
import { db, subscribeData } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Button } from '@/components/ui/Form';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import type { Employee, Facility, UserRole } from '@/types';

const PAGE_SIZE = 8;

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [facilityId, setFacilityId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [emps, facs] = await Promise.all([db.getEmployees(), db.getFacilities()]);
    setEmployees(emps);
    setFacilities(facs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return subscribeData(load);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEmpId(`EMP-${String(employees.length + 1).padStart(3, '0')}`);
    setFullName('');
    setDepartment('Operations');
    setDesignation('');
    setEmail('');
    setPhone('');
    setRole('employee');
    setFacilityId(facilities[0]?.id || '');
    setModalOpen(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setEmpId(e.employee_id);
    setFullName(e.full_name);
    setDepartment(e.department);
    setDesignation(e.designation);
    setEmail(e.email);
    setPhone(e.phone ?? '');
    setRole(e.role);
    setFacilityId(e.facility_id ?? '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!empId || !fullName || !department || !designation || !email) {
      alert('Please fill in all required fields: Employee ID, Full Name, Department, Designation, and Email');
      return;
    }
    
    try {
      await db.saveEmployee({
        ...(editing ? { id: editing.id } : {}),
        employee_id: empId,
        full_name: fullName,
        department,
        designation,
        email,
        phone: phone || null,
        role,
        facility_id: facilityId || null,
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      await load();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee. Please try again.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this employee record? This action cannot be undone.')) return;
    try {
      await db.deleteEmployee(id);
      await new Promise(resolve => setTimeout(resolve, 50));
      await load();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  }

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      e.full_name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q);

    const matchesDept = !departmentFilter || e.department === departmentFilter;
    const matchesRole = !roleFilter || e.role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  const total = filteredEmployees.length;
  const paginatedEmployees = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Employee>[] = [
    {
      key: 'employee_id',
      header: 'ID',
      render: (e) => <span className="font-mono text-xs text-sky-400 font-semibold">{e.employee_id}</span>,
    },
    {
      key: 'name',
      header: 'Personnel',
      render: (e) => (
        <div>
          <p className="font-semibold text-xs text-slate-100">{e.full_name}</p>
          <p className="text-[11px] text-slate-400">{e.designation}</p>
        </div>
      ),
    },
    {
      key: 'facility',
      header: 'Assigned Plant',
      render: (e) => {
        const fac = facilities.find((f) => f.id === e.facility_id);
        return (
          <span className="flex items-center gap-1 text-xs text-slate-300">
            <Building className="h-3 w-3 text-slate-500" />
            {fac?.name ?? 'Headquarters'}
          </span>
        );
      },
    },
    {
      key: 'department',
      header: 'Department',
      render: (e) => <span className="text-xs text-slate-300">{e.department}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (e) => (
        <div className="space-y-0.5">
          <p className="flex items-center gap-1 text-xs text-slate-300">
            <Mail className="h-3 w-3 text-slate-500" /> {e.email}
          </p>
          {e.phone && (
            <p className="flex items-center gap-1 text-[11px] text-slate-500">
              <Phone className="h-3 w-3 text-slate-500" /> {e.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Security Role',
      render: (e) => <Badge className={ROLE_COLORS[e.role]}>{ROLE_LABELS[e.role]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(e)}
            title="Edit"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(e.id)}
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
        title="Personnel & Workforce"
        description="Manage nuclear plant operators, safety engineers, health physicists, and compliance personnel"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Personnel
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, ID, email, designation..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <Select
            value={departmentFilter}
            onChange={(v) => {
              setDepartmentFilter(v);
              setPage(1);
            }}
            options={departments.map((d) => ({ value: d, label: d }))}
            placeholder="All Departments"
          />
          <Select
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'safety_officer', label: 'Safety Officer' },
              { value: 'employee', label: 'Employee' },
            ]}
            placeholder="All Roles"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedEmployees}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        emptyMessage="No personnel found matching the query"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Personnel Record' : 'Register New Personnel'}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Employee ID" value={empId} onChange={setEmpId} placeholder="EMP-001" required />
          <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="e.g. Maria Rodriguez" required />
          <Input label="Department" value={department} onChange={setDepartment} placeholder="e.g. Health Physics" required />
          <Input label="Designation / Title" value={designation} onChange={setDesignation} placeholder="e.g. Reactor Operator" required />
          <Input label="Department Email" type="email" value={email} onChange={setEmail} placeholder="m.rodriguez@nuclear.gov" required />
          <Input label="Contact Phone" value={phone} onChange={setPhone} placeholder="555-0100" />
          <Select
            label="Security Role"
            value={role}
            onChange={(v) => setRole(v as UserRole)}
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'safety_officer', label: 'Safety Officer' },
              { value: 'employee', label: 'Employee' },
            ]}
          />
          <Select
            label="Primary Assigned Plant"
            value={facilityId}
            onChange={setFacilityId}
            options={facilities.map((f) => ({ value: f.id, label: f.name }))}
            placeholder="Headquarters / Unassigned"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Save Record' : 'Register Employee'}</Button>
        </div>
      </Modal>
    </div>
  );
}
