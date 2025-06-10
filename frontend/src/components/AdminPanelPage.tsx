import React, { useState, FormEvent, useEffect } from 'react';
import { Notification, type UserProfile } from '@/types';

// Define local types to match the expected structure
interface Branch {
  id: string;
  name: string;
  location: string;
  employeeCount: number;
}

interface AdminPanelUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string;
  teamId?: string;
  position?: string;
  department?: string;
  status?: string;
}

// Align AdminPanelTeam with the expected structure from the API
interface AdminPanelTeam {
  id: string;
  name: string;
  description: string;
  branchId: string;
  assignedBranchId: string;
  teamName?: string; // For backward compatibility
  managerId?: string;
  memberCount?: number;
}

// Define the role hierarchy with associated permission levels
const ROLE_HIERARCHY = [
  { role: 'Staff', level: 0 },
  { role: 'Sub-Leader', level: 1 },
  { role: 'Leader', level: 2 },
  { role: 'Admin', level: 3 },
  { role: 'Super Admin', level: 4 },
] as const;

type UserRole = typeof ROLE_HIERARCHY[number]['role'];

// Get all available roles
const USER_ROLES: UserRole[] = ROLE_HIERARCHY.map(r => r.role);

// Get roles with minimum permission level (commented out as it's not currently used)
/*
const getRolesWithMinLevel = (minLevel: number): UserRole[] => {
  return ROLE_HIERARCHY
    .filter(({ level }) => level >= minLevel)
    .map(({ role }) => role);
};
*/ 
import { fetchBranches, addBranch, fetchAdminUsers, addAdminUser, updateUserRole, fetchAdminTeams, addAdminTeam } from '../services/apiService'; // Updated path
// Using local AdminPanelTeam type only

type AdminTab = 'branches' | 'users' | 'teams';

interface BranchFormData {
  name: string;
  location: string;
  employeeCount: string; 
}

interface UserFormData {
  name: string;
  email: string;
  password: string; 
  role: UserRole;
}

interface TeamFormData {
  teamName: string;
  description: string;
  assignedBranchId: string;
}

interface AdminPanelPageProps {
  currentUser: UserProfile;
  addAppNotification: (
    targetUserId: string, 
    details: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ) => Promise<void>;
}

