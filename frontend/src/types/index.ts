// Import types for re-export
import { UserProfile as AuthUserProfile } from './auth';
import { Notification } from './notification';

// Re-export all types from individual files
export * from './auth';
export * from './kpi';
export * from './common';
export * from './notification';

// Re-export UserProfile for backward compatibility
export type UserProfile = AuthUserProfile;

// Common types that don't fit in other files
export interface AppState {
  user: UserProfile | null;
  notifications: Notification[];
  // Add other state properties as needed
}