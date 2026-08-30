/*
# Seed Data for Nuclear Facility Radiation Monitoring System

## Purpose
Populates the database with realistic sample data for demonstrations and testing.

## Data Inserted
1. **facilities** — 4 nuclear plants with varied types and statuses
2. **zones** — 10 monitoring zones across facilities with radiation limits
3. **employees** — 12 employees across departments and roles
4. **radiation_readings** — ~40 readings across zones with varied alert levels
5. **exposure_records** — ~20 exposure records for employees
6. **inspections** — 8 inspections with varied statuses
7. **incidents** — 6 incidents with varied severities
8. **notifications** — 6 system alerts

All inserts use ON CONFLICT DO NOTHING so they are idempotent.
*/

-- ============================================================================
-- FACILITIES
-- ============================================================================
INSERT INTO public.facilities (id, name, location, type, status) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Seabrook Nuclear Station', 'Seabrook, NH', 'pressurized_water', 'operational'),
  ('a0000000-0000-4000-8000-000000000002', 'Peach Bottom Atomic', 'Delta, PA', 'boiling_water', 'operational'),
  ('a0000000-0000-4000-8000-000000000003', 'Idaho National Lab', 'Idaho Falls, ID', 'research', 'maintenance'),
  ('a0000000-0000-4000-8000-000000000004', 'Fast Flux Test Facility', 'Richland, WA', 'fast_breeder', 'decommissioned')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONES
-- ============================================================================
INSERT INTO public.zones (id, facility_id, zone_name, radiation_limit) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Reactor Containment A', 5.000),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Spent Fuel Pool', 3.500),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Control Room', 0.050),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'Reactor Containment B', 5.000),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'Turbine Hall', 0.250),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'Coolant Pump Room', 2.000),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'Research Reactor Bay', 4.000),
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'Hot Cell Laboratory', 1.500),
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'Waste Processing', 3.000),
  ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'Decommissioned Core', 10.000)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
INSERT INTO public.employees (id, employee_id, full_name, department, designation, email, phone, role, facility_id) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'EMP-001', 'James Carter', 'Operations', 'Plant Manager', 'j.carter@nuclear.gov', '555-0101', 'admin', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000002', 'EMP-002', 'Sarah Mitchell', 'Health Physics', 'Senior Safety Officer', 's.mitchell@nuclear.gov', '555-0102', 'safety_officer', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000003', 'EMP-003', 'Robert Chen', 'Health Physics', 'Safety Officer', 'r.chen@nuclear.gov', '555-0103', 'safety_officer', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000004', 'EMP-004', 'Maria Rodriguez', 'Operations', 'Reactor Operator', 'm.rodriguez@nuclear.gov', '555-0104', 'employee', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000005', 'EMP-005', 'David Thompson', 'Maintenance', 'Senior Technician', 'd.thompson@nuclear.gov', '555-0105', 'employee', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000006', 'EMP-006', 'Emily Watson', 'Engineering', 'Nuclear Engineer', 'e.watson@nuclear.gov', '555-0106', 'employee', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000007', 'EMP-007', 'Michael O''Brien', 'Operations', 'Shift Supervisor', 'm.obrien@nuclear.gov', '555-0107', 'safety_officer', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000008', 'EMP-008', 'Lisa Anderson', 'Health Physics', 'Radiation Technician', 'l.anderson@nuclear.gov', '555-0108', 'employee', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000009', 'EMP-009', 'Kevin Park', 'Maintenance', 'Mechanical Technician', 'k.park@nuclear.gov', '555-0109', 'employee', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000010', 'EMP-010', 'Jennifer Walsh', 'Engineering', 'Systems Engineer', 'j.walsh@nuclear.gov', '555-0110', 'employee', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000011', 'EMP-011', 'Thomas Becker', 'Operations', 'Control Room Operator', 't.becker@nuclear.gov', '555-0111', 'employee', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000012', 'EMP-012', 'Patricia Sullivan', 'Administration', 'Compliance Manager', 'p.sullivan@nuclear.gov', '555-0112', 'admin', 'a0000000-0000-4000-8000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RADIATION READINGS (last 24 hours, varied levels)
-- ============================================================================
INSERT INTO public.radiation_readings (facility_id, zone_id, radiation_level, unit, alert_level, timestamp)
SELECT
  z.facility_id,
  z.id,
  CASE
    WHEN random() < 0.08 THEN z.radiation_limit * (1.2 + random() * 0.5)
    WHEN random() < 0.25 THEN z.radiation_limit * (0.7 + random() * 0.3)
    ELSE z.radiation_limit * (0.1 + random() * 0.5)
  END,
  'mSv/h',
  CASE
    WHEN random() < 0.08 THEN 'critical'
    WHEN random() < 0.25 THEN 'warning'
    ELSE 'normal'
  END,
  now() - (interval '1 hour' * floor(random() * 24))
