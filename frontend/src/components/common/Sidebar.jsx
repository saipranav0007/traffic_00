import React from 'react';
import { 
  LayoutDashboard, Activity, Radio, BarChart3, Map, Database, 
  AlertTriangle, Settings, Users, ShieldAlert, Cpu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ currentPage, onNavigate }) => {
  const { isAdmin, roleName } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-traffic', label: 'Live Traffic', icon: Activity },
    { id: 'sensors', label: 'Sensors', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'traffic-map', label: 'Traffic Map', icon: Map },
    { id: 'records', label: 'Records', icon: Database },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ id: 'employees', label: 'Employee Management', icon: Users, adminOnly: true });
  }

  return (
    <aside className="w-64 bg-[#0B1120] border-r border-white/[0.08] flex flex-col flex-shrink-0 h-screen sticky top-0 select-none z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-white/[0.08] bg-[#060A12]/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-extrabold text-sm tracking-tight text-white leading-tight">
            SMART TRAFFIC
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
            Control Center
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left relative group ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="flex-1">{item.label}</span>

              {item.adminOnly && (
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Admin
                </span>
              )}

              {isActive && (
                <span className="absolute right-0 top-2 bottom-2 w-1 bg-sky-400 rounded-l-full shadow-glow-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Department Badge */}
      <div className="p-4 border-t border-white/[0.08] bg-[#060A12]/40">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
          <ShieldAlert className="w-5 h-5 text-sky-400 flex-shrink-0" />
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="font-semibold text-slate-300">Central Control Unit</span>
            <span className="text-slate-500 font-mono">Secured Terminal</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
