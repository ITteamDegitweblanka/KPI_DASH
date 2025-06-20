import React, { useState, useEffect, FormEvent } from 'react';
import { EmployeeGoal, UserRole, Notification } from '../../types';
import type { UserProfile } from '../types/auth';
import { fetchEmployeeGoals, fetchAllUsersForSelection, addEmployeeGoalService, updateEmployeeGoalService } from '../services/apiService'; // Updated path
import { TEAM_GOAL_TEMPLATES, TEAM_GOAL_METRICS } from '../../constants'; // Updated path
import {
  getSalesTargetScore,
  getSellingCostScore,
  getAOVScore,
  getAcosScore,
  getRoasScore,
  getPortfolioSalesScore,
  getPortfolioTrendScore,
  getPortfolioConversionScore
} from '../utils/goalScoring';

interface EmployeeGoalsPageProps {
  currentUser: UserProfile; 
  currentUserTeam?: string;
  addAppNotification: (
    targetUserId: string, 
    details: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ) => Promise<void>;
}

const GoalPriorityBadge: React.FC<{ priority: 'Low' | 'Medium' | 'High' }> = ({ priority }) => {
  let classes = "text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full";
  if (priority === 'High') classes += " bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  else if (priority === 'Medium') classes += " bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  else classes += " bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  return <span className={classes}>{priority}</span>;
};

const getEndOfWeek = (): string => {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
  return endOfWeek.toISOString().split('T')[0];
};

interface NewGoalFormData {
  assignedToEmployeeId: string;
  title: string;
  description: string;
  targetValue: string;
  unit: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
  startDate: string;
}

const initialNewGoalFormData: NewGoalFormData = {
  assignedToEmployeeId: '',
  title: '',
  description: '',
  targetValue: '100',
  unit: '',
  deadline: getEndOfWeek(),
  priority: 'Medium',
  startDate: '',
};

interface StandardGoalFormEntry {
  targetValue: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
}

const normalizeTeamName = (team: string): string => {
  if (!team) return 'Sales'; // Default to Sales if not set
  const t = team.trim().toLowerCase();
  if (t.includes('portfolio')) return 'Portfolio Holders';
  if (t.includes('website')) return 'Website Ads';
  if (t === 'ads' || t === 'ads team' || t.includes('ads team') || t.includes('ads')) return 'Ads';
  if (t === 'sales' || t === 'sales team' || t.includes('sales team') || t.includes('sale')) return 'Sales';
  // fallback: try to match exactly to a TEAM_GOAL_METRICS key
  if (Object.keys(TEAM_GOAL_METRICS).map(k => k.toLowerCase()).includes(t)) {
    return Object.keys(TEAM_GOAL_METRICS).find(k => k.toLowerCase() === t) || 'Sales';
  }
  return 'Sales'; // fallback
};

