import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Mail, CheckCircle, XCircle } from 'lucide-react';
import { 
  getTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember,
  getDepartments,
  getTeamMemberMetrics
} from '../services/api';
import { formatHours } from '../utils/helpers';

const TeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department_id: '',
    app_password: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [membersRes, deptsRes] = await Promise.all([
        getTeamMembers(),
        getDepartments()
      ]);
      
      // Load metrics for each member
      const membersWithMetrics = await Promise.all(
        membersRes.data.map(async (member) => {
          try {
            const metricsRes = await getTeamMemberMetrics(member.id);
            return { ...member, metrics: metricsRes.data };
          } catch {
            return { ...member, metrics: null };
          }
        })
      );
      
      setMembers(membersWithMetrics);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        department_id: parseInt(formData.department_id)
      };
      
      if (editingMember) {
        await updateTeamMember(editingMember.id, data);
      } else {
        await createTeamMember(data);
      }
      
      setShowModal(false);
      setEditingMember(null);
      setFormData({ name: '', email: '', department_id: '', is_active: true });
      loadData();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save team member');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      department_id: member.department_id,
      app_password: member.app_password || '',
      is_active: member.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      await deleteTeamMember(id);
      loadData();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete team member');
    }
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
            Team Members
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage team members and track their performance
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingMember(null);
            setFormData({ name: '', email: '', department_id: '', is_active: true });
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {/* Members Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            All Team Members ({members.length})
          </h3>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Name</th>
                <th style={{ width: '20%' }}>Email</th>
                <th style={{ width: '15%' }}>Department</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '10%' }}>Total Emails</th>
                <th style={{ width: '12%' }}>Avg Response</th>
                <th style={{ width: '10%' }}>Compliance</th>
                <th style={{ width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const dept = departments.find(d => d.id === member.department_id);
                return (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={18} color="#6b7280" />
                        <strong>{member.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} color="#6b7280" />
                        {member.email}
                      </div>
                    </td>
                    <td>{dept?.name || 'N/A'}</td>
                    <td>
                      {member.is_active ? (
                        <span className="badge success">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="badge" style={{ 
                          background: 'rgba(107, 114, 128, 0.1)',
                          color: '#6b7280'
                        }}>
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{member.metrics?.total_emails || 0}</strong>
                    </td>
                    <td>
                      {member.metrics ? 
                        formatHours(member.metrics.average_response_time) : 
                        'N/A'
                      }
                    </td>
                    <td>
                      {member.metrics && (
                        <span style={{ 
                          fontWeight: '600',
                          color: member.metrics.sla_compliance_rate >= 90 ? 
                            '#10b981' : '#ef4444'
                        }}>
                          {member.metrics.sla_compliance_rate}%
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleEdit(member)}
                          style={{ padding: '0.5rem' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleDelete(member.id)}
                          style={{ padding: '0.5rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Use Gmail address for email sync integration
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Gmail App Password (Optional)</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.app_password}
                  onChange={(e) => setFormData({ ...formData, app_password: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Required for Gmail sync. Generate at: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Google App Passwords</a>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    department_id: e.target.value 
                  })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      is_active: e.target.checked 
                    })}
                  />
                  <span className="form-label" style={{ marginBottom: 0 }}>Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;