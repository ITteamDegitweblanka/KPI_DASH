import { 
    EmployeePerformanceData, WeeklyChartDataPoint, OverallPerformanceDataItem, 
    EmployeeGoal, Branch, AdminPanelUser, AdminPanelTeam, UserRole
} from '../../types'; // Updated path
import { apiService } from './api';

// TODO: Replace with your actual API base URL
// const API_BASE_URL = 'https://your-api-service.com/api/v1'; // Kept for context, but calls are simulated

// Example: Fetch user profile from backend
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await apiService.get<UserProfile>(`/users/me`);
  return response.data?.data || response.data;
};

// Example: Fetch employee performance data from backend
export const fetchEmployeePerformanceData = async (): Promise<EmployeePerformanceData[]> => {
  try {
    const response = await apiService.get<EmployeePerformanceData[]>(`/performance/employees`);
    const rawData = response.data?.data || response.data;

    // Use backend-calculated scores and metrics directly
    return (rawData || []).map((item: any) => ({
      ...item,
      metrics: item.metrics,
      totalScore: item.totalScore ?? (item.metrics?.total_score ?? 0)
    }));
  } catch (error) {
    console.error('Error fetching employee performance data:', error);
    throw new Error('Failed to fetch employee performance data. Please try again later.');
  }
};

// Example: Fetch weekly chart data from backend
export const fetchWeeklyChartData = async (): Promise<WeeklyChartDataPoint[]> => {
  const response = await apiService.get<WeeklyChartDataPoint[]>(`/performance/weekly-chart`);
  return response.data?.data || response.data;
};

// Example: Fetch overall performance data from backend
export const fetchOverallPerformanceData = async (): Promise<OverallPerformanceDataItem[]> => {
  const response = await apiService.get<OverallPerformanceDataItem[]>(`/performance/overall`);
  return response.data?.data || response.data;
};

// Example: Fetch all users for selection from backend
export const fetchAllUsersForSelection = async (): Promise<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]> => {
  const response = await apiService.get<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]>(`/users`);
  return response.data?.data || response.data;
};

// Example: Fetch employee goals from backend
export const fetchEmployeeGoals = async (employeeId: string): Promise<EmployeeGoal[]> => {
  const response = await apiService.get<EmployeeGoal[]>(`/goals/employee/${employeeId}`);
  return response.data?.data || response.data;
};

// Example: Add employee goal via backend
export const addEmployeeGoalService = async (
  goalData: Omit<EmployeeGoal, 'id' | 'status' | 'currentValue'>
): Promise<EmployeeGoal> => {
  const response = await apiService.post<EmployeeGoal>(`/goals`, goalData);
  return response.data?.data || response.data;
};

// Update employee goal (for achievement updates)
export const updateEmployeeGoalService = async (
  goalId: number | string,
  updateData: Partial<EmployeeGoal>
): Promise<EmployeeGoal> => {
  const response = await apiService.put<EmployeeGoal>(`/goals/${goalId}`, updateData);
  return response.data?.data || response.data;
};

// Service to mark a goal as achieved (status: 'Completed')
export const markGoalAsAchievedService = async (goalId: string): Promise<void> => {
  await apiService.put(`/goals/${goalId}`, { status: 'Completed' });
};

// --- Admin Panel Specific API Calls ---

export const fetchBranches = async (): Promise<Branch[]> => {
  // Real API call to backend
  const response = await apiService.get<Branch[]>(`/branches`);
  // Accept both array and { data: array } formats
  const branches = Array.isArray(response.data) ? response.data : (response.data?.data || response.data);
  if (Array.isArray(branches)) {
    return branches.map((branch: any) => ({
      id: branch.id,
      name: branch.name,
      location: branch.location || 'N/A',
      employeeCount: branch.employeeCount || 0
    }));
  }
  throw new Error('Failed to fetch branches');
};

export const addBranch = async (branchData: Omit<Branch, 'id'>): Promise<Branch> => {
  // Real API call to backend
  const response = await apiService.post<Branch>(`/branches`, branchData);
  // Accept both object and { data: object } formats
  const branch = response.data?.data || response.data;
  if (branch && branch.id) {
    return {
      id: branch.id,
      name: branch.name,
      location: branch.location || 'N/A',
      employeeCount: branch.employeeCount || 0
    };
  }
  throw new Error('Failed to add branch');
};

