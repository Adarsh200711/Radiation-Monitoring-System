/*
# Nuclear Facility Radiation Monitoring - Core Schema

## Purpose
Creates the complete database schema for a nuclear facility radiation monitoring
and safety management system. Tracks facilities, zones, radiation readings,
employees, exposure records, inspections, incidents, and notifications.

## New Tables
1. **profiles** — extends auth.users with role (admin/safety_officer/employee), full_name, phone
2. **facilities** — nuclear plants with name, location, type, status
3. **zones** — monitoring zones within a facility, each with a radiation_limit
4. **radiation_readings** — timestamped radiation level measurements per zone
5. **employees** — personnel records with department, designation, role
6. **exposure_records** — cumulative radiation exposure per employee per date per zone
7. **inspections** — scheduled and completed facility inspections with findings
8. **incidents** — reported safety incidents with severity and resolution status
9. **notifications** — system-generated alerts shown on the dashboard

## Security
- RLS enabled on every table.
- Policies scoped to `authenticated` role with ownership checks where applicable.
- profiles: each user can read/update their own profile; admins can read all.
- All operational tables (facilities, zones, readings, employees, exposure, inspections,
  incidents, notifications): any authenticated user can SELECT; admin and safety_officer
  roles can INSERT/UPDATE/DELETE. This reflects the RBAC model where employees are
  read-only on operational data.
- Role is stored in profiles.role and checked via a join to auth.users.
*/

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','safety_officer','employee')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- FACILITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  type text NOT NULL CHECK (type IN ('pressurized_water','boiling_water','gas_cooled','fast_breeder','research','fusion')),
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','maintenance','decommissioned','emergency')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facilities_select_all" ON public.facilities;
CREATE POLICY "facilities_select_all" ON public.facilities FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "facilities_insert_staff" ON public.facilities;
CREATE POLICY "facilities_insert_staff" ON public.facilities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "facilities_update_staff" ON public.facilities;
CREATE POLICY "facilities_update_staff" ON public.facilities FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "facilities_delete_admin" ON public.facilities;
CREATE POLICY "facilities_delete_admin" ON public.facilities FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- ZONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  zone_name text NOT NULL,
  radiation_limit numeric(10,3) NOT NULL DEFAULT 5.000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zones_select_all" ON public.zones;
CREATE POLICY "zones_select_all" ON public.zones FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "zones_insert_staff" ON public.zones;
CREATE POLICY "zones_insert_staff" ON public.zones FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "zones_update_staff" ON public.zones;
CREATE POLICY "zones_update_staff" ON public.zones FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "zones_delete_admin" ON public.zones;
CREATE POLICY "zones_delete_admin" ON public.zones FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- RADIATION READINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.radiation_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  radiation_level numeric(10,3) NOT NULL,
  unit text NOT NULL DEFAULT 'mSv/h',
  alert_level text NOT NULL DEFAULT 'normal' CHECK (alert_level IN ('normal','warning','critical')),
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE public.radiation_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "radiation_select_all" ON public.radiation_readings;
CREATE POLICY "radiation_select_all" ON public.radiation_readings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "radiation_insert_staff" ON public.radiation_readings;
CREATE POLICY "radiation_insert_staff" ON public.radiation_readings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "radiation_update_staff" ON public.radiation_readings;
CREATE POLICY "radiation_update_staff" ON public.radiation_readings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "radiation_delete_admin" ON public.radiation_readings;
CREATE POLICY "radiation_delete_admin" ON public.radiation_readings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department text NOT NULL,
  designation text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','safety_officer','employee')),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees_select_all" ON public.employees;
CREATE POLICY "employees_select_all" ON public.employees FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "employees_insert_staff" ON public.employees;
CREATE POLICY "employees_insert_staff" ON public.employees FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "employees_update_staff" ON public.employees;
CREATE POLICY "employees_update_staff" ON public.employees FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;
CREATE POLICY "employees_delete_admin" ON public.employees FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- EXPOSURE RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exposure_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  exposure_value numeric(10,3) NOT NULL,
  exposure_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exposure_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exposure_select_all" ON public.exposure_records;
CREATE POLICY "exposure_select_all" ON public.exposure_records FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "exposure_insert_staff" ON public.exposure_records;
CREATE POLICY "exposure_insert_staff" ON public.exposure_records FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "exposure_update_staff" ON public.exposure_records;
CREATE POLICY "exposure_update_staff" ON public.exposure_records FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "exposure_delete_admin" ON public.exposure_records;
CREATE POLICY "exposure_delete_admin" ON public.exposure_records FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- INSPECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id text NOT NULL UNIQUE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  inspection_date date NOT NULL,
  findings text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','overdue','cancelled')),
  corrective_actions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspections_select_all" ON public.inspections;
CREATE POLICY "inspections_select_all" ON public.inspections FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "inspections_insert_staff" ON public.inspections;
CREATE POLICY "inspections_insert_staff" ON public.inspections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "inspections_update_staff" ON public.inspections;
CREATE POLICY "inspections_update_staff" ON public.inspections FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "inspections_delete_admin" ON public.inspections;
CREATE POLICY "inspections_delete_admin" ON public.inspections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- INCIDENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  reported_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "incidents_select_all" ON public.incidents;
CREATE POLICY "incidents_select_all" ON public.incidents FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "incidents_insert_staff" ON public.incidents;
CREATE POLICY "incidents_insert_staff" ON public.incidents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "incidents_update_staff" ON public.incidents;
CREATE POLICY "incidents_update_staff" ON public.incidents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "incidents_delete_admin" ON public.incidents;
CREATE POLICY "incidents_delete_admin" ON public.incidents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('radiation_alert','exposure_limit','inspection_overdue','incident_critical','system')),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.zones(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_all" ON public.notifications;
CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "notifications_insert_staff" ON public.notifications;
CREATE POLICY "notifications_insert_staff" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "notifications_update_staff" ON public.notifications;
CREATE POLICY "notifications_update_staff" ON public.notifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','safety_officer'))
  );

DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;
CREATE POLICY "notifications_delete_admin" ON public.notifications FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_zones_facility ON public.zones(facility_id);
CREATE INDEX IF NOT EXISTS idx_radiation_facility ON public.radiation_readings(facility_id);
CREATE INDEX IF NOT EXISTS idx_radiation_zone ON public.radiation_readings(zone_id);
CREATE INDEX IF NOT EXISTS idx_radiation_timestamp ON public.radiation_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employees_facility ON public.employees(facility_id);
CREATE INDEX IF NOT EXISTS idx_exposure_employee ON public.exposure_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_exposure_date ON public.exposure_records(exposure_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_facility ON public.inspections(facility_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_incidents_facility ON public.incidents(facility_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), COALESCE(NEW.raw_user_meta_data->>'role', 'employee'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();