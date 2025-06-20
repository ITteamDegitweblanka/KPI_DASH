import React from 'react';
import { SidebarNavItem } from '../../types';
import { UserProfile } from '../types/auth';
import { SIDEBAR_TOP_ITEMS, SIDEBAR_BOTTOM_ITEMS, APP_TITLE } from '../../constants';

interface SidebarProps {
  activeItem: string;
  onNavItemClick: (itemId: string) => void;
  uniqueTeams: string[];
  onTeamSelect: (teamOrEvent: string | React.ChangeEvent<HTMLSelectElement>) => void;
  currentUser: UserProfile | null;
}

const TEAM_COLORS: { [key: string]: string } = {
  Sales: 'bg-blue-500',
  Ads: 'bg-green-500',
  'Website Ads': 'bg-yellow-500',
  'Portfolio Holders': 'bg-purple-500',
  Alpha: 'bg-sky-500',
  Bravo: 'bg-teal-500',
  Charlie: 'bg-amber-500',
  Delta: 'bg-indigo-500',
};
const DEFAULT_TEAM_COLOR = 'bg-gray-500 dark:bg-gray-400';


const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavItemClick, uniqueTeams, onTeamSelect, currentUser }) => {
  
  const currentUserRole = currentUser?.role;

  const NavItem: React.FC<{ item: SidebarNavItem; isActive: boolean; onClick: () => void }> = ({ item, isActive, onClick }) => (
    <li>
      <a
        href={item.href}
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`flex items-center p-3 my-1 text-base rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-red-500 text-white shadow-md dark:bg-red-600' 
                      : 'text-gray-700 hover:bg-red-100 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-700/30 dark:hover:text-red-400'}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`w-7 h-7 mr-3 ${isActive ? 'text-white dark:text-red-100' : 'text-red-500 dark:text-red-400'}`}>{item.icon}</span>
        {item.name}
      </a>
    </li>
  );

  const handleTeamLinkClick = (teamName: string) => {
    onTeamSelect(teamName); 
  };

  const filterNavItemsByRole = (items: SidebarNavItem[]): SidebarNavItem[] => {
    if (!currentUserRole) return items.filter(item => !item.roles); // Show only non-role-restricted items if no role
    return items.filter(item => {
      if (!item.roles) return true; 
      return item.roles.includes(currentUserRole);
    });
  };
  
  const userDisplayName = currentUser?.displayName || "User";
  const userDisplayTitle = currentUser?.title || currentUser?.role || "Role not set";
  const userDisplayAvatar = currentUser?.id ? `/api/users/${currentUser.id}/avatar` : 'https://picsum.photos/seed/default/100/100';


  return (
    <aside className="w-72 h-screen bg-[#FFF5F5] dark:bg-gray-800 p-5 flex flex-col fixed shadow-lg dark:shadow-gray-900/50" aria-label="Main navigation sidebar">
      <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-10 p-3 text-center">
        {APP_TITLE}
      </div>
      
      <nav className="flex-grow" aria-labelledby="menu-heading">
        <h3 id="menu-heading" className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2 px-3">Menu</h3>
        <ul>
          {filterNavItemsByRole(SIDEBAR_TOP_ITEMS).map((item) => (
            <NavItem key={item.id} item={item} isActive={activeItem === item.id} onClick={() => onNavItemClick(item.id)} />
          ))}
        </ul>
      </nav>

      {uniqueTeams.length > 0 && (
        <div className="mb-4" aria-labelledby="teams-overview-heading">
          <h3 id="teams-overview-heading" className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2 mt-6 px-3">Teams Overview</h3>
          <ul className="text-base text-gray-600 dark:text-gray-300 space-y-1 px-3 max-h-40 overflow-y-auto" role="list">
            {uniqueTeams.map((team) => (
              <li 
                key={team} 
                className="flex items-center py-1.5 cursor-pointer hover:text-red-500 dark:hover:text-red-400 group"
                onClick={() => handleTeamLinkClick(team)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleTeamLinkClick(team)}
                aria-label={`View ${team} team overview`}
              >
                <span className={`w-2.5 h-2.5 ${TEAM_COLORS[team] || DEFAULT_TEAM_COLOR} rounded-full mr-2.5 group-hover:ring-2 group-hover:ring-red-300 dark:group-hover:ring-red-500 transition-all`}></span>
                {team}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto border-t border-red-200 dark:border-gray-700 pt-5">
        {currentUser ? (
          <div 
              className="flex items-center p-3 mb-3 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer" 
              onClick={() => onNavItemClick('profile')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && onNavItemClick('profile')}
              aria-label={`View ${userDisplayName}'s profile`}
          >
              <img
                src={userDisplayAvatar}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-red-500 dark:border-red-400 shadow-md"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://picsum.photos/seed/default/100/100'; }}
              />
              <div>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{userDisplayName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userDisplayTitle}</p>
              </div>
          </div>
        ) : (
          <div className="p-3 mb-3 text-sm text-gray-500 dark:text-gray-400">Loading user...</div>
        )}
        <ul>
          {filterNavItemsByRole(SIDEBAR_BOTTOM_ITEMS).map((item) => (
             <NavItem key={item.id} item={item} isActive={activeItem === item.id} onClick={() => onNavItemClick(item.id)} />
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
