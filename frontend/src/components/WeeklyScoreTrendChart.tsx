import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchWeeklyChartData } from '../services/apiService';

const WeeklyScoreTrendChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const chartData = await fetchWeeklyChartData();
        setData(chartData);
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div>Loading chart...</div>;
  if (!data.length) return <div className="text-red-500">No trend data available for the selected period.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Weekly KPI Score Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* Example: One line per employee, adjust as needed */}
          {Object.keys(data[0] || {}).filter(k => k !== 'week').map(key => (
            <Line key={key} type="monotone" dataKey={key} stroke="#8884d8" />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyScoreTrendChart;
