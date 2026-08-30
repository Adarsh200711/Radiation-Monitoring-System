export type UserRole = 'admin' | 'safety_officer' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Facility {
  id: string;
  name: string;
  location: string;
  type: FacilityType;
  status: FacilityStatus;
  created_at: string;
}

export type FacilityType =
  | 'pressurized_water'
  | 'boiling_water'
  | 'gas_cooled'
  | 'fast_breeder'
  | 'research'
  | 'fusion';

export type FacilityStatus =
  | 'operational'
  | 'maintenance'
  | 'decommissioned'
  | 'emergency';

export interface Zone {
  id: string;
  facility_id: string;
  zone_name: string;
  radiation_limit: number;
  created_at: string;
}

export type AlertLevel = 'normal' | 'warning' | 'critical';

export interface RadiationReading {
  id: string;
  facility_id: string;
  zone_id: string;
  radiation_level: number;
  unit: string;
  alert_level: AlertLevel;
  timestamp: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  designation: string;
  email: string;
  phone: string | null;
  role: UserRole;
  facility_id: string | null;
  created_at: string;
}

export interface ExposureRecord {
  id: string;
  employee_id: string;
  zone_id: string;
  exposure_value: number;
  exposure_date: string;
  created_at: string;
}

export type InspectionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled';

export interface Inspection {
  id: string;
  inspection_id: string;
  facility_id: string;
  inspector_id: string | null;
  inspection_date: string;
  findings: string | null;
  status: InspectionStatus;
  corrective_actions: string | null;
  created_at: string;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  reported_by: string | null;
  facility_id: string | null;
  date: string;
  status: IncidentStatus;
  created_at: string;
}

export type NotificationType =
  | 'radiation_alert'
  | 'exposure_limit'
  | 'inspection_overdue'
  | 'incident_critical'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  facility_id: string | null;
  zone_id: string | null;
  is_read: boolean;
  created_at: string;
}