export const fetchAdminUsers = async (): Promise<AdminPanelUser[]> => {
  // Real API call to backend
  const response = await apiService.get<AdminPanelUser[]>(`/users`);
  // If backend returns array directly
  const users = Array.isArray(response.data) ? response.data : (response.data.data || []);
  return users.map((user: any) => ({
    id: user.id,
    name: user.displayName || user.name || '',
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    teamId: user.teamId,
    // Add more fields as needed
  }));
};

export const addAdminUser = async (userData: Omit<AdminPanelUser, 'id'>): Promise<AdminPanelUser> => {
  // Real API call to backend
  const response = await apiService.post<AdminPanelUser>(`/users`, userData);
  const user = response.data?.data || response.data;
  if (user && user.id) {
    return user;
  }
  throw new Error('Failed to add user');
};

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<AdminPanelUser> => {
  console.warn(`Simulating API call: updateUserRole for user ${userId} to ${newRole}. Simulating success.`);
  return Promise.resolve({
    id: userId,
    name: `Updated User (Simulated)`, 
    email: 'updated.user@example.com', 
    role: newRole,
  });
};

export const updateUser = async (userId: string, userData: Partial<AdminPanelUser>): Promise<AdminPanelUser> => {
  const response = await apiService.put<AdminPanelUser>(`/users/${userId}`, userData);
  return response.data?.data || response.data;
};

export const fetchAdminTeams = async (): Promise<AdminPanelTeam[]> => {
  // Real API call to backend
  const response = await apiService.get<AdminPanelTeam[]>(`/teams`);
  // If backend returns array directly
  const teams = Array.isArray(response.data) ? response.data : (response.data.data || []);
  return teams.map((team: any) => ({
    id: String(team.id),
    teamName: team.name || '', // Always set for UI compatibility
    description: team.description || '',
    branchId: team.branchId ? String(team.branchId) : '',
    assignedBranchId: team.branchId ? String(team.branchId) : '',
  }));
};

export const addAdminTeam = async (teamData: { name: string; description: string; branchId: string }): Promise<AdminPanelTeam> => {
  // Real API call to backend
  const response = await apiService.post(`/teams`, {
    name: teamData.name,
    description: teamData.description,
    branchId: teamData.branchId
  });
  // Defensive: ensure response shape is correct
  const team: any = response.data?.data || response.data;
  if (team && team.id) {
    return {
      id: String(team.id),
      description: team.description || '',
      assignedBranchId: team.branchId ? String(team.branchId) : '',
      teamName: team.name || '',
    };
  }
  throw new Error('Failed to add team');
};

export const assignUserToTeam = async (userId: string, teamId: string): Promise<{ message: string }> => {
  console.log('[assignUserToTeam] Request:', { userId, teamId });
  try {
    const response = await apiService.post(`/user-teams/assign`, { userId, teamId });
    console.log('[assignUserToTeam] Response:', response);
    const msg = response.data?.message || 'User assigned to team';
    return { message: msg };
  } catch (err) {
    console.error('[assignUserToTeam] Error:', err);
    throw err;
  }
};

export const assignUserToTeams = async (userId: string, teamIds: string[]): Promise<{ message: string }> => {
  const response = await apiService.post(`/user-teams/assign`, { userId, teamIds });
  return { message: response.data?.message || 'Teams assigned' };
};

export const removeUserFromTeam = async (userId: string, teamId: string): Promise<{ message: string }> => {
  const response = await apiService.post(`/user-teams/remove`, { userId, teamId });
  const msg = response.data?.message || 'User removed from team';
  return { message: msg };
};

export const fetchAllUserTeamAssignments = async (): Promise<Array<{ userId: string; userName: string; teamId: string; teamName: string }>> => {
  const response = await apiService.get('/user-teams/assignments');
  const data = Array.isArray(response.data)
    ? response.data
    : response.data.data;
  return data as Array<{ userId: string; userName: string; teamId: string; teamName: string }>;

};

export const fetchUsersByBranch = async (branchId: string): Promise<AdminPanelUser[]> => {
  const response = await apiService.get<AdminPanelUser[]>(`/user-teams/branch/${branchId}`);
  return Array.isArray(response.data) ? response.data : (response.data.data || []);
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiService.delete(`/users/${userId}`);
};

export const deleteBranch = async (branchId: string): Promise<void> => {
  await apiService.delete(`/branches/${branchId}`);
};

// Minimal UserProfile type for local use
interface UserProfile {
  id: string;
  displayName: string;
  team: string;
  role: UserRole;
  title?: string;
  // Add more fields as needed
}
