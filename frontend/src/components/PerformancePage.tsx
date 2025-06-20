import React, { useState, useEffect } from 'react';
import { EmployeePerformanceData } from '../../types';
import EmployeeTable from './EmployeeTable';
import { fetchEmployeePerformanceData } from '../services/apiService';
import { StarIcon, BriefcaseIcon, ArrowTrendingUpIcon, TrophyIcon, CalendarDaysIcon, CurrencyDollarIcon } from './icons/Icons';

const PerformancePage: React.FC = () => {
  const [employeePerformanceData, setEmployeePerformanceData] = useState<EmployeePerformanceData[]>([]);

  // Filters
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchEmployeePerformanceData();
        setEmployeePerformanceData(data);
      } catch (err) {
        console.error('Error fetching performance data:', err);
      }
    };
    fetchData();
  }, []);

  // Unique month options from data
  const monthOptions = Array.from(new Set(employeePerformanceData.map(e => e.month))).filter(Boolean);

  // Unique filter options (no useMemo)
  const teamOptions = Array.from(new Set(employeePerformanceData.map(e => e.employee.team))).filter(Boolean);
  const departmentOptions = Array.from(new Set(employeePerformanceData.map(e => e.employee.department))).filter(Boolean);

  // Helper: get week-of-month for each record
  function getWeekOfMonth(date: Date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay() || 7;
    return Math.ceil((date.getDate() + dayOfWeek - 1) / 7);
  }

  // Build week options for selected month
  const weekOptions = Array.from(new Set(
    employeePerformanceData
      .filter(e => !selectedMonth || String(e.month) === String(selectedMonth))
      .map(e => {
        if (e.deadline) {
          const d = new Date(e.deadline);
          return getWeekOfMonth(d);
        }
        return undefined;
      })
  )).filter(Boolean).sort((a, b) => Number(a) - Number(b));

  // Filtered data (no useMemo)
  const filteredData = employeePerformanceData.filter(e =>
    (!selectedMonth || String(e.month) === String(selectedMonth)) &&
    (!selectedWeek || (e.deadline && getWeekOfMonth(new Date(e.deadline)) === Number(selectedWeek))) &&
    (!selectedTeam || e.employee.team === selectedTeam) &&
    (!selectedDepartment || e.employee.department === selectedDepartment)
  );

  // Use filteredData for highlights if any filter is applied
  const performersOfTheWeek = Object.values(
    (selectedMonth || selectedWeek || selectedTeam || selectedDepartment ? filteredData : employeePerformanceData)
      .filter(emp => emp.employee.isPerformerOfTheWeek && emp.totalScore === 10)
      .reduce((acc, emp) => {
        acc[emp.employee.id] = emp;
        return acc;
      }, {} as Record<string, EmployeePerformanceData>)
  );

  const maxMonthlyNetSales = Math.max(
    ...(selectedMonth || selectedWeek || selectedTeam || selectedDepartment ? filteredData : employeePerformanceData)
      .filter(emp => emp.employee.isStarOfTheMonth && emp.totalScore === 10 && typeof emp.monthlyNetSales === 'number')
      .map(emp => emp.monthlyNetSales || 0)
  );
  const starsOfTheMonth = (selectedMonth || selectedWeek || selectedTeam || selectedDepartment ? filteredData : employeePerformanceData)
    .filter(emp => emp.employee.isStarOfTheMonth && emp.totalScore === 10 && emp.monthlyNetSales === maxMonthlyNetSales
  );

  const HighlightCard: React.FC<{
    title: string;
    titleIcon: React.ReactNode;
    employeeData?: EmployeePerformanceData;
    bgColorClass?: string;
    borderColorClass?: string;
    textColorClass?: string;
    metrics: { icon: React.ReactNode; label: string; value: string | number; }[];
    congratsMessage?: string;
    fallbackMessage: string;
    fallbackIcon: React.ReactNode;
  }> = ({ 
    title, titleIcon, employeeData, 
    bgColorClass = 'bg-gradient-to-r from-yellow-50 via-red-50 to-pink-50 dark:from-yellow-900/30 dark:via-red-900/30 dark:to-pink-900/30', 
    borderColorClass = 'border-yellow-300 dark:border-yellow-700', 
    textColorClass = 'text-yellow-700 dark:text-yellow-400', 
    metrics, congratsMessage, fallbackMessage, fallbackIcon 
  }) => {
    if (!employeeData) {
      return (
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center flex-1 min-w-[300px]" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
          {fallbackIcon}
          <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-2">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{fallbackMessage}</p>
        </section>
      );
    }
    return (
      <section
        className={`${bgColorClass} p-6 rounded-xl shadow-lg border ${borderColorClass} flex-1 min-w-[300px]`}
        aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
      >
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <img
            src={employeeData.employee.id ? `/api/users/${employeeData.employee.id}/avatar` : undefined}
            alt={`${employeeData.employee.name}, ${title}`}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-md border-4 border-white dark:border-gray-700"
          />
          <div className="flex-1 text-center md:text-left">
            <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className={`text-sm font-semibold ${textColorClass} uppercase tracking-wider flex items-center justify-center md:justify-start`}>
              {titleIcon} {title}
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{employeeData.employee.name}</p>
            <p className="text-md text-red-600 dark:text-red-400 font-medium">{employeeData.employee.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employeeData.employee.department} &bull; {employeeData.employee.team} Team
            </p>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {metrics.map(metric => {
                const iconElement = metric.icon as React.ReactElement<{ className?: string }>;
                const originalClassName = iconElement.props.className || '';
                const newClassName = `${originalClassName} dark:text-gray-300`.trim();
                return (
                  <div key={metric.label} className="bg-white/70 dark:bg-gray-700/50 p-3 rounded-lg shadow-sm flex items-center">
                    {React.cloneElement(iconElement, { className: newClassName })}
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{metric.label}: </span>
                      <span className="text-gray-900 dark:text-gray-100">{metric.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {congratsMessage && (
              <p className="mt-4 text-md font-semibold text-green-600 dark:text-green-400">
                {congratsMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  };


  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Employee', 'Title', 'Department', 'Team', 'Target Sales', 'Achievement (%)', 'Sales Score', 'Cost Score', 'AOV Score', 'Total Score'];
    const rows = filteredData.map(item => [
      item.employee.name,
      item.employee.title,
      item.employee.department,
      item.employee.team,
      item.target,
      item.targetAchievedPercentage,
      item.metrics?.sales_score ?? '-',
      item.metrics?.cost_score ?? '-',
      item.metrics?.aov_score ?? '-',
      item.metrics?.total_score ?? '-',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_performance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Paginated data (no useMemo)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(start, start + rowsPerPage);

  return (
    <div className="p-6 space-y-8 flex-1 bg-slate-50 dark:bg-gray-950">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Performance Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Review individual and team performance metrics.</p>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedWeek(''); setCurrentPage(1); }} className="px-3 py-2 rounded border">
            <option value="">All Months</option>
            {monthOptions.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
          <select value={selectedWeek} onChange={e => { setSelectedWeek(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded border" disabled={!selectedMonth}>
            <option value="">All Weeks</option>
            {weekOptions.map(week => <option key={week} value={week}>{`Week ${week}`}</option>)}
          </select>
          <select value={selectedTeam} onChange={e => { setSelectedTeam(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded border">
            <option value="">All Teams</option>
            {teamOptions.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
          <select value={selectedDepartment} onChange={e => { setSelectedDepartment(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded border">
            <option value="">All Departments</option>
            {departmentOptions.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
          <button onClick={handleExportCSV} className="px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">Export CSV</button>
          <button onClick={handlePrint} className="px-3 py-2 rounded bg-gray-500 text-white hover:bg-gray-600">Print</button>
        </div>
      </header>

      <div className="flex flex-wrap gap-6 justify-center">
        {performersOfTheWeek.length > 0 ? (
          performersOfTheWeek.map((performer, idx) => (
            <HighlightCard
              key={performer.employee.id + '-' + idx}
              title="Performer of the Week"
              titleIcon={<StarIcon className="w-5 h-5 mr-1.5" />}
              employeeData={performer}
              bgColorClass="bg-gradient-to-r from-yellow-50 via-red-50 to-pink-50 dark:from-yellow-900/30 dark:via-red-900/30 dark:to-pink-900/30"
              borderColorClass="border-yellow-300 dark:border-yellow-700"
              textColorClass="text-yellow-700 dark:text-yellow-400"
              metrics={[
                { icon: <StarIcon className="w-6 h-6 text-yellow-500 mr-2 flex-shrink-0" />, label: "Total Score", value: `${performer.totalScore}/10` },
                { icon: <ArrowTrendingUpIcon className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" />, label: "Achievement", value: `${performer.targetAchievedPercentage}%` },
                { icon: <BriefcaseIcon className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" />, label: "Weekly Target", value: `$${performer.target.toLocaleString()}` }
              ]}
              congratsMessage="Congratulations on a perfect score this week!"
              fallbackMessage=""
              fallbackIcon={<StarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />}
            />
          ))
        ) : (
          <HighlightCard
            title="Performer of the Week"
            titleIcon={<StarIcon className="w-5 h-5 mr-1.5" />}
            fallbackMessage="No specific top weekly performer with a perfect score this week. Keep up the great work, team!"
            fallbackIcon={<StarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />}
            metrics={[]}
          />
        )}

        {starsOfTheMonth.length > 0 ? (
          starsOfTheMonth.map((star, idx) => (
            <HighlightCard
              key={star.employee.id + '-' + idx}
              title="Star of the Month"
              titleIcon={<TrophyIcon className="w-5 h-5 mr-1.5" />}
              employeeData={star}
              bgColorClass="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 dark:from-sky-900/30 dark:via-indigo-900/30 dark:to-purple-900/30"
              borderColorClass="border-sky-300 dark:border-sky-700"
              textColorClass="text-sky-700 dark:text-sky-400"
              metrics={[
                { icon: <CalendarDaysIcon className="w-6 h-6 text-sky-500 mr-2 flex-shrink-0" />, label: "Monthly Target", value: `${star.monthlyTargetAchievedPercentage}% Achieved` },
                { icon: <CurrencyDollarIcon className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" />, label: "Monthly Net Sales", value: `$${(star.monthlyNetSales || 0).toLocaleString()}` },
                { icon: <BriefcaseIcon className="w-6 h-6 text-indigo-500 mr-2 flex-shrink-0" />, label: "Target Value", value: `$${(star.monthlyTargetValue || 0).toLocaleString()}` }
              ]}
              congratsMessage="Outstanding monthly sales performance and target achievement!"
              fallbackMessage=""
              fallbackIcon={<TrophyIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />}
            />
          ))
        ) : (
          <HighlightCard
            title="Star of the Month"
            titleIcon={<TrophyIcon className="w-5 h-5 mr-1.5" />}
            fallbackMessage="Data for Star of the Month is being compiled or criteria not met. Aim high for next month!"
            fallbackIcon={<TrophyIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />}
            metrics={[]}
          />
        )}
      </div>
      

      <section aria-labelledby="detailed-performance-heading" className="mt-8">
        <h2 id="detailed-performance-heading" className="sr-only">Detailed Employee Performance Data</h2>
        {employeePerformanceData.length > 0 ? (
           <EmployeeTable data={paginatedData} highlightPerformers={false} />
        ) : (
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <BriefcaseIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Performance Data Available</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed employee performance data will be shown here once available.</p>
            </div>
        )}
        {/* Pagination controls */}
        {filteredData.length > rowsPerPage && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50">Prev</button>
            <span>Page {currentPage} of {Math.ceil(filteredData.length / rowsPerPage)}</span>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredData.length / rowsPerPage)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50">Next</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PerformancePage;
