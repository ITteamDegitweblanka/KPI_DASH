import React from 'react';
import { EmployeePerformanceData } from '../../types';
import { StarIcon } from './icons/Icons';
import { Link } from 'react-router-dom';

interface EmployeeTableProps {
  data: EmployeePerformanceData[];
  highlightPerformers?: boolean; // Optional prop to control specific performer highlights in table
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ data, highlightPerformers = true }) => {
  const tableHeaders = [
    { label: 'Employee', tooltip: 'Employee name and avatar' },
    { label: 'Title', tooltip: 'Job title' },
    { label: 'Department', tooltip: 'Department' },
    { label: 'Team', tooltip: 'Team' },
    { label: 'Target Sales', tooltip: 'Weekly sales target' },
    { label: 'Achievement (%)', tooltip: 'Percent of target achieved' },
    { label: 'Sales Score', tooltip: 'Score for sales target achievement' },
    { label: 'Cost Score', tooltip: 'Score for cost efficiency' },
    { label: 'AOV Score', tooltip: 'Score for average order value' },
    { label: 'Total Score', tooltip: 'Total KPI score' },
  ];

  // Helper: Only show scores if all required achievement fields are filled
  const isAchievementComplete = (metrics: any, team: string) => {
    if (!metrics) return false;
    const teamName = team || '';
    const requiredFields = teamName === 'Sales' ? ['weekly_sales', 'weekly_spend', 'aov']
      : teamName === 'Ads' ? ['weekly_sales', 'weekly_acos_percent', 'aov']
      : teamName === 'Website Ads' ? ['weekly_sales', 'weekly_roas', 'aov']
      : teamName === 'Portfolio Holders' ? ['weekly_sales', 'this_week_sales', 'conversion_rate']
      : [];
    return requiredFields.every(f => metrics[f] !== undefined && metrics[f] !== '' && metrics[f] !== null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg overflow-x-auto">
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">Detailed Performance Data</h3>
      <table className="w-full min-w-max text-left">
        <thead>
          <tr>
            {tableHeaders.map((header) => (
              <th key={header.label} title={header.tooltip} className="border-b border-red-200 dark:border-gray-700 p-4 text-base font-semibold text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-red-900/30">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={tableHeaders.length} className="text-center p-6 text-gray-500 dark:text-gray-400">
                No employee performance data available.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.employee.id} 
                className={`hover:bg-red-50 dark:hover:bg-gray-700/50 transition-colors duration-150 
                            ${highlightPerformers && item.isPerformerOfTheWeek ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                aria-label={item.isPerformerOfTheWeek ? `${item.employee.name}, Performer of the Week` : item.employee.name}
              >
                <td className="p-4 border-b border-red-100 dark:border-gray-700">
                  <div className="flex items-center">
                    <img 
                      src={item.employee.id ? `/api/users/${item.employee.id}/avatar` : undefined} 
                      alt={`${item.employee.name}'s avatar`} 
                      className="w-10 h-10 rounded-full mr-3 object-cover" 
                    />
                    <Link to={`/profile/${item.employee.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {item.employee.name}
                    </Link>
                    {highlightPerformers && item.isPerformerOfTheWeek && item.totalScore === 10 && (
                      <StarIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400 ml-2" title="Performer of the Week" />
                    )}
                  </div>
                </td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">{item.employee.title}
                </td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">{item.employee.department}</td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">{item.employee.team}</td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">${item.target.toLocaleString()}</td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <span className="mr-2">{item.targetAchievedPercentage}%</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${item.targetAchievedPercentage >= 100 ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`} 
                        style={{ width: `${Math.min(item.targetAchievedPercentage, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={item.targetAchievedPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Achievement: ${item.targetAchievedPercentage}%`}
                      ></div>
                    </div>
                  </div>
                </td>
                {/* New columns for scores from metrics */}
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {isAchievementComplete(item.metrics, item.metrics?.team || '') ? item.metrics?.sales_score : '-'}
                </td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {isAchievementComplete(item.metrics, item.metrics?.team || '') ? item.metrics?.cost_score : '-'}
                </td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {isAchievementComplete(item.metrics, item.metrics?.team || '') ? item.metrics?.aov_score : '-'}
                </td>
                <td className="p-4 border-b border-red-100 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {isAchievementComplete(item.metrics, item.metrics?.team || '') ? item.metrics?.total_score : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