FROM public.zones z
CROSS JOIN generate_series(1, 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXPOSURE RECORDS (last 30 days)
-- ============================================================================
INSERT INTO public.exposure_records (employee_id, zone_id, exposure_value, exposure_date)
SELECT
  e.id,
  z.id,
  round((random() * 1.5)::numeric, 3),
  CURRENT_DATE - floor(random() * 30)::int
FROM public.employees e
CROSS JOIN public.zones z
WHERE e.facility_id = z.facility_id
AND random() < 0.15
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSPECTIONS
-- ============================================================================
INSERT INTO public.inspections (inspection_id, facility_id, inspector_id, inspection_date, findings, status, corrective_actions) VALUES
  ('INS-2026-001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', '2026-08-15', 'Reactor containment integrity verified. All systems within normal parameters.', 'completed', 'None required.'),
  ('INS-2026-002', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', '2026-08-20', 'Spent fuel pool cooling system operating nominally. Slight corrosion noted on secondary containment.', 'completed', 'Schedule maintenance for secondary containment coating.'),
  ('INS-2026-003', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', '2026-08-28', NULL, 'scheduled', NULL),
  ('INS-2026-004', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', '2026-08-10', 'Turbine hall vibration levels elevated on Unit 2. Recommend bearing inspection.', 'completed', 'Bearing replacement scheduled for next outage.'),
  ('INS-2026-005', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000007', '2026-08-18', 'Research reactor bay shielding integrity confirmed. Ventilation system needs filter replacement.', 'in_progress', 'Order HEPA replacement filters.'),
  ('INS-2026-006', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', '2026-07-30', 'Quarterly safety systems audit overdue.', 'overdue', NULL),
  ('INS-2026-007', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', '2026-09-05', NULL, 'scheduled', NULL),
  ('INS-2026-008', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000007', '2026-08-25', 'Hot cell laboratory inspection. Remote handling equipment functioning correctly.', 'completed', 'Calibrate dosimetry equipment.')
ON CONFLICT (inspection_id) DO NOTHING;

-- ============================================================================
-- INCIDENTS
-- ============================================================================
INSERT INTO public.incidents (incident_id, title, description, severity, reported_by, facility_id, date, status) VALUES
  ('INC-2026-001', 'Coolant leak in secondary loop', 'Small coolant leak detected in secondary loop of Unit 2. Isolated and contained. No radiation release.', 'medium', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', '2026-08-22 09:30:00+00', 'resolved'),
  ('INC-2026-002', 'Elevated radiation in turbine hall', 'Radiation levels exceeded warning threshold in turbine hall zone. Area evacuated and inspected.', 'high', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', '2026-08-24 14:15:00+00', 'investigating'),
  ('INC-2026-003', 'Worker dosimeter alarm', 'Personal dosimeter triggered alarm for employee during maintenance. Exposure within annual limits.', 'low', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '2026-08-19 11:00:00+00', 'resolved'),
  ('INC-2026-004', 'Emergency cooling system activation', 'Emergency cooling system activated automatically due to sensor malfunction. No actual temperature excursion.', 'medium', 'c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', '2026-08-12 03:45:00+00', 'closed'),
  ('INC-2026-005', 'Critical radiation threshold exceeded', 'Radiation level in reactor containment zone exceeded critical threshold. Immediate evacuation ordered. Investigation underway.', 'critical', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '2026-08-26 16:20:00+00', 'investigating'),
  ('INC-2026-006', 'Fire alarm in waste processing area', 'Fire alarm triggered in waste processing area. Investigation found no fire; faulty smoke detector.', 'low', 'c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', '2026-08-14 08:10:00+00', 'closed')
ON CONFLICT (incident_id) DO NOTHING;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
INSERT INTO public.notifications (type, title, message, severity, facility_id, zone_id, is_read, created_at) VALUES
  ('radiation_alert', 'Critical radiation level detected', 'Reactor Containment A at Seabrook has exceeded the critical threshold of 5.000 mSv/h. Immediate action required.', 'critical', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', false, now() - interval '2 hours'),
  ('radiation_alert', 'Warning level radiation in turbine hall', 'Turbine Hall at Peach Bottom has exceeded the warning threshold. Monitor closely.', 'warning', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000005', false, now() - interval '4 hours'),
  ('inspection_overdue', 'Inspection overdue', 'Quarterly safety systems audit at Seabrook Nuclear Station is overdue.', 'warning', 'a0000000-0000-4000-8000-000000000001', NULL, false, now() - interval '6 hours'),
  ('incident_critical', 'Critical incident reported', 'Critical radiation threshold exceeded at Seabrook. Evacuation protocols initiated.', 'critical', 'a0000000-0000-4000-8000-000000000001', NULL, false, now() - interval '1 hour'),
  ('exposure_limit', 'Employee exposure approaching limit', 'Employee EMP-004 has accumulated 18 mSv of 20 mSv annual limit.', 'warning', NULL, NULL, true, now() - interval '1 day'),
  ('system', 'System maintenance scheduled', 'Database maintenance window scheduled for 2026-09-01 02:00 UTC.', 'info', NULL, NULL, true, now() - interval '2 days')
ON CONFLICT DO NOTHING;