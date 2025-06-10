import { API_ENDPOINTS } from '../config/api';
import { apiService } from './api';

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

class KpiService {
  public async getTeamKPI(teamId?: string): Promise<TeamKPI | null> {
    try {
      const url = teamId 
        ? `${API_ENDPOINTS.KPI.TEAM}?teamId=${teamId}`
        : API_ENDPOINTS.KPI.TEAM;
      
      // The API service returns the response with data property
      const response = await apiService.get<any>(url);
      // Extract the data property from the response
      return response?.data?.data || response?.data || null;
    } catch (error: any) {
      // If it's a 404, the endpoint doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('KPI endpoint not implemented yet, returning null');
        return null;
      }
      console.error('Failed to fetch team KPI:', error);
      throw error;
    }
  }

  public async getEmployeeKPI(employeeId: string): Promise<EmployeeKPI | null> {
    try {
      const response = await apiService.get<any>(
        API_ENDPOINTS.KPI.EMPLOYEE(employeeId)
      );
      // Extract the data property from the response
      return response?.data?.data || response?.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Employee KPI endpoint not implemented yet, returning null');
        return null;
      }
      console.error('Failed to fetch employee KPI:', error);
      throw error;
    }
  }

  public async getKPIMetric(metricId: string): Promise<KPIMetric | null> {
    try {
      const response = await apiService.get<any>(
        `${API_ENDPOINTS.KPI.BASE}/${metricId}`
      );
      // Extract the data property from the response
      return response?.data?.data || response?.data || null;
    } catch (error) {
      console.error('Failed to fetch KPI metric:', error);
      throw error;
    }
  }

  public async updateKPI(
    kpiId: string, 
    data: { value: number; notes?: string }
  ): Promise<KPIMetric | null> {
    try {
      const response = await apiService.put<any>(
        `${API_ENDPOINTS.KPI.BASE}/${kpiId}`,
        data
      );
      // Extract the data property from the response
      return response?.data?.data || response?.data || null;
    } catch (error) {
      console.error('Failed to update KPI:', error);
      throw error;
    }
  }
}

export const kpiService = new KpiService();
