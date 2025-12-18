import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'primary',
  change,
  changeType = 'neutral'
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div>
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-label">{title}</div>
        </div>
        <div className={`stat-card-icon ${iconColor}`}>
          {Icon && <Icon size={24} />}
        </div>
      </div>
      
      {change && (
        <div className={`stat-card-change ${changeType}`}>
          {changeType === 'positive' && <TrendingUp size={16} />}
          {changeType === 'negative' && <TrendingDown size={16} />}
          <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;