import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, MapPin, Layers, Search, Filter } from 'lucide-react';
import { db, subscribeData } from '@/lib/db';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Button } from '@/components/ui/Form';
import {
  FACILITY_TYPES,
  FACILITY_STATUSES,
  FACILITY_STATUS_COLORS,
} from '@/lib/constants';
import type { Facility, Zone, FacilityType, FacilityStatus } from '@/types';

export function FacilitiesPage() {
  const toast = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [zonesByFacility, setZonesByFacility] = useState<Record<string, Zone[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Facility modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<FacilityType>('pressurized_water');
  const [status, setStatus] = useState<FacilityStatus>('operational');

  // Zone modal state
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [radiationLimit, setRadiationLimit] = useState('5.000');

  const load = useCallback(async () => {
    setLoading(true);
    const [facs, zones] = await Promise.all([db.getFacilities(), db.getZones()]);
    setFacilities(facs);

    const zoneMap: Record<string, Zone[]> = {};
    zones.forEach((z: Zone) => {
      if (!zoneMap[z.facility_id]) zoneMap[z.facility_id] = [];
      zoneMap[z.facility_id].push(z);
    });
    setZonesByFacility(zoneMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return subscribeData(load);
  }, [load]);

  function openCreate() {
    setEditingFacility(null);
    setName('');
    setLocation('');
    setType('pressurized_water');
    setStatus('operational');
    setModalOpen(true);
  }

  function openEdit(f: Facility) {
    setEditingFacility(f);
    setName(f.name);
    setLocation(f.location);
    setType(f.type);
    setStatus(f.status);
    setModalOpen(true);
  }

  async function handleSaveFacility() {
    if (!name.trim() || !location.trim()) {
      toast.warning('Validation Warning', 'Please provide facility name and location.');
      return;
    }
    await db.saveFacility({
      ...(editingFacility ? { id: editingFacility.id } : {}),
      name,
      location,
      type,
      status,
    });
    toast.success(
      editingFacility ? 'Facility Updated' : 'Facility Registered',
      `${name} has been successfully saved to the plant directory.`,
    );
    setModalOpen(false);
  }

  async function handleDeleteFacility(id: string, facName: string) {
    if (!confirm(`Delete ${facName} and all associated monitoring zones? This action cannot be undone.`)) return;
    await db.deleteFacility(id);
    toast.info('Facility Deleted', `${facName} and its zones have been removed.`);
  }

  function openCreateZone(facilityId: string) {
    setSelectedFacilityId(facilityId);
    setEditingZone(null);
    setZoneName('');
    setRadiationLimit('5.000');
    setZoneModalOpen(true);
  }

  function openEditZone(z: Zone) {
    setSelectedFacilityId(z.facility_id);
    setEditingZone(z);
    setZoneName(z.zone_name);
    setRadiationLimit(String(z.radiation_limit));
    setZoneModalOpen(true);
  }

  async function handleSaveZone() {
    if (!zoneName.trim() || !selectedFacilityId) {
      toast.warning('Validation Warning', 'Zone name is required.');
      return;
    }
    const limit = parseFloat(radiationLimit) || 5.0;
    await db.saveZone({
      ...(editingZone ? { id: editingZone.id } : {}),
      facility_id: selectedFacilityId,
      zone_name: zoneName,
      radiation_limit: limit,
    });
    toast.success(
      editingZone ? 'Zone Updated' : 'Zone Configured',
      `Monitoring zone "${zoneName}" calibrated with threshold ${limit} mSv/h.`,
    );
    setZoneModalOpen(false);
  }

  async function handleDeleteZone(id: string, zName: string) {
    if (!confirm(`Delete monitoring zone "${zName}"?`)) return;
    await db.deleteZone(id);
    toast.info('Zone Removed', `Monitoring zone "${zName}" has been deleted.`);
  }

  const facilityTypeOptions = Object.entries(FACILITY_TYPES).map(([value, label]) => ({
    value,
    label,
  }));
  const facilityStatusOptions = Object.entries(FACILITY_STATUSES).map(([value, label]) => ({
    value,
    label,
  }));

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || f.status === statusFilter;
    const matchesType = !typeFilter || f.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nuclear Facilities & Monitoring Zones"
        description="Configure nuclear power plants, reactor containment units, and radiation threshold zones"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Nuclear Facility
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plant name or location..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={facilityStatusOptions}
            placeholder="All Statuses"
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={facilityTypeOptions}
            placeholder="All Plant Types"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-48 p-5">
                <div className="h-full w-full animate-pulse rounded-xl bg-slate-800/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-300 font-semibold">No nuclear facilities match your query.</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria or register a new facility.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredFacilities.map((f) => {
            const zones = zonesByFacility[f.id] ?? [];
            return (
              <Card key={f.id} className="transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-inner">
                        <Building2 className="h-5 w-5 text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100">{f.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3 text-slate-500" /> {f.location}
                        </p>
                      </div>
                    </div>
                    <Badge className={FACILITY_STATUS_COLORS[f.status]}>
                      {FACILITY_STATUSES[f.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="rounded-md bg-slate-800/80 border border-slate-700 px-2 py-0.5 font-medium text-slate-300">
                      {FACILITY_TYPES[f.type]}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Layers className="h-3.5 w-3.5 text-sky-400" /> {zones.length} active zones
                    </span>
                  </div>

                  {/* Zones list */}
                  <div className="mt-4 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Configured Monitoring Zones
                    </p>
                    {zones.length === 0 ? (
                      <p className="text-xs text-slate-600 italic py-1">No monitoring zones assigned yet</p>
                    ) : (
                      zones.map((z) => (
                        <div
                          key={z.id}
                          className="flex items-center justify-between rounded-xl bg-slate-800/40 border border-slate-800 px-3 py-2 hover:bg-slate-800/70 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{z.zone_name}</p>
                            <p className="text-[11px] text-slate-400">
                              Threshold Limit: <span className="font-mono font-bold text-amber-400">{z.radiation_limit} mSv/h</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditZone(z)}
                              title="Edit Zone Limit"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteZone(z.id, z.zone_name)}
                              title="Delete Zone"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <Button size="sm" variant="secondary" onClick={() => openCreateZone(f.id)}>
                      <Plus className="h-3.5 w-3.5" /> Add Monitoring Zone
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(f)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteFacility(f.id, f.name)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Facility modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFacility ? 'Edit Nuclear Facility' : 'Register New Nuclear Facility'}
      >
        <div className="space-y-4">
          <Input label="Facility / Station Name" value={name} onChange={setName} placeholder="e.g. Seabrook Nuclear Station" required />
          <Input label="Geographic Location" value={location} onChange={setLocation} placeholder="e.g. Seabrook, NH" required />
          <Select label="Plant Reactor Type" value={type} onChange={(v) => setType(v as FacilityType)} options={facilityTypeOptions} />
          <Select label="Operational Safety Status" value={status} onChange={(v) => setStatus(v as FacilityStatus)} options={facilityStatusOptions} />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFacility}>{editingFacility ? 'Save Changes' : 'Register Facility'}</Button>
          </div>
        </div>
      </Modal>

      {/* Zone modal */}
      <Modal
        open={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        title={editingZone ? 'Edit Monitoring Zone Limit' : 'Add New Monitoring Zone'}
      >
        <div className="space-y-4">
          <Input label="Zone Designation Name" value={zoneName} onChange={setZoneName} placeholder="e.g. Reactor Containment A" required />
          <Input label="Radiation Threshold Limit (mSv/h)" type="number" value={radiationLimit} onChange={setRadiationLimit} placeholder="5.000" required />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setZoneModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveZone}>{editingZone ? 'Save Changes' : 'Create Zone'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
