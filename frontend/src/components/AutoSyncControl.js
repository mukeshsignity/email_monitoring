import React, { useState, useEffect } from 'react';
import { Play, Square, RefreshCw, Clock, Settings } from 'lucide-react';
import { 
  startAutoSync, 
  stopAutoSync, 
  getAutoSyncStatus, 
  updateAutoSyncInterval 
} from '../services/api';

const AutoSyncControl = () => {
  const [status, setStatus] = useState({
    is_running: false,
    interval_minutes: 5,
    enabled_in_settings: false
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newInterval, setNewInterval] = useState(5);

  useEffect(() => {
    loadStatus();
    // Refresh status every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await getAutoSyncStatus();
      setStatus(response.data);
      setNewInterval(response.data.interval_minutes);
    } catch (error) {
      console.error('Error loading auto-sync status:', error);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      await startAutoSync();
      await loadStatus();
      alert('✅ Auto-sync started!');
    } catch (error) {
      console.error('Error starting auto-sync:', error);
      alert('❌ Failed to start auto-sync');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      await stopAutoSync();
      await loadStatus();
      alert('🛑 Auto-sync stopped!');
    } catch (error) {
      console.error('Error stopping auto-sync:', error);
      alert('❌ Failed to stop auto-sync');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInterval = async () => {
    try {
      setLoading(true);
      await updateAutoSyncInterval(newInterval);
      await loadStatus();
      setShowSettings(false);
      alert(`✅ Interval updated to ${newInterval} minute(s)`);
    } catch (error) {
      console.error('Error updating interval:', error);
      alert('❌ Failed to update interval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ 
      background: status.is_running ? '#f0fdf4' : '#fef3c7',
      borderColor: status.is_running ? '#10b981' : '#f59e0b'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: status.is_running ? '#10b981' : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {status.is_running ? (
              <RefreshCw size={24} className={status.is_running ? 'spinning' : ''} />
            ) : (
              <Clock size={24} />
            )}
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              Auto Email Sync
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {status.is_running ? (
                <>
                  <span style={{ 
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    marginRight: '0.5rem',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}></span>
                  Running - Syncs every {status.interval_minutes} minute(s)
                </>
              ) : (
                'Stopped - Click start to enable automatic email syncing'
              )}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
            disabled={loading}
          >
            <Settings size={18} />
          </button>
          
          {status.is_running ? (
            <button
              className="btn btn-danger"
              onClick={handleStop}
              disabled={loading}
            >
              <Square size={18} />
              Stop
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleStart}
              disabled={loading}
            >
              <Play size={18} />
              Start
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Sync Interval Settings
          </h4>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Interval (minutes)</label>
              <input
                type="number"
                className="form-input"
                value={newInterval}
                onChange={(e) => setNewInterval(parseInt(e.target.value))}
                min="1"
                max="60"
              />
            </div>
            
            <button
              className="btn btn-primary"
              onClick={handleUpdateInterval}
              disabled={loading || newInterval === status.interval_minutes}
              style={{ marginTop: '1.5rem' }}
            >
              Update
            </button>
          </div>
          
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            ⚠️ Updating the interval will restart auto-sync if it's currently running
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .spinning {
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AutoSyncControl;