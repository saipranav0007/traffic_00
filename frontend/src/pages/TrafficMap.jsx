import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, Navigation, Radio, Activity, RefreshCw, 
  Layers, ArrowRight, Clock, ShieldCheck, AlertTriangle, Zap, Compass, CheckCircle2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import StatusBadge from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

// Custom Leaflet Icons for Traffic Status
const createCustomIcon = (congestionLevel, isOffline) => {
  let color = '#10B981'; // Green (LOW)
  if (isOffline) {
    color = '#64748B'; // Gray (OFFLINE)
  } else if (congestionLevel === 'MODERATE') {
    color = '#F59E0B'; // Yellow
  } else if (congestionLevel === 'HIGH') {
    color = '#F97316'; // Orange
  } else if (congestionLevel === 'CRITICAL') {
    color = '#EF4444'; // Red
  }

  return L.divIcon({
    className: 'custom-traffic-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid #0F172A;
        box-shadow: 0 0 14px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

const TrafficMap = () => {
  const [mapData, setMapData] = useState({ nodes: [], corridors: [] });
  const [loading, setLoading] = useState(true);
  const [selectedJunction, setSelectedJunction] = useState(null);
  
  // ADSA / DMGT Graph Routing State
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [routingCriterion, setRoutingCriterion] = useState('LEAST_CONGESTED');
  const [routeResult, setRouteResult] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'graph'

  const fetchMapData = async () => {
    try {
      const res = await api.get('/locations/live-map');
      setMapData(res.data);
      if (res.data.nodes.length > 0 && !selectedJunction) {
        setSelectedJunction(res.data.nodes[0]);
        setSourceId(res.data.nodes[0].location_id);
        setTargetId(res.data.nodes[1]?.location_id || res.data.nodes[0].location_id);
      }
    } catch (err) {
      console.error('Error fetching map telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCalculateRoute = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) {
      alert('Please select two distinct junctions to compute a corridor route.');
      return;
    }

    setRoutingLoading(true);
    try {
      const res = await api.post('/routing/calculate-route', {
        source_location_id: Number(sourceId),
        target_location_id: Number(targetId),
        criterion: routingCriterion
      });
      setRouteResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'No viable route found between selected junctions');
    } finally {
      setRoutingLoading(false);
    }
  };

  if (loading && mapData.nodes.length === 0) {
    return <LoadingSpinner text="Rendering Geospatial Sensor Grid & Graph Vertices..." />;
  }

  // Calculate center of nodes
  const centerLat = mapData.nodes.reduce((acc, n) => acc + n.latitude, 0) / (mapData.nodes.length || 1);
  const centerLng = mapData.nodes.reduce((acc, n) => acc + n.longitude, 0) / (mapData.nodes.length || 1);

  // Map nodes dictionary for easy corridor lookup
  const nodeDict = {};
  mapData.nodes.forEach(n => { nodeDict[n.location_id] = n; });

  // Corridor lines
  const corridorLines = mapData.corridors.map(c => {
    const s = nodeDict[c.source_location_id];
    const t = nodeDict[c.target_location_id];
    if (!s || !t) return null;
    return {
      id: c.corridor_id,
      positions: [[s.latitude, s.longitude], [t.latitude, t.longitude]],
      roadName: c.road_name,
      distance: c.distance_km,
      sourceName: s.location_name,
      targetName: t.location_name
    };
  }).filter(Boolean);

  // Path lines if routing is computed
  const routePolyline = [];
  if (routeResult?.path) {
    for (const nid of routeResult.path) {
      const node = nodeDict[nid];
      if (node) routePolyline.push([node.latitude, node.longitude]);
    }
  }

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Metropolitan Traffic Map & Graph Network</h1>
          <p className="text-xs text-slate-400">
            Geographic GIS visualization with live congestion indicators and ADSA/DMGT shortest path route engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                activeTab === 'map' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              GIS Traffic Map
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                activeTab === 'graph' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ADSA Graph Routing
            </button>
          </div>

          <button onClick={fetchMapData} className="btn btn-secondary btn-sm flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="glass-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <span className="text-slate-400 font-semibold uppercase">Junction Status Legend:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-slate-300">LOW / NORMAL FLOW</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-slate-300">MODERATE VOLUME</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
            <span className="text-slate-300">HIGH CONGESTION</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-slate-300">CRITICAL GRIDLOCK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 shadow-sm" />
            <span className="text-slate-400">SENSOR OFFLINE</span>
          </div>
        </div>
      </div>

      {/* Main Map & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Container */}
        <div className="lg:col-span-2 glass-card p-2 h-[550px] relative rounded-2xl overflow-hidden">
          <MapContainer
            center={[centerLat || 12.9716, centerLng || 77.5946]}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full rounded-xl"
          >
            {/* OpenStreetMap Dark Styled Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Corridors */}
            {corridorLines.map((line) => (
              <Polyline
                key={line.id}
                positions={line.positions}
                pathOptions={{
                  color: '#06B6D4',
                  weight: 2,
                  opacity: 0.35,
                  dashArray: '4, 6',
                }}
              />
            ))}

            {/* Render Selected Route Polyline if Active */}
            {routePolyline.length > 0 && (
              <Polyline
                positions={routePolyline}
                pathOptions={{
                  color: '#10B981',
                  weight: 5,
                  opacity: 0.9,
                }}
              />
            )}

            {/* Render Junction Markers */}
            {mapData.nodes.map((node) => {
              const isOffline = node.sensor_status === 'OFFLINE';
              const icon = createCustomIcon(node.congestion_level, isOffline);

              return (
                <Marker
                  key={node.location_id}
                  position={[node.latitude, node.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedJunction(node),
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 font-sans">
                      <div className="font-bold text-white mb-1">{node.location_name}</div>
                      <div className="font-mono text-cyan-400 text-[10px] mb-2">{node.location_code}</div>
                      <div className="space-y-1 text-slate-300">
                        <div>Vehicles: <span className="font-bold text-white">{node.vehicle_count}</span>/min</div>
                        <div>Avg Speed: <span className="font-bold text-emerald-400">{node.average_speed}</span> km/h</div>
                        <div>Status: <span className="font-bold text-cyan-300">{node.congestion_level}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Right Drawer: Junction Telemetry Inspector or Graph Routing Engine */}
        <div className="space-y-6">
          {activeTab === 'map' ? (
            /* Selected Junction Inspector */
            <div className="glass-card flex flex-col justify-between h-full">
              {selectedJunction ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                        {selectedJunction.location_code}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight leading-snug mt-0.5">
                        {selectedJunction.location_name}
                      </h3>
                      <p className="text-xs text-slate-400">{selectedJunction.area}</p>
                    </div>
                    <StatusBadge status={selectedJunction.congestion_level} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Flow Rate</span>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">
                        {selectedJunction.vehicle_count} <span className="text-xs text-slate-500 font-normal">vpm</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Cap: {selectedJunction.capacity_vpm}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Velocity</span>
                      <div className={`text-xl font-bold font-mono mt-0.5 ${selectedJunction.average_speed < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedJunction.average_speed} <span className="text-xs text-slate-500 font-normal">km/h</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Limit: {selectedJunction.speed_limit}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Current Density Index</span>
                      <span className="text-slate-100 font-bold">{selectedJunction.traffic_density}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedJunction.traffic_density > 85 ? 'bg-rose-500' : selectedJunction.traffic_density > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, selectedJunction.traffic_density)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300 font-mono">
                      <span>Coordinates:</span>
                      <span className="text-slate-400">{selectedJunction.latitude?.toFixed(4)}, {selectedJunction.longitude?.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 font-mono">
                      <span>Sensor Status:</span>
                      <StatusBadge status={selectedJunction.sensor_status} showDot={false} />
                    </div>
                    <div className="flex justify-between text-slate-300 font-mono">
                      <span>Active Sensors:</span>
                      <span className="text-cyan-400 font-bold">{selectedJunction.active_sensors_count} of {selectedJunction.total_sensors_count} Online</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                    Telemetry Timestamp: {new Date(selectedJunction.last_updated).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Click any junction marker on the map to inspect live telemetry.
                </div>
              )}
            </div>
          ) : (
            /* ADSA / DMGT Graph Routing Engine */
            <div className="glass-card flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    ADSA Graph Route Optimization
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Dijkstra's shortest/least-congested path algorithm across urban graph vertices and weighted corridors.
                </p>

                <form onSubmit={handleCalculateRoute} className="space-y-3">
                  <div className="form-group mb-2">
                    <label className="form-label text-[10px]">Origin Junction (Vertex A)</label>
                    <select
                      value={sourceId}
                      onChange={(e) => setSourceId(Number(e.target.value))}
                      className="form-select text-xs py-1.5"
                    >
                      {mapData.nodes.map(n => (
                        <option key={n.location_id} value={n.location_id}>{n.location_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-2">
                    <label className="form-label text-[10px]">Destination Junction (Vertex B)</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(Number(e.target.value))}
                      className="form-select text-xs py-1.5"
                    >
                      {mapData.nodes.map(n => (
                        <option key={n.location_id} value={n.location_id}>{n.location_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label text-[10px]">Optimization Criterion</label>
                    <select
                      value={routingCriterion}
                      onChange={(e) => setRoutingCriterion(e.target.value)}
                      className="form-select text-xs py-1.5"
                    >
                      <option value="LEAST_CONGESTED">Least Congested Route (Dynamic Weights)</option>
                      <option value="FASTEST_TIME">Fastest Travel Time</option>
                      <option value="SHORTEST_DISTANCE">Shortest Physical Distance</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={routingLoading}
                    className="btn btn-primary w-full btn-sm font-mono text-xs"
                  >
                    {routingLoading ? 'Executing Dijkstra Algorithm...' : 'Compute Optimal Path'}
                  </button>
                </form>
              </div>

              {/* Route Results */}
              {routeResult && (
                <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Total Distance:</span>
                    <span className="font-bold text-white">{routeResult.total_distance_km} km</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Est. Travel Time:</span>
                    <span className="font-bold text-cyan-400">{routeResult.total_estimated_time_min} mins</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Avg Corridor Speed:</span>
                    <span className="font-bold text-emerald-400">{routeResult.average_speed_kmh} km/h</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Route Path:</span>
                    <div className="space-y-1">
                      {routeResult.steps?.map((step) => (
                        <div key={step.step_number} className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                          <span>{step.step_number}. {step.from_location} → {step.to_location}</span>
                          <StatusBadge status={step.congestion_level} showDot={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TrafficMap;
