import { UserRole } from './common';

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  position: string;
  displayName: string;
  title?: string;
  avatarUrl: string;
  team?: string;
  joinDate?: string;
  lastActive?: string;
  workEmail: string;
  phoneNumber: string;
  dateOfBirth: string;
  hireDate: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  identityDocuments?: Array<{
    type: string;
    number: string;
    expiryDate?: string;
    issuedBy?: string;
  }>;
  accessibilityNeeds?: string[];
  skills?: string[];
  certifications?: string[];
  languages?: Array<{
    name: string;
    proficiency: 'Basic' | 'Intermediate' | 'Fluent' | 'Native';
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
