import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Radiation,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  HardHat,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Form';
import type { UserRole } from '@/types';

export function LoginPage() {
  const { session, signIn, signUp, demoSignIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } else {
      const res = await signUp(email, password, fullName, role);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setError(null);
        navigate('/dashboard');
      }
    }
  }

  async function handleDemoLogin(demoRole: UserRole) {
    setLoading(true);
    await demoSignIn(demoRole);
    navigate('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-2xl shadow-sky-500/30">
            <Radiation className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">RadSafe Monitor</h1>
          <p className="mt-1 text-xs text-slate-400">
            Nuclear Facility Radiation Monitoring & Safety Management System
          </p>
        </div>

        {/* 1-Click Demo Login Panel */}
        <div className="mb-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 backdrop-blur-md">
          <p className="mb-2.5 text-center text-xs font-semibold uppercase tracking-wider text-sky-400">
            ⚡ Quick Demo Access (1-Click)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="flex flex-col items-center justify-center rounded-lg border border-sky-500/30 bg-slate-900/80 p-2.5 text-center transition-all hover:bg-sky-500/20 hover:border-sky-400 group"
            >
              <ShieldAlert className="mb-1 h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">Admin</span>
              <span className="text-[10px] text-slate-400">Full Access</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('safety_officer')}
              className="flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-slate-900/80 p-2.5 text-center transition-all hover:bg-amber-500/20 hover:border-amber-400 group"
            >
              <ShieldCheck className="mb-1 h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">Safety Off.</span>
              <span className="text-[10px] text-slate-400">Operations</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('employee')}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 p-2.5 text-center transition-all hover:bg-slate-800 hover:border-slate-500 group"
            >
              <HardHat className="mb-1 h-4 w-4 text-slate-300 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">Worker</span>
              <span className="text-[10px] text-slate-400">Read-Only</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex rounded-lg border border-slate-800 bg-slate-800/50 p-1">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New Personnel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Alex Mercer"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Authorization Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-100 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="admin">Administrator (Plant Mgmt)</option>
                    <option value="safety_officer">Safety Officer (Health Physics)</option>
                    <option value="employee">Employee / Radiation Tech</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Department Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@nuclear.gov"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Security Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Authenticating...' : 'Registering...'}
                </>
              ) : mode === 'login' ? (
                <>
                  Sign In <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                'Create Authorized Account'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          Nuclear Regulatory Commission (NRC) Compliant · Audit Logged
        </p>
      </div>
    </div>
  );
}
