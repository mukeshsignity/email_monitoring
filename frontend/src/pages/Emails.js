import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, AlertTriangle, Filter, Search, ArrowUpDown } from 'lucide-react';
import { getEmails, logReceivedEmail } from '../services/api';
import { formatDate, formatHours, truncateText } from '../utils/helpers';
import GmailSyncButton from '../components/GmailSyncButton';

const Emails = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    is_replied: null,
    is_sla_breach: null,
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'received_at', direction: 'desc' });
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);
  const [newEmailForm, setNewEmailForm] = useState({
    sender: '',
    recipient: '',
    subject: '',
    body: '',
    team_member_id: null
  });

  useEffect(() => {
    loadEmails();
  }, [filters]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.is_replied !== null) params.is_replied = filters.is_replied;
      if (filters.is_sla_breach !== null) params.is_sla_breach = filters.is_sla_breach;
      
      const response = await getEmails(params);
      let emailsData = response.data;
      
      // Apply search filter
      if (filters.search) {
        emailsData = emailsData.filter(email => 
          email.subject?.toLowerCase().includes(filters.search.toLowerCase()) ||
          email.sender?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setEmails(emailsData);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmails = React.useMemo(() => {
    let sortableEmails = [...emails];
    
    if (sortConfig.key) {
      sortableEmails.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableEmails;
  }, [emails, sortConfig]);

  const handleNewEmail = async (e) => {
    e.preventDefault();
    try {
      await logReceivedEmail(newEmailForm);
      setShowNewEmailModal(false);
      setNewEmailForm({
        sender: '',
        recipient: '',
        subject: '',
        body: '',
        team_member_id: null
      });
      loadEmails();
    } catch (error) {
      console.error('Error logging email:', error);
      alert('Failed to log email');
    }
  };

  const SortableHeader = ({ label, sortKey }) => (
    <th 
      onClick={() => handleSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {label}
        <ArrowUpDown 
          size={14} 
          style={{ 
            opacity: sortConfig.key === sortKey ? 1 : 0.3,
            transform: sortConfig.key === sortKey && sortConfig.direction === 'desc' 
              ? 'rotate(180deg)' 
              : 'rotate(0deg)',
            transition: 'all 0.2s'
          }} 
        />
      </div>
    </th>
  );

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
            Email Tracking
          </h1>
          <p style={{ color: '#6b7280' }}>
            Monitor all incoming and outgoing emails
          </p>
        </div>
        <GmailSyncButton onSyncComplete={loadEmails} />
      </div>

      {/* Filters and Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <Search size={18} style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search emails..."
              className="form-input"
              style={{ paddingLeft: '35px' }}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <select
            className="form-input"
            value={filters.is_replied === null ? '' : filters.is_replied}
            onChange={(e) => setFilters({ 
              ...filters, 
              is_replied: e.target.value === '' ? null : e.target.value === 'true'
            })}
            style={{ width: 'auto' }}
          >
            <option value="">All Status</option>
            <option value="true">Replied</option>
            <option value="false">Pending</option>
          </select>
          
          <select
            className="form-input"
            value={filters.is_sla_breach === null ? '' : filters.is_sla_breach}
            onChange={(e) => setFilters({ 
              ...filters, 
              is_sla_breach: e.target.value === '' ? null : e.target.value === 'true'
            })}
            style={{ width: 'auto' }}
          >
            <option value="">All SLA</option>
            <option value="false">Within SLA</option>
            <option value="true">Breached</option>
          </select>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewEmailModal(true)}
          >
            <Mail size={18} />
            Log New Email
          </button>
        </div>
      </div>

      {/* Email Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="stat-card">
          <div className="stat-card-value">{sortedEmails.length}</div>
          <div className="stat-card-label">Total Emails</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-value">
            {sortedEmails.filter(e => e.is_replied).length}
          </div>
          <div className="stat-card-label">Replied</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-value">
            {sortedEmails.filter(e => !e.is_replied).length}
          </div>
          <div className="stat-card-label">Pending</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#ef4444' }}>
            {sortedEmails.filter(e => e.is_sla_breach).length}
          </div>
          <div className="stat-card-label">SLA Breaches</div>
        </div>
      </div>

      {/* Emails Table with Sticky Header and Scrollbar */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            All Emails ({sortedEmails.length})
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Click column headers to sort
          </div>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <SortableHeader label="Subject" sortKey="subject" />
                <th style={{ width: '18%' }}>From</th>
                <th style={{ width: '18%' }}>To</th>
                <th style={{ width: '15%' }}>Received</th>
                <th style={{ width: '12%' }}>Response Time</th>
                <th style={{ width: '10%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmails.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Mail size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af', display: 'block' }} />
                    <p style={{ color: '#6b7280' }}>No emails found</p>
                  </td>
                </tr>
              ) : (
                sortedEmails.map((email) => (
                  <tr key={email.id}>
                    <td>
                      <div>
                        <strong>{truncateText(email.subject || 'No subject', 40)}</strong>
                        {email.body && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            {truncateText(email.body, 50)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {email.sender}
                      </div>
                    </td>
                    <td>
                      <div style={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {email.recipient}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formatDate(email.received_at)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {email.response_time_hours !== null ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem'
                        }}>
                          <Clock size={14} color="#6b7280" />
                          {formatHours(email.response_time_hours)}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      {email.is_replied ? (
                        <span className="badge success">
                          <CheckCircle size={12} />
                          Replied
                        </span>
                      ) : email.is_sla_breach ? (
                        <span className="badge danger">
                          <AlertTriangle size={12} />
                          Breach
                        </span>
                      ) : (
                        <span className="badge warning">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Email Modal */}
      {showNewEmailModal && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
              Log New Email
            </h2>

            <form onSubmit={handleNewEmail}>
              <div className="form-group">
                <label className="form-label">From (Sender)</label>
                <input
                  type="email"
                  className="form-input"
                  value={newEmailForm.sender}
                  onChange={(e) => setNewEmailForm({ 
                    ...newEmailForm, 
                    sender: e.target.value 
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">To (Recipient)</label>
                <input
                  type="email"
                  className="form-input"
                  value={newEmailForm.recipient}
                  onChange={(e) => setNewEmailForm({ 
                    ...newEmailForm, 
                    recipient: e.target.value 
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmailForm.subject}
                  onChange={(e) => setNewEmailForm({ 
                    ...newEmailForm, 
                    subject: e.target.value 
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Body</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={newEmailForm.body}
                  onChange={(e) => setNewEmailForm({ 
                    ...newEmailForm, 
                    body: e.target.value 
                  })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewEmailModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emails;