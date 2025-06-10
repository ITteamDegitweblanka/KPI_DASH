
import React from 'react';
import { Notification, NotificationType, getRelativeTime } from '../types/notification';
import { 
    ListBulletIcon, StarIcon, AdjustmentsHorizontalIcon, InformationCircleIcon, 
    PencilSquareIcon, XMarkIcon, CheckCircleIcon
} from './icons/Icons';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
  onNavigate: (link?: string) => void;
}

const getNotificationIcon = (type: NotificationType, classNames: string): React.ReactNode => {
  switch (type) {
    case 'new_target':
      return <ListBulletIcon className={classNames + " text-blue-500 dark:text-blue-400"} />;
    case 'target_reached':
      return <StarIcon className={classNames + " text-yellow-500 dark:text-yellow-400"} />;
    case 'admin_action':
      return <AdjustmentsHorizontalIcon className={classNames + " text-purple-500 dark:text-purple-400"} />;
    case 'goal_updated':
      return <PencilSquareIcon className={classNames + " text-orange-500 dark:text-orange-400"} />;
    case 'general_update':
    default:
      return <InformationCircleIcon className={classNames + " text-sky-500 dark:text-sky-400"} />;
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead, onClear, onNavigate }) => {
  const relativeTime = getRelativeTime(notification.timestamp);

  const handleItemClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onNavigate(notification.link);
  };

  return (
    <li 
      className={`p-3 hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors duration-150 rounded-md ${!notification.isRead ? 'bg-red-50 dark:bg-red-900/30' : 'bg-white dark:bg-gray-800'}`}
      aria-live="polite" 
      aria-atomic="true"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          {notification.isRead ? 
            <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" title="Notification read"/> :
            getNotificationIcon(notification.type, "w-5 h-5")
          }
        </div>
        <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={handleItemClick}
            onKeyPress={(e) => e.key === 'Enter' && handleItemClick()}
            role="button"
            tabIndex={0}
            aria-label={`Notification: ${notification.title}. Status: ${notification.isRead ? 'Read' : 'Unread'}. Click to view details.`}
        >
          <p className={`text-sm font-semibold ${!notification.isRead ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-100'}`}>
            {notification.title}
          </p>
          <p className={`text-sm ${!notification.isRead ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'} mt-0.5`}>
            {notification.message}
          </p>
          <p className={`text-xs ${!notification.isRead ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'} mt-1`}>
            {relativeTime}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClear(notification.id); }}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500"
          aria-label={`Clear notification: ${notification.title}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
};

export default NotificationItem;
