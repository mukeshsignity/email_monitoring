import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import TeamMembers from './pages/TeamMembers';
import Emails from './pages/Emails';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './styles/App.css';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'departments':
        return <Departments />;
      case 'team-members':
        return <TeamMembers />;
      case 'emails':
        return <Emails />;
      case 'alerts':
        return <Alerts />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <div className="main-content">
        <Navbar unreadAlerts={3} />
        
        <div style={{ padding: '2rem 3rem' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;