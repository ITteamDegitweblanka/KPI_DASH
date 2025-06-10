

import React from 'react';
import { EmployeePerformanceData } from '../../types';
import EmployeeTable from './EmployeeTable';
import { StarIcon, BriefcaseIcon, ArrowTrendingUpIcon, TrophyIcon, CalendarDaysIcon, CurrencyDollarIcon } from './icons/Icons';

interface PerformancePageProps {
  employeePerformanceData: EmployeePerformanceData[];
}

const PerformancePage: React.FC<PerformancePageProps> = ({ employeePerformanceData }) => {
  
  const performerOfTheWeek = employeePerformanceData.find(
    emp => emp.isPerformerOfTheWeek && emp.totalScore === 10
  );

  const calculateStarOfTheMonth = (): EmployeePerformanceData | undefined => {
    if (!employeePerformanceData || employeePerformanceData.length === 0) {
      return undefined;
    }

    const eligibleEmployees = employeePerformanceData.filter(
      emp => emp.monthlyTargetAchievedPercentage !== undefined && 
             emp.monthlyTargetAchievedPercentage >= 100 &&
             emp.monthlyNetSales !== undefined
    );

    if (eligibleEmployees.length === 0) {
      return undefined;
    }

    return eligibleEmployees.reduce((star, current) => {
      return (current.monthlyNetSales! > star.monthlyNetSales!) ? current : star;
    });
  };

  const starOfTheMonth = calculateStarOfTheMonth();

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
            src={employeeData.employee.avatarUrl}
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


  return (
    <div className="p-6 space-y-8 flex-1 bg-slate-50 dark:bg-gray-950">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Performance Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Review individual and team performance metrics.</p>
      </header>

      <div className="flex flex-wrap gap-6 justify-center">
        <HighlightCard
            title="Performer of the Week"
            titleIcon={<StarIcon className="w-5 h-5 mr-1.5" />}
            employeeData={performerOfTheWeek}
            bgColorClass="bg-gradient-to-r from-yellow-50 via-red-50 to-pink-50 dark:from-yellow-900/30 dark:via-red-900/30 dark:to-pink-900/30"
            borderColorClass="border-yellow-300 dark:border-yellow-700"
            textColorClass="text-yellow-700 dark:text-yellow-400"
            metrics={performerOfTheWeek ? [
                { icon: <StarIcon className="w-6 h-6 text-yellow-500 mr-2 flex-shrink-0" />, label: "Total Score", value: `${performerOfTheWeek.totalScore}/10` },
                { icon: <ArrowTrendingUpIcon className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" />, label: "Achievement", value: `${performerOfTheWeek.targetAchievedPercentage}%` },
                { icon: <BriefcaseIcon className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" />, label: "Weekly Target", value: `$${performerOfTheWeek.target.toLocaleString()}` }
            ] : []}
            congratsMessage={performerOfTheWeek ? "Congratulations on a perfect score this week!" : undefined}
            fallbackMessage="No specific top weekly performer with a perfect score this week. Keep up the great work, team!"
            fallbackIcon={<StarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />}
        />

        <HighlightCard
            title="Star of the Month"
            titleIcon={<TrophyIcon className="w-5 h-5 mr-1.5" />}
            employeeData={starOfTheMonth}
            bgColorClass="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 dark:from-sky-900/30 dark:via-indigo-900/30 dark:to-purple-900/30"
            borderColorClass="border-sky-300 dark:border-sky-700"
            textColorClass="text-sky-700 dark:text-sky-400"
            metrics={starOfTheMonth ? [
                { icon: <CalendarDaysIcon className="w-6 h-6 text-sky-500 mr-2 flex-shrink-0" />, label: "Monthly Target", value: `${starOfTheMonth.monthlyTargetAchievedPercentage}% Achieved` },
                { icon: <CurrencyDollarIcon className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" />, label: "Monthly Net Sales", value: `$${(starOfTheMonth.monthlyNetSales || 0).toLocaleString()}` },
                { icon: <BriefcaseIcon className="w-6 h-6 text-indigo-500 mr-2 flex-shrink-0" />, label: "Target Value", value: `$${(starOfTheMonth.monthlyTargetValue || 0).toLocaleString()}` }
            ] : []}
            congratsMessage={starOfTheMonth ? "Outstanding monthly sales performance and target achievement!" : undefined}
            fallbackMessage="Data for Star of the Month is being compiled or criteria not met. Aim high for next month!"
            fallbackIcon={<TrophyIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />}
        />
      </div>
      

      <section aria-labelledby="detailed-performance-heading" className="mt-8">
        <h2 id="detailed-performance-heading" className="sr-only">Detailed Employee Performance Data</h2>
        {employeePerformanceData.length > 0 ? (
           <EmployeeTable data={employeePerformanceData} highlightPerformers={false} />
        ) : (
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <BriefcaseIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Performance Data Available</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed employee performance data will be shown here once available.</p>
            </div>
        )}
      </section>
    </div>
  );
};

export default PerformancePage;
