import { 
    EmployeePerformanceData, WeeklyChartDataPoint, OverallPerformanceDataItem, 
    EmployeeGoal, Branch, AdminPanelUser, AdminPanelTeam, UserRole,
    Notification, GoalStatus, Employee
} from '../../types'; // Updated path
import type { UserProfile } from '../../types/auth';

// TODO: Replace with your actual API base URL
// const API_BASE_URL = 'https://your-api-service.com/api/v1'; // Kept for context, but calls are simulated

// --- In-memory store for Notifications (Simulation) ---
let activeNotifications: Notification[] = [];
// --- End Notification Store ---

// --- In-memory store for Employee Goals (Simulation) ---
let activeGoals: EmployeeGoal[] = [
    // {
    //   id: 'goal_init_1',
    //   assignedToEmployeeId: 'user_dynamic_001', // Matches the dynamic user for testing
    //   setByUserId: 'admin_system_id',
    //   title: 'Initial Sales Quota',
    //   description: 'Meet the initial sales quota for the quarter.',
    //   targetValue: 50000,
    //   currentValue: 15000,
    //   unit: '$',
    //   deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days from now
    //   status: 'In Progress',
    //   priority: 'High',
    // },
    // {
    //   id: 'goal_init_2',
    //   assignedToEmployeeId: 'user_dynamic_001',
    //   setByUserId: 'admin_system_id',
    //   title: 'Client Onboarding Efficiency',
    //   description: 'Successfully onboard 10 new clients this month.',
    //   targetValue: 10,
    //   currentValue: 3,
    //   unit: 'clients',
    //   deadline: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0], // 20 days from now
    //   status: 'Not Started',
    //   priority: 'Medium',
    // }
];
// --- End Goals Store ---

// --- In-memory store for All Users (for goal assignment selection) ---
const MOCK_ALL_EMPLOYEES_FOR_GOALS: Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[] = [
  { id: 'user_dynamic_001', displayName: 'Dynamic User (Admin)', team: 'Management', role: 'Admin' },
  { id: 'user_staff_001', displayName: 'Alice Wonderland', team: 'Sales', role: 'Staff' },
  { id: 'user_staff_002', displayName: 'Bob The Builder', team: 'Sales', role: 'Staff' },
  { id: 'user_leader_001', displayName: 'Charlie Brown (Sales Leader)', team: 'Sales', role: 'Leader'},
  { id: 'user_staff_003', displayName: 'Diana Prince', team: 'Ads', role: 'Staff' },
  { id: 'user_subleader_001', displayName: 'Edward Scissorhands (Ads Sub-Leader)', team: 'Ads', role: 'Sub-Leader' },
  { id: 'user_staff_004', displayName: 'Fiona Gallagher', team: 'Website Ads', role: 'Staff' },
  { id: 'user_staff_005', displayName: 'George Jetson', team: 'Portfolio', role: 'Staff' },
];
// --- End All Users Store ---


export const fetchUserProfile = async (): Promise<UserProfile> => {
  console.log('Simulating fetching user profile...');
  return new Promise((resolve) => {
    setTimeout(() => {
      // Example: if you log in with a user who should be a leader to test team-specific goal assignment
      const profile: UserProfile = {
        id: 'user_dynamic_001', 
        displayName: 'Dynamic User',
        title: 'System Administrator', 
        workEmail: 'dynamic.user@example.com',
        phoneNumber: '+1-555-0000',
        dateOfBirth: '1990-01-01',
        nationality: 'Canadian',
        address: '100 Dynamic Way, Ottawa, ON',
        avatarUrl: 'https://picsum.photos/seed/dynamicuser/100/100',
        role: 'Admin', 
        team: 'Management', // Default team for Admin, can be overridden for specific test users
        // Example for a Leader role to test team-specific goal assignment:
        // role: 'Leader',
        // team: 'Sales', 
        emergencyContacts: [ { id: 'ec_dyn_1', name: 'Jane Doe', relationship: 'Partner', phone: '+1-555-0001'} ],
        identityDocuments: [ {id: 'id_dyn_1', name: 'Passport', status: 'Verified', fileName: 'passport.pdf', lastUpdated: '2023-05-10'}],
        accessibilityNeeds: 'None',
      };
      resolve(profile);
    }, 300);
  });
};

// --- Mock Employees for Performance Data ---
const mockEmployees: Employee[] = [
  { id: 'emp_001', name: 'Elena Rodriguez', avatarUrl: 'https://picsum.photos/seed/elena/100/100', department: 'Sales', team: 'Alpha', title: 'Sales Lead' },
  { id: 'emp_002', name: 'Marcus Chen', avatarUrl: 'https://picsum.photos/seed/marcus/100/100', department: 'Marketing', team: 'Bravo', title: 'Marketing Specialist' },
  { id: 'emp_003', name: 'Aisha Khan', avatarUrl: 'https://picsum.photos/seed/aisha/100/100', department: 'Sales', team: 'Alpha', title: 'Account Executive' },
  { id: 'emp_004', name: 'David Miller', avatarUrl: 'https://picsum.photos/seed/david/100/100', department: 'Operations', team: 'Charlie', title: 'Operations Manager' },
  { id: 'emp_005', name: 'Sophia Lee', avatarUrl: 'https://picsum.photos/seed/sophia/100/100', department: 'Sales', team: 'Bravo', title: 'Sales Associate' },
];
// --- End Mock Employees ---

