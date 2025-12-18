import React, { useState, useEffect } from 'react';
import { Download, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getOverallMetrics, getDepartments } from '../services/api';
import { exportToCSV } from '../utils/helpers';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [dateRange, setDateRange] = useState('week'); // week, month, quarter

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [metricsRes, deptsRes] = await Promise.all([
        getOverallMetrics(),
        getDepartments()
      ]);
      
      setMetrics(metricsRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = departments.map(dept => ({
      Department: dept.name,
      'SLA Threshold': `${dept.sla_threshold_hours}h`,
      'Total Emails': metrics?.total_emails || 0,
      'Avg Response Time': `${metrics?.average_response_time || 0}h`,
      'SLA Compliance': `${metrics?.sla_compliance_rate || 0}%`,
      'Breaches': metrics?.sla_breaches || 0
    }));
    
    exportToCSV(exportData, `email-monitoring-report-${Date.now()}.csv`);
  };

  // Sample trend data
  const trendData = [
    { week: 'Week 1', emails: 145, avgTime: 2.3, compliance: 92 },
    { week: 'Week 2', emails: 178, avgTime: 2.1, compliance: 94 },
    { week: 'Week 3', emails: 156, avgTime: 2.5, compliance: 89 },
    { week: 'Week 4', emails: 189, avgTime: 1.9, compliance: 96 }
  ];

  const departmentComparison = departments.map(dept => ({
    name: dept.name,
    threshold: dept.sla_threshold_hours,
    emails: Math.floor(Math.random() * 200) + 50,
    compliance: Math.floor(Math.random() * 20) + 80
  }));

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
            Performance Reports
          </h1>
          <p style={{ color: '#6b7280' }}>
            Comprehensive analytics and insights
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            className="form-input"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="stat-card">
          <div className="stat-card-icon primary">
            <BarChart3 />
          </div>
          <div className="stat-card-value">{metrics?.total_emails || 0}</div>
          <div className="stat-card-label">Total Emails Processed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon success">
            <TrendingUp />
          </div>
          <div className="stat-card-value">
            {metrics?.average_response_time?.toFixed(1) || 0}h
          </div>
          <div className="stat-card-label">Avg Response Time</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon info">
            <Calendar />
          </div>
          <div className="stat-card-value">
            {metrics?.sla_compliance_rate || 0}%
          </div>
          <div className="stat-card-label">Overall SLA Compliance</div>
        </div>
      </div>

      {/* Email Volume Trend */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Email Volume & Response Time Trend</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="emails" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Email Volume"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgTime" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Avg Response (hrs)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Comparison */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Department Performance Comparison</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departmentComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="emails" 
                fill="#2563eb" 
                name="Total Emails"
              />
              <Bar 
                yAxisId="right"
                dataKey="compliance" 
                fill="#10b981" 
                name="Compliance %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">SLA Compliance by Department</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>SLA Threshold</th>
                  <th>Total Emails</th>
                  <th>Compliance Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {departmentComparison.map((dept, index) => (
                  <tr key={index}>
                    <td><strong>{dept.name}</strong></td>
                    <td>{dept.threshold} hours</td>
                    <td>{dept.emails}</td>
                    <td>
                      <span style={{ 
                        fontWeight: '600',
                        color: dept.compliance >= 90 ? '#10b981' : '#ef4444'
                      }}>
                        {dept.compliance}%
                      </span>
                    </td>
                    <td>
                      {dept.compliance >= 95 && (
                        <span className="badge success">Excellent</span>
                      )}
                      {dept.compliance >= 85 && dept.compliance < 95 && (
                        <span className="badge info">Good</span>
                      )}
                      {dept.compliance < 85 && (
                        <span className="badge danger">Needs Improvement</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;