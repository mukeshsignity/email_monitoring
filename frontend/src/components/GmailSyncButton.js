import React, { useState } from 'react';
import { Mail, Download, Loader } from 'lucide-react';
import { syncGmailEmails } from '../services/api';

const GmailSyncButton = ({ onSyncComplete }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncLimit, setSyncLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setShowModal(false);
      
      const response = await syncGmailEmails(syncLimit);
      const result = response.data;
      
      setLastResult(result);
      
      // Show results
      const message = `
📊 Gmail Sync Complete!

✅ Members Synced: ${result.members_synced}
📬 Emails Found: ${result.emails_found}
📝 New Emails Processed: ${result.emails_processed}
${result.errors.length > 0 ? `\n⚠️ Errors: ${result.errors.length}` : ''}
      `.trim();
      
      alert(message);
      
      if (onSyncComplete) {
        onSyncComplete();
      }
      
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      alert('❌ Failed to sync Gmail emails. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setShowModal(true)}
        disabled={syncing}
      >
        {syncing ? (
          <>
            <Loader size={18} className="spinning" />
            Syncing...
          </>
        ) : (
          <>
            <Download size={18} />
            Sync Gmail
          </>
        )}
      </button>

      {/* Sync Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mail size={24} color="#2563eb" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  Sync Gmail Emails
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Fetch unread emails from all team members
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Number of emails to fetch per member
              </label>
              <input
                type="number"
                className="form-input"
                value={syncLimit}
                onChange={(e) => setSyncLimit(parseInt(e.target.value))}
                min="1"
                max="50"
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                This will fetch the most recent unread emails from each team member's Gmail inbox
              </p>
            </div>

            <div style={{ 
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                ⚠️ <strong>Note:</strong> Make sure team members have their Gmail App Passwords configured in the system.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSync}
              >
                <Download size={18} />
                Start Sync
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
};

export default GmailSyncButton;