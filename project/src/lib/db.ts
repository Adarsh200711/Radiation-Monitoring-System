import { supabase } from '@/lib/supabase';
import type {
  Facility,
  Zone,
  Employee,
  RadiationReading,
  ExposureRecord,
  Inspection,
  Incident,
  Notification,
  Profile,
} from '@/types';

// Default initial seed data matching official migrations
const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Seabrook Nuclear Station',
    location: 'Seabrook, NH',
    type: 'pressurized_water',
    status: 'operational',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Peach Bottom Atomic',
    location: 'Delta, PA',
    type: 'boiling_water',
    status: 'operational',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    name: 'Idaho National Lab',
    location: 'Idaho Falls, ID',
    type: 'research',
    status: 'maintenance',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    name: 'Fast Flux Test Facility',
    location: 'Richland, WA',
    type: 'fast_breeder',
    status: 'decommissioned',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const INITIAL_ZONES: Zone[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_name: 'Reactor Containment A',
    radiation_limit: 5.0,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_name: 'Spent Fuel Pool',
    radiation_limit: 3.5,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_name: 'Control Room',
    radiation_limit: 0.05,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_name: 'Reactor Containment B',
    radiation_limit: 5.0,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000005',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_name: 'Turbine Hall',
    radiation_limit: 0.25,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000006',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_name: 'Coolant Pump Room',
    radiation_limit: 2.0,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000007',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    zone_name: 'Research Reactor Bay',
    radiation_limit: 4.0,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000008',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    zone_name: 'Hot Cell Laboratory',
    radiation_limit: 1.5,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000009',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    zone_name: 'Waste Processing',
    radiation_limit: 3.0,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-4000-8000-000000000010',
    facility_id: 'a0000000-0000-4000-8000-000000000004',
    zone_name: 'Decommissioned Core',
    radiation_limit: 10.0,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    employee_id: 'EMP-001',
    full_name: 'James Carter',
    department: 'Operations',
    designation: 'Plant Manager',
    email: 'j.carter@nuclear.gov',
    phone: '555-0101',
    role: 'admin',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    employee_id: 'EMP-002',
    full_name: 'Sarah Mitchell',
    department: 'Health Physics',
    designation: 'Senior Safety Officer',
    email: 's.mitchell@nuclear.gov',
    phone: '555-0102',
    role: 'safety_officer',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    employee_id: 'EMP-003',
    full_name: 'Robert Chen',
    department: 'Health Physics',
    designation: 'Safety Officer',
    email: 'r.chen@nuclear.gov',
    phone: '555-0103',
    role: 'safety_officer',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    employee_id: 'EMP-004',
    full_name: 'Maria Rodriguez',
    department: 'Operations',
    designation: 'Reactor Operator',
    email: 'm.rodriguez@nuclear.gov',
    phone: '555-0104',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    employee_id: 'EMP-005',
    full_name: 'David Thompson',
    department: 'Maintenance',
    designation: 'Senior Technician',
    email: 'd.thompson@nuclear.gov',
    phone: '555-0105',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000006',
    employee_id: 'EMP-006',
    full_name: 'Emily Watson',
    department: 'Engineering',
    designation: 'Nuclear Engineer',
    email: 'e.watson@nuclear.gov',
    phone: '555-0106',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000007',
    employee_id: 'EMP-007',
    full_name: "Michael O'Brien",
    department: 'Operations',
    designation: 'Shift Supervisor',
    email: 'm.obrien@nuclear.gov',
    phone: '555-0107',
    role: 'safety_officer',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000008',
    employee_id: 'EMP-008',
    full_name: 'Lisa Anderson',
    department: 'Health Physics',
    designation: 'Radiation Technician',
    email: 'l.anderson@nuclear.gov',
    phone: '555-0108',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000009',
    employee_id: 'EMP-009',
    full_name: 'Kevin Park',
    department: 'Maintenance',
    designation: 'Mechanical Technician',
    email: 'k.park@nuclear.gov',
    phone: '555-0109',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000010',
    employee_id: 'EMP-010',
    full_name: 'Jennifer Walsh',
    department: 'Engineering',
    designation: 'Systems Engineer',
    email: 'j.walsh@nuclear.gov',
    phone: '555-0110',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000011',
    employee_id: 'EMP-011',
    full_name: 'Thomas Becker',
    department: 'Operations',
    designation: 'Control Room Operator',
    email: 't.becker@nuclear.gov',
    phone: '555-0111',
    role: 'employee',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000012',
    employee_id: 'EMP-012',
    full_name: 'Patricia Sullivan',
    department: 'Administration',
    designation: 'Compliance Manager',
    email: 'p.sullivan@nuclear.gov',
    phone: '555-0112',
    role: 'admin',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const INITIAL_READINGS: RadiationReading[] = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_id: 'b0000000-0000-4000-8000-000000000001',
    radiation_level: 2.15,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_id: 'b0000000-0000-4000-8000-000000000002',
    radiation_level: 3.82,
    unit: 'mSv/h',
    alert_level: 'critical',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000003',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_id: 'b0000000-0000-4000-8000-000000000003',
    radiation_level: 0.021,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000004',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_id: 'b0000000-0000-4000-8000-000000000004',
    radiation_level: 1.84,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000005',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_id: 'b0000000-0000-4000-8000-000000000005',
    radiation_level: 0.22,
    unit: 'mSv/h',
    alert_level: 'warning',
    timestamp: new Date(Date.now() - 70 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000006',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_id: 'b0000000-0000-4000-8000-000000000006',
    radiation_level: 0.95,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 85 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000007',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    zone_id: 'b0000000-0000-4000-8000-000000000007',
    radiation_level: 3.12,
    unit: 'mSv/h',
    alert_level: 'warning',
    timestamp: new Date(Date.now() - 100 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000008',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    zone_id: 'b0000000-0000-4000-8000-000000000008',
    radiation_level: 0.45,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000009',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    zone_id: 'b0000000-0000-4000-8000-000000000009',
    radiation_level: 1.15,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000010',
    facility_id: 'a0000000-0000-4000-8000-000000000004',
    zone_id: 'b0000000-0000-4000-8000-000000000010',
    radiation_level: 0.85,
    unit: 'mSv/h',
    alert_level: 'normal',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
  },
];

const INITIAL_EXPOSURES: ExposureRecord[] = [
  {
    id: 'e0000000-0000-4000-8000-000000000001',
    employee_id: 'c0000000-0000-4000-8000-000000000004',
    zone_id: 'b0000000-0000-4000-8000-000000000001',
    exposure_value: 3.85,
    exposure_date: '2026-08-20',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-4000-8000-000000000002',
    employee_id: 'c0000000-0000-4000-8000-000000000004',
    zone_id: 'b0000000-0000-4000-8000-000000000002',
    exposure_value: 6.2,
    exposure_date: '2026-08-24',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-4000-8000-000000000003',
    employee_id: 'c0000000-0000-4000-8000-000000000004',
    zone_id: 'b0000000-0000-4000-8000-000000000001',
    exposure_value: 7.95,
    exposure_date: '2026-08-27',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-4000-8000-000000000004',
    employee_id: 'c0000000-0000-4000-8000-000000000005',
    zone_id: 'b0000000-0000-4000-8000-000000000005',
    exposure_value: 2.1,
    exposure_date: '2026-08-15',
    created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-4000-8000-000000000005',
    employee_id: 'c0000000-0000-4000-8000-000000000006',
    zone_id: 'b0000000-0000-4000-8000-000000000001',
    exposure_value: 1.45,
    exposure_date: '2026-08-18',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-4000-8000-000000000006',
    employee_id: 'c0000000-0000-4000-8000-000000000008',
    zone_id: 'b0000000-0000-4000-8000-000000000008',
    exposure_value: 4.3,
    exposure_date: '2026-08-22',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-4000-8000-000000000007',
    employee_id: 'c0000000-0000-4000-8000-000000000009',
    zone_id: 'b0000000-0000-4000-8000-000000000006',
    exposure_value: 3.1,
    exposure_date: '2026-08-25',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: 'f0000000-0000-4000-8000-000000000001',
    inspection_id: 'INS-2026-001',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    inspector_id: 'c0000000-0000-4000-8000-000000000002',
    inspection_date: '2026-08-15',
    findings: 'Reactor containment integrity verified. All systems within normal parameters.',
    status: 'completed',
    corrective_actions: 'None required.',
    created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000002',
    inspection_id: 'INS-2026-002',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    inspector_id: 'c0000000-0000-4000-8000-000000000002',
    inspection_date: '2026-08-20',
    findings: 'Spent fuel pool cooling system operating nominally. Slight corrosion noted on secondary containment.',
    status: 'completed',
    corrective_actions: 'Schedule maintenance for secondary containment coating.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000003',
    inspection_id: 'INS-2026-003',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    inspector_id: 'c0000000-0000-4000-8000-000000000003',
    inspection_date: '2026-08-28',
    findings: null,
    status: 'scheduled',
    corrective_actions: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000004',
    inspection_id: 'INS-2026-004',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    inspector_id: 'c0000000-0000-4000-8000-000000000003',
    inspection_date: '2026-08-10',
    findings: 'Turbine hall vibration levels elevated on Unit 2. Recommend bearing inspection.',
    status: 'completed',
    corrective_actions: 'Bearing replacement scheduled for next outage.',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000005',
    inspection_id: 'INS-2026-005',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    inspector_id: 'c0000000-0000-4000-8000-000000000007',
    inspection_date: '2026-08-18',
    findings: 'Research reactor bay shielding integrity confirmed. Ventilation system needs filter replacement.',
    status: 'in_progress',
    corrective_actions: 'Order HEPA replacement filters.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000006',
    inspection_id: 'INS-2026-006',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    inspector_id: 'c0000000-0000-4000-8000-000000000002',
    inspection_date: '2026-07-30',
    findings: 'Quarterly safety systems audit overdue.',
    status: 'overdue',
    corrective_actions: null,
    created_at: new Date(Date.now() - 29 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000007',
    inspection_id: 'INS-2026-007',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    inspector_id: 'c0000000-0000-4000-8000-000000000003',
    inspection_date: '2026-09-05',
    findings: null,
    status: 'scheduled',
    corrective_actions: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-4000-8000-000000000008',
    inspection_id: 'INS-2026-008',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    inspector_id: 'c0000000-0000-4000-8000-000000000007',
    inspection_date: '2026-08-25',
    findings: 'Hot cell laboratory inspection. Remote handling equipment functioning correctly.',
    status: 'completed',
    corrective_actions: 'Calibrate dosimetry equipment.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'g0000000-0000-4000-8000-000000000001',
    incident_id: 'INC-2026-001',
    title: 'Coolant leak in secondary loop',
    description: 'Small coolant leak detected in secondary loop of Unit 2. Isolated and contained. No radiation release.',
    severity: 'medium',
    reported_by: 'c0000000-0000-4000-8000-000000000003',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    date: '2026-08-22T09:30:00.000Z',
    status: 'resolved',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'g0000000-0000-4000-8000-000000000002',
    incident_id: 'INC-2026-002',
    title: 'Elevated radiation in turbine hall',
    description: 'Radiation levels exceeded warning threshold in turbine hall zone. Area evacuated and inspected.',
    severity: 'high',
    reported_by: 'c0000000-0000-4000-8000-000000000003',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    date: '2026-08-24T14:15:00.000Z',
    status: 'investigating',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'g0000000-0000-4000-8000-000000000003',
    incident_id: 'INC-2026-003',
    title: 'Worker dosimeter alarm',
    description: 'Personal dosimeter triggered alarm for employee during maintenance. Exposure within annual limits.',
    severity: 'low',
    reported_by: 'c0000000-0000-4000-8000-000000000002',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    date: '2026-08-19T11:00:00.000Z',
    status: 'resolved',
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'g0000000-0000-4000-8000-000000000004',
    incident_id: 'INC-2026-004',
    title: 'Emergency cooling system activation',
    description: 'Emergency cooling system activated automatically due to sensor malfunction. No actual temperature excursion.',
    severity: 'medium',
    reported_by: 'c0000000-0000-4000-8000-000000000007',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    date: '2026-08-12T03:45:00.000Z',
    status: 'closed',
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  {
    id: 'g0000000-0000-4000-8000-000000000005',
    incident_id: 'INC-2026-005',
    title: 'Critical radiation threshold exceeded',
    description: 'Radiation level in reactor containment zone exceeded critical threshold. Immediate evacuation ordered. Investigation underway.',
    severity: 'critical',
    reported_by: 'c0000000-0000-4000-8000-000000000002',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    date: '2026-08-26T16:20:00.000Z',
    status: 'investigating',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'g0000000-0000-4000-8000-000000000006',
    incident_id: 'INC-2026-006',
    title: 'Fire alarm in waste processing area',
    description: 'Fire alarm triggered in waste processing area. Investigation found no fire; faulty smoke detector.',
    severity: 'low',
    reported_by: 'c0000000-0000-4000-8000-000000000007',
    facility_id: 'a0000000-0000-4000-8000-000000000003',
    date: '2026-08-14T08:10:00.000Z',
    status: 'closed',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'h0000000-0000-4000-8000-000000000001',
    type: 'radiation_alert',
    title: 'Critical radiation level detected',
    message: 'Reactor Containment A at Seabrook has exceeded the critical threshold of 5.000 mSv/h. Immediate action required.',
    severity: 'critical',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_id: 'b0000000-0000-4000-8000-000000000001',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'h0000000-0000-4000-8000-000000000002',
    type: 'radiation_alert',
    title: 'Warning level radiation in turbine hall',
    message: 'Turbine Hall at Peach Bottom has exceeded the warning threshold. Monitor closely.',
    severity: 'warning',
    facility_id: 'a0000000-0000-4000-8000-000000000002',
    zone_id: 'b0000000-0000-4000-8000-000000000005',
    is_read: false,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'h0000000-0000-4000-8000-000000000003',
    type: 'inspection_overdue',
    title: 'Inspection overdue',
    message: 'Quarterly safety systems audit at Seabrook Nuclear Station is overdue.',
    severity: 'warning',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_id: null,
    is_read: false,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'h0000000-0000-4000-8000-000000000004',
    type: 'incident_critical',
    title: 'Critical incident reported',
    message: 'Critical radiation threshold exceeded at Seabrook. Evacuation protocols initiated.',
    severity: 'critical',
    facility_id: 'a0000000-0000-4000-8000-000000000001',
    zone_id: null,
    is_read: false,
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'h0000000-0000-4000-8000-000000000005',
    type: 'exposure_limit',
    title: 'Employee exposure approaching limit',
    message: 'Employee EMP-004 (Maria Rodriguez) has accumulated 18.00 mSv of 20 mSv annual limit.',
    severity: 'warning',
    facility_id: null,
    zone_id: null,
    is_read: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'h0000000-0000-4000-8000-000000000006',
    type: 'system',
    title: 'System maintenance scheduled',
    message: 'Database maintenance window scheduled for 2026-09-01 02:00 UTC.',
    severity: 'info',
    facility_id: null,
    zone_id: null,
    is_read: true,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export interface SystemSettings {
  warningThreshold: number; // percentage, default 70
  criticalThreshold: number; // percentage, default 100
  exposureLimit: number; // annual limit in mSv, default 20
  emailAlerts: boolean;
  pushAlerts: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  warningThreshold: 70,
  criticalThreshold: 100,
  exposureLimit: 20,
  emailAlerts: true,
  pushAlerts: true,
};

// Storage keys
const STORAGE_PREFIX = 'radsafe_data_';

function getStore<T>(key: string, initial: T[]): T[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return initial;
  }
}

function setStore<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeData(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChange() {
  listeners.forEach((l) => l());
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Public Data Service API
export const db = {
  // Reset entire database to factory seed
  resetToFactoryDefaults() {
    setStore('facilities', INITIAL_FACILITIES);
    setStore('zones', INITIAL_ZONES);
    setStore('employees', INITIAL_EMPLOYEES);
    setStore('readings', INITIAL_READINGS);
    setStore('exposures', INITIAL_EXPOSURES);
    setStore('inspections', INITIAL_INSPECTIONS);
    setStore('incidents', INITIAL_INCIDENTS);
    setStore('notifications', INITIAL_NOTIFICATIONS);
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(DEFAULT_SETTINGS));
    notifyChange();
  },

  // FACILITIES
  async getFacilities(): Promise<Facility[]> {
    const local = getStore<Facility>('facilities', INITIAL_FACILITIES);
    try {
      const { data, error } = await supabase.from('facilities').select('*').order('name');
      if (!error && data && data.length > 0) {
        // Merge or sync
        setStore('facilities', data as Facility[]);
        return data as Facility[];
      }
    } catch {
      // Use local fallback
    }
    return local;
  },

  async saveFacility(fac: Partial<Facility> & { id?: string }): Promise<Facility> {
    const list = getStore<Facility>('facilities', INITIAL_FACILITIES);
    let saved: Facility;
    if (fac.id) {
      const idx = list.findIndex((f) => f.id === fac.id);
      saved = {
        ...(list[idx] || {}),
        ...fac,
        id: fac.id,
      } as Facility;
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
    } else {
      saved = {
        id: generateUUID(),
        name: fac.name ?? '',
        location: fac.location ?? '',
        type: fac.type ?? 'pressurized_water',
        status: fac.status ?? 'operational',
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    setStore('facilities', list);
    notifyChange();

    // Try remote update
    try {
      if (fac.id) {
        await supabase.from('facilities').update(fac).eq('id', fac.id);
      } else {
        await supabase.from('facilities').insert(saved);
      }
    } catch {
      // Local is already preserved
    }
    return saved;
  },

  async deleteFacility(id: string): Promise<void> {
    const list = getStore<Facility>('facilities', INITIAL_FACILITIES).filter((f) => f.id !== id);
    setStore('facilities', list);
    // Cascade delete zones
    const zones = getStore<Zone>('zones', INITIAL_ZONES).filter((z) => z.facility_id !== id);
    setStore('zones', zones);
    notifyChange();

    try {
      await supabase.from('facilities').delete().eq('id', id);
    } catch {
      // Local done
    }
  },

  // ZONES
  async getZones(): Promise<Zone[]> {
    const local = getStore<Zone>('zones', INITIAL_ZONES);
    try {
      const { data, error } = await supabase.from('zones').select('*').order('zone_name');
      if (!error && data && data.length > 0) {
        setStore('zones', data as Zone[]);
        return data as Zone[];
      }
    } catch {
      // Local fallback
    }
    return local;
  },

  async saveZone(zone: Partial<Zone> & { id?: string; facility_id: string }): Promise<Zone> {
    const list = getStore<Zone>('zones', INITIAL_ZONES);
    let saved: Zone;
    if (zone.id) {
      const idx = list.findIndex((z) => z.id === zone.id);
      saved = {
        ...(list[idx] || {}),
        ...zone,
        id: zone.id,
      } as Zone;
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
    } else {
      saved = {
        id: generateUUID(),
        facility_id: zone.facility_id,
        zone_name: zone.zone_name ?? '',
        radiation_limit: Number(zone.radiation_limit) || 5.0,
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    setStore('zones', list);
    notifyChange();

    try {
      if (zone.id) {
        await supabase.from('zones').update(zone).eq('id', zone.id);
      } else {
        await supabase.from('zones').insert(saved);
      }
    } catch {
      // Local preserved
    }
    return saved;
  },

  async deleteZone(id: string): Promise<void> {
    const list = getStore<Zone>('zones', INITIAL_ZONES).filter((z) => z.id !== id);
    setStore('zones', list);
    notifyChange();

    try {
      await supabase.from('zones').delete().eq('id', id);
    } catch {
      // Local done
    }
  },

  // EMPLOYEES
  async getEmployees(): Promise<Employee[]> {
    const local = getStore<Employee>('employees', INITIAL_EMPLOYEES);
    try {
      const { data, error } = await supabase.from('employees').select('*').order('full_name');
      if (!error && data && data.length > 0) {
        setStore('employees', data as Employee[]);
        return data as Employee[];
      }
    } catch {
      // Local fallback
    }
    return local;
  },

  async saveEmployee(emp: Partial<Employee> & { id?: string }): Promise<Employee> {
    const list = getStore<Employee>('employees', INITIAL_EMPLOYEES);
    let saved: Employee;
    if (emp.id) {
      const idx = list.findIndex((e) => e.id === emp.id);
      if (idx >= 0) {
        saved = {
          ...list[idx],
          ...emp,
          id: emp.id,
        } as Employee;
        list[idx] = saved;
      } else {
        saved = {
          id: emp.id,
          employee_id: emp.employee_id ?? 'EMP-???',
          full_name: emp.full_name ?? '',
          department: emp.department ?? 'Operations',
          designation: emp.designation ?? 'Technician',
          email: emp.email ?? '',
          phone: emp.phone ?? null,
          role: emp.role ?? 'employee',
          facility_id: emp.facility_id ?? null,
          created_at: emp.created_at || new Date().toISOString(),
        };
        list.unshift(saved);
      }
    } else {
      saved = {
        id: generateUUID(),
        employee_id: emp.employee_id || `EMP-${String(list.length + 1).padStart(3, '0')}`,
        full_name: emp.full_name ?? '',
        department: emp.department ?? 'Operations',
        designation: emp.designation ?? 'Technician',
        email: emp.email ?? '',
        phone: emp.phone ?? null,
        role: emp.role ?? 'employee',
        facility_id: emp.facility_id ?? null,
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    setStore('employees', list);
    notifyChange();

    try {
      if (emp.id) {
        await supabase.from('employees').update(emp).eq('id', emp.id);
      } else {
        await supabase.from('employees').insert(saved);
      }
    } catch (error) {
      console.error('Employee save error:', error);
      // Local preserved even if remote fails
    }
    return saved;
  },

  async deleteEmployee(id: string): Promise<void> {
    const list = getStore<Employee>('employees', INITIAL_EMPLOYEES).filter((e) => e.id !== id);
    setStore('employees', list);
    notifyChange();

    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (error) {
      console.error('Employee delete error:', error);
      // Local done even if remote fails
    }
  },

  // RADIATION READINGS
  async getReadings(limit = 100): Promise<RadiationReading[]> {
    const local = getStore<RadiationReading>('readings', INITIAL_READINGS);
    try {
      const { data, error } = await supabase
        .from('radiation_readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) {
        setStore('readings', data as RadiationReading[]);
        return data as RadiationReading[];
      }
    } catch {
      // Local fallback
    }
    return local.slice(0, limit);
  },

  async addReading(reading: Omit<RadiationReading, 'id' | 'timestamp'> & { timestamp?: string }): Promise<RadiationReading> {
    const list = getStore<RadiationReading>('readings', INITIAL_READINGS);
    const newReading: RadiationReading = {
      id: generateUUID(),
      facility_id: reading.facility_id,
      zone_id: reading.zone_id,
      radiation_level: Number(reading.radiation_level),
      unit: reading.unit || 'mSv/h',
      alert_level: reading.alert_level || 'normal',
      timestamp: reading.timestamp || new Date().toISOString(),
    };
    list.unshift(newReading);
    if (list.length > 300) list.pop();
    setStore('readings', list);

    // If warning or critical, create notification automatically
    if (newReading.alert_level !== 'normal') {
      const zones = getStore<Zone>('zones', INITIAL_ZONES);
      const facs = getStore<Facility>('facilities', INITIAL_FACILITIES);
      const zone = zones.find((z) => z.id === newReading.zone_id);
      const fac = facs.find((f) => f.id === newReading.facility_id);

      await this.addNotification({
        type: 'radiation_alert',
        title: `${newReading.alert_level === 'critical' ? 'CRITICAL' : 'Warning'}: High Radiation Detected`,
        message: `${zone?.zone_name ?? 'Zone'} at ${fac?.name ?? 'Facility'} recorded ${newReading.radiation_level} mSv/h.`,
        severity: newReading.alert_level === 'critical' ? 'critical' : 'warning',
        facility_id: newReading.facility_id,
        zone_id: newReading.zone_id,
        is_read: false,
      });
    }

    notifyChange();

    try {
      await supabase.from('radiation_readings').insert(newReading);
    } catch {
      // Local preserved
    }
    return newReading;
  },

  // EXPOSURE RECORDS
  async getExposures(): Promise<ExposureRecord[]> {
    const local = getStore<ExposureRecord>('exposures', INITIAL_EXPOSURES);
    try {
      const { data, error } = await supabase
        .from('exposure_records')
        .select('*')
        .order('exposure_date', { ascending: false });
      if (!error && data && data.length > 0) {
        setStore('exposures', data as ExposureRecord[]);
        return data as ExposureRecord[];
      }
    } catch {
      // Local fallback
    }
    return local;
  },

  async saveExposure(exp: Partial<ExposureRecord> & { id?: string; employee_id: string; zone_id: string }): Promise<ExposureRecord> {
    const list = getStore<ExposureRecord>('exposures', INITIAL_EXPOSURES);
    let saved: ExposureRecord;
    if (exp.id) {
      const idx = list.findIndex((e) => e.id === exp.id);
      if (idx >= 0) {
        saved = {
          ...list[idx],
          ...exp,
          id: exp.id,
        } as ExposureRecord;
        list[idx] = saved;
      } else {
        saved = {
          id: exp.id,
          employee_id: exp.employee_id,
          zone_id: exp.zone_id,
          exposure_value: Number(exp.exposure_value) || 0,
          exposure_date: exp.exposure_date || new Date().toISOString().split('T')[0],
          created_at: exp.created_at || new Date().toISOString(),
        };
        list.unshift(saved);
      }
    } else {
      saved = {
        id: generateUUID(),
        employee_id: exp.employee_id,
        zone_id: exp.zone_id,
        exposure_value: Number(exp.exposure_value) || 0,
        exposure_date: exp.exposure_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    setStore('exposures', list);

    // Check if employee exposure nears limit (e.g., > 16 mSv of 20 mSv)
    const empExposures = list.filter((e) => e.employee_id === saved.employee_id);
    const total = empExposures.reduce((acc, curr) => acc + Number(curr.exposure_value), 0);
    if (total >= 16) {
      const emps = getStore<Employee>('employees', INITIAL_EMPLOYEES);
      const emp = emps.find((e) => e.id === saved.employee_id);
      await this.addNotification({
        type: 'exposure_limit',
        title: total >= 20 ? 'CRITICAL: Annual Exposure Exceeded' : 'Warning: Exposure Limit Nearing Threshold',
        message: `${emp?.full_name ?? 'Employee'} has accumulated ${total.toFixed(2)} mSv out of 20 mSv annual limit.`,
        severity: total >= 20 ? 'critical' : 'warning',
        facility_id: emp?.facility_id ?? null,
        zone_id: saved.zone_id,
        is_read: false,
      });
    }

    notifyChange();

    try {
      if (exp.id) {
        const updateData = { ...exp };
        delete updateData.id;
        await supabase.from('exposure_records').update(updateData).eq('id', exp.id);
      } else {
        await supabase.from('exposure_records').insert(saved);
      }
    } catch (error) {
      console.error('Exposure save error:', error);
      // Local preserved even if remote fails
    }
    return saved;
  },

  async deleteExposure(id: string): Promise<void> {
    const list = getStore<ExposureRecord>('exposures', INITIAL_EXPOSURES).filter((e) => e.id !== id);
    setStore('exposures', list);
    notifyChange();

    try {
      await supabase.from('exposure_records').delete().eq('id', id);
    } catch (error) {
      console.error('Exposure delete error:', error);
      // Local done even if remote fails
    }
  },

  // INSPECTIONS
  async getInspections(): Promise<Inspection[]> {
    const local = getStore<Inspection>('inspections', INITIAL_INSPECTIONS);
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('inspection_date', { ascending: false });
      if (!error && data && data.length > 0) {
        setStore('inspections', data as Inspection[]);
        return data as Inspection[];
      }
    } catch {
      // Local fallback
    }
    return local;
  },

  async saveInspection(insp: Partial<Inspection> & { id?: string }): Promise<Inspection> {
    const list = getStore<Inspection>('inspections', INITIAL_INSPECTIONS);
    let saved: Inspection;
    if (insp.id) {
      const idx = list.findIndex((i) => i.id === insp.id);
      if (idx >= 0) {
        saved = {
          ...list[idx],
          ...insp,
          id: insp.id,
        } as Inspection;
        list[idx] = saved;
      } else {
        saved = {
          id: insp.id,
          inspection_id: insp.inspection_id || 'INS-???',
          facility_id: insp.facility_id ?? '',
          inspector_id: insp.inspector_id ?? null,
          inspection_date: insp.inspection_date || new Date().toISOString().split('T')[0],
          findings: insp.findings ?? null,
          status: insp.status ?? 'scheduled',
          corrective_actions: insp.corrective_actions ?? null,
          created_at: insp.created_at || new Date().toISOString(),
        };
        list.unshift(saved);
      }
    } else {
      saved = {
        id: generateUUID(),
        inspection_id: insp.inspection_id || `INS-2026-${String(list.length + 1).padStart(3, '0')}`,
        facility_id: insp.facility_id ?? '',
        inspector_id: insp.inspector_id ?? null,
        inspection_date: insp.inspection_date || new Date().toISOString().split('T')[0],
        findings: insp.findings ?? null,
        status: insp.status ?? 'scheduled',
        corrective_actions: insp.corrective_actions ?? null,
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    setStore('inspections', list);
    notifyChange();

    try {
      if (insp.id) {
        await supabase.from('inspections').update(insp).eq('id', insp.id);
      } else {
        await supabase.from('inspections').insert(saved);
      }
    } catch (error) {
      console.error('Inspection save error:', error);
      // Local preserved even if remote fails
    }
    return saved;
  },

  async deleteInspection(id: string): Promise<void> {
    const list = getStore<Inspection>('inspections', INITIAL_INSPECTIONS).filter((i) => i.id !== id);
    setStore('inspections', list);
    notifyChange();

    try {
      await supabase.from('inspections').delete().eq('id', id);
    } catch (error) {
      console.error('Inspection delete error:', error);
      // Local done even if remote fails
    }
  },

  // INCIDENTS
  async getIncidents(): Promise<Incident[]> {
    const local = getStore<Incident>('incidents', INITIAL_INCIDENTS);
    try {
      const { data, error } = await supabase.from('incidents').select('*').order('date', { ascending: false });
      if (!error && data && data.length > 0) {
        setStore('incidents', data as Incident[]);
        return data as Incident[];
      }
    } catch {
      // Local fallback
    }
    return local;
  },

  async saveIncident(inc: Partial<Incident> & { id?: string }): Promise<Incident> {
    const list = getStore<Incident>('incidents', INITIAL_INCIDENTS);
    let saved: Incident;
    if (inc.id) {
      const idx = list.findIndex((i) => i.id === inc.id);
      saved = {
        ...(list[idx] || {}),
        ...inc,
        id: inc.id,
      } as Incident;
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
    } else {
      saved = {
        id: generateUUID(),
        incident_id: inc.incident_id || `INC-2026-${String(list.length + 1).padStart(3, '0')}`,
        title: inc.title ?? '',
        description: inc.description ?? '',
        severity: inc.severity ?? 'low',
        reported_by: inc.reported_by ?? null,
        facility_id: inc.facility_id ?? null,
        date: inc.date || new Date().toISOString(),
        status: inc.status ?? 'open',
        created_at: new Date().toISOString(),
      };
      list.unshift(saved);

      if (saved.severity === 'high' || saved.severity === 'critical') {
        await this.addNotification({
          type: 'incident_critical',
          title: `Incident: ${saved.title}`,
          message: saved.description,
          severity: saved.severity === 'critical' ? 'critical' : 'warning',
          facility_id: saved.facility_id,
          zone_id: null,
          is_read: false,
        });
      }
    }
    setStore('incidents', list);
    notifyChange();

    try {
      if (inc.id) {
        await supabase.from('incidents').update(inc).eq('id', inc.id);
      } else {
        await supabase.from('incidents').insert(saved);
      }
    } catch {
      // Local preserved
    }
    return saved;
  },

  async deleteIncident(id: string): Promise<void> {
    const list = getStore<Incident>('incidents', INITIAL_INCIDENTS).filter((i) => i.id !== id);
    setStore('incidents', list);
    notifyChange();

    try {
      await supabase.from('incidents').delete().eq('id', id);
    } catch {
      // Local done
    }
  },

  // NOTIFICATIONS
  async getNotifications(): Promise<Notification[]> {
    const local = getStore<Notification>('notifications', INITIAL_NOTIFICATIONS);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setStore('notifications', data as Notification[]);
        return data as Notification[];
      }
    } catch {
      // Local fallback
    }
    return local;
  },

  async addNotification(notif: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const list = getStore<Notification>('notifications', INITIAL_NOTIFICATIONS);
    const saved: Notification = {
      ...notif,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    list.unshift(saved);
    if (list.length > 100) list.pop();
    setStore('notifications', list);
    notifyChange();

    try {
      await supabase.from('notifications').insert(saved);
    } catch {
      // Local preserved
    }
    return saved;
  },

  async markNotificationRead(id: string): Promise<void> {
    const list = getStore<Notification>('notifications', INITIAL_NOTIFICATIONS);
    const item = list.find((n) => n.id === id);
    if (item) {
      item.is_read = true;
      setStore('notifications', list);
      notifyChange();
    }
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch {
      // Local done
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    const list = getStore<Notification>('notifications', INITIAL_NOTIFICATIONS);
    list.forEach((n) => {
      n.is_read = true;
    });
    setStore('notifications', list);
    notifyChange();
  },

  async deleteNotification(id: string): Promise<void> {
    const list = getStore<Notification>('notifications', INITIAL_NOTIFICATIONS).filter((n) => n.id !== id);
    setStore('notifications', list);
    notifyChange();
  },

  // SETTINGS
  getSettings(): SystemSettings {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + 'settings');
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(updated));
    notifyChange();
    return updated;
  },

  // USER PROFILE
  getSavedProfile(userId: string): Profile | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + 'profile_' + userId);
      if (raw) return JSON.parse(raw) as Profile;
    } catch {
      //
    }
    return null;
  },

  saveProfile(profile: Profile): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'profile_' + profile.id, JSON.stringify(profile));
    } catch {
      //
    }
  },
};
