import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Clock, Mail } from 'lucide-react';
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentMetrics 
} from '../services/api';
import { formatHours } from '../utils/helpers';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sla_threshold_hours: 24
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await getDepartments();
      
      // Load metrics for each department
      const deptsWithMetrics = await Promise.all(
        response.data.map(async (dept) => {
          try {
            const metricsResponse = await getDepartmentMetrics(dept.id);
            return { ...dept, metrics: metricsResponse.data };
          } catch {
            return { ...dept, metrics: null };
          }
        })
      );
      
      setDepartments(deptsWithMetrics);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, formData);
      } else {
        await createDepartment(formData);
      }
      
      setShowModal(false);
      setEditingDept(null);
      setFormData({ name: '', sla_threshold_hours: 24 });
      loadDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      sla_threshold_hours: dept.sla_threshold_hours
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
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
            Departments
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage departments and their SLA thresholds
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: '', sla_threshold_hours: 24 });
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {departments.map((dept) => (
          <div key={dept.id} className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={24} color="#2563eb" />
                <h3 className="card-title">{dept.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleEdit(dept)}
                  style={{ padding: '0.5rem' }}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(dept.id)}
                  style={{ padding: '0.5rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="card-body">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#f3f4f6',
                borderRadius: '0.5rem'
              }}>
                <Clock size={18} color="#6b7280" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    SLA Threshold
                  </div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                    {dept.sla_threshold_hours} hours
                  </div>
                </div>
              </div>

              {dept.metrics && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Total Emails
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {dept.metrics.total_emails}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Avg Response
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {formatHours(dept.metrics.average_response_time)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Compliance
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      color: dept.metrics.sla_compliance_rate >= 90 ? '#10b981' : '#ef4444'
                    }}>
                      {dept.metrics.sla_compliance_rate}%
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Breaches
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      color: '#ef4444'
                    }}>
                      {dept.metrics.sla_breaches}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
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
              {editingDept ? 'Edit Department' : 'Add Department'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SLA Threshold (hours)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.sla_threshold_hours}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    sla_threshold_hours: parseInt(e.target.value) 
                  })}
                  required
                  min="1"
                />
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
                  {editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;