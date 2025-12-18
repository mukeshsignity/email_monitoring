import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Mail, 
  AlertCircle, 
  BarChart3,
  Settings as SettingsIcon
} from 'lucide-react';

const Sidebar = ({ activePage, onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'departments', icon: Building2, label: 'Departments' },
    { id: 'team-members', icon: Users, label: 'Team Members' },
    { id: 'emails', icon: Mail, label: 'Emails' },
    { id: 'alerts', icon: AlertCircle, label: 'Alerts' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '700',
          color: '#2563eb'
        }}>
          Email Monitor
        </h2>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280',
          marginTop: '0.25rem'
        }}>
          Performance Dashboard
        </p>
      </div>
      
      <nav>
        <ul className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="sidebar-nav-item">
                <a
                  href="#"
                  className={`sidebar-nav-link ${activePage === item.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.id);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;