export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  SUB_LEADER = 'SUB_LEADER',
  MEMBER = 'MEMBER'
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IUserInputDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface IUserUpdateDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IAuthTokens {
  access: {
    token: string;
    expires: Date;
  };
  refresh: {
    token: string;
    expires: Date;
  };
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  tokens: IAuthTokens;
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  PERFORMANCE = 'PERFORMANCE',
  ALERT = 'ALERT',
  UPDATE = 'UPDATE',
  OTHER = 'OTHER'
}

export enum PerformanceRating {
  EXCEEDS_EXPECTATIONS = 'EXCEEDS_EXPECTATIONS',
  MEETS_EXPECTATIONS = 'MEETS_EXPECTATIONS',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  UNSATISFACTORY = 'UNSATISFACTORY'
}

export interface IPerformanceMetric {
  name: string;
  value: number;
  target: number;
}

export interface IPerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewDate: Date;
  nextReviewDate: Date;
  rating: PerformanceRating;
  feedback: string;
  strengths: Record<string, any>;
  areasForImprovement: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}