import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

export function useOTAUpdates() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUpdatePending, setIsUpdatePending] = useState(false);

    useEffect(() => {
        // Safe check for the module
        if (__DEV__) return;

        const monitorUpdates = async () => {
            try {
                // Check if we are running in a managed environment where Updates works
                if (!Updates.isEnabled) return;

                const update = await Updates.checkForUpdateAsync().catch(() => ({ isAvailable: false }));
                if (update.isAvailable) {
                    setIsDownloading(true);
                    await Updates.fetchUpdateAsync().catch(() => null);
                    setIsDownloading(false);
                    setIsUpdatePending(true);
                    console.log('OTA Update fetched successfully');
                }
            } catch (e) {
                console.warn('OTA Monitoring failed:', e);
            }
        };

        monitorUpdates();
    }, []);

    return { isDownloading, isUpdatePending };
}
