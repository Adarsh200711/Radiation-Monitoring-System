/*
# Fix RLS Policy Infinite Recursion

## Problem
Error code 42P17: "infinite recursion detected in policy"

Root cause: Multiple tables use EXISTS (SELECT FROM public.profiles) to check user roles.
When Supabase enforces the SELECT policy on profiles during these subqueries, it creates
a circular dependency that causes infinite recursion.

## Solution
1. Create a SECURITY DEFINER function that safely checks user roles WITHOUT triggering RLS
2. Replace all EXISTS (SELECT FROM profiles) subqueries with calls to this function
3. Apply to all affected tables: radiation_readings, exposure_records, inspections, notifications

SECURITY DEFINER allows the function to bypass RLS and read profiles directly,
breaking the recursion cycle.
*/

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER - bypass RLS)
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

DROP FUNCTION IF EXISTS public.is_staff() CASCADE;
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'safety_officer')
  );
END;
$$;

-- ============================================================================
-- RADIATION_READINGS - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "radiation_insert_staff" ON public.radiation_readings;
CREATE POLICY "radiation_insert_staff" ON public.radiation_readings FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "radiation_update_staff" ON public.radiation_readings;
CREATE POLICY "radiation_update_staff" ON public.radiation_readings FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "radiation_delete_admin" ON public.radiation_readings;
CREATE POLICY "radiation_delete_admin" ON public.radiation_readings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- EXPOSURE_RECORDS - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "exposure_insert_staff" ON public.exposure_records;
CREATE POLICY "exposure_insert_staff" ON public.exposure_records FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "exposure_update_staff" ON public.exposure_records;
CREATE POLICY "exposure_update_staff" ON public.exposure_records FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "exposure_delete_admin" ON public.exposure_records;
CREATE POLICY "exposure_delete_admin" ON public.exposure_records FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- INSPECTIONS - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "inspections_insert_staff" ON public.inspections;
CREATE POLICY "inspections_insert_staff" ON public.inspections FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "inspections_update_staff" ON public.inspections;
CREATE POLICY "inspections_update_staff" ON public.inspections FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "inspections_delete_admin" ON public.inspections;
CREATE POLICY "inspections_delete_admin" ON public.inspections FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- NOTIFICATIONS - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "notifications_insert_staff" ON public.notifications;
CREATE POLICY "notifications_insert_staff" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "notifications_update_staff" ON public.notifications;
CREATE POLICY "notifications_update_staff" ON public.notifications FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;
CREATE POLICY "notifications_delete_admin" ON public.notifications FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- FACILITIES - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "facilities_insert_staff" ON public.facilities;
CREATE POLICY "facilities_insert_staff" ON public.facilities FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "facilities_update_staff" ON public.facilities;
CREATE POLICY "facilities_update_staff" ON public.facilities FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "facilities_delete_admin" ON public.facilities;
CREATE POLICY "facilities_delete_admin" ON public.facilities FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- ZONES - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "zones_insert_staff" ON public.zones;
CREATE POLICY "zones_insert_staff" ON public.zones FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "zones_update_staff" ON public.zones;
CREATE POLICY "zones_update_staff" ON public.zones FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "zones_delete_admin" ON public.zones;
CREATE POLICY "zones_delete_admin" ON public.zones FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- EMPLOYEES - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "employees_insert_staff" ON public.employees;
CREATE POLICY "employees_insert_staff" ON public.employees FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "employees_update_staff" ON public.employees;
CREATE POLICY "employees_update_staff" ON public.employees FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "employees_delete_admin" ON public.employees;
CREATE POLICY "employees_delete_admin" ON public.employees FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- INCIDENTS - Replace EXISTS with function calls
-- ============================================================================

DROP POLICY IF EXISTS "incidents_insert_staff" ON public.incidents;
CREATE POLICY "incidents_insert_staff" ON public.incidents FOR INSERT
  TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "incidents_update_staff" ON public.incidents;
CREATE POLICY "incidents_update_staff" ON public.incidents FOR UPDATE
  TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "incidents_delete_admin" ON public.incidents;
CREATE POLICY "incidents_delete_admin" ON public.incidents FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- PROFILES - Simplify to avoid recursion
-- ============================================================================

-- The profiles SELECT policy also needs fixing: remove the nested profiles query
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR public.is_admin()  -- Use function instead of nested SELECT
  );
