import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Building2
} from 'lucide-react';
import AutoSyncControl from '../components/AutoSyncControl';
import GmailSyncButton from '../components/GmailSyncButton';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/StatCard';
import { getDashboardStats, getSLABreaches } from '../services/api';
import { formatHours } from '../utils/helpers';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmails: 0,
    repliedEmails: 0,
    avgResponseTime: 0,
    slaBreaches: 0,
    complianceRate: 0
  });
  const [breaches, setBreaches] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const statsResponse = await getDashboardStats();
      setStats(statsResponse.data);
      
      // Load SLA breaches
      const breachesResponse = await getSLABreaches();
      const breachData = breachesResponse.data.sla_breaches || [];
      setBreaches(breachData.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const responseTimeData = [
    { day: 'Mon', hours: 2.3 },
    { day: 'Tue', hours: 1.8 },
    { day: 'Wed', hours: 2.5 },
    { day: 'Thu', hours: 1.9 },
    { day: 'Fri', hours: 2.1 },
    { day: 'Sat', hours: 3.2 },
    { day: 'Sun', hours: 2.8 }
  ];

  const departmentData = [
    { name: 'Sales', emails: 145, avgTime: 2.3 },
    { name: 'Support', emails: 289, avgTime: 1.8 },
    { name: 'Marketing', emails: 98, avgTime: 3.1 },
    { name: 'Engineering', emails: 76, avgTime: 4.2 }
  ];

  const statusData = [
    { name: 'Replied', value: stats.repliedEmails, color: '#10b981' },
    { name: 'Pending', value: stats.totalEmails - stats.repliedEmails, color: '#f59e0b' },
    { name: 'Breached', value: stats.slaBreaches, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Dashboard Overview
            </h1>
            <p style={{ color: '#6b7280' }}>
              Real-time email monitoring and SLA tracking
            </p>
          </div>
          <GmailSyncButton onSyncComplete={loadDashboardData} />
        </div>
      </div>

      {/* Auto-Sync Control */}
      <AutoSyncControl />

      {/* Stats Grid */}
      <div className="stat-grid">
        <StatCard
          title="Total Emails"
          value={stats.totalEmails}
          icon={Mail}
          iconColor="primary"
          change="+12.5% from last week"
          changeType="positive"
        />
        
        <StatCard
          title="Avg Response Time"
          value={formatHours(stats.avgResponseTime)}
          icon={Clock}
          iconColor="info"
          change="-8.2% improvement"
          changeType="positive"
        />
        
        <StatCard
          title="SLA Compliance"
          value={`${stats.complianceRate}%`}
          icon={CheckCircle}
          iconColor="success"
          change="+3.1% this month"
          changeType="positive"
        />
        
        <StatCard
          title="SLA Breaches"
          value={stats.slaBreaches}
          icon={AlertTriangle}
          iconColor="danger"
          change="-5 from yesterday"
          changeType="positive"
        />
      </div>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Response Time Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Response Time Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Avg Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Email Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Email Status Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Department Performance</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis yAxisId="left" orientation="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="emails" fill="#2563eb" name="Total Emails" />
              <Bar yAxisId="right" dataKey="avgTime" fill="#10b981" name="Avg Time (hrs)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent SLA Breaches */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent SLA Breaches</h3>
          <span className="badge danger">{breaches.length} Active</span>
        </div>
        <div className="card-body">
          {breaches.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#6b7280'
            }}>
              <CheckCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p>No SLA breaches - Great work!</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '400px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Email Subject</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Time Elapsed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {breaches.map((breach) => (
                    <tr key={breach.id}>
                      <td>{breach.subject || 'No subject'}</td>
                      <td>{breach.sender}</td>
                      <td>{breach.recipient}</td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>
                          {breach.response_time_hours 
                            ? formatHours(breach.response_time_hours)
                            : formatHours((new Date() - new Date(breach.received_at)) / (1000 * 60 * 60))
                          }
                        </span>
                      </td>
                      <td>
                        <span className="badge danger">
                          <AlertTriangle size={12} />
                          Breach
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;