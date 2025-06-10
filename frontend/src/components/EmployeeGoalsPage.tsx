import React, { useState, useEffect, FormEvent } from 'react';
import { EmployeeGoal, GoalStatus, UserRole, Notification, GoalTemplate } from '../../types';
import type { UserProfile } from '../types/auth';
import { fetchEmployeeGoals, fetchAllUsersForSelection, addEmployeeGoalService } from '../services/apiService'; // Updated path
import { TEAM_GOAL_TEMPLATES } from '../../constants'; // Updated path

interface EmployeeGoalsPageProps {
  currentUser: UserProfile; 
  currentUserTeam?: string;
  addAppNotification: (
    targetUserId: string, 
    details: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ) => Promise<void>;
}

const GoalStatusBadge: React.FC<{ status: GoalStatus }> = ({ status }) => {
  let bgColor = 'bg-gray-200 dark:bg-gray-600';
  let textColor = 'text-gray-700 dark:text-gray-200';

  switch (status) {
    case 'Not Started': bgColor = 'bg-blue-100 dark:bg-blue-900'; textColor = 'text-blue-700 dark:text-blue-300'; break;
    case 'In Progress': bgColor = 'bg-yellow-100 dark:bg-yellow-900'; textColor = 'text-yellow-700 dark:text-yellow-300'; break;
    case 'Completed': bgColor = 'bg-green-100 dark:bg-green-900'; textColor = 'text-green-700 dark:text-green-300'; break;
    case 'On Hold': bgColor = 'bg-purple-100 dark:bg-purple-900'; textColor = 'text-purple-700 dark:text-purple-300'; break;
    case 'Cancelled': bgColor = 'bg-red-100 dark:bg-red-900'; textColor = 'text-red-700 dark:text-red-300'; break;
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

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
}

const initialNewGoalFormData: NewGoalFormData = {
  assignedToEmployeeId: '',
  title: '',
  description: '',
  targetValue: '100',
  unit: '',
  deadline: getEndOfWeek(),
  priority: 'Medium',
};

interface StandardGoalFormEntry {
  targetValue: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
}


const EmployeeGoalsPage: React.FC<EmployeeGoalsPageProps> = ({ currentUser, currentUserTeam, addAppNotification }) => {
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Single/Custom Goal Form
  const [showAddGoalForm, setShowAddGoalForm] = useState<boolean>(false);
  const [newGoalFormData, setNewGoalFormData] = useState<NewGoalFormData>(initialNewGoalFormData);
  
  const [selectableEmployees, setSelectableEmployees] = useState<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]>([]);
  const [selectedEmployeeForGoal, setSelectedEmployeeForGoal] = useState<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'> | null>(null);
  const [availableGoalTemplates, setAvailableGoalTemplates] = useState<GoalTemplate[]>([]); // For single goal form dropdown
  const [targetEmployeeExistingGoals, setTargetEmployeeExistingGoals] = useState<EmployeeGoal[]>([]);
  const [isLoadingTargetEmployeeGoals, setIsLoadingTargetEmployeeGoals] = useState<boolean>(false);

  // Standard Team Goals (Batch Form)
  const [showStandardGoalsSection, setShowStandardGoalsSection] = useState<boolean>(false);
  const [standardGoalsFormEntries, setStandardGoalsFormEntries] = useState<Record<string, StandardGoalFormEntry>>({});


  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;
  const canSetGoalsForOthers = currentUserRole && ['Super Admin', 'Admin', 'Leader', 'Sub-Leader'].includes(currentUserRole as UserRole);
  const keyTeamNames = Object.keys(TEAM_GOAL_TEMPLATES).filter(teamName => teamName !== "Default");


  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      setError("User ID not available. Cannot load goals.");
      return;
    }
    const loadPageData = async () => {
      setIsLoading(true);
      setError(null);
      setShowAddGoalForm(false); // Reset form visibility on user change
      setShowStandardGoalsSection(false);
      setSelectedEmployeeForGoal(null);

      try {
        const goalsPromise = fetchEmployeeGoals(currentUserId);
        let employeesPromise: Promise<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]> = Promise.resolve([]);
        if (canSetGoalsForOthers) {
          employeesPromise = fetchAllUsersForSelection();
        }
        
        const [fetchedGoals, fetchedEmployees] = await Promise.all([goalsPromise, employeesPromise]);
        
        setGoals(fetchedGoals);
        
        if (canSetGoalsForOthers) {
          let filteredEmployees = fetchedEmployees;
          if (currentUserRole === 'Leader' || currentUserRole === 'Sub-Leader') {
            filteredEmployees = fetchedEmployees.filter(emp => emp.team === currentUserTeam);
          }
          setSelectableEmployees(filteredEmployees);
        }

      } catch (err) {
        console.error('Failed to load employee goals page data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, [currentUserId, canSetGoalsForOthers, currentUserRole, currentUserTeam]);

  // Effect to manage data when selectedEmployeeForGoal changes (for both single and standard goal forms)
  useEffect(() => {
    const fetchDetailsForSelectedEmployee = async () => {
      if (selectedEmployeeForGoal) {
        setIsLoadingTargetEmployeeGoals(true);
        setStandardGoalsFormEntries({}); // Reset standard form entries

        let fetchedExistingGoalsFromApi: EmployeeGoal[] = [];
        try {
          fetchedExistingGoalsFromApi = await fetchEmployeeGoals(selectedEmployeeForGoal.id);
          setTargetEmployeeExistingGoals(fetchedExistingGoalsFromApi);
        } catch (err) {
          console.error(`Failed to fetch goals for ${selectedEmployeeForGoal.displayName}`, err);
          setTargetEmployeeExistingGoals([]);
        } finally {
          setIsLoadingTargetEmployeeGoals(false);
        }
        
        const teamName = selectedEmployeeForGoal.team || 'Default';
        const templatesForTeam = TEAM_GOAL_TEMPLATES[teamName] || TEAM_GOAL_TEMPLATES['Default'] || [];
        setAvailableGoalTemplates(templatesForTeam); // For single goal form

        // Initialize standardGoalsFormEntries if it's a key team
        if (keyTeamNames.includes(teamName)) {
          const initialStandardEntries: Record<string, StandardGoalFormEntry> = {};
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
          setStandardGoalsFormEntries(initialStandardEntries);
        }
        
        // Pre-fill single goal form if it's active and templates are available
        if (showAddGoalForm && templatesForTeam.length > 0) {
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
        setAvailableGoalTemplates([]);
        setTargetEmployeeExistingGoals([]);
        setStandardGoalsFormEntries({});
        // Reset single goal form if it was tied to a previously selected employee
        setNewGoalFormData(_prev => ({ ...initialNewGoalFormData, assignedToEmployeeId: ''})); 
      }
    };

    fetchDetailsForSelectedEmployee();
  }, [selectedEmployeeForGoal, showAddGoalForm]); // Re-run if showAddGoalForm changes to prefill correctly


  const handleEmployeeSelectionForGoal = (employeeId: string) => {
    const employee = selectableEmployees.find(emp => emp.id === employeeId);
    setSelectedEmployeeForGoal(employee || null);
    
    // Reset forms when employee changes
    setShowAddGoalForm(false);
    setShowStandardGoalsSection(false);
    setNewGoalFormData(_prev => ({ ...initialNewGoalFormData, assignedToEmployeeId: employeeId }));
    // standardGoalsFormEntries will be reset by the useEffect for selectedEmployeeForGoal
  };
  
  // For single/custom goal form's template dropdown
  const handleGoalTemplateSelection = (templateIndex: string) => {
      const index = parseInt(templateIndex, 10);
      if (availableGoalTemplates[index]) {
          const template = availableGoalTemplates[index];
          setNewGoalFormData(prev => ({
              ...prev,
              title: template.title,
              unit: template.unit,
              description: template.description || '',
          }));
      } else { 
           setNewGoalFormData(prev => ({ ...prev, title: '', unit: '', description: '' }));
      }
  };

  const handleNewGoalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewGoalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewGoal = async (e: FormEvent) => { // For single/custom goal
    e.preventDefault();
    if (!currentUserId || !newGoalFormData.assignedToEmployeeId) {
        alert("Cannot add goal: Current user or target employee ID is missing.");
        return;
    }
    const { assignedToEmployeeId, title, description, targetValue, unit, deadline, priority } = newGoalFormData;

    if (!title.trim() || !targetValue.trim() || !unit.trim() || !deadline) {
      alert('Please select an employee, a template or enter custom goal, and fill required fields (Title, Target Value, Unit, Deadline).');
      return;
    }
    
    const parsedTargetValue = parseFloat(targetValue);
    if (isNaN(parsedTargetValue)) {
      alert('Target Value must be a valid number.');
      return;
    }

    const goalDataToSave = {
      assignedToEmployeeId,
      setByUserId: currentUserId,
      title: title.trim(),
      description: description.trim(),
      targetValue: parsedTargetValue,
      unit: unit.trim(),
      deadline,
      priority,
    };

    try {
      const savedGoal = await addEmployeeGoalService(goalDataToSave);
      
      if (assignedToEmployeeId === currentUserId) {
        setGoals(prevGoals => [savedGoal, ...prevGoals]);
      }
      if (selectedEmployeeForGoal && assignedToEmployeeId === selectedEmployeeForGoal.id) {
        setTargetEmployeeExistingGoals(prev => [savedGoal, ...prev]);
      }
      
      alert(`New goal "${savedGoal.title}" added successfully for ${selectedEmployeeForGoal?.displayName || 'selected employee'}!`);
      
      await addAppNotification(assignedToEmployeeId, {
        type: 'new_target',
        title: 'New Goal Assigned',
        message: `A new goal "${savedGoal.title}" has been set for you by ${currentUser.displayName}.`,
        link: '#employee-goals' 
      });

      setShowAddGoalForm(false);
      setNewGoalFormData(initialNewGoalFormData); // Fully reset
      setSelectedEmployeeForGoal(null); // Deselect employee to reset context


    } catch (err) {
        alert(`Failed to add goal: ${(err as Error).message}`);
        console.error("Error adding goal:", err);
    }
  };

  const handleStandardGoalInputChange = (templateTitle: string, fieldName: keyof StandardGoalFormEntry, value: string) => {
    setStandardGoalsFormEntries(prev => ({
      ...prev,
      [templateTitle]: {
        ...prev[templateTitle],
        [fieldName]: value,
      },
    }));
  };

  const handleSaveStandardTeamGoals = async () => {
    if (!selectedEmployeeForGoal || !currentUserId) {
      alert("Selected employee or current user ID is missing.");
      return;
    }

    const teamName = selectedEmployeeForGoal.team || 'Default';
    const templatesForTeam = TEAM_GOAL_TEMPLATES[teamName] || TEAM_GOAL_TEMPLATES['Default'] || [];
    let goalsAddedCount = 0;

    for (const template of templatesForTeam) {
      const entry = standardGoalsFormEntries[template.title];
      if (entry && entry.targetValue.trim() !== "") { // If entry exists and targetValue is provided
        const isAlreadySet = targetEmployeeExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase());
        if (isAlreadySet) continue; // Skip if this specific template goal was somehow already set

        const parsedTargetValue = parseFloat(entry.targetValue);
        if (isNaN(parsedTargetValue)) {
          alert(`Invalid Target Value for goal "${template.title}". Please enter a number.`);
          continue; 
        }

        const goalDataToSave = {
          assignedToEmployeeId: selectedEmployeeForGoal.id,
          setByUserId: currentUserId,
          title: template.title,
          description: template.description || '',
          targetValue: parsedTargetValue,
          unit: template.unit,
          deadline: entry.deadline,
          priority: entry.priority,
        };

        try {
          const savedGoal = await addEmployeeGoalService(goalDataToSave);
          goalsAddedCount++;
          if (selectedEmployeeForGoal.id === currentUserId) { // If admin sets goal for themselves
            setGoals(prevGoals => [savedGoal, ...prevGoals]);
          }
           // Update targetEmployeeExistingGoals to reflect new addition for the UI
          setTargetEmployeeExistingGoals(prev => [savedGoal, ...prev]);
          
          await addAppNotification(selectedEmployeeForGoal.id, {
            type: 'new_target',
            title: 'New Goal Assigned',
            message: `A new goal "${savedGoal.title}" has been set for you by ${currentUser.displayName}.`,
            link: '#employee-goals',
          });
        } catch (err) {
          alert(`Failed to add standard goal "${template.title}": ${(err as Error).message}`);
        }
      }
    }

    if (goalsAddedCount > 0) {
      alert(`${goalsAddedCount} standard goal(s) added successfully for ${selectedEmployeeForGoal.displayName}!`);
    } else {
      alert(`No new standard goals were added for ${selectedEmployeeForGoal.displayName}. Ensure target values are filled for unset goals.`);
    }
    
    // Reset or update UI
    setShowStandardGoalsSection(false);
    // Re-fetch or re-initialize standardGoalsFormEntries based on newly updated targetEmployeeExistingGoals
    const updatedExistingGoals = [...targetEmployeeExistingGoals]; // Assume this is updated with new goals
    const newStandardEntries: Record<string, StandardGoalFormEntry> = {};
    templatesForTeam.forEach(template => {
        const isNowSet = updatedExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase());
        if (!isNowSet) {
            newStandardEntries[template.title] = {
                targetValue: '', 
                deadline: getEndOfWeek(),
                priority: 'Medium',
            };
        }
    });
    setStandardGoalsFormEntries(newStandardEntries);
     // setSelectedEmployeeForGoal(null); // Option: deselect employee after setting goals. For now, keep selected.

  };


  const calculateProgress = (current: number, target: number): number => {
    if (target <= 0) return current > 0 ? 100 : 0;
    const progress = (current / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
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
        setShowStandardGoalsSection(true);
        setShowAddGoalForm(false);
      } else {
        setShowAddGoalForm(true);
        setShowStandardGoalsSection(false);
        setNewGoalFormData(_prev => ({...initialNewGoalFormData, assignedToEmployeeId: selectedEmployeeForGoal.id}));
      }
    } else { // Not a key team, or default
      setShowAddGoalForm(true);
      setShowStandardGoalsSection(false);
      setNewGoalFormData(_prev => ({...initialNewGoalFormData, assignedToEmployeeId: selectedEmployeeForGoal.id}));
    }
  };

  const getButtonText = () => {
    if (!selectedEmployeeForGoal) return "+ Set New Goal";
    
    const teamName = selectedEmployeeForGoal.team || 'Default';
    if (keyTeamNames.includes(teamName)) {
      const teamTemplates = TEAM_GOAL_TEMPLATES[teamName] || [];
      const unsetStandardGoalsExist = teamTemplates.some(template => 
        !targetEmployeeExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase())
      );
      if (unsetStandardGoalsExist) return "Set Standard Team Goals";
    }
    return "Set Custom Goal";
  };


  if (isLoading) {
    return (
      <div className="p-6 flex-1 flex justify-center items-center dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 dark:border-red-400"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">Loading Goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex-1 text-center dark:bg-gray-950">
        <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">Error</h1>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex-1 bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {canSetGoalsForOthers ? "Manage Employee Goals" : "My Goals"}
          {currentUserTeam && !canSetGoalsForOthers && <span className="text-xl text-gray-500 dark:text-gray-400"> ({currentUserTeam})</span>}
        </h1>
        {canSetGoalsForOthers && (
          <button 
            onClick={() => {
                if (showAddGoalForm || showStandardGoalsSection) {
                    setShowAddGoalForm(false);
                    setShowStandardGoalsSection(false);
                    // setSelectedEmployeeForGoal(null); // Keep employee selected for now
                } else {
                    mainButtonAction();
                }
            }}
            className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg shadow hover:bg-red-600 dark:hover:bg-red-700 transition"
            aria-expanded={showAddGoalForm || showStandardGoalsSection}
          >
            {(showAddGoalForm || showStandardGoalsSection) ? 'Cancel Goal Creation' : getButtonText()}
          </button>
        )}
      </div>
      
      {canSetGoalsForOthers && (
        <div className="mb-6">
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
              {selectableEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.displayName} ({emp.team || 'No Team'})</option>
              ))}
            </select>
        </div>
      )}


      {/* Standard Team Goals Section */}
      {canSetGoalsForOthers && showStandardGoalsSection && selectedEmployeeForGoal && (
        <section id="standard-goals-section" className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Set Standard Goals for {selectedEmployeeForGoal.displayName}
          </h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Team: {selectedEmployeeForGoal.team || 'Default'}</p>
          
          {(TEAM_GOAL_TEMPLATES[selectedEmployeeForGoal.team || 'Default'] || []).length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No standard goal templates defined for this team.</p>
          )}

          <div className="space-y-6">
            {(TEAM_GOAL_TEMPLATES[selectedEmployeeForGoal.team || 'Default'] || []).map(template => {
              const isAlreadySet = targetEmployeeExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase());
              const entry = standardGoalsFormEntries[template.title];

              if (isAlreadySet) {
                return (
                  <div key={template.title} className="p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-lg">
                    <h3 className="font-medium text-green-700 dark:text-green-300">✓ {template.title} ({template.unit}) - Already Set</h3>
                    <p className="text-xs text-green-600 dark:text-green-400">{template.description}</p>
                  </div>
                );
              }
              
              if (!entry) return null; // Should not happen if initialized correctly for unset goals

              return (
                <div key={template.title} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-slate-50 dark:bg-gray-700/30">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">{template.title} ({template.unit})</h3>
                  {template.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{template.description}</p>}
                  
                  <div>
                    <label htmlFor={`std_target_${template.title}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300">Target Value <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      id={`std_target_${template.title}`}
                      value={entry.targetValue}
                      onChange={(e) => handleStandardGoalInputChange(template.title, 'targetValue', e.target.value)}
                      step="any"
                      className="mt-1 w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-300 dark:focus:border-red-500"
                      placeholder="e.g., 1000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`std_deadline_${template.title}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300">Deadline</label>
                      <input 
                        type="date" 
                        id={`std_deadline_${template.title}`}
                        value={entry.deadline}
                        onChange={(e) => handleStandardGoalInputChange(template.title, 'deadline', e.target.value)}
                        className="mt-1 w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-300 dark:focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`std_priority_${template.title}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300">Priority</label>
                      <select 
                        id={`std_priority_${template.title}`}
                        value={entry.priority}
                        onChange={(e) => handleStandardGoalInputChange(template.title, 'priority', e.target.value as 'Low'|'Medium'|'High')}
                        className="mt-1 w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-300 dark:focus:border-red-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(standardGoalsFormEntries).some(key => standardGoalsFormEntries[key].targetValue.trim() !== "") && (
             <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowStandardGoalsSection(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition">
                    Cancel
                </button>
                <button 
                    type="button" 
                    onClick={handleSaveStandardTeamGoals}
                    className="px-6 py-2 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition"
                >
                    Save All Pending Standard Goals
                </button>
             </div>
          )}
           {(Object.keys(standardGoalsFormEntries).length === 0 && (TEAM_GOAL_TEMPLATES[selectedEmployeeForGoal.team || 'Default'] || []).length > 0) && (
            <p className="mt-4 text-sm text-green-600 dark:text-green-400">All standard goals for this team are already set for {selectedEmployeeForGoal.displayName}.</p>
          )}
        </section>
      )}


      {/* Single/Custom Goal Form */}
      {canSetGoalsForOthers && showAddGoalForm && selectedEmployeeForGoal && (
        <section id="add-goal-form-section" className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Set Custom Goal for {selectedEmployeeForGoal.displayName}
          </h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Team: {selectedEmployeeForGoal.team || 'Default'}</p>
          <form onSubmit={handleAddNewGoal} className="space-y-4">
                <div>
                  <label htmlFor="goalTemplate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Goal Template (Optional - for {selectedEmployeeForGoal.team || 'Default'} team)
                    {isLoadingTargetEmployeeGoals && <span className="text-xs text-gray-500 dark:text-gray-400 italic ml-2">Loading template status...</span>}
                  </label>
                  <select 
                    name="goalTemplate" 
                    id="goalTemplate"
                    onChange={(e) => handleGoalTemplateSelection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500"
                    value={availableGoalTemplates.findIndex(t => t.title === newGoalFormData.title && t.unit === newGoalFormData.unit).toString()}
                  >
                     <option value="-1">-- Select a template or enter custom --</option>
                    {availableGoalTemplates.map((template, index) => {
                      const isSet = !isLoadingTargetEmployeeGoals && targetEmployeeExistingGoals.some(g => g.title.trim().toLowerCase() === template.title.trim().toLowerCase());
                      return (
                        <option key={index} value={index.toString()}>
                          {template.title} ({template.unit}) {isSet ? "✓ Already Set" : "(Not Set)"}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Goal Title <span className="text-red-500">*</span></label>
                  <input type="text" name="title" id="title" value={newGoalFormData.title} onChange={handleNewGoalInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Description (Optional)</label>
                  <textarea name="description" id="description" rows={3} value={newGoalFormData.description} onChange={handleNewGoalInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="targetValue" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Target Value <span className="text-red-500">*</span></label>
                    <input type="number" name="targetValue" id="targetValue" value={newGoalFormData.targetValue} onChange={handleNewGoalInputChange} required step="any" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500" />
                  </div>
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Unit <span className="text-red-500">*</span></label>
                    <input type="text" name="unit" id="unit" value={newGoalFormData.unit} onChange={handleNewGoalInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Deadline <span className="text-red-500">*</span></label>
                    <input type="date" name="deadline" id="deadline" value={newGoalFormData.deadline} onChange={handleNewGoalInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500" />
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Priority</label>
                    <select name="priority" id="priority" value={newGoalFormData.priority} onChange={handleNewGoalInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => { setShowAddGoalForm(false); setNewGoalFormData(initialNewGoalFormData); /* Keep employee selected */}} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition">
                    Save Custom Goal
                  </button>
                </div>
          </form>
        </section>
      )}

      {/* My Goals List */}
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4 mt-8">Goals Assigned to Me</h2>
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <p className="mt-2 text-gray-500 dark:text-gray-400">You currently have no goals assigned.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => {
            const progressPercentage = calculateProgress(goal.currentValue, goal.targetValue);
            const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'Completed';
            const assignedBy = selectableEmployees.find(u => u.id === goal.setByUserId)?.displayName || (goal.setByUserId === currentUserId ? 'Yourself' : 'System/Admin');
            
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-gray-700/50 transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">{goal.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-prose">{goal.description || "No description provided."}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                     <GoalPriorityBadge priority={goal.priority} />
                     <GoalStatusBadge status={goal.status} />
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Progress</span>
                    <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Goal progress: ${goal.title}`}>
                    <div className="bg-red-500 dark:bg-red-600 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3 mt-3">
                  <div>
                    <p>Deadline: <span className="font-medium text-gray-700 dark:text-gray-200">{formatDate(goal.deadline)}</span></p>
                    {goal.setByUserId !== goal.assignedToEmployeeId && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Set by: {assignedBy}
                        </p>
                    )}
                  </div>
                  <p className={`mt-2 sm:mt-0 font-semibold ${progressPercentage === 100 && goal.status === 'Completed' ? 'text-green-600 dark:text-green-400' : (isOverdue ? 'text-red-600 dark:text-red-400' : '')}`}>
                    {progressPercentage === 100 && goal.status === 'Completed' ? 'Achieved!' : (isOverdue ? 'Overdue' : '')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeGoalsPage;
