import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, Download, Calendar, 
  ChevronLeft, ChevronRight, RefreshCw, FileSpreadsheet, ArrowUpDown
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/Modal';
import api from '../services/api';

const Records = () => {
  const [records, setRecords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationId, setLocationId] = useState('');
  const [sensorId, setSensorId] = useState('');
  const [congestionLevel, setCongestionLevel] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchFiltersData = async () => {
    try {
      const [locRes, senRes] = await Promise.all([
        api.get('/locations'),
        api.get('/sensors')
      ]);
      setLocations(locRes.data);
      setSensors(senRes.data);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

  const fetchRecords = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchQuery || undefined,
        location_id: locationId || undefined,
        sensor_id: sensorId || undefined,
        congestion_level: congestionLevel !== 'ALL' ? congestionLevel : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const res = await api.get('/traffic/records', { params });
      setRecords(res.data.items);
      setTotalRecords(res.data.total);
      setTotalPages(res.data.total_pages);
      setCurrentPage(res.data.page);
    } catch (err) {
      console.error('Error fetching historical records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchRecords(1);
  }, [locationId, sensorId, congestionLevel, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('location_id', locationId);
      if (congestionLevel !== 'ALL') params.append('congestion_level', congestionLevel);
      params.append('limit', '500');

      window.open(`/api/traffic/export/csv?${params.toString()}`, '_blank');
    } catch (err) {
      alert('Failed to trigger CSV export.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setLocationId('');
    setSensorId('');
    setCongestionLevel('ALL');
    setStartDate('');
    setEndDate('');
    fetchRecords(1);
  };

  return (
    <div className="page-body space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Historical Traffic Records Database</h1>
          <p className="text-xs text-slate-400">
            Structured relational database archive of time-series sensor telemetry, vehicle counts, and velocity metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Multi-criteria Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search junction or sensor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-9 text-xs py-2"
            />
          </div>

          {/* Location Dropdown */}
          <div>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="form-select text-xs py-2"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l.location_id} value={l.location_id}>
                  {l.location_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sensor Dropdown */}
          <div>
            <select
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              className="form-select text-xs py-2"
            >
              <option value="">All Sensors</option>
              {sensors.map((s) => (
                <option key={s.sensor_id} value={s.sensor_id}>
                  {s.sensor_code} ({s.sensor_type})
                </option>
              ))}
            </select>
          </div>

          {/* Congestion Level */}
          <div>
            <select
              value={congestionLevel}
              onChange={(e) => setCongestionLevel(e.target.value)}
              className="form-select text-xs py-2"
            >
              <option value="ALL">All Congestion</option>
              <option value="LOW">LOW</option>
              <option value="MODERATE">MODERATE</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button type="submit" className="btn btn-primary btn-sm flex-1 text-xs">
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-secondary btn-sm text-xs"
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">From:</span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input text-xs py-1 px-2 w-auto bg-slate-900 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">To:</span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input text-xs py-1 px-2 w-auto bg-slate-900 font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchRecords(1)}
              className="btn btn-secondary btn-sm text-xs py-1"
            >
              Apply Dates
            </button>
          </div>

          <div className="text-slate-400">
            Total Archive Records: <span className="text-cyan-400 font-bold">{totalRecords.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner text="Querying MySQL Database Time-Series Records..." />
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Timestamp</th>
                <th>Sensor ID</th>
                <th>Location / Junction</th>
                <th>Vehicle Count</th>
                <th>Average Speed</th>
                <th>Density Index</th>
                <th>Congestion Status</th>
                <th>Weather</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.record_id}>
                  <td className="font-mono text-xs text-slate-400">#{r.record_id}</td>
                  <td className="font-mono text-xs text-slate-300">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-cyan-400">{r.sensor_code}</span>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-200 text-xs">{r.location_name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{r.location_area}</div>
                  </td>
                  <td className="font-mono font-bold text-slate-100 text-xs">
                    {r.vehicle_count} <span className="text-[10px] text-slate-500 font-normal">veh/min</span>
                  </td>
                  <td>
                    <span className={`font-mono font-bold text-xs ${r.average_speed < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {r.average_speed} km/h
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-300">{r.traffic_density}%</span>
                  </td>
                  <td>
                    <StatusBadge status={r.congestion_level} />
                  </td>
                  <td className="text-xs text-slate-400 font-mono">{r.weather_condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="glass-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="form-select py-1 px-2 text-xs bg-slate-900 w-20"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="ml-2">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecords(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="btn btn-secondary btn-sm p-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono font-semibold px-2 text-slate-200">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => fetchRecords(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="btn btn-secondary btn-sm p-1.5 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Records;
