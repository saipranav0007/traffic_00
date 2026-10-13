import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, Lock, User, AlertCircle, Radio, ShieldAlert, 
  ArrowRight, KeyRound, CheckCircle, Sparkles, Building2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

const Login = () => {
  const { login } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Forgot Password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmpId, setForgotEmpId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!employeeId || !password) {
      setErrorMessage('Please enter both Employee ID and Password.');
      return;
    }

    setLoading(true);
    const result = await login(employeeId, password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/forgot-password', {
        employee_id: forgotEmpId,
        email: forgotEmail
      });
      setForgotStatus({
        type: 'success',
        message: res.data.message
      });
    } catch (err) {
      setForgotStatus({
        type: 'error',
        message: 'Unable to dispatch reset request. Contact your Department IT Administrator directly.'
      });
    }
  };

  const setDemoUser = (id, pass) => {
    setEmployeeId(id);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Background Decorative Gradients & Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-sky-500/15 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-8 py-5 flex items-center justify-between border-b border-white/[0.06] bg-[#0B1120]/40 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base tracking-tight text-white">
                SMART CITY TRAFFIC SENSOR SYSTEM
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Traffic Police & Urban Mobility Control Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Main Login Form Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 my-4">
        <div className="w-full max-w-[440px]">
          
          <div className="glass-panel p-8 sm:p-9 relative overflow-hidden border border-white/[0.09] shadow-2xl">
            
            {/* Top Badge & Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-sky-500/15 to-transparent border border-sky-500/30 text-sky-400 mb-4 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                Authorized Personnel Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 font-normal">
                Enter your official Officer ID and security credentials.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Employee / Officer ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. ADM-001 or TP-1042"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#060A12]/80 border border-white/[0.1] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-sm text-white placeholder-slate-500 font-mono outline-none transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStatus(null);
                      setForgotEmpId(employeeId);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#060A12]/80 border border-white/[0.1] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Strict Internal Note */}
            <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>No public registration • Managed by System Admin</span>
              </div>
            </div>

            {/* Quick Demo Test Credential Switcher */}
            <div className="mt-5 p-3.5 rounded-xl bg-[#060A12]/90 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Evaluation Quick Login
                </span>
                <span className="text-[10px] font-mono text-slate-400">Click to fill</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoUser('ADM-001', 'Admin@2026')}
                  className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-purple-300">ADMIN</div>
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-300">ADM-001</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser('TP-1042', 'Officer@2026')}
                  className="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-sky-300">OFFICER</div>
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-300">TP-1042</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser('TSO-0187', 'Operator@2026')}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-emerald-300">OPERATOR</div>
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-300">TSO-0187</div>
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-8 border-t border-white/[0.06] bg-[#0B1120]/30 text-center text-xs text-slate-400 font-mono">
        Municipal Traffic Police Department • Restricted Command Terminal • 2026
      </footer>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Department Password Recovery Request"
      >
        {forgotStatus ? (
          <div className="text-center py-5 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{forgotStatus.message}</p>
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your assigned Officer ID and registered department email. A password reset ticket will be routed to the Central System Administrator.
            </p>
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1">
                Employee / Officer ID
              </label>
              <input
                type="text"
                placeholder="e.g. ADM-001"
                value={forgotEmpId}
                onChange={(e) => setForgotEmpId(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#060A12] border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1">
                Official Department Email
              </label>
              <input
                type="email"
                placeholder="officer@traffic.gov.in"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#060A12] border border-white/10 rounded-lg text-xs text-white outline-none focus:border-sky-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white shadow-md shadow-sky-500/20"
              >
                Submit Request
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default Login;
