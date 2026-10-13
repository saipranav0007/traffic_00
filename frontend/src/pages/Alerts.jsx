import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle, Clock, Filter, 
  RefreshCw, Plus, Send, AlertOctagon, Info, ChevronRight, UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { Modal, LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

const Alerts = () => {
  const { user, isOfficer } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Manual Alert Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    location_id: 1,
    alert_type: 'HIGH CONGESTION',
    severity: 'WARNING',
    message: ''
  });

  const fetchData = async () => {
    try {
      const [alertRes, locRes] = await Promise.all([
        api.get('/alerts?limit=100'),
        api.get('/locations')
      ]);
      setAlerts(alertRes.data);
      setLocations(locRes.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`);
      fetchData();
    } catch (err) {
      alert('Error acknowledging alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/resolve`);
      fetchData();
    } catch (err) {
      alert('Error resolving alert');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.message) {
      alert('Please enter an alert dispatch message.');
      return;
    }

    try {
      await api.post('/alerts/manual', {
        ...manualForm,
        location_id: Number(manualForm.location_id)
      });
      setIsManualModalOpen(false);
      setManualForm({
        location_id: locations[0]?.location_id || 1,
        alert_type: 'HIGH CONGESTION',
        severity: 'WARNING',
        message: ''
      });
      fetchData();
    } catch (err) {
      alert('Error creating manual dispatch alert.');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchesSeverity = filterSeverity === 'ALL' || a.severity === filterSeverity;
    return matchesStatus && matchesSeverity;
  });

  if (loading && alerts.length === 0) {
    return <LoadingSpinner text="Retrieving Incident Feeds & Emergency Telemetry..." />;
  }

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Traffic Incident & Alert Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time threshold breaches, sensor dropouts, severe bottleneck detection, and officer response workflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn btn-secondary btn-sm flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Alerts</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="btn btn-danger btn-sm flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Officer Alert</span>
          </button>
        </div>
      </div>

      {/* Incident Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              Critical Gridlock Alerts
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{criticalCount}</div>
            <span className="text-[10px] text-slate-400">Requires immediate traffic division dispatch</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Total Active Incidents
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{activeCount}</div>
            <span className="text-[10px] text-slate-400">Unacknowledged & pending resolution</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Resolved Incidents
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {alerts.filter(a => a.status === 'RESOLVED').length}
            </div>
            <span className="text-[10px] text-slate-400">Logged & closed in past cycles</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select text-xs py-1.5 px-2 bg-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="form-select text-xs py-1.5 px-2 bg-slate-900"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredAlerts.length} logged incident events
        </span>
      </div>

      {/* Alerts Feed / List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.alert_id}
            className={`glass-card p-5 transition-all duration-200 ${
              alert.status === 'ACTIVE'
                ? alert.severity === 'CRITICAL'
                  ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                  : 'border-amber-500/50 bg-amber-950/15'
                : 'border-slate-800 opacity-80'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Alert Content */}
              <div className="flex items-start gap-3.5">
                <div className="mt-1">
                  <StatusBadge status={alert.severity} showDot={false} />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{alert.alert_id}</span>
                    <h3 className="text-sm font-bold text-white tracking-tight">{alert.alert_type}</h3>
                    <span className="text-xs text-cyan-400 font-mono font-semibold">• {alert.location_name}</span>
                    {alert.sensor_code && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        Sensor: {alert.sensor_code}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{alert.message}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Issued: {new Date(alert.created_at).toLocaleString()}
                    </span>

                    {alert.acknowledger_name && (
                      <span className="text-amber-300">
                        Acknowledged by: {alert.acknowledger_name}
                      </span>
                    )}

                    {alert.resolver_name && (
                      <span className="text-emerald-300">
                        Resolved by: {alert.resolver_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                <StatusBadge status={alert.status} />

                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAcknowledge(alert.alert_id)}
                    className="btn btn-secondary btn-sm text-xs font-mono"
                  >
                    Acknowledge
                  </button>
                )}

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(alert.alert_id)}
                    className="btn btn-success btn-sm text-xs font-mono"
                  >
                    Resolve Incident
                  </button>
                )}
              </div>

            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center glass-card">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-mono">No incident alerts match your filter criteria.</p>
          </div>
        )}
      </div>

      {/* Broadcast Officer Alert Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Broadcast Officer Emergency Dispatch Alert"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Affected Location / Junction</label>
            <select
              value={manualForm.location_id}
              onChange={(e) => setManualForm({ ...manualForm, location_id: Number(e.target.value) })}
              className="form-select"
            >
              {locations.map((l) => (
                <option key={l.location_id} value={l.location_id}>
                  {l.location_name} ({l.area})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Incident Type</label>
              <select
                value={manualForm.alert_type}
                onChange={(e) => setManualForm({ ...manualForm, alert_type: e.target.value })}
                className="form-select"
              >
                <option value="HIGH CONGESTION">HIGH CONGESTION</option>
                <option value="ACCIDENT / OBSTRUCTION">ACCIDENT / OBSTRUCTION</option>
                <option value="VERY LOW SPEED">VERY LOW SPEED</option>
                <option value="VIP MOVEMENT / DIVERSION">VIP MOVEMENT / DIVERSION</option>
                <option value="WEATHER HAZARD">WEATHER HAZARD</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Severity Level</label>
              <select
                value={manualForm.severity}
                onChange={(e) => setManualForm({ ...manualForm, severity: e.target.value })}
                className="form-select"
              >
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Incident Message / Dispatch Instructions</label>
            <textarea
              rows={3}
              value={manualForm.message}
              onChange={(e) => setManualForm({ ...manualForm, message: e.target.value })}
              placeholder="e.g. Lane 2 blocked due to multi-vehicle breakdown. Diverting traffic towards South Spine Corridor."
              className="form-textarea text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-sm font-bold flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Alerts;
