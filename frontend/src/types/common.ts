import React from 'react';
import { TeamKPI } from './kpi';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  link?: string;
}

export type UserRole = 'Super Admin' | 'Admin' | 'Leader' | 'Sub-Leader' | 'Staff';

export interface SidebarNavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

export interface DashboardProps {
  teamKPI: TeamKPI | null;
  isLoading: boolean;
  error: string | null;
}
