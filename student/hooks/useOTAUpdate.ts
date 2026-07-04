import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook to handle silent OTA updates in the background.
 * It checks for updates when the app foregrounds and downloads them silently.
 * Updates are applied on the next cold boot.
 */
export const useOTAUpdate = () => {
    useEffect(() => {
        const handleSilentUpdate = async () => {
            if (__DEV__) return; // Skip in development

            try {
                // 1. Check if an update is available
                const update = await Updates.checkForUpdateAsync();

                if (update.isAvailable) {
                    // 2. Fetch the update silently in the background
                    await Updates.fetchUpdateAsync();

                    // Note: We do NOT call Updates.reloadAsync() here because 
                    // the user wants updates to apply only after they reopen the app.
                    // Expo will naturally load the new bundle on the next cold boot.
                }
            } catch (error) {
                // Fail silently as per user request (user ko pata nahi lagna chahiye)
            }
        };

        // Run on initial mount
        handleSilentUpdate();

        // Also check whenever the app comes back to the foreground
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                handleSilentUpdate();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);
};
