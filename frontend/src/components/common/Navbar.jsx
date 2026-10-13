import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bell, ShieldCheck, UserCircle, LogOut, Activity, Radio, AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';

const Navbar = ({ onNavigateAlerts }) => {
  const { user, logout, roleName } = useAuth();
  const [time, setTime] = useState(new Date());
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setActiveAlertsCount(res.data.active_alerts);
      } catch (err) {
        // quiet
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#0B1120]/80 backdrop-blur-xl px-7 flex items-center justify-between sticky top-0 z-30">
      {/* Left: System Status & Clock */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold">
              LIVE TELEMETRY
            </span>
            <span className="text-xs font-mono text-slate-300">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {time.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-5 border-l border-white/[0.08]">
          <span className="text-xs text-slate-400">Node Grid:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            OPERATIONAL
          </span>
        </div>
      </div>

      {/* Right: Alerts, User Profile, Role Badge, Logout */}
      <div className="flex items-center gap-4">
        {/* Active Alert Notification Bell */}
        <button
          onClick={onNavigateAlerts}
          className="relative p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all border border-white/[0.08]"
          title="View Active Traffic Alerts"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-950">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* User Role & ID Pill */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">{user?.name}</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {roleName}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              ID: {user?.employee_id} • {user?.department}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all ml-1"
          title="Sign out of Traffic Command"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
