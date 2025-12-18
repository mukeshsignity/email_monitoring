import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel 
}) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem 1rem',
      color: '#6b7280'
    }}>
      {Icon && (
        <Icon 
          size={64} 
          style={{ 
            margin: '0 auto 1.5rem',
            display: 'block',
            color: '#9ca3af',
            strokeWidth: 1.5
          }} 
        />
      )}
      
      {title && (
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          color: '#374151'
        }}>
          {title}
        </h3>
      )}
      
      {description && (
        <p style={{ 
          fontSize: '0.875rem',
          color: '#6b7280',
          marginBottom: action ? '1.5rem' : 0,
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <button 
          className="btn btn-primary"
          onClick={action}
          style={{ marginTop: '1.5rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;