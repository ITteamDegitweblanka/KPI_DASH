import { AppNotification } from '../types';

export const addAppNotification = (
  notifications: AppNotification[],
  notification: AppNotification
): AppNotification[] => {
  return [notification, ...notifications];
};

export const removeNotification = (
  notifications: AppNotification[],
  notificationId: string
): AppNotification[] => {
  return notifications.filter(notif => notif.id !== notificationId);
};
