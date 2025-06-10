
import React, { useRef, useEffect } from 'react';
import { Notification } from '../types/notification';
import NotificationItem from './NotificationItem';
import { BellIcon } from './icons/Icons';

interface NotificationBellProps {
  notifications: Notification[];
  showPanel: boolean;
  onTogglePanel: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onMarkAsRead?: (id: string) => void; // For backward compatibility
  onMarkAllAsRead?: () => void; // For backward compatibility
  onClear: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (link?: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  showPanel,
  onTogglePanel,
  onMarkRead,
  onMarkAllRead,
  onClear,
  onClearAll,
  onNavigate
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPanel && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const bellButton = document.getElementById('notification-bell-button');
        if (bellButton && !bellButton.contains(event.target as Node)) {
            onTogglePanel();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel, onTogglePanel]);

  return (
    <div className="relative">
      <button
        id="notification-bell-button"
        onClick={onTogglePanel}
        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 relative p-1"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="true"
        aria-expanded={showPanel}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
            aria-hidden="true" /* Label provides count */
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-heading"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 id="notifications-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
              {notifications.some(n => !n.isRead) && (
                 <button 
                    onClick={onMarkAllRead} 
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    aria-label="Mark all notifications as read"
                 >
                    Mark all as read
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No new notifications.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={onMarkRead}
                  onClear={onClear}
                  onNavigate={(link) => {
                    onNavigate(link);
                    onTogglePanel(); // Close panel on navigation
                  }}
                />
              ))}
            </ul>
          )}
          
          {notifications.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-center">
              <button 
                onClick={onClearAll} 
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
                aria-label="Clear all notifications"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
