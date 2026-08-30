import type {
  AlertLevel,
  FacilityStatus,
  FacilityType,
  IncidentSeverity,
  IncidentStatus,
  InspectionStatus,
  UserRole,
} from '@/types';

export const FACILITY_TYPES: Record<FacilityType, string> = {
  pressurized_water: 'Pressurized Water',
  boiling_water: 'Boiling Water',
  gas_cooled: 'Gas Cooled',
  fast_breeder: 'Fast Breeder',
  research: 'Research',
  fusion: 'Fusion',
};

export const FACILITY_STATUSES: Record<FacilityStatus, string> = {
  operational: 'Operational',
  maintenance: 'Maintenance',
  decommissioned: 'Decommissioned',
  emergency: 'Emergency',
};

export const FACILITY_STATUS_COLORS: Record<FacilityStatus, string> = {
  operational: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  decommissioned: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  emergency: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const ALERT_LEVEL_COLORS: Record<AlertLevel, string> = {
  normal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const ALERT_LEVEL_DOT: Record<AlertLevel, string> = {
  normal: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
};

export const INSPECTION_STATUSES: Record<InspectionStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INSPECTION_STATUS_COLORS: Record<InspectionStatus, string> = {
  scheduled: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  in_progress: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export const INCIDENT_SEVERITIES: Record<IncidentSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const INCIDENT_SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const INCIDENT_STATUSES: Record<IncidentStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  open: 'bg-red-500/15 text-red-400 border-red-500/30',
  investigating: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  safety_officer: 'Safety Officer',
  employee: 'Employee',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  safety_officer: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  employee: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
