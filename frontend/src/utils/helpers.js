// Format date to readable format
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format hours to readable time
export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return 'N/A';
  
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  
  if (hours < 24) {
    return `${hours.toFixed(1)} hr${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
};

// Get status badge color
export const getStatusColor = (isBreach) => {
  return isBreach ? 'status-danger' : 'status-success';
};

// Get status text
export const getStatusText = (isBreach) => {
  return isBreach ? 'SLA Breach' : 'Within SLA';
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

// Format percentage
export const formatPercentage = (value) => {
  return `${value}%`;
};

// Get priority color
export const getPriorityColor = (hours, threshold) => {
  if (!threshold) return 'priority-normal';
  
  const percentage = (hours / threshold) * 100;
  
  if (percentage >= 90) return 'priority-critical';
  if (percentage >= 75) return 'priority-high';
  if (percentage >= 50) return 'priority-medium';
  return 'priority-low';
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Export data to CSV
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};