import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: number; // timestamp
  type: 'success' | 'warning' | 'info';
  isNew: boolean;
  relatedId?: string; // e.g. grievance ID
}

const STORAGE_KEY = 'app_notifications_v1';

export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const addNotification = async (notif: Omit<AppNotification, 'id' | 'time' | 'isNew'>): Promise<void> => {
  try {
    const list = await getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: Date.now().toString(),
      time: Date.now(),
      isNew: true,
    };
    
    // Add to top and keep reasonable limit (e.g. 50)
    const updated = [newNotif, ...list].slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};

export const markNotificationsAsRead = async (): Promise<void> => {
  try {
    const list = await getNotifications();
    const updated = list.map(n => ({ ...n, isNew: false }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

export const clearNotifications = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};
