import React from 'react';
import { Card } from './index';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendType = 'neutral',
  className = '',
  ...props 
}) => {
  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trendType) {
      case 'positive':
        return '↗';
      case 'negative':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-300 ${className}`} {...props}>
      <Card.Content className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-light">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
                <span className="mr-1">{getTrendIcon()}</span>
                <span>{trendValue}</span>
                {trend && <span className="ml-1">vs mês anterior</span>}
              </div>
            )}
          </div>
          
          {Icon && (
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

export default StatCard;
