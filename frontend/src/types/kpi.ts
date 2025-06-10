export interface KPIMetric {
  id: string;
  name: string;
  target: number;
  weight: number;
  currentValue?: number;
  progress?: number;
  unit?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  team: string;
  position: string;
  department: string;
  avatar?: string;
}

export interface TeamKPI {
  teamId: string;
  teamName: string;
  overallScore: number;
  metrics: KPIMetric[];
  teamMembers?: TeamMember[];
}

export interface EmployeeKPI {
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  overallScore: number;
  metrics: KPIMetric[];
}
