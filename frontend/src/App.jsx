import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import { LoadingSpinner } from './components/common/Modal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveTraffic from './pages/LiveTraffic';
import Sensors from './pages/Sensors';
import Analytics from './pages/Analytics';
import TrafficMap from './pages/TrafficMap';
import Records from './pages/Records';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Employees from './pages/Employees';

const MainLayout = () => {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner text="Initializing Traffic Police Terminal Environment..." />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'live-traffic':
        return <LiveTraffic />;
      case 'sensors':
        return <Sensors />;
      case 'analytics':
        return <Analytics />;
      case 'traffic-map':
        return <TrafficMap />;
      case 'records':
        return <Records />;
      case 'alerts':
        return <Alerts />;
      case 'settings':
        return <Settings />;
      case 'employees':
        return isAdmin ? <Employees /> : <Dashboard onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-content">
        <Navbar onNavigateAlerts={() => setCurrentPage('alerts')} />
        <main className="flex-1 overflow-y-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
