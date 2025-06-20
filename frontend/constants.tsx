import { 
  HomeIcon, ChartBarIcon, ListBulletIcon, UserCircleIcon, CogIcon, AdjustmentsHorizontalIcon, ArrowLeftOnRectangleIcon
} from './src/components/icons/Icons'; // Updated path
import { SidebarNavItem, TeamSpecificGoalTemplates } from './types';
import { UserProfile } from './src/types/auth';


export const APP_TITLE = "KpiDash";

export const SIDEBAR_TOP_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: <HomeIcon />, href: '#dashboard' },
  { id: 'performance', name: 'Performance', icon: <ChartBarIcon />, href: '#performance' },
  { id: 'employeeGoals', name: 'Employee Goals', icon: <ListBulletIcon />, href: '#employeeGoals' },
  { id: 'profile', name: 'My Profile', icon: <UserCircleIcon />, href: '#profile' },
];

export const SIDEBAR_BOTTOM_ITEMS: SidebarNavItem[] = [
  { id: 'admin-panel', name: 'Admin Panel', icon: <AdjustmentsHorizontalIcon />, href: '#admin-panel', roles: ['Super Admin', 'Admin', 'Leader', 'Sub-Leader'] },
  { id: 'settings', name: 'Settings', icon: <CogIcon />, href: '#settings' },
  { id: 'logout', name: 'Log Out', icon: <ArrowLeftOnRectangleIcon />, href: '#logout' },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'default_user_000',
  name: 'Guest User',
  email: 'guest@example.com',
  role: 'Staff',
  department: 'Unassigned',
  position: 'Employee',
  displayName: 'Guest User',
  title: 'Employee',
  avatarUrl: 'https://picsum.photos/seed/guest/100/100',
  team: 'Unassigned',
  workEmail: 'guest@example.com',
  phoneNumber: 'N/A',
  dateOfBirth: '1990-01-01',
  hireDate: new Date().toISOString().split('T')[0],
  nationality: 'N/A',
  address: {
    street: 'N/A',
    city: 'N/A',
    state: 'N/A',
    country: 'N/A',
    postalCode: 'N/A'
  },
  emergencyContacts: [],
  identityDocuments: [],
  accessibilityNeeds: ['None'],
  skills: [],
  certifications: [],
  languages: []
};

// For EmployeeGoalsPage > Team-Specific Goal Templates
export const TEAM_GOAL_TEMPLATES: TeamSpecificGoalTemplates = {
  "Sales": [
    { title: "Monthly Sales Target", unit: "$", description: "Achieve the target monthly sales revenue." },
    { title: "New Leads Generated", unit: "leads", description: "Generate the target number of new qualified leads." },
    { title: "Average Deal Size", unit: "$", description: "Increase the average value of closed deals." },
    { title: "Selling Cost Target", unit: "%", description: "Maintain selling costs below the target percentage of revenue." },
    { title: "Average Order Value (AOV) Target", unit: "$", description: "Increase the average order value for sales." }
  ],
  "Ads": [
    { title: "Ad Campaign Sales Target", unit: "$", description: "Achieve the target sales revenue from ad campaigns." },
    { title: "Click-Through Rate (CTR)", unit: "%", description: "Improve the CTR for key ad campaigns." },
    { title: "Advertising Cost of Sales (ACOS) Target", unit: "%", description: "Optimize ACOS to meet the target percentage." },
    { title: "Ad Campaign Average Order Value (AOV)", unit: "$", description: "Increase the AOV from ad campaigns." }
  ],
  "Website Ads": [
    { title: "Website Ad Revenue Target", unit: "$", description: "Generate target revenue from website advertisements." },
    { title: "Return on Ad Spend (ROAS) Target", unit: "x", description: "Achieve the target ROAS for website ad campaigns." },
    { title: "Website Ad Conversion Rate", unit: "%", description: "Improve the conversion rate of website ads." },
    { title: "Website Ad AOV Target", unit: "$", description: "Increase the AOV from website ad conversions." }
  ],
  "Portfolio": [
    { title: "Portfolio Sales vs Target", unit: "%", description: "Achieve target percentage of portfolio sales against projections." },
    { title: "Client Retention Rate", unit: "%", description: "Maintain or improve the client retention rate." },
    { title: "Sales Trend Performance", unit: "Trend", description: "Demonstrate positive sales trend performance over the period." },
    { title: "Client Conversion Rate", unit: "%", description: "Improve the conversion rate for portfolio clients." }
  ],
   "Management": [ // Fallback for teams not explicitly defined
    { title: "Team Performance Improvement", unit: "%", description: "Improve overall team performance by a target percentage." },
    { title: "Budget Adherence", unit: "%", description: "Maintain departmental budget adherence within target limits." },
    { title: "Strategic Initiative Completion", unit: "milestones", description: "Complete milestones for key strategic initiatives." }
  ]
};

export const TEAM_GOAL_METRICS = {
  Ads: [
    "Weekly Target (Sales)", "Weekly Achievement (Sales)",
    "Weekly Target (Sales Trend %)", "Weekly Achievement (Sales Trend %)",
    "Weekly Target (Conversion Rate %)", "Weekly Achievement (Conversion Rate %)",
    "Weekly Target (AOV)", "Weekly Achievement (AOV)",
    "Sales Achievement %", "Sales Score", "Sales Trend % Score", "Conversion Rate % Score", "AOV Score", "Total Score"
  ],
  Sales: [
    "Weekly Target (Sales)", "Weekly Achievement (Sales)",
    "Weekly Target (Selling Cost %)", "Weekly Achievement (Selling Cost %)",
    "Weekly Target (AOV)", "Weekly Achievement (AOV)",
    "Sales Achievement %", "Sales Score", "Selling Cost % Score", "AOV Score", "Total Score"
  ],
  "Website Ads": [
    "Weekly Target (Sales)", "Weekly Achievement (Sales)",
    "Weekly Target (ROAS %)", "Weekly Achievement (ROAS %)",
    "Weekly Target (AOV)", "Weekly Achievement (AOV)",
    "Sales Achievement %", "Sales Score", "ROAS % Score", "AOV Score", "Total Score"
  ],
  "Portfolio Holders": [
    "Weekly Target (Sales)", "Weekly Achievement (Sales)",
    "Weekly Target (Sales Trend %)", "Weekly Achievement (Sales Trend %)",
    "Weekly Target (Conversion Rate %)", "Weekly Achievement (Conversion Rate %)",
    "Sales Achievement %", "Sales Score", "Sales Trend % Score", "Conversion Rate % Score", "Total Score"
  ]
};
