import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Lock, Sliders, Play, Zap, 
  ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [settingsList, setSettingsList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password state
  const [passData, setPassData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passStatus, setPassStatus] = useState(null);

  // Threshold form state
  const [thresholds, setThresholds] = useState({
    CONGESTION_LOW_THRESHOLD: '40',
    CONGESTION_MEDIUM_THRESHOLD: '70',
    CONGESTION_CRITICAL_SPEED_KMH: '18',
    ALERT_AUTO_GENERATE: 'true',
    SIMULATION_INTERVAL_SEC: '5'
  });
  const [thresholdStatus, setThresholdStatus] = useState(null);

  // Incident Injection state (for demo evaluation)
  const [incidentLocationId, setIncidentLocationId] = useState(3);
  const [incidentDuration, setIncidentDuration] = useState(5);
  const [incidentStatus, setIncidentStatus] = useState(null);

  const fetchSettingsData = async () => {
    try {
      const [setRes, locRes] = await Promise.all([
        api.get('/settings'),
        api.get('/locations')
      ]);
      setSettingsList(setRes.data);
      setLocations(locRes.data);

      const map = {};
      setRes.data.forEach(s => {
        map[s.setting_key] = s.setting_value;
      });
      setThresholds(prev => ({ ...prev, ...map }));
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassStatus(null);
    if (passData.new_password !== passData.confirm_password) {
      setPassStatus({ type: 'error', message: 'New password confirmation does not match.' });
      return;
    }

    try {
      await api.post('/settings/change-password', {
        current_password: passData.current_password,
        new_password: passData.new_password
      });
      setPassStatus({ type: 'success', message: 'Password updated successfully!' });
      setPassData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPassStatus({ type: 'error', message: err.response?.data?.detail || 'Failed to update password.' });
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setThresholdStatus(null);
    try {
      for (const [k, v] of Object.entries(thresholds)) {
        await api.put(`/settings/${k}`, { setting_value: String(v) });
      }
      setThresholdStatus({ type: 'success', message: 'Traffic congestion thresholds updated and active!' });
    } catch (err) {
      setThresholdStatus({ type: 'error', message: 'Failed to update system settings.' });
    }
  };

  const handleInjectIncident = async (e) => {
    e.preventDefault();
    setIncidentStatus(null);
    try {
      const res = await api.post('/settings/inject-incident', {
        location_id: Number(incidentLocationId),
        duration_minutes: Number(incidentDuration)
      });
      setIncidentStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setIncidentStatus({ type: 'error', message: 'Failed to trigger simulated congestion.' });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading System Configurations & Thresholds..." />;
  }

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Calibration</h1>
        <p className="text-xs text-slate-400">
          Officer profile preferences, congestion thresholds, algorithm parameters, and simulation controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Officer Profile Summary */}
        <div className="glass-card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Authorized Officer Profile
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Officer Name:</span>
              <span className="font-bold text-white font-sans">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Employee / Officer ID:</span>
              <span className="font-mono font-bold text-cyan-400">{user?.employee_id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Official Email:</span>
              <span className="font-mono text-slate-300">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Assigned Role:</span>
              <span className="font-mono font-bold text-purple-300 uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60">
                {user?.role?.role_name}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Division:</span>
              <span className="text-slate-300 font-sans">{user?.department}</span>
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Change Account Password
            </h4>

            {passStatus && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                passStatus.type === 'success' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}>
                {passStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{passStatus.message}</span>
              </div>
            )}

            <div className="form-group mb-2">
              <label className="form-label text-[10px]">Current Password</label>
              <input
                type="password"
                value={passData.current_password}
                onChange={(e) => setPassData({ ...passData, current_password: e.target.value })}
                className="form-input text-xs py-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group mb-2">
                <label className="form-label text-[10px]">New Password</label>
                <input
                  type="password"
                  value={passData.new_password}
                  onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                  className="form-input text-xs py-1.5"
                  required
                />
              </div>

              <div className="form-group mb-2">
                <label className="form-label text-[10px]">Confirm Password</label>
                <input
                  type="password"
                  value={passData.confirm_password}
                  onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                  className="form-input text-xs py-1.5"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary btn-sm text-xs font-mono">
              Update Password
            </button>
          </form>
        </div>

        {/* System Thresholds (ADMIN ONLY) */}
        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Congestion Classification Thresholds
              </h3>
            </div>
            {!isAdmin && (
              <span className="text-[10px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                View Only
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Configure dynamic mathematical scoring parameters used by the sensor ingestion engine to categorize urban density.
          </p>

          {thresholdStatus && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              thresholdStatus.type === 'success' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}>
              <CheckCircle className="w-4 h-4" />
              <span>{thresholdStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveThresholds} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group mb-2">
                <label className="form-label text-[10px]">LOW Flow Max (Veh/min)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={thresholds.CONGESTION_LOW_THRESHOLD}
                  onChange={(e) => setThresholds({ ...thresholds, CONGESTION_LOW_THRESHOLD: e.target.value })}
                  className="form-input text-xs font-mono py-1.5"
                  required
                />
              </div>

              <div className="form-group mb-2">
                <label className="form-label text-[10px]">MEDIUM Flow Max (Veh/min)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={thresholds.CONGESTION_MEDIUM_THRESHOLD}
                  onChange={(e) => setThresholds({ ...thresholds, CONGESTION_MEDIUM_THRESHOLD: e.target.value })}
                  className="form-input text-xs font-mono py-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group mb-2">
                <label className="form-label text-[10px]">Critical Speed Floor (km/h)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={thresholds.CONGESTION_CRITICAL_SPEED_KMH}
                  onChange={(e) => setThresholds({ ...thresholds, CONGESTION_CRITICAL_SPEED_KMH: e.target.value })}
                  className="form-input text-xs font-mono py-1.5"
                  required
                />
              </div>

              <div className="form-group mb-2">
                <label className="form-label text-[10px]">Simulation Interval (sec)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={thresholds.SIMULATION_INTERVAL_SEC}
                  onChange={(e) => setThresholds({ ...thresholds, SIMULATION_INTERVAL_SEC: e.target.value })}
                  className="form-input text-xs font-mono py-1.5"
                  required
                />
              </div>
            </div>

            {isAdmin && (
              <button type="submit" className="btn btn-primary btn-sm text-xs font-mono mt-2">
                Save & Apply Thresholds
              </button>
            )}
          </form>

          {/* Simulation Incident Injection Box (Demonstration Feature) */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <h4 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                Live Incident Simulation Injector (Demo Tool)
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">
              Trigger an artificial gridlock surge at any junction to evaluate real-time alert generation, map color shifts, and Dijkstra re-routing in action.
            </p>

            {incidentStatus && (
              <div className="p-2.5 rounded-lg text-xs bg-amber-950/60 border border-amber-800 text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{incidentStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleInjectIncident} className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="form-label text-[9px]">Target Junction</label>
                <select
                  value={incidentLocationId}
                  onChange={(e) => setIncidentLocationId(Number(e.target.value))}
                  className="form-select text-xs py-1 px-1.5"
                >
                  {locations.map((l) => (
                    <option key={l.location_id} value={l.location_id}>
                      {l.location_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-[9px]">Duration (Mins)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={incidentDuration}
                  onChange={(e) => setIncidentDuration(Number(e.target.value))}
                  className="form-input text-xs py-1 px-2 font-mono"
                />
              </div>

              <div>
                <button type="submit" className="btn btn-danger btn-sm text-xs w-full py-1.5 font-bold">
                  Inject Gridlock
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
