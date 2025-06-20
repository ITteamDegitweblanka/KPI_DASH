import React, { useState, useEffect, useMemo } from 'react';
import WeeklyPerformanceChart from './WeeklyPerformanceChart';
import TeamComparisonChart from './TeamComparisonChart';
import OverallPerformance from './OverallPerformance';
import { fetchWeeklyChartData, fetchOverallPerformanceData } from '../services/apiService';
import { EmployeePerformanceData, WeeklyChartDataPoint, OverallPerformanceDataItem } from '../../types';

// Add prop types for DashboardPage
interface DashboardPageProps {
  employeePerformanceData: EmployeePerformanceData[];
  selectedTeam: string;
  onTeamChange: (teamOrEvent: string | React.ChangeEvent<HTMLSelectElement>) => void;
  uniqueTeamsForFilter: string[];
  addAppNotification?: (targetUserId: string, details: any) => Promise<void>;
  currentUserId?: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  employeePerformanceData,
  selectedTeam,
  onTeamChange,
  uniqueTeamsForFilter,
}) => {
  // Remove local employeePerformanceData state and use prop
  const [weeklyChartData, setWeeklyChartData] = useState<WeeklyChartDataPoint[]>([]);
  const [overallPerformanceData, setOverallPerformanceData] = useState<OverallPerformanceDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  // Use selectedTeam and onTeamChange from props
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Fetch chart and overall data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [chartData, overallData] = await Promise.all([
          fetchWeeklyChartData(),
          fetchOverallPerformanceData()
        ]);
        setWeeklyChartData(chartData);
        setOverallPerformanceData(overallData);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Unique filter options
  const uniqueWeeksForFilter = useMemo(() => Array.from(new Set(employeePerformanceData.map(e => e.week).filter((w): w is string => !!w))), [employeePerformanceData]);
  const uniqueEmployeesForFilter = useMemo(() => Array.from(new Set(employeePerformanceData.map(e => e.employee.id).filter(Boolean))).map(id => {
    const emp = employeePerformanceData.find(e => e.employee.id === id);
    return emp ? { id: emp.employee.id, name: emp.employee.name } : null;
  }).filter(Boolean), [employeePerformanceData]);

  // Filtered data
  const filteredData = useMemo(() => employeePerformanceData.filter(e =>
    (selectedTeam === 'all' || e.employee.team === selectedTeam) &&
    (selectedWeek === 'all' || e.week === selectedWeek) &&
    (selectedEmployee === 'all' || e.employee.id === selectedEmployee)
  ), [employeePerformanceData, selectedTeam, selectedWeek, selectedEmployee]);

  // Memoize team comparison data to avoid hook order issues
  const teamComparisonData = useMemo(() => {
    const teamsData: { [key: string]: { totalScoreSum: number, count: number } } = {};
    filteredData.forEach(item => {
      if (!teamsData[item.employee.team]) {
        teamsData[item.employee.team] = { totalScoreSum: 0, count: 0 };
      }
      teamsData[item.employee.team].totalScoreSum += item.totalScore;
      teamsData[item.employee.team].count += 1;
    });
    return Object.entries(teamsData).map(([teamName, data]) => ({
      name: teamName,
      score: data.count > 0 ? parseFloat((data.totalScoreSum / data.count).toFixed(1)) : 0,
    })).sort((a,b) => b.score - a.score);
  }, [filteredData]);

  if (isLoading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6 flex-1 dark:bg-gray-950">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Employee KPI</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedTeam === 'all' ? 'Overall Performance Overview' : `${selectedTeam} Team Performance`}
            </p>
        </div>
      </div>
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mt-4">
        {/* Team Filter */}
        <div className="relative">
          <select
            value={selectedTeam}
            onChange={onTeamChange}
            className="appearance-none bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-600 text-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:outline-none dark:border-gray-600"
            aria-label="Filter by team"
          >
            <option value="all">All Teams</option>
            {uniqueTeamsForFilter.map((team: string) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
        {/* Week Filter */}
        <div className="relative">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-600 text-sm focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:outline-none dark:border-gray-600"
            aria-label="Filter by week"
          >
            <option value="all">All Weeks</option>
            {uniqueWeeksForFilter.map((week) => (
              <option key={week} value={week}>{week}</option>
            ))}
          </select>
        </div>
        {/* Employee Filter */}
        <div className="relative">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-600 text-sm focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-500 focus:outline-none dark:border-gray-600"
            aria-label="Filter by employee"
          >
            <option value="all">All Employees</option>
            {uniqueEmployeesForFilter.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyPerformanceChart data={weeklyChartData} />
        </div>
        <div className="lg:col-span-1">
          <TeamComparisonChart data={teamComparisonData} />
        </div>
      </div>
      <div>
        <OverallPerformance data={overallPerformanceData.filter(item => selectedTeam === 'all' || item.team_name.includes(selectedTeam))} />
      </div>
    </div>
  );
};

export default DashboardPage;
