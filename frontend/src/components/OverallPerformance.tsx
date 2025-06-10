
import React from 'react';
import { OverallPerformanceDataItem } from '../../types';

interface OverallPerformanceProps {
  data: OverallPerformanceDataItem[];
}

const OverallPerformance: React.FC<OverallPerformanceProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Overall Performance</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No overall performance data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Overall Performance</h2>
      <div className="space-y-6">
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="w-2/5 pr-4">
              <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{item.employee_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.team_name}</p>
            </div>
            <div className="w-3/5 flex items-center">
              <div 
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden"
                role="progressbar"
                aria-valuenow={item.performance_percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.employee_name} performance ${item.performance_percentage}%`}
              >
                <div
                  className="bg-red-500 dark:bg-red-600 h-full rounded-full flex items-center justify-center text-xs font-medium text-white transition-all duration-500 ease-out"
                  style={{ width: `${item.performance_percentage}%` }}
                >
                  {item.performance_percentage}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverallPerformance;
