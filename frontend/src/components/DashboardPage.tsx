

import React, { useState, useEffect, useMemo } from 'react';
import WeeklyPerformanceChart from './WeeklyPerformanceChart';
import TeamComparisonChart from './TeamComparisonChart';
import OverallPerformance from './OverallPerformance';
import { fetchWeeklyChartData, fetchOverallPerformanceData } from '../services/apiService'; // Updated path
import { EmployeePerformanceData, WeeklyChartDataPoint, TeamComparisonDataPoint, OverallPerformanceDataItem, Notification } from '../../types';
import { ChevronDownIcon } from './icons/Icons';

interface DashboardPageProps {
  employeePerformanceData: EmployeePerformanceData[];
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  uniqueTeamsForFilter: string[]; 
  addAppNotification: ( // For demo button
    targetUserId: string, 
    details: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ) => Promise<void>;
  currentUserId: string; // For demo button
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  employeePerformanceData, 
  selectedTeam, 
  onTeamChange,
  uniqueTeamsForFilter,
  addAppNotification, // For demo button
  currentUserId // For demo button
}) => {
  const [weeklyChartData, setWeeklyChartData] = useState<WeeklyChartDataPoint[]>([]);
  const [overallPerformanceData, setOverallPerformanceData] = useState<OverallPerformanceDataItem[]>([]);
  const [isLoadingLocalData, setIsLoadingLocalData] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_week');

  useEffect(() => {
    const loadLocalDashboardData = async () => {
      setIsLoadingLocalData(true);
      setLocalError(null);
      try {
        const [chartData, overallData] = await Promise.all([
          fetchWeeklyChartData(),
          fetchOverallPerformanceData(),
        ]);
        setWeeklyChartData(chartData);
        setOverallPerformanceData(overallData);
      } catch (error) {
        console.error("Failed to load local dashboard data:", error);
        setLocalError("Failed to load some dashboard components. Please try again later.");
      } finally {
        setIsLoadingLocalData(false);
      }
    };

    loadLocalDashboardData();
  }, []);

  const filteredEmployeePerformanceData = useMemo(() => {
    if (!employeePerformanceData) return [];
    if (selectedTeam === 'all') {
      return employeePerformanceData;
    }
    return employeePerformanceData.filter(p => p.employee.team === selectedTeam);
  }, [employeePerformanceData, selectedTeam]);

  const teamComparisonChartData = useMemo((): TeamComparisonDataPoint[] => {
    if (!employeePerformanceData || employeePerformanceData.length === 0) return [];
    const sourceData = selectedTeam === 'all' ? employeePerformanceData : filteredEmployeePerformanceData;

    const teamsData: { [key: string]: { totalScoreSum: number, count: number } } = {};

    sourceData.forEach(item => {
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

  }, [employeePerformanceData, selectedTeam, filteredEmployeePerformanceData]);

  // Demo function to send a general update
  const sendDemoNotification = async () => {
    if (!currentUserId) {
      alert("Current user ID not available for demo notification.");
      return;
    }
    await addAppNotification(currentUserId, {
      type: 'general_update',
      title: 'System Announcement (Demo)',
      message: 'This is a test general update notification from the dashboard!',
    });
    alert("Demo notification sent!");
  };


  if (isLoadingLocalData) {
    return (
      <div className="flex justify-center items-center h-full flex-1">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 dark:border-red-400"></div>
          <p className="ml-4 text-lg text-gray-600 dark:text-gray-300 mt-4">Loading Dashboard Details...</p>
        </div>
      </div>
    );
  }
   if (localError) {
        return (
            <div className="p-6 text-center flex-1">
                <h2 className="text-xl font-semibold text-red-500 dark:text-red-400">Partial Data Error</h2>
                <p className="dark:text-gray-300">{localError}</p>
            </div>
        );
    }

  return (
    <div className="p-6 space-y-6 flex-1 dark:bg-gray-950">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Employee KPI</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedTeam === 'all' ? 'Overall Performance Overview' : `${selectedTeam} Team Performance`}
            </p>
        </div>
        <div className="flex items-center space-x-3">
             {/* Demo Notification Button */}
            <button 
                onClick={sendDemoNotification}
                className="bg-sky-500 text-white px-3 py-2 rounded-lg shadow hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-xs"
            >
                Send Demo Notif
            </button>
            <div className="relative">
                 <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-600 text-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:outline-none dark:border-gray-600"
                    aria-label="Select performance period"
                >
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month" disabled>This Month (soon)</option>
                    <option value="this_year" disabled>This Year (soon)</option>
                 </select>
                 <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"/>
            </div>
             <div className="relative">
                <select
                    value={selectedTeam}
                    onChange={(e) => onTeamChange(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-600 text-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:outline-none dark:border-gray-600"
                    aria-label="Filter by team"
                >
                    {uniqueTeamsForFilter.map(team => (
                        <option key={team} value={team}>{team === 'all' ? 'All Teams' : team}</option>
                    ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"/>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyPerformanceChart data={weeklyChartData} />
        </div>
        <div className="lg:col-span-1">
          <TeamComparisonChart data={teamComparisonChartData} />
        </div>
      </div>
      
      <div>
        <OverallPerformance data={overallPerformanceData.filter(item => selectedTeam === 'all' || item.team_name.includes(selectedTeam))} />
      </div>

    </div>
  );
};

export default DashboardPage;
