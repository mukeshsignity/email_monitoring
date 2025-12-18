import axios from 'axios';

// ========== API BASE URL CONFIGURATION ==========
// For Create React App, use process.env.REACT_APP_*
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     (process.env.NODE_ENV === 'development' 
                       ? 'http://localhost:8000/api' 
                       : 'https://signity-email-monitoring.onrender.com/api');

console.log('🚀 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ ${error.config.method.toUpperCase()} ${error.config.url} - ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

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
export const getEmail = (id) => api.get(`/emails/${id}`);
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

// ========== ADMIN ==========
export const getAdminStats = () => api.get('/admin/database-stats');
export const initSampleData = (secret) => api.post(`/admin/init-sample-data?secret=${secret}`);

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
        complianceRate: parseFloat(complianceRate),
        departmentMetrics: deptMetrics
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
        sla_compliance_rate: parseFloat(complianceRate),
        department_metrics: deptMetricsRes.data
      }
    };
  } catch (error) {
    console.error('Error fetching overall metrics:', error);
    throw error;
  }
};

export default api;
