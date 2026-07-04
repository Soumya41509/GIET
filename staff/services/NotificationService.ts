import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { adminSupabase } from '../lib/supabase';

// Detect if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false, // Suppress native banner when app is open
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: false,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    /**
     * Request permissions and get the Expo push token
     */
    registerForPushNotificationsAsync: async (): Promise<string | undefined> => {
        if (Platform.OS === 'web') {
            return undefined;
        }

        // Push notifications are no longer supported in Expo Go for Android
        if (isExpoGo && Platform.OS === 'android') {
            console.log('Skipping push notification registration: Not supported in Expo Go on Android.');
            return undefined;
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return undefined;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return undefined;
            }

            // projectId is required for Expo Push Notifications
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'cbc8161e-2bfc-4de7-a4e0-3ee9be463c20';

            const token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            return token;
        } catch (error) {
            console.warn('Error during push notification registration:', error);
            return undefined;
        }
    },

    /**
     * Save the push token to Supabase for the specified staff member
     */
    saveTokenToSupabase: async (staffId: string, token: string) => {
        try {
            if (!token) return;

            // First check if token already exists for this staff to avoid duplicates
            const { data: existing } = await adminSupabase
                .from('push_tokens')
                .select('*')
                .eq('staff_id', staffId)
                .eq('token', token)
                .maybeSingle();

            if (existing) return;

            const { error } = await adminSupabase
                .from('push_tokens')
                .insert([{ staff_id: staffId, token }]);

            if (error) {
                console.error('Error saving push token to Supabase:', error);
            }
        } catch (err) {
            console.error('Unexpected error saving push token:', err);
        }
    },

    /**
     * Setup listeners for incoming notifications
     */
    addNotificationListeners: (
        onNotificationReceived: (notification: Notifications.Notification) => void,
        onNotificationResponse: (response: Notifications.NotificationResponse) => void
    ) => {
        // Skip listeners in Expo Go if needed, but usually they don't cause crashes, 
        // they just won't trigger if no token is registered. 
        // However, we'll keep them for dev builds.
        const notificationListener = Notifications.addNotificationReceivedListener(onNotificationReceived);
        const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }
};
