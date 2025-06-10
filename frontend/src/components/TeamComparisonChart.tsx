
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TeamComparisonDataPoint } from '../../types';

interface TeamComparisonChartProps {
  data: TeamComparisonDataPoint[];
}

const TEAM_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA', '#F0C419'];
// Dark mode friendly colors - these are just examples, could be refined
const DARK_TEAM_COLORS = ['#E53E3E', '#38B2AC', '#3182CE', '#D69E2E', '#00A3C4', '#B7791F'];


const TeamComparisonChart: React.FC<TeamComparisonChartProps> = ({ data }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const currentTeamColors = isDarkMode ? DARK_TEAM_COLORS : TEAM_COLORS;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-80 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No team comparison data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-80">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Team Performance Comparison</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#4A5568" : "#e0e0e0"} />
          <XAxis type="number" tick={{ fontSize: 12, fill: isDarkMode ? '#A0AEC0' : '#6b7280' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: isDarkMode ? '#A0AEC0' : '#6b7280' }} width={80} />
          <Tooltip
            cursor={{ fill: isDarkMode ? 'rgba(226, 62, 62, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}
            contentStyle={{ 
                backgroundColor: isDarkMode ? '#2D3748' : 'white', 
                borderRadius: '0.5rem', 
                borderColor: isDarkMode ? '#4A5568' : '#e5e7eb' 
            }}
            itemStyle={{ color: isDarkMode ? '#E2E8F0' : '#1F2937' }}
            labelStyle={{ color: isDarkMode ? '#CBD5E0' : '#374151', fontWeight: 'bold' }}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '14px', 
              paddingTop: '10px',
              color: isDarkMode ? '#CBD5E0' : '#374151'
            }} 
          />
          <Bar dataKey="score" name="Average Score" barSize={25}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={currentTeamColors[index % currentTeamColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamComparisonChart;
