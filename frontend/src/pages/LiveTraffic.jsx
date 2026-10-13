import React, { useState, useEffect } from 'react';
import { 
  Activity, Radio, Gauge, MapPin, RefreshCw, Filter, 
  Layers, ArrowUpRight, Search, Zap, AlertTriangle 
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

const LiveTraffic = () => {
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLiveTraffic = async () => {
    try {
      const res = await api.get('/traffic/live');
      setTrafficData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live traffic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTraffic();
    let interval;
    if (isLiveStreaming) {
      interval = setInterval(fetchLiveTraffic, 5000);
    }
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Extract unique areas
  const areas = ['ALL', ...new Set(trafficData.map(t => t.area))];

  const filteredTraffic = trafficData.filter(item => {
    const matchesArea = filterArea === 'ALL' || item.area === filterArea;
    const matchesStatus = filterStatus === 'ALL' || item.congestion_level === filterStatus;
    const matchesSearch = searchQuery === '' || 
      item.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArea && matchesStatus && matchesSearch;
  });

  if (loading && trafficData.length === 0) {
    return <LoadingSpinner text="Connecting to Real-time Sensor Mesh..." />;
  }

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Live Traffic & Junction Monitoring</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-sensor telemetry stream across metropolitan arterial corridors.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`btn btn-sm flex items-center gap-1.5 font-mono text-xs ${
              isLiveStreaming ? 'btn-success' : 'btn-secondary'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-pulse text-emerald-200' : ''}`} />
            <span>{isLiveStreaming ? 'LIVE STREAM ACTIVE (5s)' : 'STREAM PAUSED'}</span>
          </button>

          <button
            onClick={fetchLiveTraffic}
            className="btn btn-secondary btn-sm flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search junction name/code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-9 text-xs py-2"
            />
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Area:</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="form-select text-xs py-1.5 px-2 bg-slate-900"
            >
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Congestion Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Congestion:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select text-xs py-1.5 px-2 bg-slate-900"
            >
              <option value="ALL">All Levels</option>
              <option value="LOW">LOW</option>
              <option value="MODERATE">MODERATE</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 self-end md:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Grid Table
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTraffic.map((item) => (
            <div
              key={item.location_id}
              className="glass-card flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:border-slate-600"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                      {item.location_code} • {item.area}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                      {item.location_name}
                    </h3>
                  </div>
                  <StatusBadge status={item.congestion_level} />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Vehicle Count</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-bold font-mono text-white">{item.vehicle_count}</span>
                      <span className="text-[10px] text-slate-500 font-mono">/min</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Cap: {item.capacity_vpm} vpm</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Average Speed</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-xl font-bold font-mono ${item.average_speed < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.average_speed}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">km/h</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Limit: {item.speed_limit} km/h</span>
                  </div>
                </div>

                {/* Density Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Traffic Density Index</span>
                    <span className="text-slate-200 font-bold">{item.traffic_density}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.traffic_density > 85 ? 'bg-rose-500' : item.traffic_density > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.traffic_density)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sensors: {item.active_sensors_count}/{item.total_sensors_count} Online</span>
                </div>
                <span>Updated: {new Date(item.last_updated).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Junction / Location</th>
                <th>Area</th>
                <th>Vehicles / Min</th>
                <th>Average Speed</th>
                <th>Density Index</th>
                <th>Congestion Level</th>
                <th>Sensors</th>
                <th>Last Reading</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraffic.map((item) => (
                <tr key={item.location_id}>
                  <td>
                    <div className="font-semibold text-slate-200">{item.location_name}</div>
                    <div className="text-[11px] font-mono text-cyan-400">{item.location_code}</div>
                  </td>
                  <td className="text-xs text-slate-400">{item.area}</td>
                  <td className="font-mono font-bold text-slate-100">{item.vehicle_count} vpm</td>
                  <td>
                    <span className={`font-mono font-bold ${item.average_speed < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.average_speed} km/h
                    </span>
                  </td>
                  <td>
                    <div className="w-24">
                      <span className="text-[10px] font-mono text-slate-400 block mb-0.5">{item.traffic_density}%</span>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.traffic_density > 85 ? 'bg-rose-500' : item.traffic_density > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.traffic_density)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={item.congestion_level} />
                  </td>
                  <td className="text-xs font-mono text-slate-300">
                    {item.active_sensors_count}/{item.total_sensors_count} Active
                  </td>
                  <td className="text-xs font-mono text-slate-400">
                    {new Date(item.last_updated).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredTraffic.length === 0 && (
        <div className="p-12 text-center glass-card">
          <p className="text-slate-400 text-sm">No traffic junctions match the selected filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LiveTraffic;
