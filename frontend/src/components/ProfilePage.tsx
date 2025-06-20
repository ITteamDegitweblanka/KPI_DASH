import React, { useState, useEffect } from 'react';
import { Notification } from '../../types';
import type { UserProfile } from '../types/auth';
import { DEFAULT_USER_PROFILE } from '../../constants';
import { userService } from '../services/userService';

interface ProfilePageProps {
  currentUser: UserProfile;
  addAppNotification: ( // Added prop, though not used in this component yet
    targetUserId: string, 
    details: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ) => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser /* addAppNotification is available but not used here yet */ }) => {
  const [profileData, setProfileData] = useState<UserProfile>(currentUser || DEFAULT_USER_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(!currentUser); 

  useEffect(() => {
    if (currentUser) {
      setProfileData(currentUser);
      setIsLoading(false);
    }
  }, [currentUser]);

  // Only admin can edit name/email, user can only update avatar
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      console.log('No file selected');
      return;
    }
    const file = e.target.files[0];
    console.log('Selected file:', file);
    try {
      setIsLoading(true);
      await userService.uploadAvatar(profileData.id, file);
      // Force refresh avatar by updating state with a new timestamp (cache-busting)
      setProfileData(prev => ({ ...prev, avatarRefresh: Date.now() }));
      alert('Avatar updated successfully!');
    } catch (err) {
      alert('Failed to upload avatar.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex-1 flex justify-center items-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 dark:border-red-400"></div>
        <p className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading Profile...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-8 flex-1 bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 border-b dark:border-gray-700 pb-3">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 flex flex-col items-center space-y-3">
            <img 
              src={profileData.id ? `/api/users/${profileData.id}/avatar?${profileData.avatarRefresh || ''}` : undefined} 
              alt="User Avatar" 
              className="w-32 h-32 rounded-full object-cover shadow-md"
            />
            <label className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline cursor-pointer">
              Change Avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={profileData.displayName}
                readOnly={!isAdmin}
                className={`w-full px-4 py-2 border ${isAdmin ? 'bg-white' : 'bg-gray-100 dark:bg-gray-700'} border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200`}
              />
            </div>
            <div>
              <label htmlFor="workEmail" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Work Email
              </label>
              <input
                type="email"
                id="workEmail"
                name="workEmail"
                value={profileData.workEmail}
                readOnly={!isAdmin}
                className={`w-full px-4 py-2 border ${isAdmin ? 'bg-white' : 'bg-gray-100 dark:bg-gray-700'} border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
