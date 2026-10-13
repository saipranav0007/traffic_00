import React from 'react';

const StatCard = ({ title, value, unit = '', icon: Icon, subtitle, trend, status = 'normal' }) => {
  let statusGlow = '';
  let iconBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

  if (status === 'warning') {
    statusGlow = 'border-amber-500/40 shadow-amber-950/30';
    iconBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (status === 'critical') {
    statusGlow = 'border-rose-500/50 shadow-rose-950/40';
    iconBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (status === 'success') {
    statusGlow = 'border-emerald-500/40 shadow-emerald-950/30';
    iconBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }

  return (
    <div className={`glass-card ${statusGlow} relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconBg} backdrop-blur-sm`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <span className={`font-mono font-medium ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
