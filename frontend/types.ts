import React from 'react';

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
  department: string;
  team: string;
  title: string; // e.g. Sales Manager
}

export interface EmployeePerformanceData {
  employee: Employee;
  target: number; // Weekly target
  targetAchievedPercentage: number; // Weekly achievement
  totalScore: number; // Weekly score
  isPerformerOfTheWeek: boolean;
  monthlyTargetValue?: number; // Monthly sales target value
  monthlyTargetAchievedPercentage?: number; // Percentage of monthly target achieved
  monthlyNetSales?: number; // Actual net sales for the month
}

export interface WeeklyChartDataPoint {
  name: string; // Day e.g., 'Mon'
  performance: number;
}

export interface SummaryKPI {
  id:string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string; // e.g. "+5%"
  changeType?: 'positive' | 'negative';
}

export interface SidebarNavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  roles?: UserRole[]; // Optional: specify roles that can see this item
}

export interface TeamComparisonDataPoint {
  name: string; // Team name
  score: number; // Average or total score for the team
}

export interface OverallPerformanceDataItem {
  id: string;
  employee_name: string;
  team_name: string;
  performance_percentage: number;
}

// User Roles
export type UserRole = 'Super Admin' | 'Admin' | 'Leader' | 'Sub-Leader' | 'Staff';

// For Profile Page
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface IdentityDocument {
  id: string;
  name: string;
  status: 'Verified' | 'Pending Review' | 'Rejected' | 'Not Uploaded';
  fileName?: string;
  lastUpdated?: string;
}

// UserProfile interface has been moved to src/types/auth.ts

// For Employee Goals Page
export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';

export interface EmployeeGoal {
  id: string;
  assignedToEmployeeId: string; // ID of the employee the goal is for
  setByUserId: string;          // ID of the user who set the goal
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., "$", "projects", "tasks", "%"
  deadline: string; // YYYY-MM-DD
  status: GoalStatus;
  priority: 'Low' | 'Medium' | 'High';
}

export interface GoalTemplate {
  title: string;
  unit: string;
  description?: string; // Optional default description
}

export interface TeamSpecificGoalTemplates {
  [teamName: string]: GoalTemplate[];
}


// For Admin Panel
export interface Branch {
  id: string;
  name: string;
  location: string;
  employeeCount: number;
}

export interface AdminPanelUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AdminPanelTeam {
  id: string;
  teamName: string;
  description: string;
  assignedBranchId: string;
}

// For Settings Page
export interface UserSettings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  dataRefreshInterval: 5 | 10 | 15 | 30; // in minutes
  language: 'en' | 'es' | 'fr';
}

export const USER_ROLES_HIERARCHY: UserRole[] = ['Super Admin', 'Admin', 'Leader', 'Sub-Leader', 'Staff'];

// For Notifications
export type NotificationType = 'new_target' | 'target_reached' | 'general_update' | 'admin_action' | 'goal_updated';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO Date string
  isRead: boolean;
  link?: string; // e.g., "#employee-goals/goal_id_123"
  icon?: React.ReactNode; // Optional: specific to type, resolved in NotificationItem
}

export const getRelativeTime = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Average days in month
  const years = Math.round(days / 365.25); // Account for leap years

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`; // Up to 4 weeks
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};