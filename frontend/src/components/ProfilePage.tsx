
import React, { useState, useEffect } from 'react';
import { Notification } from '../../types';
import type { UserProfile } from '../types/auth';
import { PencilSquareIcon, ArrowUpTrayIcon } from './icons/Icons';
import { DEFAULT_USER_PROFILE } from '../../constants';
import { userService, UpdateProfileData } from '../services/userService';

interface ProfilePageProps {
  currentUser: UserProfile;
  addAppNotification: ( // Added prop, though not used in this component yet
    targetUserId: string, 
    details: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ) => Promise<void>;
}

interface FormInputProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  isTextarea?: boolean;
  name?: string;
}

const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  readOnly = false, 
  required = false, 
  isTextarea = false,
  name
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {isTextarea ? (
      <textarea
        id={id}
        name={name || id}
        rows={3}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        readOnly={readOnly}
        required={required}
        className={`w-full px-4 py-2 border ${readOnly ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-700'} border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm text-gray-700 dark:text-gray-200 dark:placeholder-gray-400`}
      />
    ) : (
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        readOnly={readOnly}
        required={required}
        className={`w-full px-4 py-2 border ${readOnly ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-700'} border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm text-gray-700 dark:text-gray-200 dark:placeholder-gray-400`}
      />
    )}
  </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser /* addAppNotification is available but not used here yet */ }) => {
  const [profileData, setProfileData] = useState<UserProfile>(currentUser || DEFAULT_USER_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(!currentUser); 

  useEffect(() => {
    if (currentUser) {
      setProfileData(currentUser);
      setIsLoading(false);
    } else {
      setIsLoading(true); 
    }
  }, [currentUser]);


  const canEditDetails = profileData.role === 'Super Admin' || profileData.role === 'Admin' || profileData.id === currentUser?.id; 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!canEditDetails && e.target.name !== 'accessibilityNeeds' && e.target.name !== 'avatarUrl') return; 
    const { name, value } = e.target;
    
    // Handle nested address updates
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...(prev.address || {}),
          [field]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value || '' // Ensure empty string as fallback
      }));
    }
  };

  const handleEmergencyContactChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!canEditDetails) return;
    const { name, value } = e.target;
    setProfileData((prev: UserProfile) => {
      const updatedContacts = [...(prev.emergencyContacts || [])];
      if(updatedContacts[index]) {
        updatedContacts[index] = { ...updatedContacts[index], [name]: value };
        return { ...prev, emergencyContacts: updatedContacts };
      }
      return prev;
    });
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('[ProfilePage] Starting profile update with data:', profileData);
      
      // Prepare the data to send to the API - only include fields that can be updated
      const updateData: UpdateProfileData = {
        name: profileData.name,
        email: profileData.email,
        title: profileData.title || undefined,
        phoneNumber: profileData.phoneNumber || undefined,
      };
      
      console.log('[ProfilePage] Sending update request with data:', updateData);
      
      // Call the API to update the profile
      const updatedUser = await userService.updateUserProfile(profileData.id, updateData);
      
      console.log('[ProfilePage] Successfully updated profile:', updatedUser);
      
      // Update the local state with the returned user data
      setProfileData(updatedUser);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('[ProfilePage] Failed to update profile:', {
        error,
        profileData,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while updating your profile';
      
      alert(`Failed to update profile: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = () => {
    alert('Upload document functionality (mock).');
  }

  const handleEditDocument = (docId: string) => {
    alert(`Edit document ${docId} (mock).`);
  }

  const handleChangeAvatar = () => {
    alert('Change avatar functionality (mock).');
  }

  if (isLoading) {
    return (
      <div className="p-6 flex-1 flex justify-center items-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 dark:border-red-400"></div>
        <p className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading Profile...</p>
      </div>
    );
  }
  
  if (!profileData || !profileData.id) {
     return (
      <div className="p-6 flex-1 text-center dark:bg-gray-950">
        <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">Profile Not Found</h1>
        <p className="text-gray-700 dark:text-gray-300">User profile data could not be loaded.</p>
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
              src={profileData.avatarUrl} 
              alt="User Avatar" 
              className="w-32 h-32 rounded-full object-cover shadow-md"
            />
            <button 
              type="button"
              onClick={handleChangeAvatar}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
            >
              Change Avatar
            </button>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <FormInput label="Display Name" id="displayName" name="displayName" value={profileData.displayName} onChange={handleInputChange} required readOnly={!canEditDetails} />
            <FormInput label="Work Email" id="workEmail" name="workEmail" type="email" value={profileData.workEmail} onChange={handleInputChange} readOnly />
            <FormInput label="Phone Number" id="phoneNumber" name="phoneNumber" type="tel" value={profileData.phoneNumber} onChange={handleInputChange} readOnly={!canEditDetails} />
            <FormInput label="Date of Birth" id="dateOfBirth" name="dateOfBirth" type="date" value={profileData.dateOfBirth} onChange={handleInputChange} readOnly={!canEditDetails} />
            <FormInput label="Nationality" id="nationality" name="nationality" value={profileData.nationality || ''} onChange={handleInputChange} readOnly={!canEditDetails} />
            
            <div className="sm:col-span-2">
              <div className="space-y-2">
                <FormInput 
                  label="Street" 
                  id="address.street" 
                  name="address.street" 
                  value={profileData.address?.street || ''} 
                  onChange={handleInputChange} 
                  readOnly={!canEditDetails} 
                />
                <FormInput 
                  label="City" 
                  id="address.city" 
                  name="address.city" 
                  value={profileData.address?.city || ''} 
                  onChange={handleInputChange} 
                  readOnly={!canEditDetails} 
                />
                <FormInput 
                  label="State/Province" 
                  id="address.state" 
                  name="address.state" 
                  value={profileData.address?.state || ''} 
                  onChange={handleInputChange} 
                  readOnly={!canEditDetails} 
                />
                <FormInput 
                  label="Postal Code" 
                  id="address.postalCode" 
                  name="address.postalCode" 
                  value={profileData.address?.postalCode || ''} 
                  onChange={handleInputChange} 
                  readOnly={!canEditDetails} 
                />
                <FormInput 
                  label="Country" 
                  id="address.country" 
                  name="address.country" 
                  value={profileData.address?.country || ''} 
                  onChange={handleInputChange} 
                  readOnly={!canEditDetails} 
                />
              </div>
            </div>

            {(profileData.emergencyContacts && profileData.emergencyContacts.length > 0) && (
              <>
                <h3 className="sm:col-span-2 text-md font-semibold text-gray-600 dark:text-gray-300 mt-4 pt-2 border-t dark:border-gray-700">Emergency Contact</h3>
                <FormInput 
                    label="Contact Name" 
                    id={`emergencyContacts[0].name_field`} 
                    name="name" 
                    value={profileData.emergencyContacts[0].name} 
                    onChange={(e) => handleEmergencyContactChange(0, e)} 
                    readOnly={!canEditDetails} />
                <FormInput 
                    label="Relationship" 
                    id={`emergencyContacts[0].relationship_field`}
                    name="relationship"
                    value={profileData.emergencyContacts[0].relationship} 
                    onChange={(e) => handleEmergencyContactChange(0, e)} 
                    readOnly={!canEditDetails} />
                <FormInput 
                    label="Contact Phone" 
                    id={`emergencyContacts[0].phone_field`}
                    name="phone"
                    type="tel" 
                    value={profileData.emergencyContacts[0].phone} 
                    onChange={(e) => handleEmergencyContactChange(0, e)} 
                    readOnly={!canEditDetails} />
              </>
            )}
             <div className="sm:col-span-2">
              <FormInput 
                label="Accessibility Needs" 
                id="accessibilityNeeds" 
                name="accessibilityNeeds" 
                value={Array.isArray(profileData.accessibilityNeeds) ? profileData.accessibilityNeeds.join(', ') : ''} 
                onChange={(e) => {
                  const value = e.target.value;
                  setProfileData(prev => ({
                    ...prev,
                    accessibilityNeeds: value ? value.split(',').map(item => item.trim()) : []
                  }));
                }} 
                placeholder="Comma-separated list of accessibility needs"
                isTextarea 
                readOnly={!canEditDetails}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 border-b dark:border-gray-700 pb-3">Identity Verification Documents</h2>
        <div className="space-y-4">
          {(profileData.identityDocuments && profileData.identityDocuments.length > 0) ? profileData.identityDocuments.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700/50">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">{doc.name}</p>
                <p className={`text-xs ${doc.status === 'Verified' ? 'text-green-600 dark:text-green-400' : (doc.status === 'Not Uploaded' ? 'text-gray-500 dark:text-gray-400' : 'text-orange-500 dark:text-orange-400')}`}>
                  Status: {doc.status} {doc.fileName && `(${doc.fileName})`}
                </p>
              </div>
              {(canEditDetails || doc.status === 'Not Uploaded') && doc.status !== 'Not Uploaded' && ( 
                 <button 
                    onClick={() => handleEditDocument(doc.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                    aria-label={`Edit ${doc.name}`}
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-1"/> Edit
                 </button>
              )}
            </div>
          )) : <p className="text-gray-500 dark:text-gray-400">No identity documents uploaded.</p>}
        </div>
        {(canEditDetails) && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleUploadDocument}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-red-100 dark:bg-red-700/30 text-red-600 dark:text-red-400 font-medium rounded-lg shadow-sm hover:bg-red-200 dark:hover:bg-red-700/50 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:outline-none transition-colors"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Upload New Document
            </button>
          </div>
        )}
      </section>
      
      {(canEditDetails) && (
        <div className="flex justify-end mt-8">
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-3 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:outline-none transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
