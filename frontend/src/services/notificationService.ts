import { Notification, NotificationType } from '../types/notification';
import { apiService } from './api';

export const fetchNotificationsService = async (userId: string): Promise<Notification[]> => {
  const response = await apiService.get<Notification[]>(`/notifications/user/${userId}`);
  return response.data?.data || response.data;
};

export const sendNotificationService = async (userId: string, type: NotificationType, message: string, title?: string, link?: string): Promise<boolean> => {
  try {
    const payload: any = { userId, type, message };
    if (title) payload.title = title;
    if (link) payload.link = link;
    await apiService.post('/notifications', payload);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

export const markNotificationAsReadService = async (notificationId: string): Promise<boolean> => {
  try {
    await apiService.put(`/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const markAllNotificationsAsReadService = async (userId: string): Promise<boolean> => {
  try {
    await apiService.put(`/notifications/user/${userId}/read-all`);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

export const clearNotificationService = async (notificationId: string): Promise<boolean> => {
  try {
    await apiService.delete(`/notifications/${notificationId}`);
    return true;
  } catch (error) {
    console.error('Error clearing notification:', error);
    return false;
  }
};

export const clearAllNotificationsService = async (userId: string): Promise<boolean> => {
  try {
    await apiService.delete(`/notifications/user/${userId}`);
    return true;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return false;
  }
};
