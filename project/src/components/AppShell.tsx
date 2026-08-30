import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Building2,
  Activity,
  Users,
  Radiation,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  CheckCheck,
  Trash2,
  ShieldCheck,
  Radio,
  Play,
  Pause,
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { db, subscribeData } from '@/lib/db';
import { telemetry } from '@/lib/telemetry';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/format';
import type { UserRole, Notification } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/facilities', label: 'Facilities', icon: Building2, roles: ['admin', 'safety_officer'] },
  { to: '/radiation', label: 'Radiation Monitoring', icon: Activity, roles: ['admin', 'safety_officer'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'safety_officer'] },
  { to: '/exposure', label: 'Exposure Tracking', icon: Radiation },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle, roles: ['admin', 'safety_officer'] },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'safety_officer'] },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, demoSignIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [telemetryState, setTelemetryState] = useState(() => telemetry.getState());

  useEffect(() => {
    async function loadNotifs() {
      const list = await db.getNotifications();
      setNotifications(list);
    }
    loadNotifs();
    const unsubDb = subscribeData(loadNotifs);
    const unsubTelemetry = telemetry.subscribe(setTelemetryState);

    return () => {
      unsubDb();
      unsubTelemetry();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const currentRole = profile?.role ?? 'admin';
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  async function handleRoleSwitch(role: UserRole) {
    await demoSignIn(role);
    setUserMenuOpen(false);
  }

  const isLive = telemetryState.status === 'connected' && telemetryState.isStreaming;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
            <Radiation className="h-5 w-5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100">RadSafe Monitor</h1>
            <p className="text-[10px] font-medium text-sky-400/90 tracking-wider uppercase">Nuclear Safety OS</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 shadow-sm shadow-sky-500/10 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card in Sidebar */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/40">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/90 p-2.5 shadow-inner">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-cyan-700 text-xs font-bold text-white shadow">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">
                {profile?.full_name ?? 'James Carter'}
              </p>
              <div className="mt-0.5">
                <Badge className={ROLE_COLORS[currentRole]}>
                  {ROLE_LABELS[currentRole]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-md lg:px-6 relative z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
              aria-label="Toggle Navigation Menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Live Telemetry Stream Indicator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => telemetry.toggleStream()}
                title={isLive ? 'Pause Live Telemetry Stream' : 'Resume Live Telemetry Stream'}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  isLive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isLive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isLive ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </span>
                <span className="hidden sm:inline">
                  {isLive ? '🟢 Telemetry Bus: Live' : '⚪ Telemetry: Paused'}
                </span>
                <span className="sm:hidden">{isLive ? 'Live' : 'Paused'}</span>
                {isLive ? <Pause className="h-3 w-3 ml-0.5 opacity-70" /> : <Play className="h-3 w-3 ml-0.5 opacity-70" />}
              </button>

              {telemetryState.latestReading && (
                <span className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/40 px-2.5 py-1 text-[11px] font-mono text-slate-300">
                  <Radio className="h-3 w-3 text-sky-400 animate-pulse" />
                  Latest: <strong className="text-white">{telemetryState.latestReading.radiation_level} mSv/h</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Drawer */}
            <div className="relative">
              <button
                onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
                className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                title="Notifications & Alarms"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDrawerOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[998] backdrop-blur-sm"
                    onClick={() => setNotifDrawerOpen(false)}
                  />
                  <div className="fixed right-4 lg:right-6 top-20 z-[999] w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/95">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-sky-400" />
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                          Alarms & Telemetry Events
                        </h4>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => db.markAllNotificationsRead()}
                          className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-500">
                          All systems normal. No active notifications.
                        </p>
                      ) : (
                        notifications.slice(0, 15).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 transition-colors rounded-lg mx-1 my-0.5 ${
                              !n.is_read ? 'bg-slate-800/50 border border-slate-700/50' : 'opacity-70 hover:opacity-100'
                            } hover:bg-slate-800/80`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span
                                  className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                                    n.severity === 'critical'
                                      ? 'bg-red-400 animate-ping'
                                      : n.severity === 'warning'
                                        ? 'bg-amber-400'
                                        : 'bg-sky-400'
                                  }`}
                                />
                                <div>
                                  <p className="text-xs font-semibold text-slate-100">
                                    {n.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                                    {n.message}
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-500 font-mono">
                                    {formatRelative(n.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!n.is_read && (
                                  <button
                                    onClick={() => db.markNotificationRead(n.id)}
                                    title="Mark as read"
                                    className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-emerald-400"
                                  >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => db.deleteNotification(n.id)}
                                  title="Dismiss"
                                  className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-850 p-1.5 transition-all hover:border-slate-700 hover:bg-slate-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-cyan-700 text-xs font-bold text-white shadow">
                  {profile?.full_name?.charAt(0) ?? 'U'}
                </div>
                <div className="hidden text-left sm:block pr-1">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {profile?.full_name ?? 'James Carter'}
                  </p>
                  <p className="text-[9px] font-mono text-sky-400 uppercase tracking-wider">
                    {currentRole}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[998] backdrop-blur-sm"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="fixed right-4 lg:right-6 top-20 z-[999] w-64 rounded-2xl border border-slate-800 bg-slate-900 py-2 shadow-2xl">
                    <div className="border-b border-slate-800 px-4 py-3 bg-slate-950/40">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {profile?.full_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {profile?.phone ?? 'Clearance Level 4'}
                      </p>
                      <div className="mt-2">
                        <Badge className={ROLE_COLORS[currentRole]}>
                          {ROLE_LABELS[currentRole]}
                        </Badge>
                      </div>
                    </div>

                    {/* Role Switcher */}
                    <div className="border-b border-slate-800 p-2">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Switch Role Mode
                      </p>
                      <button
                        onClick={() => handleRoleSwitch('admin')}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                          currentRole === 'admin'
                            ? 'bg-sky-500/15 text-sky-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5" /> Administrator
                        </span>
                        {currentRole === 'admin' && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('safety_officer')}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                          currentRole === 'safety_officer'
                            ? 'bg-amber-500/15 text-amber-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5" /> Safety Officer
                        </span>
                        {currentRole === 'safety_officer' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('employee')}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                          currentRole === 'employee'
                            ? 'bg-slate-700 text-slate-200 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" /> Employee (Read-only)
                        </span>
                        {currentRole === 'employee' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                      </button>
                    </div>

                    <div className="pt-1 px-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/settings');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Settings className="h-4 w-4" /> System Configuration
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Secure Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content with zero horizontal overflow */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
