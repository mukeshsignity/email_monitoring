import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,  // Add /api prefix
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== DEPARTMENTS ==========
export const getDepartments = () => api.get('/departments/');
export const getDepartment = (id) => api.get(`/departments/${id}`);
export const createDepartment = (data) => api.post('/departments/', data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// ========== TEAM MEMBERS ==========
export const getTeamMembers = (params) => api.get('/team-members/', { params });
export const getTeamMember = (id) => api.get(`/team-members/${id}`);
export const createTeamMember = (data) => api.post('/team-members/', data);
export const updateTeamMember = (id, data) => api.put(`/team-members/${id}`, data);
export const deleteTeamMember = (id) => api.delete(`/team-members/${id}`);

// ========== EMAILS ==========
export const getEmails = (params) => api.get('/emails/', { params });
export const logReceivedEmail = (data) => api.post('/emails/receive/', data);
export const logEmailReply = (data) => api.post('/emails/reply/', data);

// ========== METRICS ==========
export const getDepartmentMetrics = (departmentId = null) => {
  const params = departmentId ? { department_id: departmentId } : {};
  return api.get('/metrics/departments/', { params });
};

export const getTeamMemberMetrics = (teamMemberId = null) => {
  const params = teamMemberId ? { team_member_id: teamMemberId } : {};
  return api.get('/metrics/team-members/', { params });
};

// ========== SLA & ALERTS ==========
export const getSLABreaches = (includePending = true) => {
  return api.get('/sla/breaches/', { params: { include_pending: includePending } });
};

export const checkSLAAndSendAlerts = () => api.post('/alerts/check-sla/');

export const sendCustomAlert = (data) => api.post('/alerts/send/', data);

// ========== GMAIL SYNC ==========
export const syncGmailEmails = (limit = 10) => {
  return api.post('/emails/sync/gmail/', null, { params: { limit } });
};

// ========== AUTO-SYNC ==========
export const startAutoSync = () => api.post('/auto-sync/start/');
export const stopAutoSync = () => api.post('/auto-sync/stop/');
export const getAutoSyncStatus = () => api.get('/auto-sync/status/');
export const updateAutoSyncInterval = (intervalMinutes) => {
  return api.put('/auto-sync/interval/', null, { params: { interval_minutes: intervalMinutes } });
};

// ========== DASHBOARD (Aggregate Data) ==========
export const getDashboardStats = async () => {
  try {
    // Fetch all necessary data for dashboard
    const [emailsRes, breachesRes, deptMetricsRes] = await Promise.all([
      api.get('/emails/', { params: { limit: 1000 } }),
      api.get('/sla/breaches/'),
      api.get('/metrics/departments/')
    ]);

    const emails = emailsRes.data;
    const breaches = breachesRes.data.sla_breaches || [];
    const deptMetrics = deptMetricsRes.data;

    // Calculate overall stats
    const totalEmails = emails.length;
    const repliedEmails = emails.filter(e => e.is_replied).length;
    const slaBreaches = breaches.length;
    
    // Calculate average response time
    const repliedWithTime = emails.filter(e => e.response_time_hours !== null);
    const avgResponseTime = repliedWithTime.length > 0
      ? repliedWithTime.reduce((sum, e) => sum + e.response_time_hours, 0) / repliedWithTime.length
      : 0;

    // Calculate compliance rate
    const clientEmails = emails.filter(e => e.is_client_email);
    const complianceRate = clientEmails.length > 0
      ? ((clientEmails.length - slaBreaches) / clientEmails.length * 100).toFixed(1)
      : 100;

    return {
      data: {
        totalEmails,
        repliedEmails,
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        slaBreaches,
        complianceRate: parseFloat(complianceRate)
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getOverallMetrics = async () => {
  try {
    const [emailsRes, deptMetricsRes] = await Promise.all([
      api.get('/emails/'),
      api.get('/metrics/departments/')
    ]);

    const emails = emailsRes.data;
    const repliedWithTime = emails.filter(e => e.response_time_hours !== null);
    
    const avgResponseTime = repliedWithTime.length > 0
      ? repliedWithTime.reduce((sum, e) => sum + e.response_time_hours, 0) / repliedWithTime.length
      : 0;

    const slaBreaches = emails.filter(e => e.is_sla_breach).length;
    const complianceRate = emails.length > 0
      ? ((emails.length - slaBreaches) / emails.length * 100).toFixed(1)
      : 100;

    return {
      data: {
        total_emails: emails.length,
        average_response_time: parseFloat(avgResponseTime.toFixed(2)),
        sla_breaches: slaBreaches,
        sla_compliance_rate: parseFloat(complianceRate)
      }
    };
  } catch (error) {
    console.error('Error fetching overall metrics:', error);
    throw error;
  }
};

export default api;