export const fetchEmployeePerformanceData = async (): Promise<EmployeePerformanceData[]> => {
  console.warn('Simulating API call: fetchEmployeePerformanceData. Returning MOCK data for demonstration.');
  // This is a temporary re-introduction of mock data to demonstrate the "Star of the Month" feature.
  // In a real application, this data would come from a backend API.
  
  const performanceData: EmployeePerformanceData[] = mockEmployees.map((emp, index) => {
    const isPerformer = emp.id === 'emp_001'; // Elena will be Performer of the Week
    const isStarCandidate = emp.department === 'Sales'; // Only sales people for Star of the Month for this mock

    let monthlyTargetAchievedPerc = 0;
    let monthlyNetSalesVal = 0;

    if (isStarCandidate) {
        monthlyTargetAchievedPerc = Math.floor(80 + Math.random() * 50); // 80% to 130%
        monthlyNetSalesVal = Math.floor(30000 + Math.random() * 40000); // $30k to $70k
    }
    
    // Specific setup for Elena (emp_001)
    if (emp.id === 'emp_001') { // Elena
        monthlyTargetAchievedPerc = 115; // Achieved target
        monthlyNetSalesVal = 65000; // High sales
    }
    // Specific setup for Aisha (emp_003)
    if (emp.id === 'emp_003') { // Aisha
        monthlyTargetAchievedPerc = 105; // Achieved target
        monthlyNetSalesVal = 70000; // Highest sales, to become Star of the Month
    }
     // Specific setup for Sophia (emp_005)
    if (emp.id === 'emp_005') { // Sophia
        monthlyTargetAchievedPerc = 95; // Did not achieve target
        monthlyNetSalesVal = 68000; // High sales but target not met
    }


    return {
      employee: emp,
      target: Math.floor(10000 + Math.random() * 5000), // Weekly target
      targetAchievedPercentage: Math.floor(70 + Math.random() * 60), // 70% to 130%
      totalScore: isPerformer ? 10 : Math.floor(6 + Math.random() * 4), // Random score, Elena gets 10
      isPerformerOfTheWeek: isPerformer,
      monthlyTargetValue: isStarCandidate ? 50000 : undefined,
      monthlyTargetAchievedPercentage: isStarCandidate ? monthlyTargetAchievedPerc : undefined,
      monthlyNetSales: isStarCandidate ? monthlyNetSalesVal : undefined,
    };
  });

  return Promise.resolve(performanceData);
};


export const fetchWeeklyChartData = async (): Promise<WeeklyChartDataPoint[]> => {
  console.warn('Simulating API call: fetchWeeklyChartData. Returning empty array.');
  return Promise.resolve([]);
};

export const fetchOverallPerformanceData = async (): Promise<OverallPerformanceDataItem[]> => {
  console.warn('Simulating API call: fetchOverallPerformanceData. Returning empty array.');
  return Promise.resolve([]);
};

export const fetchAllUsersForSelection = async (): Promise<Pick<UserProfile, 'id' | 'displayName' | 'team' | 'role'>[]> => {
  console.log('Simulating API: Fetching all users for goal assignment selection.');
  await new Promise(resolve => setTimeout(resolve, 250));
  return Promise.resolve(MOCK_ALL_EMPLOYEES_FOR_GOALS);
};

export const fetchEmployeeGoals = async (employeeId: string): Promise<EmployeeGoal[]> => {
  console.log(`Simulating API call: fetchEmployeeGoals for employee ${employeeId}.`);
  if (!employeeId) {
    console.warn('Cannot fetch goals without an employee ID.');
    return Promise.resolve([]);
  }
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  const userGoals = activeGoals.filter(goal => goal.assignedToEmployeeId === employeeId);
  return Promise.resolve(userGoals);
};

export const addEmployeeGoalService = async (
  goalData: Omit<EmployeeGoal, 'id' | 'status' | 'currentValue'>
): Promise<EmployeeGoal> => {
  console.log('Simulating API: Adding new employee goal', goalData);
  await new Promise(resolve => setTimeout(resolve, 200));
  const newGoal: EmployeeGoal = {
    ...goalData,
    id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    currentValue: 0,
    status: 'Not Started' as GoalStatus,
  };
  activeGoals.unshift(newGoal);
  return newGoal;
};


