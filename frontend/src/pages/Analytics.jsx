import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Clock, AlertTriangle, MapPin, Gauge, 
  Layers, ArrowUpRight, Zap, RefreshCw, Calendar
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner text="Computing Multi-Variate Traffic Analytics & SQL Aggregates..." />;
  }

  const kpis = data?.kpis || {};

  // 1. 24h Hourly Volume & Speed Line Chart
  const hourlyLabels = data?.hourly_time_series?.map(h => h.hour) || [];
  const hourlyVolume = data?.hourly_time_series?.map(h => h.vehicles) || [];
  const hourlySpeed = data?.hourly_time_series?.map(h => h.speed) || [];

  const timeSeriesChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Hourly Vehicle Volume (veh/hr)',
        data: hourlyVolume,
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: 'Average Speed (km/h)',
        data: hourlySpeed,
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  // 2. Junction Comparison Bar Chart
  const junctionNames = data?.junction_comparison?.map(j => j.name) || [];
  const junctionVolumes = data?.junction_comparison?.map(j => j.volume) || [];
  const junctionSpeeds = data?.junction_comparison?.map(j => j.speed) || [];

  const junctionChartData = {
    labels: junctionNames,
    datasets: [
      {
        label: 'Total Volume (24h)',
        data: junctionVolumes,
        backgroundColor: 'rgba(6, 182, 212, 0.75)',
        borderColor: '#06B6D4',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  // 3. 7-Day Trend Bar Chart
  const dailyLabels = data?.daily_trends?.map(d => d.date) || [];
  const dailyVolumes = data?.daily_trends?.map(d => d.vehicles) || [];

  const dailyTrendData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Daily Vehicle Flow',
        data: dailyVolumes,
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#3B82F6',
        borderRadius: 6,
      }
    ]
  };

  // 4. Congestion Distribution Doughnut
  const dist = data?.congestion_distribution || {};
  const distributionData = {
    labels: ['Low Flow', 'Moderate', 'High Congestion', 'Critical Gridlock'],
    datasets: [
      {
        data: [dist.LOW || 0, dist.MODERATE || 0, dist.HIGH || 0, dist.CRITICAL || 0],
        backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
        borderColor: '#0F172A',
        borderWidth: 2,
      }
    ]
  };

  const darkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono', size: 10 } }
      }
    }
  };

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Traffic Pattern Analytics & Intelligence</h1>
          <p className="text-xs text-slate-400">
            Historical relational database queries, peak hour identification, and corridor performance analysis.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{refreshing ? 'Calculating...' : 'Recalculate Metrics'}</span>
        </button>
      </div>

      {/* 6 Key Statistical KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="glass-card p-4">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
            PEAK TRAFFIC TIME
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">{kpis.peak_traffic_time}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Maximum urban influx</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
            HIGHEST TRAFFIC CORRIDOR
          </span>
          <div className="text-sm font-bold text-slate-100 mt-1 truncate" title={kpis.highest_traffic_location}>
            {kpis.highest_traffic_location}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Top cumulative volume</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
            AVG VEHICLES / HOUR
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {kpis.average_vehicles_per_hour?.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Hourly network average</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
            NETWORK AVG SPEED
          </span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {kpis.average_speed_kmh} <span className="text-xs text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">City-wide velocity</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold block">
            MOST CONGESTED
          </span>
          <div className="text-sm font-bold text-rose-200 mt-1 truncate" title={kpis.most_congested_junction}>
            {kpis.most_congested_junction}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Frequent bottleneck node</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block">
            CONGESTION EVENTS
          </span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {kpis.congestion_events_count}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Logged severe delays</span>
        </div>
      </div>

      {/* Row 1 Charts: 24h Time Series & Congestion Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              24-Hour Diurnal Volume & Speed Dynamics
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated hourly traffic flow showing rush-hour peaks vs average velocity
            </p>
          </div>
          <div className="h-72 w-full">
            <Line
              data={timeSeriesChartData}
              options={{
                ...darkOptions,
                scales: {
                  ...darkOptions.scales,
                  y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(148, 163, 184, 0.08)' },
                    ticks: { color: '#06B6D4', font: { family: 'JetBrains Mono', size: 10 } }
                  },
                  y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#10B981', font: { family: 'JetBrains Mono', size: 10 } }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-1">
              Congestion Classification Share
            </h3>
            <p className="text-xs text-slate-400">Distribution of historical sensor readings by severity index</p>
          </div>

          <div className="h-56 flex items-center justify-center relative my-2">
            <Doughnut
              data={distributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94A3B8', font: { size: 10 } }
                  }
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">OPTIMAL FLOW</span>
              <span className="text-emerald-400 font-bold">{dist.LOW || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CRITICAL GRIDLOCK</span>
              <span className="text-rose-400 font-bold">{dist.CRITICAL || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Traffic Volume by Junction & 7-Day Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Volume Distribution Across Key Junctions
            </h3>
            <p className="text-xs text-slate-400">Comparative 24h cumulative vehicles detected per location</p>
          </div>
          <div className="h-64 w-full">
            <Bar data={junctionChartData} options={darkOptions} />
          </div>
        </div>

        <div className="glass-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              7-Day Weekly Mobility Trends
            </h3>
            <p className="text-xs text-slate-400">Day-over-day city-wide traffic volume fluctuations</p>
          </div>
          <div className="h-64 w-full">
            <Bar data={dailyTrendData} options={darkOptions} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
