import React, { useState, useEffect } from 'react';
import { 
  Radio, Plus, Search, Filter, RefreshCw, Edit3, Power, 
  Battery, Wifi, Calendar, MapPin, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { Modal, LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

const Sensors = () => {
  const { isAdmin } = useAuth();
  const [sensors, setSensors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    sensor_code: '',
    sensor_type: 'Vehicle Counter',
    location_id: 1,
    model: 'TrafficSense-V400',
    status: 'ONLINE',
    installed_at: new Date().toISOString().split('T')[0],
    battery_health: 100,
    firmware_version: 'v2.4.1'
  });

  const fetchData = async () => {
    try {
      const [senRes, locRes] = await Promise.all([
        api.get('/sensors'),
        api.get('/locations')
      ]);
      setSensors(senRes.data);
      setLocations(locRes.data);
    } catch (err) {
      console.error('Error fetching sensor grid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sensors', formData);
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register sensor');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/sensors/${selectedSensor.sensor_id}`, {
        sensor_type: formData.sensor_type,
        location_id: Number(formData.location_id),
        model: formData.model,
        status: formData.status,
        battery_health: Number(formData.battery_health),
        firmware_version: formData.firmware_version
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update sensor');
    }
  };

  const openEditModal = (sensor) => {
    setSelectedSensor(sensor);
    setFormData({
      sensor_code: sensor.sensor_code,
      sensor_type: sensor.sensor_type,
      location_id: sensor.location_id,
      model: sensor.model,
      status: sensor.status,
      installed_at: sensor.installed_at,
      battery_health: sensor.battery_health,
      firmware_version: sensor.firmware_version
    });
    setIsEditModalOpen(true);
  };

  const toggleSensorStatus = async (sensor) => {
    if (!isAdmin) return;
    const newStatus = sensor.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await api.put(`/sensors/${sensor.sensor_id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Error toggling sensor state');
    }
  };

  const pingSensor = async (sensorId) => {
    try {
      await api.post(`/sensors/${sensorId}/ping`);
      fetchData();
    } catch (err) {
      console.error('Ping error:', err);
    }
  };

  const filteredSensors = sensors.filter(s => {
    const matchesType = filterType === 'ALL' || s.sensor_type === filterType;
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      s.sensor_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location?.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner text="Scanning Hardware Sensor Telemetry Nodes..." />;
  }

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sensor Telemetry & Hardware Management</h1>
          <p className="text-xs text-slate-400">
            Configure radar speed detectors, inductive loop counters, and optical ANPR sensors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Grid</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setFormData({
                  sensor_code: `SNS-${Math.floor(100 + Math.random() * 900)}`,
                  sensor_type: 'Vehicle Counter',
                  location_id: locations[0]?.location_id || 1,
                  model: 'TrafficSense-V400',
                  status: 'ONLINE',
                  installed_at: new Date().toISOString().split('T')[0],
                  battery_health: 100,
                  firmware_version: 'v2.4.1'
                });
                setIsAddModalOpen(true);
              }}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy New Sensor</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sensor code or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-9 text-xs py-2"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sensor Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select text-xs py-1.5 px-2 bg-slate-900"
            >
              <option value="ALL">All Hardware Types</option>
              <option value="Vehicle Counter">Vehicle Counter</option>
              <option value="Speed Radar Sensor">Speed Radar Sensor</option>
              <option value="Traffic Density Sensor">Traffic Density Sensor</option>
              <option value="Smart ANPR Camera">Smart ANPR Camera</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select text-xs py-1.5 px-2 bg-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">ONLINE</option>
              <option value="WARNING">WARNING</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 self-end md:self-auto">
          Showing {filteredSensors.length} of {sensors.length} nodes
        </div>
      </div>

      {/* Sensor Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sensor ID</th>
              <th>Type / Model</th>
              <th>Installed Location</th>
              <th>Operational Status</th>
              <th>Latest Reading</th>
              <th>Health / Battery</th>
              <th>Last Ping</th>
              {isAdmin && <th className="text-right">Admin Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSensors.map((sensor) => (
              <tr key={sensor.sensor_id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono font-bold text-white text-xs">{sensor.sensor_code}</span>
                  </div>
                </td>

                <td>
                  <div className="text-xs font-semibold text-slate-200">{sensor.sensor_type}</div>
                  <div className="text-[10px] font-mono text-slate-400">{sensor.model} • {sensor.firmware_version}</div>
                </td>

                <td>
                  <div className="text-xs font-semibold text-slate-200">{sensor.location?.location_name || 'Unassigned'}</div>
                  <div className="text-[10px] font-mono text-cyan-400">{sensor.location?.area}</div>
                </td>

                <td>
                  <StatusBadge status={sensor.status} />
                </td>

                <td>
                  {sensor.current_reading ? (
                    <div className="font-mono text-xs text-slate-200">
                      <div>
                        <span className="font-bold text-white">{sensor.current_reading.vehicle_count}</span> veh/min •{' '}
                        <span className="text-emerald-400">{sensor.current_reading.average_speed}</span> km/h
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Density: {sensor.current_reading.traffic_density}%
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">No stream</span>
                  )}
                </td>

                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sensor.battery_health > 70 ? 'bg-emerald-400' : sensor.battery_health > 40 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${sensor.battery_health}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300">{sensor.battery_health}%</span>
                  </div>
                </td>

                <td className="text-xs font-mono text-slate-400">
                  {sensor.last_communication ? new Date(sensor.last_communication).toLocaleTimeString() : 'N/A'}
                </td>

                {isAdmin && (
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => pingSensor(sensor.sensor_id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Ping Telemetry"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openEditModal(sensor)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Sensor Configuration"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleSensorStatus(sensor)}
                        className={`p-1.5 rounded transition-colors ${
                          sensor.status === 'ONLINE'
                            ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-400'
                            : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400'
                        }`}
                        title={sensor.status === 'ONLINE' ? 'Deactivate Sensor' : 'Activate Sensor'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Sensor Modal (ADMIN ONLY) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Deploy New Sensor Node to Municipal Grid"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Sensor Code / Identifier</label>
            <input
              type="text"
              value={formData.sensor_code}
              onChange={(e) => setFormData({ ...formData, sensor_code: e.target.value })}
              className="form-input font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Sensor Hardware Type</label>
              <select
                value={formData.sensor_type}
                onChange={(e) => setFormData({ ...formData, sensor_type: e.target.value })}
                className="form-select"
              >
                <option value="Vehicle Counter">Vehicle Counter</option>
                <option value="Speed Radar Sensor">Speed Radar Sensor</option>
                <option value="Traffic Density Sensor">Traffic Density Sensor</option>
                <option value="Smart ANPR Camera">Smart ANPR Camera</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Installed Junction</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: Number(e.target.value) })}
                className="form-select"
              >
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Hardware Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="form-input font-mono text-xs"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Firmware Version</label>
              <input
                type="text"
                value={formData.firmware_version}
                onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                className="form-input font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Deploy Sensor
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Sensor Modal (ADMIN ONLY) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Configure Sensor ${formData.sensor_code}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Sensor Type</label>
              <select
                value={formData.sensor_type}
                onChange={(e) => setFormData({ ...formData, sensor_type: e.target.value })}
                className="form-select"
              >
                <option value="Vehicle Counter">Vehicle Counter</option>
                <option value="Speed Radar Sensor">Speed Radar Sensor</option>
                <option value="Traffic Density Sensor">Traffic Density Sensor</option>
                <option value="Smart ANPR Camera">Smart ANPR Camera</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: Number(e.target.value) })}
                className="form-select"
              >
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="WARNING">WARNING</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Battery Health (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.battery_health}
                onChange={(e) => setFormData({ ...formData, battery_health: Number(e.target.value) })}
                className="form-input font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Configuration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sensors;
