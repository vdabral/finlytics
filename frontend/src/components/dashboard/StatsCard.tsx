import React from 'react';
import { Link } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  isGainLoss?: boolean;
  link?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  isGainLoss = false,
  link,
  onClick,
}) => {const isPositive = change >= 0;
  const changeColor = isGainLoss 
    ? (isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')
    : 'text-primary-600 dark:text-primary-400';
  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
          <span className="text-2xl">{icon}</span>
        </div>
        {change !== 0 && (
          <div className={`flex items-center ${changeColor}`}>
            <svg
              className={`w-4 h-4 mr-1 ${isPositive ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 10l5 5 5-5"
              />
            </svg>
            <span className="text-sm font-medium">
              {Math.abs(change) < 1 ? change.toFixed(2) : change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{changeLabel}</div>
      </div>
    </>
  );

  const baseClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200";
  const interactiveClasses = (link || onClick) ? "hover:shadow-lg hover:scale-105 cursor-pointer" : "hover:shadow-md";

  if (link) {
    return (
      <Link to={link} className={`${baseClasses} ${interactiveClasses} block`}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div 
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses}`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} hover:shadow-md`}>
      {cardContent}
    </div>
  );
};

export default StatsCard;
