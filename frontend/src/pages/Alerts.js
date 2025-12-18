import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Bell, RefreshCw } from 'lucide-react';
import { getSLABreaches, checkSLAAndSendAlerts } from '../services/api';
import { formatDate, formatHours } from '../utils/helpers';

const Alerts = () => {
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadBreaches();
  }, []);

  const loadBreaches = async () => {
    try {
      setLoading(true);
      const response = await getSLABreaches(true);
      const breachData = response.data.sla_breaches || [];
      setBreaches(breachData);
    } catch (error) {
      console.error('Error loading SLA breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndAlert = async () => {
    try {
      setChecking(true);
      const response = await checkSLAAndSendAlerts();
      alert(`✅ ${response.data.alerts_sent} alert(s) sent successfully!`);
      loadBreaches();
    } catch (error) {
      console.error('Error checking SLA:', error);
      alert('❌ Failed to check SLA breaches');
    } finally {
      setChecking(false);
    }
  };

  const stats = {
    total: breaches.length,
    critical: breaches.filter(b => b.is_sla_breach).length,
    pending: breaches.filter(b => !b.is_replied).length
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            SLA Breach Alerts
          </h1>
          <p style={{ color: '#6b7280' }}>
            Monitor and manage SLA breaches
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadBreaches}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={handleCheckAndAlert}
            disabled={checking}
          >
            <Bell size={18} />
            {checking ? 'Checking...' : 'Check & Send Alerts'}
          </button>
        </div>
      </div>

      {/* Alert Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="stat-card">
          <div className="stat-card-icon danger">
            <Bell />
          </div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Breaches</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon warning">
            <AlertTriangle />
          </div>
          <div className="stat-card-value">{stats.critical}</div>
          <div className="stat-card-label">Critical</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon info">
            <Clock />
          </div>
          <div className="stat-card-value">{stats.pending}</div>
          <div className="stat-card-label">Pending Reply</div>
        </div>
      </div>

      {/* Breaches List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">SLA Breaches ({breaches.length})</h3>
          <span className="badge danger">{breaches.length} Active</span>
        </div>
        
        <div className="card-body">
          {breaches.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#6b7280'
            }}>
              <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                No SLA Breaches
              </h3>
              <p>All emails are within SLA thresholds - Great work!</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Email Subject</th>
                    <th style={{ width: '20%' }}>From</th>
                    <th style={{ width: '20%' }}>To</th>
                    <th style={{ width: '15%' }}>Received</th>
                    <th style={{ width: '10%' }}>Response Time</th>
                    <th style={{ width: '5%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {breaches.map((breach) => (
                    <tr key={breach.id}>
                      <td>
                        <strong>{breach.subject || 'No subject'}</strong>
                        {breach.body && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            {breach.body.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td>{breach.sender}</td>
                      <td>{breach.recipient}</td>
                      <td>{formatDate(breach.received_at)}</td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>
                          {breach.response_time_hours 
                            ? formatHours(breach.response_time_hours)
                            : formatHours((new Date() - new Date(breach.received_at)) / (1000 * 60 * 60))
                          }
                        </span>
                      </td>
                      <td>
                        {breach.is_replied ? (
                          <span className="badge warning">
                            <CheckCircle size={12} />
                            Replied (Late)
                          </span>
                        ) : (
                          <span className="badge danger">
                            <AlertTriangle size={12} />
                            Breach
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Alert Instructions */}
      <div className="card" style={{ marginTop: '1.5rem', background: '#fef3c7', borderColor: '#fbbf24' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <Bell size={24} color="#f59e0b" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Alert System
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>
              Click "Check & Send Alerts" to manually trigger SLA breach detection and send email notifications.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
              Automatic alerts are scheduled to run every 30 minutes via the background scheduler.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;