import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FacilitiesPage } from '@/pages/FacilitiesPage';
import { RadiationPage } from '@/pages/RadiationPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { ExposurePage } from '@/pages/ExposurePage';
import { InspectionsPage } from '@/pages/InspectionsPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities"
              element={
                <ProtectedRoute roles={['admin', 'safety_officer']}>
                  <AppShell>
                    <FacilitiesPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiation"
              element={
                <ProtectedRoute roles={['admin', 'safety_officer']}>
                  <AppShell>
                    <RadiationPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute roles={['admin', 'safety_officer']}>
                  <AppShell>
                    <EmployeesPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exposure"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ExposurePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <ProtectedRoute roles={['admin', 'safety_officer']}>
                  <AppShell>
                    <IncidentsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['admin', 'safety_officer']}>
                  <AppShell>
                    <ReportsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <SettingsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