// --- Admin Panel Specific API Calls ---

export const fetchBranches = async (): Promise<Branch[]> => {
  console.warn('Simulating API call: fetchBranches. Returning empty array.');
  return Promise.resolve([]);
};

export const addBranch = async (branchData: Omit<Branch, 'id'>): Promise<Branch> => {
  console.warn('Simulating API call: addBranch. Simulating success.', branchData);
  const newBranch: Branch = {
    id: `branch_${Date.now()}`,
    ...branchData,
  };
  return Promise.resolve(newBranch);
};

export const fetchAdminUsers = async (): Promise<AdminPanelUser[]> => {
  console.warn('Simulating API call: fetchAdminUsers. Returning MOCK_ALL_EMPLOYEES_FOR_GOALS.');
  // For AdminPanel, we can reuse MOCK_ALL_EMPLOYEES_FOR_GOALS format if it's compatible
  // Assuming AdminPanelUser is compatible with Pick<UserProfile, 'id' | 'name' -> 'displayName' | 'email' | 'role'>
  // If not, this needs a separate mock or transformation
  const adminUsers: AdminPanelUser[] = MOCK_ALL_EMPLOYEES_FOR_GOALS.map(u => ({
    id: u.id,
    name: u.displayName,
    email: `${u.displayName.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Mock email
    role: u.role,
  }));
  return Promise.resolve(adminUsers);
};

export const addAdminUser = async (userData: Omit<AdminPanelUser, 'id'>): Promise<AdminPanelUser> => {
  console.warn('Simulating API call: addAdminUser. Simulating success.', userData);
  const newUser: AdminPanelUser = {
    id: `user_${Date.now()}`,
    ...userData,
  };
  // Also add to MOCK_ALL_EMPLOYEES_FOR_GOALS for consistency if this user might get goals
  MOCK_ALL_EMPLOYEES_FOR_GOALS.push({
    id: newUser.id,
    displayName: newUser.name,
    team: 'Unassigned', // Default team, admin might assign later
    role: newUser.role,
  });
  return Promise.resolve(newUser);
};

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<AdminPanelUser> => {
  console.warn(`Simulating API call: updateUserRole for user ${userId} to ${newRole}. Simulating success.`);
  const userToUpdate = MOCK_ALL_EMPLOYEES_FOR_GOALS.find(u => u.id === userId);
  if (userToUpdate) {
    userToUpdate.role = newRole;
  }
  return Promise.resolve({
    id: userId,
    name: userToUpdate?.displayName || 'Updated User (Simulated)', 
    email: 'updated.user@example.com', 
    role: newRole,
  });
};


export const fetchAdminTeams = async (): Promise<AdminPanelTeam[]> => {
  console.warn('Simulating API call: fetchAdminTeams. Returning empty array.');
  return Promise.resolve([]);
};

export const addAdminTeam = async (teamData: Omit<AdminPanelTeam, 'id'>): Promise<AdminPanelTeam> => {
  console.warn('Simulating API call: addAdminTeam. Simulating success.', teamData);
  const newTeam: AdminPanelTeam = {
    id: `team_${Date.now()}`,
    ...teamData,
  };
  return Promise.resolve(newTeam);
};

// --- Notification Service Functions (Simulated) ---

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  console.log(`Simulating API: Fetching notifications for user ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
  return activeNotifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addNotificationService = async (
  notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
): Promise<Notification> => {
  console.log('Simulating API: Adding notification', notificationData);
  await new Promise(resolve => setTimeout(resolve, 100));
  const newNotification: Notification = {
    ...notificationData,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  activeNotifications.unshift(newNotification); // Add to the beginning for newest first
  return newNotification;
};

export const markNotificationAsReadService = async (notificationId: string): Promise<boolean> => {
  console.log(`Simulating API: Marking notification ${notificationId} as read`);
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = activeNotifications.findIndex(n => n.id === notificationId);
  if (index > -1) {
    activeNotifications[index].isRead = true;
    return true;
  }
  return false;
};

export const markAllNotificationsAsReadService = async (userId: string): Promise<boolean> => {
  console.log(`Simulating API: Marking all notifications for user ${userId} as read`);
  await new Promise(resolve => setTimeout(resolve, 100));
  activeNotifications.forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  return true;
};

export const clearNotificationService = async (notificationId: string): Promise<boolean> => {
  console.log(`Simulating API: Clearing notification ${notificationId}`);
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = activeNotifications.length;
  activeNotifications = activeNotifications.filter(n => n.id !== notificationId);
  return activeNotifications.length < initialLength;
};

export const clearAllNotificationsService = async (userId: string): Promise<boolean> => {
  console.log(`Simulating API: Clearing all notifications for user ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  const initialLength = activeNotifications.length;
  activeNotifications = activeNotifications.filter(n => n.userId !== userId);
  return activeNotifications.length < initialLength;
};