const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ currentUser, addAppNotification }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [branchForm, setBranchForm] = useState<BranchFormData>({ name: '', location: '', employeeCount: '' });
  const [userForm, setUserForm] = useState<UserFormData>({ name: '', email: '', password: '', role: 'Staff' });
  const [teamForm, setTeamForm] = useState<TeamFormData>({ teamName: '', description: '', assignedBranchId: '' });
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<AdminPanelUser[]>([]);
  const [teams, setTeams] = useState<AdminPanelTeam[]>([]);


  // Filter out Super Admin role from assignable roles
  const assignableRoles = USER_ROLES.filter(role => role !== 'Super Admin') as Exclude<UserRole, 'Super Admin'>[];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data in parallel with proper type assertions
      const [fetchedBranches, fetchedUsers, fetchedTeams] = (await Promise.all([
        fetchBranches(),
        fetchAdminUsers(),
        fetchAdminTeams()
      ])) as [Branch[], AdminPanelUser[], AdminPanelTeam[]];
      
      setBranches(fetchedBranches);
      setUsers(fetchedUsers);
      
      // Map API teams to local AdminPanelTeam format
      const mappedTeams = fetchedTeams.map(team => ({
        id: team.id,
        name: team.teamName || team.name || 'Unnamed Team',
        description: team.description || '',
        branchId: team.branchId || team.assignedBranchId || '',
        assignedBranchId: team.assignedBranchId || team.branchId || ''
      } as AdminPanelTeam));
      
      setTeams(mappedTeams);
        if (fetchedBranches.length > 0 && !teamForm.assignedBranchId) {
          setTeamForm(prev => ({ ...prev, assignedBranchId: fetchedBranches[0].id }));
        }
      } catch (err) {
        console.error("Failed to load admin panel data:", err);
        setError("Failed to load some admin data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleBranchFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBranchForm({ ...branchForm, [e.target.name]: e.target.value });
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value as UserRole });
  };

  const handleTeamFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTeamForm({ ...teamForm, [e.target.name]: e.target.value });
  };

  const handleAddBranchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.location || !branchForm.employeeCount) {
        alert("Please fill all branch fields.");
        return;
    }
    const newBranchData: Omit<Branch, 'id'> = {
        name: branchForm.name,
        location: branchForm.location,
        employeeCount: parseInt(branchForm.employeeCount, 10) || 0,
    };
    try {
      const addedBranch = await addBranch(newBranchData); 
      setBranches(prevBranches => [...prevBranches, addedBranch]);
      alert('Branch added successfully!');
      setBranchForm({ name: '', location: '', employeeCount: '' });
    } catch (err) {
      alert(`Failed to add branch: ${(err as Error).message}`);
    }
  };

  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
     if (!userForm.name || !userForm.email || !userForm.password) {
        alert("Please fill all user fields (name, email, password).");
        return;
    }
    if (userForm.role === 'Super Admin' && currentUser.role !== 'Super Admin') {
        alert("Only a Super Admin can assign the Super Admin role.");
        return;
    }
    const newUserApiData = { 
        name: userForm.name, 
        email: userForm.email, 
        role: userForm.role, 
    };
    try {
      const addedUser = await addAdminUser(newUserApiData); 
      setUsers(prevUsers => [...prevUsers, addedUser]);
      alert('User added successfully!');
      setUserForm({ name: '', email: '', password: '', role: 'Staff' }); 
    } catch (err) {
      alert(`Failed to add user: ${(err as Error).message}`);
    }
  };

  const handleAddTeamSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamForm.teamName || !teamForm.assignedBranchId) {
        alert("Team Name and Assigned Branch are required.");
        return;
    }
    const newTeamData: Omit<AdminPanelTeam, 'id'> = {
      name: teamForm.teamName, // Use name instead of teamName
      description: teamForm.description,
      branchId: teamForm.assignedBranchId, // Use branchId instead of assignedBranchId
      assignedBranchId: teamForm.assignedBranchId,
    };
    try {
      const addedTeam = await addAdminTeam({
        ...newTeamData,
        teamName: newTeamData.name
      } as any); // Using any as a temporary workaround for type mismatch
      
      setTeams(prevTeams => [...prevTeams, {
        ...newTeamData,
        id: addedTeam.id
      }]);
      alert('Team added successfully!');
      setTeamForm({ teamName: '', description: '', assignedBranchId: branches[0]?.id || '' });
    } catch (err) {
       alert(`Failed to add team: ${(err as Error).message}`);
    }
  };

  const handleUserRoleChangeSubmit = async (userId: string, newRole: UserRole) => {
    if (newRole === 'Super Admin') {
        alert("Cannot assign Super Admin role via this interface.");
        return;
    }
    const originalUser = users.find(u => u.id === userId);
    if (!originalUser) return;

    // Optimistic UI update
    setUsers(prevUsers => 
        prevUsers.map(user => 
            user.id === userId ? { ...user, role: newRole } : user
        )
    );

    try {
        const updatedUser = await updateUserRole(userId, newRole);
        // API call was successful, UI is already updated.
        alert(`User ${updatedUser.name}'s role changed to ${newRole}.`);
        // Send notification to the user whose role was changed
        await addAppNotification(userId, {
            type: 'admin_action',
            title: 'Your Role Has Been Updated',
            message: `An administrator has changed your role to ${newRole}. Please review your profile.`,
            link: '#profile'
        });

    } catch (err) {
        alert(`Failed to update role: ${(err as Error).message}`);
        // Revert UI change if API call fails
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user.id === userId ? originalUser : user // Revert to originalUser
            )
        );
    }
  };

  const renderFormInput = (
    label: string, name: string, value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    type: string = 'text', required: boolean = true, placeholder?: string
  ) => ( 
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="w-full px-4 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm text-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
      />
    </div>
  );

   const renderTextarea = (
    label: string, name: string, value: string, 
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, 
    required: boolean = false, placeholder?: string
  ) => ( 
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={3}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="w-full px-4 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm text-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
      />
    </div>
  );

  const renderSelect = (
    label: string, name: string, value: string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    options: { value: string; label: string }[],
    required: boolean = true, disabled: boolean = false
  ) => ( 
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm text-gray-700 dark:text-gray-200 ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );

  const TabButton: React.FC<{ tabId: AdminTab; label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${activeTab === tabId 
          ? 'bg-red-500 text-white shadow-md dark:bg-red-600' 
          : 'text-gray-600 hover:bg-red-100 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-700/30 dark:hover:text-red-400'}`}
      aria-current={activeTab === tabId ? 'page' : undefined}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="p-6 flex-1 flex justify-center items-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 dark:border-red-400"></div>
        <p className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading Admin Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex-1 text-center dark:bg-gray-950">
        <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">Error</h1>
        <p className="text-gray-700 dark:text-gray-300">{error}</p>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6 flex-1 bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Panel</h1>

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-3 mb-6" role="tablist" aria-label="Admin Management Tabs">
        <TabButton tabId="branches" label="Manage Branches" />
        <TabButton tabId="users" label="Manage Users" />
        <TabButton tabId="teams" label="Manage Teams" />
      </div>

      <div role="tabpanel" hidden={activeTab !== 'branches'}>
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New Branch</h2>
          <form onSubmit={handleAddBranchSubmit} className="space-y-4">
            {renderFormInput('Branch Name', 'name', branchForm.name, handleBranchFormChange)}
            {renderFormInput('Location', 'location', branchForm.location, handleBranchFormChange)}
            {renderFormInput('Employee Count', 'employeeCount', branchForm.employeeCount, handleBranchFormChange, 'number')}
            <button type="submit" className="px-6 py-2.5 bg-red-500 dark:bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition-colors">
              Add Branch
            </button>
          </form>
        </section>
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Existing Branches</h2>
          {branches.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No branches have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left">
                <thead className="bg-red-50 dark:bg-red-900/30">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Name</th>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Location</th>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Employee Count</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{branch.name}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{branch.location}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{branch.employeeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div role="tabpanel" hidden={activeTab !== 'users'}>
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New User</h2>
          <form onSubmit={handleAddUserSubmit} className="space-y-4">
            {renderFormInput('Full Name', 'name', userForm.name, handleUserFormChange)}
            {renderFormInput('Email Address', 'email', userForm.email, handleUserFormChange, 'email')}
            {renderFormInput('Password', 'password', userForm.password, handleUserFormChange, 'password', true, 'Enter temporary password')}
            {renderSelect('Assign Role', 'role', userForm.role, handleUserFormChange, 
              assignableRoles.map(role => ({ value: role, label: role }))
            )}
            <button type="submit" className="px-6 py-2.5 bg-red-500 dark:bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition-colors">
              Add User
            </button>
          </form>
        </section>
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Existing Users</h2>
          {users.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No users have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left">
                <thead className="bg-red-50 dark:bg-red-900/30">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Name</th>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Email</th>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Role</th>
                    {currentUser.role === 'Super Admin' && <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{user.name}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                        {currentUser.role === 'Super Admin' && user.id !== currentUser.id ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleUserRoleChangeSubmit(user.id, e.target.value as UserRole)}
                            className="w-full p-1.5 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-1 focus:ring-red-400 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 text-xs text-gray-700 dark:text-gray-200"
                            aria-label={`Change role for ${user.name}`}
                          >
                            {assignableRoles.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        ) : (
                          user.role
                        )}
                      </td>
                      {currentUser.role === 'Super Admin' && (
                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 text-center">
                          {user.id === currentUser.id ? (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Current User</span>
                          ) : (
                            <button 
                                onClick={() => alert(`More actions for ${user.name} (e.g., Edit, Delete) - TBD`)}
                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline"
                            >
                                Edit/Del
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div role="tabpanel" hidden={activeTab !== 'teams'}>
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New Team</h2>
          <form onSubmit={handleAddTeamSubmit} className="space-y-4">
            {renderFormInput('Team Name', 'teamName', teamForm.teamName, handleTeamFormChange)}
            {renderTextarea('Description', 'description', teamForm.description, (e) => handleTeamFormChange(e as React.ChangeEvent<HTMLTextAreaElement>), false, "Enter team description (optional)")}
            {renderSelect('Assign Branch', 'assignedBranchId', teamForm.assignedBranchId, handleTeamFormChange,
              branches.length > 0 
                ? branches.map(branch => ({ value: branch.id, label: branch.name }))
                : [{ value: '', label: 'No branches available' }],
              branches.length > 0,
              branches.length === 0 
            )}
            <button 
                type="submit" 
                className={`px-6 py-2.5 bg-red-500 dark:bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:outline-none transition-colors ${branches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={branches.length === 0}
            >
              Add Team
            </button>
             {branches.length === 0 && <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">Please add branches before creating teams.</p>}
          </form>
        </section>
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Existing Teams</h2>
          {teams.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No teams have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left">
                <thead className="bg-red-50 dark:bg-red-900/30">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Team Name</th>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Description</th>
                    <th className="p-3 text-sm font-semibold text-red-700 dark:text-red-300">Assigned Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const branch = branches.find(b => b.id === team.assignedBranchId);
                    return (
                      <tr key={team.id} className="border-b border-red-100 dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{team.teamName}</td>
                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{team.description || '-'}</td>
                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{branch ? branch.name : 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminPanelPage;
