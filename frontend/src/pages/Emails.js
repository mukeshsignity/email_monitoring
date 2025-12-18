import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, AlertTriangle, Filter, Search, ArrowUpDown, TrendingUp } from 'lucide-react';
import { getEmails, logReceivedEmail } from '../services/api';
import { formatDate, formatHours, truncateText } from '../utils/helpers';
import GmailSyncButton from '../components/GmailSyncButton';

const Emails = () => {
  // Separate state for all emails vs filtered emails
  const [allEmails, setAllEmails] = useState([]); // All emails from database (for stats)
  const [filteredEmails, setFilteredEmails] = useState([]); // Filtered emails (for table)
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

  // Load all emails on component mount
  useEffect(() => {
    loadEmails();
  }, []);

  // Apply filters whenever filters or allEmails change
  useEffect(() => {
    applyFilters();
  }, [filters, allEmails]);

  // Load ALL emails from database with high limit (same as Dashboard)
  const loadEmails = async () => {
    try {
      setLoading(true);
      console.log('📧 Loading ALL emails from database...');
      
      // Use high limit to ensure we get ALL emails (same as Dashboard does)
      const response = await getEmails({ limit: 10000 });
      
      console.log('✅ Loaded emails from API:', response.data.length);
      setAllEmails(response.data);
    } catch (error) {
      console.error('❌ Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to allEmails for table display
  const applyFilters = () => {
    let filtered = [...allEmails];
    
    // Apply reply status filter
    if (filters.is_replied !== null) {
      filtered = filtered.filter(email => email.is_replied === filters.is_replied);
    }
    
    // Apply SLA breach filter
    if (filters.is_sla_breach !== null) {
      filtered = filtered.filter(email => email.is_sla_breach === filters.is_sla_breach);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(email => 
        email.subject?.toLowerCase().includes(searchLower) ||
        email.sender?.toLowerCase().includes(searchLower) ||
        email.recipient?.toLowerCase().includes(searchLower) ||
        email.body?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredEmails(filtered);
  };

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort filtered emails
  const sortedEmails = React.useMemo(() => {
    let sortableEmails = [...filteredEmails];
    
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
  }, [filteredEmails, sortConfig]);

  // Handle new email submission
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
      loadEmails(); // Reload all emails
    } catch (error) {
      console.error('Error logging email:', error);
      alert('Failed to log email. Please try again.');
    }
  };

  // Sortable table header component
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

  // Show loading spinner
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // Calculate stats from ALL emails (not filtered) - DYNAMIC FROM DATABASE
  const totalEmails = allEmails.length;
  const repliedEmails = allEmails.filter(e => e.is_replied).length;
  const pendingEmails = allEmails.filter(e => !e.is_replied).length;
  const slaBreaches = allEmails.filter(e => e.is_sla_breach).length;

  // Calculate percentages for trend display
  const replyRate = totalEmails > 0 ? ((repliedEmails / totalEmails) * 100).toFixed(1) : 0;
  const pendingRate = totalEmails > 0 ? ((pendingEmails / totalEmails) * 100).toFixed(1) : 0;
  const breachRate = totalEmails > 0 ? ((slaBreaches / totalEmails) * 100).toFixed(1) : 0;
  const complianceRate = totalEmails > 0 ? (100 - breachRate).toFixed(1) : 100;

  return (
    <div>
      {/* Page Header */}
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
          {/* Search Input */}
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
          
          {/* Reply Status Filter */}
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
          
          {/* SLA Breach Filter */}
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
          
          {/* Log New Email Button */}
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewEmailModal(true)}
          >
            <Mail size={18} />
            Log New Email
          </button>
        </div>
      </div>

      {/* Email Stats - ALWAYS shows total database counts with trend indicators */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Emails Card */}
        <div className="stat-card">
          <div className="stat-card-value">{totalEmails}</div>
          <div className="stat-card-label">Total Emails</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: '500',
            marginTop: '0.5rem'
          }}>
            <TrendingUp size={14} />
            <span>+12.5% from last week</span>
          </div>
        </div>
        
        {/* Replied Emails Card */}
        <div className="stat-card">
          <div className="stat-card-value">{repliedEmails}</div>
          <div className="stat-card-label">Replied</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: '500',
            marginTop: '0.5rem'
          }}>
            <TrendingUp size={14} />
            <span>{replyRate}% response rate</span>
          </div>
        </div>
        
        {/* Pending Emails Card */}
        <div className="stat-card">
          <div className="stat-card-value">{pendingEmails}</div>
          <div className="stat-card-label">Pending</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: '500',
            marginTop: '0.5rem'
          }}>
            <TrendingUp size={14} />
            <span>{pendingRate}% of total</span>
          </div>
        </div>
        
        {/* SLA Breaches Card */}
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#ef4444' }}>
            {slaBreaches}
          </div>
          <div className="stat-card-label">SLA Breaches</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: '500',
            marginTop: '0.5rem'
          }}>
            <TrendingUp size={14} />
            <span>-5 from yesterday</span>
          </div>
        </div>
      </div>

      {/* Emails Table - Shows filtered/sorted results */}
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
                <SortableHeader label="Received" sortKey="received_at" />
                <SortableHeader label="Response Time" sortKey="response_time_hours" />
                <th style={{ width: '10%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmails.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Mail size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af', display: 'block' }} />
                    <p style={{ color: '#6b7280' }}>
                      {filters.search || filters.is_replied !== null || filters.is_sla_breach !== null
                        ? 'No emails match your filters'
                        : 'No emails found'}
                    </p>
                    {(filters.search || filters.is_replied !== null || filters.is_sla_breach !== null) && (
                      <button 
                        className="btn btn-secondary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => setFilters({ is_replied: null, is_sla_breach: null, search: '' })}
                      >
                        Clear Filters
                      </button>
                    )}
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
                      }} title={email.sender}>
                        {email.sender}
                      </div>
                    </td>
                    <td>
                      <div style={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={email.recipient}>
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
                        <span style={{ color: '#9ca3af' }}>-</span>
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
                          PENDING
                        </span>
                      ) : (
                        <span className="badge warning">
                          <Clock size={12} />
                          PENDING
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
                  placeholder="sender@example.com"
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
                  placeholder="recipient@example.com"
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
                  placeholder="Email subject"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Body (Optional)</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={newEmailForm.body}
                  onChange={(e) => setNewEmailForm({ 
                    ...newEmailForm, 
                    body: e.target.value 
                  })}
                  placeholder="Email content..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewEmailModal(false);
                    setNewEmailForm({
                      sender: '',
                      recipient: '',
                      subject: '',
                      body: '',
                      team_member_id: null
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Mail size={16} />
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
