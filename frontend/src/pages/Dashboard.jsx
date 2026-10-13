import React, { useState, useEffect } from 'react';
import { 
  Radio, Activity, AlertTriangle, MapPin, Gauge, RefreshCw, 
  TrendingUp, Clock, ShieldCheck, ChevronRight, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ onNavigate }) => {
  const [summary, setSummary] = useState(null);
  const [liveJunctions, setLiveJunctions] = useState([]);
  const [trends, setTrends] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sumRes, liveRes, trendRes, alertRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/live-overview'),
        api.get('/dashboard/hourly-trend'),
        api.get('/alerts?limit=5&status=ACTIVE')
      ]);

      setSummary(sumRes.data);
      setLiveJunctions(liveRes.data);
      setTrends(trendRes.data);
      setRecentAlerts(alertRes.data);
      setLastSync(new Date());
    } catch (err) {
      console.error('Dashboard telemetry fetch error:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 6 seconds to capture live simulated sensor telemetry
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`);
      fetchDashboardData();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  if (loading && !summary) {
    return <LoadingSpinner text="Booting Central Traffic Telemetry Feeds..." />;
  }

  // Chart configuration for 12-hour trends
  const trendChartData = {
    labels: trends?.labels || [],
    datasets: [
      {
        label: 'Vehicles Detected',
        data: trends?.vehicles || [],
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Avg Speed (km/h)',
        data: trends?.speeds || [],
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        yAxisID: 'y1',
        pointRadius: 2,
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#06B6D4', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#10B981', font: { family: 'JetBrains Mono', size: 10 } }
      }
    }
  };

  // Doughnut data for sensor health
  const sensorDoughnutData = {
    labels: ['Online', 'Warning', 'Offline/Maintenance'],
    datasets: [
      {
        data: [
          summary?.active_sensors || 0,
          summary?.warning_sensors || 0,
          summary?.offline_sensors || 0
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#64748B'],
        borderColor: '#0F172A',
        borderWidth: 2,
      }
    ]
  };

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Traffic Control Command Overview</h1>
          <p className="text-xs text-slate-400">
            Real-time urban mobility surveillance, sensor health telemetry, and incident dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
            Sync: {lastSync.toLocaleTimeString()}
          </span>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Summary Cards */}
      <div className="grid-cols-5">
        <StatCard
          title="Total Sensors"
          value={summary?.total_sensors || 0}
          unit="UNITS"
          icon={Radio}
          subtitle="Grid Infrastructure"
          trend={{ value: '100% Deployed', positive: true }}
          status="normal"
        />

        <StatCard
          title="Active Sensors"
          value={summary?.active_sensors || 0}
          unit="ONLINE"
          icon={Activity}
          subtitle={`${((summary?.active_sensors / (summary?.total_sensors || 1)) * 100).toFixed(0)}% Availability`}
          trend={{ value: `${summary?.warning_sensors || 0} Warning`, positive: summary?.warning_sensors === 0 }}
          status={summary?.offline_sensors > 2 ? 'warning' : 'success'}
        />

        <StatCard
          title="Vehicles Today"
          value={summary?.vehicles_today || 0}
          unit="FLOW"
          icon={TrendingUp}
          subtitle="Total detected volume"
          trend={{ value: '+4.2% vs avg', positive: true }}
          status="normal"
        />

        <StatCard
          title="Congested Junctions"
          value={summary?.congested_locations || 0}
          unit="BOTTLENECKS"
          icon={MapPin}
          subtitle="High / Critical Density"
          trend={{ value: summary?.congested_locations > 2 ? 'Action Required' : 'Optimal Flow', positive: summary?.congested_locations <= 1 }}
          status={summary?.congested_locations > 2 ? 'critical' : summary?.congested_locations > 0 ? 'warning' : 'success'}
        />

        <StatCard
          title="Active Alerts"
          value={summary?.active_alerts || 0}
          unit="INCIDENTS"
          icon={AlertTriangle}
          subtitle="Unresolved alerts"
          trend={{ value: summary?.active_alerts === 0 ? 'All Clear' : 'Dispatches active', positive: summary?.active_alerts === 0 }}
          status={summary?.active_alerts > 0 ? 'critical' : 'success'}
        />
      </div>

      {/* 2-Column Section: Trend Chart & Sensor Health Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph */}
        <div className="lg:col-span-2 glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                12-Hour Traffic & Speed Trend
              </h3>
              <p className="text-xs text-slate-400">Time-series volume curve correlated with average corridor speed</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              Full Analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <Line data={trendChartData} options={trendChartOptions} />
          </div>
        </div>

        {/* Sensor Health & Status Summary */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Sensor Grid Health
              </h3>
              <StatusBadge status={summary?.system_status} />
            </div>
            <p className="text-xs text-slate-400 mb-4">Hardware telemetry distribution across municipal grid</p>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            <Doughnut
              data={sensorDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderWidth: 1,
                  }
                }
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-white">{summary?.total_sensors}</span>
              <span className="text-[10px] uppercase font-mono text-slate-400">Total Nodes</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
            <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-900/50">
              <span className="text-[10px] text-emerald-400 font-bold block">ONLINE</span>
              <span className="text-sm font-mono font-bold text-white">{summary?.active_sensors}</span>
            </div>
            <div className="p-1.5 rounded bg-amber-950/40 border border-amber-900/50">
              <span className="text-[10px] text-amber-400 font-bold block">WARNING</span>
              <span className="text-sm font-mono font-bold text-white">{summary?.warning_sensors}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">OFFLINE</span>
              <span className="text-sm font-mono font-bold text-white">{summary?.offline_sensors}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Traffic Overview Table */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Junction Traffic Telemetry
              </h3>
            </div>
            <p className="text-xs text-slate-400">Real-time vehicle density, flow rate, and congestion indices</p>
          </div>
          <button
            onClick={() => onNavigate('live-traffic')}
            className="btn btn-secondary btn-sm flex items-center gap-1 text-cyan-400"
          >
            <span>Live Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Junction / Location</th>
                <th>District / Area</th>
                <th>Flow (Veh/min)</th>
                <th>Avg Speed</th>
                <th>Density Index</th>
                <th>Congestion Status</th>
                <th>Sensor Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {liveJunctions.slice(0, 5).map((loc) => (
                <tr key={loc.location_id}>
                  <td>
                    <div className="font-semibold text-slate-200">{loc.location_name}</div>
                    <div className="text-[11px] font-mono text-cyan-400">{loc.location_code}</div>
                  </td>
                  <td className="text-slate-400 text-xs">{loc.area}</td>
                  <td>
                    <span className="font-mono font-bold text-slate-100">{loc.vehicle_count}</span>
                    <span className="text-[11px] text-slate-500 font-mono"> / {loc.capacity_vpm} vpm</span>
                  </td>
                  <td>
                    <span className={`font-mono font-bold ${loc.average_speed < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {loc.average_speed} km/h
                    </span>
                    <span className="text-[11px] text-slate-500 block">Limit: {loc.speed_limit}</span>
                  </td>
                  <td>
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                        <span>{loc.traffic_density}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            loc.traffic_density > 85 ? 'bg-rose-500' : loc.traffic_density > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, loc.traffic_density)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={loc.congestion_level} />
                  </td>
                  <td>
                    <StatusBadge status={loc.sensor_status} />
                  </td>
                  <td className="text-xs font-mono text-slate-400">
                    {new Date(loc.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Recent Alerts Feed */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Active Urgent Alerts & Dispatches
            </h3>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            All Alerts ({summary?.active_alerts}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span className="text-xs font-mono text-emerald-300">NO ACTIVE TRAFFIC ALERTS • ALL CORRIDORS CLEAR</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <StatusBadge status={alert.severity} showDot={false} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{alert.alert_type}</span>
                      <span className="text-xs text-cyan-400 font-mono">• {alert.location_name}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      Issued: {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.alert_id)}
                    className="btn btn-secondary btn-sm text-xs font-mono"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
