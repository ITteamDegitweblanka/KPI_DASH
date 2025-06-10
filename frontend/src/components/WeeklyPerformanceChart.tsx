

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeeklyChartDataPoint } from '../../types';

interface WeeklyPerformanceChartProps {
  data: WeeklyChartDataPoint[];
}

const WeeklyPerformanceChart: React.FC<WeeklyPerformanceChartProps> = ({ data }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-96"> {/* Increased height slightly */}
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Weekly Performance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 10 }}> {/* Adjusted margins */}
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#4A5568" : "#e0e0e0"} /> {/* gray-600 for dark */}
          <XAxis dataKey="name" tick={{ fontSize: 14, fill: isDarkMode ? '#A0AEC0' : '#6b7280' }} /> {/* gray-400 for dark text */}
          <YAxis tick={{ fontSize: 14, fill: isDarkMode ? '#A0AEC0' : '#6b7280' }} />
          <Tooltip
            cursor={{ fill: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }}
            contentStyle={{ 
                backgroundColor: isDarkMode ? '#2D3748' : 'white',  /* gray-800 for dark */
                borderRadius: '0.5rem', 
                borderColor: isDarkMode ? '#4A5568' : '#e5e7eb', /* gray-600 for dark */
                fontSize: '0.875rem' 
            }}
            itemStyle={{ color: isDarkMode ? '#E2E8F0' : '#1F2937' }} /* gray-200 for dark text */
            labelStyle={{ color: isDarkMode ? '#FC8181' : '#ef4444', fontWeight: 'bold', fontSize: '1rem' }} /* red-400 for dark */
          />
          <Legend wrapperStyle={{ fontSize: '1rem', paddingTop: '15px', color: isDarkMode ? '#CBD5E0' : '#374151' }} /> {/* gray-300 for dark */}
          <Bar dataKey="performance" fill={isDarkMode ? "#FC8181" : "#ef4444"} radius={[4, 4, 0, 0]} barSize={35} name="Progress"/> {/* red-400 for dark */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyPerformanceChart;
