import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { User } from './authService';
import type { UserProfile } from '../types/auth';

// Helper function to convert API User to UserProfile
const mapUserToUserProfile = (user: User): UserProfile => {
  return {
    id: user.id,
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    role: user.role as UserProfile['role'], // Cast to the correct role type
    displayName: user.displayName || user.email.split('@')[0],
    title: user.title || '',
    phoneNumber: user.phoneNumber || '',
    avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}`,
    team: user.team?.name || '',
    department: '', // These fields might not be in the User type
    position: user.title || '',
    workEmail: user.email,
    dateOfBirth: '',
    hireDate: user.createdAt || new Date().toISOString(),
    // Add any other required fields with default values
    avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}`,
    joinDate: user.createdAt || new Date().toISOString(),
    lastActive: user.updatedAt || new Date().toISOString(),
    nationality: '',
    address: {},
    emergencyContacts: [],
    identityDocuments: [],
    accessibilityNeeds: [],
    skills: [],
    certifications: [],
    languages: []
  };
};

export interface UpdateProfileData {
  name?: string;
  email?: string;
  title?: string;
  phoneNumber?: string;
  // Add other fields that can be updated
}

class UserService {
  public async updateUserProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      console.log('[userService] Updating profile for user:', userId, 'with data:', data);
      
      // First, log the API endpoint we're calling
      const endpoint = `${API_ENDPOINTS.USERS.BASE}/${userId}`;
      console.log('[userService] Calling API endpoint:', endpoint);
      
      // Log the request details
      console.log('[userService] Making API request:', {
        method: 'PUT',
        url: endpoint,
        data: data,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')?.substring(0, 10)}...`
        }
      });
      
      let response;
      try {
        // Make the API call with a more flexible response type
        response = await apiService.put<any>(endpoint, data);
      } catch (error: any) {
        console.error('[userService] API call failed:', {
          error: error?.response?.data || error.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          headers: error?.response?.headers
        });
        throw new Error(error.response?.data?.message || 'Failed to update profile');
      }
      
      // Type the response data
      interface ApiResponseData {
        success: boolean;
        data: any;
        message?: string;
        user?: any;
      }
      
      const responseData = response?.data as ApiResponseData;
      
      console.log('[userService] Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        // Convert to plain object for better logging
        fullResponse: JSON.parse(JSON.stringify(response, (key, value) => 
          key === 'headers' ? undefined : value
        ))
      });
      
      if (!response || !responseData) {
        console.error('[userService] Invalid response format:', response);
        throw new Error('Invalid response from server');
      }
      
      // Check if the request was successful
      if (responseData.success === false) {
        const errorMessage = responseData.message || 'Failed to update profile';
        console.error('[userService] API Error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          data: responseData
        });
        throw new Error(errorMessage);
      }
      
      // Try to extract user data from different possible locations in the response
      // Handle different possible response structures
      const userData = responseData?.data?.user || responseData?.data || responseData?.user || responseData;
      
      // If we still don't have user data, check if the response has a user property directly
      if (!userData && typeof responseData === 'object' && responseData !== null) {
        const responseObj = responseData as Record<string, unknown>;
        if (responseObj.user) {
          return responseObj.user as UserProfile;
        }
      }
      
      if (!userData) {
        console.error('[userService] No user data in response. Full response:', responseData);
        throw new Error('No user data received in response');
      }
      
      console.log('[userService] Extracted user data:', userData);
      
      // Convert the API user to UserProfile
      const userProfile = mapUserToUserProfile(userData as User);
      console.log('[userService] Successfully updated profile:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('[userService] Error updating user profile:', {
        error,
        userId,
        data,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error instanceof Error 
        ? error 
        : new Error('An unknown error occurred while updating the profile');
    }
  }
  
  public async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await apiService.get<{ user: User }>(
        API_ENDPOINTS.USERS.PROFILE(userId)
      );
      
      if (!response.data?.success || !response.data.data?.user) {
        throw new Error(response.data?.message || 'Failed to fetch profile');
      }
      
      // Convert the API user to UserProfile
      return mapUserToUserProfile(response.data.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