const EmployeeGoalsPage: React.FC<EmployeeGoalsPageProps> = ({ currentUser, currentUserTeam, addAppNotification }) => {
  const [showAddGoalForm, setShowAddGoalForm] = useState<boolean>(false);
  const [newGoalFormData, setNewGoalFormData] = useState<NewGoalFormData>(initialNewGoalFormData);
  
  const [selectableEmployees, setSelectableEmployees] = useState<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]>([]);
  const [selectedEmployeeForGoal, setSelectedEmployeeForGoal] = useState<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'> | null>(null);
  const [targetEmployeeExistingGoals, setTargetEmployeeExistingGoals] = useState<EmployeeGoal[]>([]);
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);

  // Add state for selected team filter
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('');

  // Add tab state for admin panel
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;
  const isLeaderOrSubLeader = currentUserRole === 'Leader' || currentUserRole === 'Sub-Leader';
  const isStaff = currentUserRole === 'Staff';
  // Outer tab for Leader/Sub-Leader
  const [mainTab, setMainTab] = useState<'manage' | 'mygoals'>('manage');
  // Inner tab for management UI
  const [activeTab, setActiveTab] = useState<'setGoal' | 'setAchievement'>('setGoal');

  // Add state for My Goals tab
  const [myGoalsTab, setMyGoalsTab] = useState<'active' | 'achieved'>('active');

  // Allow goal assignment if user is Super Admin, Admin, Leader, or Sub-Leader
  const canSetGoalsForOthers = currentUserRole && ['Super Admin', 'Admin', 'Leader', 'Sub-Leader'].includes(currentUserRole as UserRole);
  const showMyGoals = currentUserRole && ['Staff', 'Leader', 'Sub-Leader'].includes(currentUserRole as UserRole);
  const keyTeamNames = Object.keys(TEAM_GOAL_TEMPLATES).filter(teamName => teamName !== "Default");


  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    const loadPageData = async () => {
      setShowAddGoalForm(false); // Reset form visibility on user change
      setSelectedEmployeeForGoal(null);

      try {
        const goalsPromise = fetchEmployeeGoals(currentUserId);
        let employeesPromise: Promise<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]> = Promise.resolve([]);
        if (canSetGoalsForOthers) {
          employeesPromise = fetchAllUsersForSelection();
        }
        const [fetchedGoals, fetchedEmployees] = await Promise.all([goalsPromise, employeesPromise]);
        setGoals(fetchedGoals); // Always set current user's goals
        if (canSetGoalsForOthers) {
          let filteredEmployees = fetchedEmployees;
          // Only filter for Leader (single team), not for Sub-Leader (may have multiple teams)
          if (currentUserRole === 'Leader') {
            filteredEmployees = fetchedEmployees.filter(emp => emp.team === currentUserTeam);
          }
          setSelectableEmployees(filteredEmployees);
        }
      } catch (err) {
        console.error('Failed to load employee goals page data:', err);
      }
    };

    loadPageData();
  }, [currentUserId, canSetGoalsForOthers, currentUserRole, currentUserTeam]);

  // Effect to manage data when selectedEmployeeForGoal changes (for both single and standard goal forms)
  useEffect(() => {
    const fetchDetailsForSelectedEmployee = async () => {
      if (selectedEmployeeForGoal) {
        let fetchedExistingGoalsFromApi: EmployeeGoal[] = [];
        try {
          fetchedExistingGoalsFromApi = await fetchEmployeeGoals(selectedEmployeeForGoal.id);
          setTargetEmployeeExistingGoals(fetchedExistingGoalsFromApi);
        } catch (err) {
          console.error(`Failed to fetch goals for ${selectedEmployeeForGoal.displayName}`, err);
          setTargetEmployeeExistingGoals([]);
        } 
        
        const teamName = selectedEmployeeForGoal.team || 'Default';

        // Initialize standardGoalsFormEntries if it's a key team
        if (keyTeamNames.includes(teamName)) {
          const initialStandardEntries: Record<string, StandardGoalFormEntry> = {};
          const templatesForTeam = TEAM_GOAL_TEMPLATES[teamName] || TEAM_GOAL_TEMPLATES['Default'] || [];
          templatesForTeam.forEach(template => {
            const isAlreadySet = fetchedExistingGoalsFromApi.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase());
            if (!isAlreadySet) { // Only add if not already set
                 initialStandardEntries[template.title] = {
                    targetValue: '', // User needs to fill this
                    deadline: getEndOfWeek(),
                    priority: 'Medium',
                };
            }
          });
          // setStandardGoalsFormEntries(initialStandardEntries);
        }
        
        // Pre-fill single goal form if it's active and templates are available
        if (showAddGoalForm) {
            const templatesForTeam = TEAM_GOAL_TEMPLATES[selectedEmployeeForGoal.team || 'Default'] || [];
            const firstUnsetTemplateForSingleForm = templatesForTeam.find(t => !fetchedExistingGoalsFromApi.some(g => g.title.trim().toLowerCase() === t.title.trim().toLowerCase()));
            if (firstUnsetTemplateForSingleForm) {
                setNewGoalFormData(prev => ({
                    ...prev,
                    title: firstUnsetTemplateForSingleForm.title,
                    unit: firstUnsetTemplateForSingleForm.unit,
                    description: firstUnsetTemplateForSingleForm.description || '',
                }));
            } else if (templatesForTeam.length > 0) { // If all set, pick the first one
                 setNewGoalFormData(prev => ({
                    ...prev,
                    title: templatesForTeam[0].title,
                    unit: templatesForTeam[0].unit,
                    description: templatesForTeam[0].description || '',
                }));
            }
        } else if (showAddGoalForm) {
            setNewGoalFormData(prev => ({ ...prev, title: '', unit: '', description: ''}));
        }

      } else { // No employee selected
        setTargetEmployeeExistingGoals([]);
        // Reset single goal form if it was tied to a previously selected employee
        setNewGoalFormData(_prev => ({ ...initialNewGoalFormData, assignedToEmployeeId: ''})); 
      }
    };

    fetchDetailsForSelectedEmployee();
  }, [selectedEmployeeForGoal, showAddGoalForm]); // Re-run if showAddGoalForm changes to prefill correctly


  // Ensure assignedToEmployeeId is set when employee is selected
  const handleEmployeeSelectionForGoal = (employeeId: string) => {
    console.log('Selectable employees:', selectableEmployees);
    const employee = selectableEmployees.find(emp => String(emp.id) === String(employeeId));
    console.log('Employee selected:', employeeId, employee);
    setSelectedEmployeeForGoal(employee || null);
    // Reset forms when employee changes
    setShowAddGoalForm(false);
    setNewGoalFormData(_prev => ({ ...initialNewGoalFormData, assignedToEmployeeId: employeeId }));
  };

  const handleNewGoalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewGoalFormData(prev => ({ ...prev, [name]: value }));
  };

  // Patch: Always use selectedEmployeeForGoal.id if assignedToEmployeeId is missing on submit
  const handleAddNewGoal = async (e: FormEvent) => { // For single/custom goal
    e.preventDefault();
    // Debug logs for troubleshooting
    console.log('handleAddNewGoal called');
    console.log('currentUserId:', currentUserId);
    console.log('newGoalFormData.assignedToEmployeeId:', newGoalFormData.assignedToEmployeeId);
    console.log('selectedEmployeeForGoal:', selectedEmployeeForGoal);
    // Patch: fallback to selectedEmployeeForGoal.id if assignedToEmployeeId is missing
    let assignedToId = newGoalFormData.assignedToEmployeeId || selectedEmployeeForGoal?.id;
    if (!canSetGoalsForOthers) {
      alert('You do not have permission to assign goals.');
      return;
    }
    if (!currentUserId || !assignedToId) {
      alert("Cannot add goal: Current user or target employee ID is missing.");
      return;
    }

    const teamName: string = Array.isArray(selectedEmployeeForGoal?.team)
      ? selectedEmployeeForGoal.team[0]
      : selectedEmployeeForGoal?.team || 'Default';
    let metrics: Record<string, any> = { ...newGoalFormData };
    let totalScore = 0;

    // Only calculate scores if both target and achievement values are present
    const hasTargets = Object.keys(metrics).some(key => key.includes('Target') && metrics[key]);
    // Only calculate and display achievement metrics if all required achievement fields are filled
    const requiredAchievementFields = teamName === 'Sales' ? ['Weekly Achievement (Sales)', 'Weekly Achievement (Selling Cost %)', 'Weekly Achievement (AOV)']
      : teamName === 'Ads' ? ['Weekly Achievement (Sales)', 'Weekly Achievement (Sales Trend %)']
      : teamName === 'Website Ads' ? ['Weekly Achievement (Sales)', 'Weekly Achievement (ROAS %)', 'Weekly Achievement (AOV)']
      : teamName === 'Portfolio Holders' ? ['Weekly Achievement (Sales)', 'Weekly Achievement (Sales Trend %)', 'Weekly Achievement (Conversion Rate %)']
      : [];
    const allAchievementsFilled = requiredAchievementFields.every(field => metrics[field] !== undefined && metrics[field] !== '' && metrics[field] !== null);

    if (hasTargets && allAchievementsFilled) {
      if (teamName === 'Sales') {
        const salesTarget = parseFloat(metrics['Weekly Target (Sales)'] || '0');
        const salesAchieved = parseFloat(metrics['Weekly Achievement (Sales)'] || '0');
        const salesPercent = salesTarget ? (salesAchieved / salesTarget) * 100 : 0;
        const salesScore = getSalesTargetScore(salesPercent);
        metrics['Sales Achievement %'] = salesPercent;
        metrics['Sales Score'] = salesScore;

        const sellingCostTarget = parseFloat(metrics['Weekly Target (Selling Cost %)'] || '0');
        const sellingCostAchieved = parseFloat(metrics['Weekly Achievement (Selling Cost %)'] || '0');
        const sellingCostScore = getSellingCostScore(sellingCostAchieved, sellingCostTarget);
        metrics['Selling Cost % Score'] = sellingCostScore;

        const aovTarget = parseFloat(metrics['Weekly Target (AOV)'] || '0');
        const aovAchieved = parseFloat(metrics['Weekly Achievement (AOV)'] || '0');
        const aovScore = getAOVScore(aovAchieved, aovTarget);
        metrics['AOV Score'] = aovScore;

        totalScore = salesScore + sellingCostScore + aovScore;
        metrics['Total Score'] = totalScore;
      } else if (teamName === 'Ads') {
        const salesTarget = parseFloat(metrics['Weekly Target (Sales)'] || '0');
        const salesAchieved = parseFloat(metrics['Weekly Achievement (Sales)'] || '0');
        const salesPercent = salesTarget ? (salesAchieved / salesTarget) * 100 : 0;
        const salesScore = getSalesTargetScore(salesPercent);
        metrics['Sales Achievement %'] = salesPercent;
        metrics['Sales Score'] = salesScore;

        const acosTarget = parseFloat(metrics['Weekly Target (Sales Trend %)'] || '0');
        const acosAchieved = parseFloat(metrics['Weekly Achievement (Sales Trend %)'] || '0');
        const acosScore = getAcosScore(acosAchieved, acosTarget);
        metrics['Sales Trend % Score'] = acosScore;

        const aovTarget = parseFloat(metrics['Weekly Target (AOV)'] || '0');
        const aovAchieved = parseFloat(metrics['Weekly Achievement (AOV)'] || '0');
        const aovScore = getAOVScore(aovAchieved, aovTarget);
        metrics['AOV Score'] = aovScore;

        totalScore = salesScore + acosScore + aovScore;
        metrics['Total Score'] = totalScore;
      } else if (teamName === 'Website Ads') {
        const salesTarget = parseFloat(metrics['Weekly Target (Sales)'] || '0');
        const salesAchieved = parseFloat(metrics['Weekly Achievement (Sales)'] || '0');
        const salesPercent = salesTarget ? (salesAchieved / salesTarget) * 100 : 0;
        const salesScore = getSalesTargetScore(salesPercent);
        metrics['Sales Achievement %'] = salesPercent;
        metrics['Sales Score'] = salesScore;

        const roasTarget = parseFloat(metrics['Weekly Target (ROAS %)'] || '0');
        const roasAchieved = parseFloat(metrics['Weekly Achievement (ROAS %)'] || '0');
        const roasScore = getRoasScore(roasAchieved, roasTarget);
        metrics['ROAS % Score'] = roasScore;

        const aovTarget = parseFloat(metrics['Weekly Target (AOV)'] || '0');
        const aovAchieved = parseFloat(metrics['Weekly Achievement (AOV)'] || '0');
        const aovScore = getAOVScore(aovAchieved, aovTarget);
        metrics['AOV Score'] = aovScore;

        totalScore = salesScore + roasScore + aovScore;
        metrics['Total Score'] = totalScore;
      } else if (teamName === 'Portfolio Holders') {
        const salesTarget = parseFloat(metrics['Weekly Target (Sales)'] || '0');
        const salesAchieved = parseFloat(metrics['Weekly Achievement (Sales)'] || '0');
        const salesPercent = salesTarget ? (salesAchieved / salesTarget) * 100 : 0;
        const salesScore = getPortfolioSalesScore(salesPercent);
        metrics['Sales Achievement %'] = salesPercent;
        metrics['Sales Score'] = salesScore;

        const trendTarget = parseFloat(metrics['Weekly Target (Sales Trend %)'] || '0');
        const trendAchieved = parseFloat(metrics['Weekly Achievement (Sales Trend %)'] || '0');
        const trendPercent = trendTarget ? ((trendAchieved - trendTarget) / trendTarget) * 100 : 0;
        const trendScore = getPortfolioTrendScore(trendPercent);
        metrics['Sales Trend % Score'] = trendScore;

        const convTarget = parseFloat(metrics['Weekly Target (Conversion Rate %)'] || '0');
        const convAchieved = parseFloat(metrics['Weekly Achievement (Conversion Rate %)'] || '0');
        const convScore = getPortfolioConversionScore(convAchieved, convTarget);
        metrics['Conversion Rate % Score'] = convScore;

        totalScore = salesScore + trendScore + convScore;
        metrics['Total Score'] = totalScore;
      }
    } else {
      // Clear scores and achievement metrics if not all required achievements are present
      Object.keys(metrics).forEach(key => {
        if (key.includes('Score') || key === 'Total Score' || key.includes('%') || key.toLowerCase().includes('achiev')) {
          metrics[key] = '';
        }
      });
    }

    // Patch: Set title and description from selected metric if available
    // Patch: Use the first metric for the team as the goal title, description, and unit
    const normalizedTeamName = normalizeTeamName(teamName) as keyof typeof TEAM_GOAL_METRICS;
    const teamMetrics: string[] = TEAM_GOAL_METRICS[normalizedTeamName] || [];
    let firstMetric: string = (teamMetrics.find((m: string) => m.includes('Target')) || teamMetrics[0] || '');
    if (!firstMetric) firstMetric = selectedEmployeeForGoal?.team || 'General';
    const teamTemplates = TEAM_GOAL_TEMPLATES[normalizedTeamName] || [];
    const templateForMetric = teamTemplates.find(t => firstMetric.includes(t.title)) || teamTemplates[0];
    // Only include actual metric fields in metrics (all filled fields, not just the first)
    const filteredMetrics = Object.fromEntries(
      Object.entries(metrics)
        .filter(([k, v]) => teamMetrics.includes(k) && v !== undefined && v !== '')
    );
    // If no metrics are filled, fallback to all fields in newGoalFormData that match teamMetrics
    const allFormMetrics = Object.fromEntries(
      Object.entries(newGoalFormData as Record<string, any>)
        .filter(([k, v]) => teamMetrics.includes(k) && v !== undefined && v !== '')
    );
    const finalMetrics = Object.keys(filteredMetrics).length > 0 ? filteredMetrics : allFormMetrics;
    // Always include all target fields for the selected team in metrics, even if empty
    const allTargetFields = TEAM_TARGET_FIELDS[normalizeTeamName(teamName)] || [];
    const metricsWithTargets = { ...allTargetFields.reduce((acc, field) => {
      acc[field] = (newGoalFormData as any)[field] || '';
      return acc;
    }, {} as Record<string, any>) };
    // Merge with any filled fields
    Object.assign(metricsWithTargets, finalMetrics);
    const goalDataToSave = {
      assignedToEmployeeId: assignedToId,
      setByUserId: currentUserId,
      title: firstMetric || (selectedEmployeeForGoal?.team || 'General'),
      description: templateForMetric?.description || newGoalFormData.description || '',
      targetValue: parseFloat((newGoalFormData as Record<string, any>)[firstMetric] || newGoalFormData.targetValue || '0'),
      unit: templateForMetric?.unit || newGoalFormData.unit || '',
      deadline: newGoalFormData.deadline || '',
      priority: newGoalFormData.priority || 'Medium',
      metrics: metricsWithTargets, // Always include all target fields
      startDate: newGoalFormData.startDate || '',
    };

    try {
      const savedGoal = await addEmployeeGoalService(goalDataToSave);
      if (newGoalFormData.assignedToEmployeeId === currentUserId) {
        // setGoals(prevGoals => [savedGoal, ...prevGoals]);
      }
      if (selectedEmployeeForGoal && newGoalFormData.assignedToEmployeeId === selectedEmployeeForGoal.id) {
        setTargetEmployeeExistingGoals(prev => [savedGoal, ...prev]);
      }
      alert(`New goal "${savedGoal.title}" added successfully for ${selectedEmployeeForGoal?.displayName || 'selected employee'}!`);
      await addAppNotification(newGoalFormData.assignedToEmployeeId, {
        type: 'new_target',
        title: 'New Goal Assigned',
        message: `A new goal "${savedGoal.title}" has been set for you by ${currentUser.displayName}.`,
        link: '#employee-goals'
      });
      setShowAddGoalForm(false);
      setNewGoalFormData(initialNewGoalFormData);
      setSelectedEmployeeForGoal(null);
    } catch (err) {
      alert(`Failed to add goal: ${(err as Error).message}`);
      console.error("Error adding goal:", err);
    }
  };

  // Restore getButtonText and mainButtonAction so they are defined before use
  const getButtonText = () => {
    if (!selectedEmployeeForGoal) return activeTab === 'setGoal' ? "+ Set New Target" : "+ Set New Achievement";
    const teamName = selectedEmployeeForGoal.team || 'Default';
    if (keyTeamNames.includes(teamName)) {
      const teamTemplates = TEAM_GOAL_TEMPLATES[teamName] || [];
      const unsetStandardGoalsExist = teamTemplates.some(template => 
        !targetEmployeeExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase())
      );
      if (unsetStandardGoalsExist) return activeTab === 'setGoal' ? "Set Standard Team Targets" : "Set Standard Team Achievements";
    }
    return activeTab === 'setGoal' ? "Set Custom Target" : "Set Custom Achievement";
  };

  const mainButtonAction = () => {
    if (!selectedEmployeeForGoal) {
      alert("Please select an employee first.");
      return;
    }
    const teamName = selectedEmployeeForGoal.team || 'Default';
    if (keyTeamNames.includes(teamName)) {
      const teamTemplates = TEAM_GOAL_TEMPLATES[teamName] || [];
      const unsetStandardGoalsExist = teamTemplates.some(template => 
        !targetEmployeeExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase())
      );
      if (unsetStandardGoalsExist) {
        // setShowStandardGoalsSection(true);
        setShowAddGoalForm(false);
      } else {
        setShowAddGoalForm(true);
        // setShowStandardGoalsSection(false);
        setNewGoalFormData(_prev => ({...initialNewGoalFormData, assignedToEmployeeForGoal: selectedEmployeeForGoal.id}));
      }
    } else {
      setShowAddGoalForm(true);
      // setShowStandardGoalsSection(false);
      setNewGoalFormData(_prev => ({...initialNewGoalFormData, assignedToEmployeeForGoal: selectedEmployeeForGoal.id}));
    }
  };

  // In useEffect, only fetch and set 'goals' if !canSetGoalsForOthers
  useEffect(() => {
    if (!currentUserId) return;
    if (!canSetGoalsForOthers) {
      fetchEmployeeGoals(currentUserId)
        .then(setGoals)
        .catch(() => setGoals([]));
    }
  }, [currentUserId, canSetGoalsForOthers]);

  // Define the fields for each team for target and achievement
  const TEAM_TARGET_FIELDS: Record<string, string[]> = {
    Sales: ['weekly_sales_target', 'target_cost_percent', 'aov_target'],
    Ads: ['weekly_sales_target', 'target_acos_percent', 'aov_target'],
    'Website Ads': ['weekly_sales_target', 'target_roas', 'aov_target'],
    'Portfolio Holders': ['weekly_sales_target', 'last_week_sales', 'conversion_target'],
  };
  const TEAM_ACHIEVEMENT_FIELDS: Record<string, string[]> = {
    Sales: ['weekly_sales', 'weekly_spend', 'aov'],
    Ads: ['weekly_sales', 'weekly_acos_percent', 'aov'],
    'Website Ads': ['weekly_sales', 'weekly_roas', 'aov'],
    'Portfolio Holders': ['weekly_sales', 'this_week_sales', 'conversion_rate'],
  };

  // Add at the top level of EmployeeGoalsPage
  const [achievementFieldsByGoalId, setAchievementFieldsByGoalId] = useState<Record<string, Record<string, string>>>({});

  // In useEffect, whenever targetEmployeeExistingGoals changes, initialize achievementFieldsByGoalId for each goal
  useEffect(() => {
    if (activeTab === 'setAchievement' && targetEmployeeExistingGoals.length > 0) {
      const newFields: Record<string, Record<string, string>> = {};
      targetEmployeeExistingGoals.forEach(goal => {
        let metricsObj: Record<string, any> = {};
        try {
          metricsObj = typeof (goal as any).metrics === 'string' ? JSON.parse((goal as any).metrics) : ((goal as any).metrics || {});
        } catch (e) { metricsObj = {}; }
        const rawTeamName = Array.isArray(selectedEmployeeForGoal?.team)
          ? selectedEmployeeForGoal.team[0]
          : selectedEmployeeForGoal?.team || 'Sales';
        const teamName = normalizeTeamName(rawTeamName);
        const fields = TEAM_ACHIEVEMENT_FIELDS[teamName] || [];
        newFields[goal.id] = {};
        fields.forEach((field: string) => {
          newFields[goal.id][field] = metricsObj[field] || '';
        });
      });
      setAchievementFieldsByGoalId(newFields);
    }
  }, [activeTab, targetEmployeeExistingGoals, selectedEmployeeForGoal]);

  // Fix: For sub-leader, auto-select their only team and update employee list accordingly
  useEffect(() => {
    if (currentUserRole === 'Sub-Leader') {
      const teamsManaged = Array.isArray(currentUserTeam) ? currentUserTeam : [currentUserTeam];
      if (teamsManaged.length === 1) {
        setSelectedTeamFilter(teamsManaged[0]);
      }
    }
  }, [currentUserRole, currentUserTeam]);

  console.log('DEBUG: currentUserRole', currentUserRole);
  console.log('DEBUG: showMyGoals', showMyGoals);
  console.log('DEBUG: goals', goals);

  return (
    <div className="p-6 flex-1 bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      {/* Tab navigation for Leader/Sub-Leader */}
      {isLeaderOrSubLeader && (
        <div className="mb-6 flex space-x-2 border-b border-gray-300 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition-all ${mainTab === 'manage' ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-300 dark:border-gray-700 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            onClick={() => setMainTab('manage')}
          >
            Manage Employee Goals
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition-all ${mainTab === 'mygoals' ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-300 dark:border-gray-700 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            onClick={() => setMainTab('mygoals')}
          >
            My Goals
          </button>
        </div>
      )}
      {/* Management UI for users who can set goals for others (tabbed for Leader/Sub-Leader) */}
      {canSetGoalsForOthers && (!isLeaderOrSubLeader || mainTab === 'manage') && (
        <>
          {/* Add tab buttons for Manage Employee Goals */}
          <div className="mb-4 flex space-x-2 border-b border-gray-300 dark:border-gray-700">
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition-all ${activeTab === 'setGoal' ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-300 dark:border-gray-700 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('setGoal')}
            >
              Set New Target
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition-all ${activeTab === 'setAchievement' ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-300 dark:border-gray-700 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('setAchievement')}
            >
              Set Custom Achievement
            </button>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {canSetGoalsForOthers ? "Manage Employee Goals" : "My Goals"}
              {currentUserTeam && !canSetGoalsForOthers && <span className="text-xl text-gray-500 dark:text-gray-400"> ({currentUserTeam})</span>}
            </h1>
            {canSetGoalsForOthers && (
              <button 
                onClick={() => {
                    if (showAddGoalForm) {
                        setShowAddGoalForm(false);
                    } else {
                        mainButtonAction();
                    }
                }}
                className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg shadow hover:bg-red-600 dark:hover:bg-red-700 transition"
                aria-expanded={showAddGoalForm}
              >
                {showAddGoalForm ? 'Cancel Goal Creation' : getButtonText()}
              </button>
            )}
          </div>
          {canSetGoalsForOthers && (
            <div className="mb-6">
              <label htmlFor="teamFilter" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Filter by Team
              </label>
              <select
                id="teamFilter"
                value={selectedTeamFilter}
                onChange={e => setSelectedTeamFilter(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 mb-2"
              >
                <option value="">-- All Teams --</option>
                {Array.from(new Set(
                  selectableEmployees.flatMap(emp => Array.isArray(emp.team) ? emp.team : (emp.team ? [emp.team] : []))
                )).map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <label htmlFor="employeeToAssignGoal" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Select Employee to Manage Goals For <span className="text-red-500">*</span>
              </label>
              <select
                id="employeeToAssignGoal"
                value={selectedEmployeeForGoal?.id || ''}
                onChange={(e) => handleEmployeeSelectionForGoal(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <option value="" disabled>-- Select an Employee --</option>
                {selectableEmployees
                  .filter(emp =>
                    !selectedTeamFilter ||
                    (Array.isArray(emp.team) ? emp.team.includes(selectedTeamFilter) : emp.team === selectedTeamFilter)
                  )
                  .map(emp => {
                    const teamList = Array.isArray(emp.team) ? emp.team : (emp.team ? [emp.team] : []);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.displayName} ({teamList.length > 0 ? teamList.join(', ') : 'No Team'})
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
          {/* Tab Content */}
          {canSetGoalsForOthers && activeTab === 'setGoal' && selectedEmployeeForGoal && (
            <section id="add-goal-form-section" className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Set Custom Goal for {selectedEmployeeForGoal.displayName}
              </h2>
              <form onSubmit={handleAddNewGoal} className="space-y-4">
                {/* Show only the correct target fields for the selected team */}
                {(() => {
                  const rawTeamName = Array.isArray(selectedEmployeeForGoal.team)
                    ? selectedEmployeeForGoal.team[0]
                    : selectedEmployeeForGoal.team || 'Sales';
                  const teamName = normalizeTeamName(rawTeamName);
                  const fields = TEAM_TARGET_FIELDS[teamName] || [];
                  return fields.map((field: string) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                      <input
                        type="text"
                        name={field}
                        value={(newGoalFormData as any)[field] || ''}
                        onChange={handleNewGoalInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500"
                      />
                    </div>
                  ));
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Target Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={newGoalFormData.startDate || ''}
                      onChange={handleNewGoalInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Target End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={newGoalFormData.deadline || ''}
                      onChange={handleNewGoalInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => { setShowAddGoalForm(false); setNewGoalFormData(initialNewGoalFormData); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition">
                    Cancel Set Target
                  </button>
                  <button type="submit" className="px-6 py-2 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition">
                    Set Target
                  </button>
                </div>
              </form>
            </section>
          )}
          {canSetGoalsForOthers && activeTab === 'setAchievement' && selectedEmployeeForGoal && (
            <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Set Achievement for {selectedEmployeeForGoal.displayName}
              </h2>
              {/* Achievement form for selected employee's goals */}
              {targetEmployeeExistingGoals.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No goals found for this employee.</p>
              ) : (
                <div className="space-y-6">
                  {targetEmployeeExistingGoals.filter(goal => goal.status !== 'Completed').map(goal => {
                    let metricsObj: Record<string, any> = {};
                    try {
                      metricsObj = typeof (goal as any).metrics === 'string' ? JSON.parse((goal as any).metrics) : ((goal as any).metrics || {});
                    } catch (e) { metricsObj = {}; }
                    // Show only the correct achievement fields for the selected team
                    const rawTeamName = Array.isArray(selectedEmployeeForGoal.team)
                      ? selectedEmployeeForGoal.team[0]
                      : selectedEmployeeForGoal.team || 'Sales';
                    const teamName = normalizeTeamName(rawTeamName);
                    const fields = TEAM_ACHIEVEMENT_FIELDS[teamName] || [];

                    // Add local state for achievement fields
                    const achievementFields = achievementFieldsByGoalId[goal.id] || {};
                    const handleAchievementInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      const { name, value } = e.target;
                      setAchievementFieldsByGoalId(prev => ({
                        ...prev,
                        [goal.id]: {
                          ...prev[goal.id],
                          [name]: value,
                        },
                      }));
                    };

                    const handleAchievementReset = () => {
                      setAchievementFieldsByGoalId(prev => ({
                        ...prev,
                        [goal.id]: Object.fromEntries(Object.keys(achievementFields).map(f => [f, ''])),
                      }));
                    };

                    return (
                      <form key={goal.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow space-y-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const updatedMetrics = { ...metricsObj };
                            fields.forEach(field => {
                              updatedMetrics[field] = achievementFields[field];
                            });
                            // Determine which field should be used as currentValue (main achievement)
                            let mainAchievementField = fields[0];
                            if (fields.includes('weekly_sales')) mainAchievementField = 'weekly_sales';
                            else if (fields.includes('this_week_sales')) mainAchievementField = 'this_week_sales';
                            else if (fields.includes('weekly_acos_percent')) mainAchievementField = 'weekly_acos_percent';
                            else if (fields.includes('weekly_roas')) mainAchievementField = 'weekly_roas';
                            else if (fields.includes('aov')) mainAchievementField = 'aov';
                            const newCurrentValue = achievementFields[mainAchievementField] || '';
                            await updateEmployeeGoalService(goal.id, {
                              metrics: JSON.stringify(updatedMetrics),
                              currentValue: newCurrentValue !== '' ? Number(newCurrentValue) : undefined
                            });
                            // Refresh goals after achievement update
                            if (!canSetGoalsForOthers) {
                              const refreshedGoals = await fetchEmployeeGoals(currentUserId);
                              setGoals(refreshedGoals);
                            }
                            alert('Achievement updated!');
                          } catch (err) {
                            alert('Failed to update achievement.');
                          }
                        }}
                        onReset={handleAchievementReset}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{goal.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{goal.description}</p>
                          </div>
                          <GoalPriorityBadge priority={goal.priority} />
                        </div>
                        {/* Goal details section */}
                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-4">
                          <div>
                            <span className="font-semibold">Target:</span> {goal.targetValue} {goal.unit ? goal.unit : ''}
                          </div>
                          {goal.deadline && (
                            <div>
                              <span className="font-semibold">Deadline:</span> {goal.deadline}
                            </div>
                          )}
                          {goal.startDate && (
                            <div>
                              <span className="font-semibold">Start Date:</span> {goal.startDate}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">Status:</span> {goal.status}
                          </div>
                          <div>
                            <span className="font-semibold">Priority:</span> {goal.priority}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fields.map((field: string) => {
                            // Find the corresponding target value and unit for this field
                            let targetValue = '';
                            let unit = '';
                            if (field.includes('sales')) {
                              targetValue = metricsObj['weekly_sales_target'] || '';
                              unit = field === 'weekly_sales' && goal.unit ? goal.unit : '';
                            } else if (field.includes('spend')) {
                              targetValue = metricsObj['target_cost_percent'] || '';
                              unit = '%';
                            } else if (field.includes('aov')) {
                              targetValue = metricsObj['aov_target'] || '';
                              unit = field === 'aov' && goal.unit ? goal.unit : '';
                            } else if (field.includes('acos')) {
                              targetValue = metricsObj['target_acos_percent'] || '';
                              unit = '%';
                            } else if (field.includes('roas')) {
                              targetValue = metricsObj['target_roas'] || '';
                              unit = '';
                            } else if (field.includes('conversion')) {
                              targetValue = metricsObj['conversion_target'] || '';
                              unit = '%';
                            } else if (field.includes('trend')) {
                              targetValue = metricsObj['last_week_sales'] || '';
                              unit = '';
                            }
                            return (
                              <div key={field}>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                  {field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  {targetValue !== '' && (
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Target: {targetValue}{unit && ` ${unit}`})</span>
                                  )}
                                </label>
                                <input
                                  type="number"
                                  name={field}
                                  value={achievementFields[field] || ''}
                                  onChange={handleAchievementInputChange}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-end pt-2">
                          <button type="reset" className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition mr-2">
                            Clear Achievement
                          </button>
                          <button type="submit" className="px-6 py-2 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition">
                            Set Achievement
                          </button>
                        </div>
                      </form>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
      {/* My Goals for Staff, Leader, and Sub-Leader (tabbed for Leader/Sub-Leader) */}
      {(isStaff || (isLeaderOrSubLeader && mainTab === 'mygoals')) && (
        <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-1">My Goals</h2>
          {/* Tabs for Active/Achieved */}
          <div className="mb-4 flex space-x-2 border-b border-gray-300 dark:border-gray-700">
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition-all ${myGoalsTab === 'active' ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-300 dark:border-gray-700 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              onClick={() => setMyGoalsTab('active')}
            >
              Active Goals
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition-all ${myGoalsTab === 'achieved' ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-300 dark:border-gray-700 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              onClick={() => setMyGoalsTab('achieved')}
            >
              Achieved Goals
            </button>
          </div>
          {/* Filter goals by tab */}
          {goals.filter(goal => myGoalsTab === 'active' ? goal.status !== 'Completed' : goal.status === 'Completed').length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No {myGoalsTab === 'active' ? 'active' : 'achieved'} goals.</p>
          ) : (
            <div className="space-y-4">
              {goals.filter(goal => myGoalsTab === 'active' ? goal.status !== 'Completed' : goal.status === 'Completed').map(goal => {
                let metrics = goal.metrics;
                if (typeof metrics === 'string') {
                  try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
                }
                return (
                  <div key={goal.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{goal.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{goal.description}</p>
                      </div>
                      <GoalPriorityBadge priority={goal.priority} />
                    </div>
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-4">
                      <div>
                        <span className="font-semibold">Target:</span> {goal.targetValue} {goal.unit ? goal.unit : ''}
                      </div>
                      {goal.deadline && (
                        <div>
                          <span className="font-semibold">Deadline:</span> {goal.deadline}
                        </div>
                      )}
                      {goal.startDate && (
                        <div>
                          <span className="font-semibold">Start Date:</span> {goal.startDate}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Status:</span> {goal.status}
                      </div>
                      <div>
                        <span className="font-semibold">Priority:</span> {goal.priority}
                      </div>
                    </div>
                    <div className="mt-2">
                    <span className="font-semibold">Performance Summary:</span>
                    <ul className="ml-4 mt-1 list-disc text-xs">
                      <li>Target Sales: <span className="font-semibold">{(metrics && (metrics.weekly_sales_target || goal.targetValue || '-')) + ' ' + (goal.unit || '')}</span></li>
                      <li>Achieved Sales: <span className="font-semibold">{metrics && metrics.weekly_sales !== undefined && metrics.weekly_sales !== '' ? metrics.weekly_sales + ' ' + (goal.unit || '') : '-'}</span></li>
                      <li>Achievement: <span className="font-semibold">{metrics && metrics.sales_achievement_percent !== undefined && metrics.sales_achievement_percent !== '' ? Number(metrics.sales_achievement_percent).toFixed(2) + '%' : '-'}</span></li>
                      <li>Total Score: <span className="font-semibold">{metrics && metrics.total_score !== undefined && metrics.total_score !== '' ? metrics.total_score : '-'}</span></li>
                      <li>Performer of the Week: <span className="font-semibold">{metrics && metrics.isPerformerOfTheWeek === true ? 'Yes' : 'No'}</span></li>
                    </ul>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default EmployeeGoalsPage;
