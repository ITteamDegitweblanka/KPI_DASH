

import React from 'react';
import { SummaryKPI } from '../../types';

interface SummaryCardProps {
  kpi: SummaryKPI;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ kpi }) => {
  const iconElement = kpi.icon as React.ReactElement<{ className?: string }>;
  const originalClassName = iconElement.props.className || '';
  const newClassName = `${originalClassName} text-red-500 dark:text-red-400`.trim();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-5 transition-all hover:shadow-xl dark:hover:shadow-gray-700/50">
      <div className="flex-shrink-0 w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        {React.cloneElement(iconElement, { className: newClassName })}
      </div>
      <div>
        <p className="text-base text-gray-500 dark:text-gray-400 font-medium">{kpi.title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{kpi.value}</p>
        {kpi.change && (
          <p className={`text-sm font-medium ${kpi.changeType === 'positive' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {kpi.change} vs last week
          </p>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
