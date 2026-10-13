import React from 'react';

const StatusBadge = ({ status, type = 'traffic', showDot = true }) => {
  if (!status) return null;
  const s = status.toUpperCase();

  let badgeClass = 'badge-offline';
  let dotClass = 'pulse-cyan';
  let label = status;

  if (s === 'LOW' || s === 'NORMAL' || s === 'ONLINE' || s === 'ACTIVE') {
    badgeClass = 'badge-low';
    dotClass = 'pulse-green';
  } else if (s === 'MODERATE' || s === 'WARNING' || s === 'ACKNOWLEDGED') {
    badgeClass = 'badge-mod';
    dotClass = 'pulse-amber';
  } else if (s === 'HIGH') {
    badgeClass = 'badge-high';
    dotClass = 'pulse-amber';
  } else if (s === 'CRITICAL' || s === 'RESOLVED_CRITICAL') {
    badgeClass = 'badge-crit';
    dotClass = 'pulse-red';
  } else if (s === 'OFFLINE' || s === 'INACTIVE' || s === 'MAINTENANCE') {
    badgeClass = 'badge-offline';
    dotClass = '';
  } else if (s === 'INFO') {
    badgeClass = 'badge-cyan';
    dotClass = 'pulse-cyan';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {showDot && dotClass && <span className={`pulse-dot ${dotClass}`} />}
      {label}
    </span>
  );
};

export default StatusBadge;
