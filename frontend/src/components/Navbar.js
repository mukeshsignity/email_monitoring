import React from 'react';
import { Bell, User, Search } from 'lucide-react';

const Navbar = ({ unreadAlerts = 0 }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>📧 Email Monitor</span>
      </div>
      
      <div className="navbar-actions">
        <div className="search-box" style={{ position: 'relative' }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Search..."
            className="form-input"
            style={{ 
              paddingLeft: '35px',
              width: '300px',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        <button className="btn btn-secondary" style={{ position: 'relative' }}>
          <Bell size={18} />
          {unreadAlerts > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </button>
        
        <button className="btn btn-secondary">
          <User size={18} />
          <span>Admin</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;