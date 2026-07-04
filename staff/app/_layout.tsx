import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, StyleSheet, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { WifiOff } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Grievance } from '@/components/GrievanceCard';
import { NotificationModal } from '@/components/NotificationModal';
import { grievanceCategories } from '@/constants/grievanceData';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { studentSupabase } from '@/lib/supabase';
import { NotificationService } from '@/services/NotificationService';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import { AnnouncementModal } from '@/components/AnnouncementModal';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { DeviceEventEmitter } from 'react-native';
import { globalCache } from '@/lib/cache';

function RootLayoutNav() {
  useOTAUpdates();
  const { theme, colors } = useTheme();
  const { staff, isInitialLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Internet Connection Listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const [notification, setNotification] = useState<{ title: string; message: string; visible: boolean; data?: any }>({
    title: '',
    message: '',
    visible: false
  });

  const [announcement, setAnnouncement] = useState<{ title: string; message: string; visible: boolean; priority: string }>({
    title: '',
    message: '',
    priority: 'Normal',
    visible: false
  });

  // App Lock Logic
  useEffect(() => {
    const checkSettings = async () => {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(enabled === 'true');
      if (enabled === 'true' && staff) {
        setIsLocked(true);
        checkBiometricLock();
      }
    };
    
    if (!isInitialLoading && staff) {
      checkSettings();
    }

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        (appState.current === 'background' || appState.current === 'inactive') &&
        nextAppState === 'active' &&
        !isInitialLoading &&
        staff
      ) {
        const enabled = await AsyncStorage.getItem('biometric_enabled');
        if (enabled === 'true') {
          setIsLocked(true);
          checkBiometricLock();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [staff, isInitialLoading]);

  const checkBiometricLock = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      if (enabled !== 'true') {
        setIsLocked(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock GIET Staff',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setIsLocked(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setIsLocked(true);
      }
    } catch (e) {
      console.log('Biometric lock error', e);
      setIsLocked(false); // Fallback to avoid permalock on error
    }
  };


  useEffect(() => {
    if (isInitialLoading) return;

    const inAuthGroup = segments[0] === '(tabs)'; // Main app

    // If not logged in and in main app, redirect to login
    if (!staff && inAuthGroup) {
      router.replace('/login');
    }
    // If logged in and on login page, redirect to main app
    else if (staff && segments[0] === 'login') {
      router.replace('/(tabs)');
    }

    // Hide splash screen once initial loading is done
    if (!isInitialLoading) {
      SplashScreen.hideAsync();
    }
  }, [staff, segments, isInitialLoading]);

  // Handle push notifications setup
  useEffect(() => {
    if (!staff) return;

    // Register for push notifications and save token
    NotificationService.registerForPushNotificationsAsync().then(token => {
      if (token && staff.id) {
        NotificationService.saveTokenToSupabase(staff.id, token);
      }
    });

    // 1. MOBILE SYSTEM PUSH LISTENER
    const cleanupNotifications = NotificationService.addNotificationListeners(
      (receivedNotification) => {
        // Show in-app modal for ALL foreground notifications
        // This acts as a reliable fallback if Realtime fails or is delayed
        const data = receivedNotification.request.content.data;

        // Prevent duplicate modal if already visible for same grievance
        setNotification(prev => {
          if (prev.visible && prev.data?.grievanceId === data?.grievanceId) {
            return prev;
          }
          return {
            title: receivedNotification.request.content.title || 'Notification',
            message: receivedNotification.request.content.body || '',
            visible: true,
            data: data
          };
        });
      },
      (response) => {
        // Handle notification click
        const data = response.notification.request.content.data;
        if (data?.grievanceId) {
          router.push({ pathname: "/grievance/[id]", params: { id: String(data.grievanceId) } });
        }
      }
    );


    // 1b. ANNOUNCEMENT BROADCAST LISTENER
    const announcementChannel = studentSupabase
      .channel('global-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          const newAnn = payload.new as any;
          setAnnouncement({
            title: newAnn.title || 'New Announcement',
            message: newAnn.message || '',
            priority: newAnn.priority || 'Normal',
            visible: true
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      )
      .subscribe();


    // 2. SUPABASE REALTIME LISTENER (Global Handler)
    // 2a. Notification Listener (Popups only)
    const notificationChannel = studentSupabase
      .channel('staff-popups')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications',
          filter: `staff_id=eq.${staff.id}`
        },
        (payload) => {
          const newNotif = payload.new as any;
          setNotification({
            title: newNotif.title || 'New Update',
            message: newNotif.message || '',
            visible: true,
            data: {
              grievanceId: newNotif.grievance_id,
              type: newNotif.type
            }
          });
        }
      )
      .subscribe();

    // 2b. Data Sync Listener (Dashboard & Cache updates - NO POPUPS)
    const realtimeChannel = studentSupabase
      .channel('global-data-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grievances',
        },
        (payload) => {
          const newRecord = payload.new as Grievance;
          const oldRecord = payload.old as Grievance;
          const eventType = payload.eventType;

          // --- 1. UPDATE CACHE & EMIT EVENT ---
          // This allows screens to stay in sync without their own listeners
          const isAssignedToMe = newRecord?.assigned_staff_id === staff.id;

          if (newRecord?.id) {
            globalCache.grievances[String(newRecord.id)] = newRecord;
          }

          if (globalCache.grievanceList) {
            const normalizedStatus = (newRecord?.status || '').trim().toLowerCase();
            const isPubliclyVisible = normalizedStatus === 'submitted' || normalizedStatus === 'pending' || normalizedStatus === 'unresponsive';
            
            const grievanceHostel = newRecord?.hostel?.trim().toLowerCase() || '';
            const staffHostel = staff.hostel_assigned?.trim().toLowerCase() || '';

            let isActuallyRelevant = isAssignedToMe ||
              newRecord?.resolved_by_staff_id === staff.id ||
              (newRecord?.unresponsive_staff_ids && newRecord.unresponsive_staff_ids.includes(staff.id));

            // Role-based logic (only apply if not already explicitly assigned AND it's not assigned to someone else)
            const isAssignedToSomeoneElse = newRecord?.assigned_staff_id && newRecord?.assigned_staff_id !== staff.id;

            if (!isActuallyRelevant && !isAssignedToSomeoneElse && isPubliclyVisible) {
              if (staffHostel) {
                // Hostel Warden logic: Strict building isolation
                if (grievanceHostel) {
                  const sDigit = staffHostel.match(/\d+/)?.[0];
                  const gDigit = grievanceHostel.match(/\d+/)?.[0];

                  if (sDigit && gDigit && sDigit !== gDigit) {
                    isActuallyRelevant = false;
                  } else {
                    const isMatch = grievanceHostel.includes(staffHostel) ||
                      staffHostel.includes(grievanceHostel) ||
                      (staffHostel.replace(/\s/g, '').includes(grievanceHostel.replace(/\s/g, ''))) ||
                      (grievanceHostel.replace(/\s/g, '').includes(staffHostel.replace(/\s/g, '')));
                    
                    if (isMatch) isActuallyRelevant = true;
                  }
                } else {
                  // No hostel on grievance: show if it's Hostel category or matches department
                  const isHostelCategory = newRecord?.category?.toLowerCase() === 'hostel';
                  const isDeptMatch = staff.department && newRecord?.category && 
                    staff.department.toLowerCase() === newRecord.category.toLowerCase();
                  
                  if (isHostelCategory || isDeptMatch) isActuallyRelevant = true;
                }
              } else {
                // General staff logic: Department match
                const isDeptMatch = staff.department && newRecord?.category && 
                  staff.department.toLowerCase() === newRecord.category.toLowerCase();
                
                if (isDeptMatch) isActuallyRelevant = true;
              }
            }

            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

            if (eventType === 'INSERT' && isActuallyRelevant) {
              if (!globalCache.grievanceList.find((g: Grievance) => g.id === newRecord.id)) {
                globalCache.grievanceList = [newRecord, ...globalCache.grievanceList];
              }
            } else if (eventType === 'UPDATE') {
              if (isActuallyRelevant) {
                const status = (newRecord as any).status;
                const isOldFinalized = (status === 'Resolved' || status === 'Rejected') &&
                  new Date((newRecord as any).updated_at || newRecord.created_at).getTime() < oneWeekAgo;

                if (isOldFinalized) {
                  globalCache.grievanceList = globalCache.grievanceList.filter((g: Grievance) => g.id !== newRecord.id);
                } else {
                  globalCache.grievanceList = globalCache.grievanceList.some((g: Grievance) => g.id === newRecord.id)
                    ? globalCache.grievanceList.map((g: Grievance) => g.id === newRecord.id ? newRecord : g)
                    : [newRecord, ...globalCache.grievanceList];
                }
              } else if (oldRecord?.assigned_staff_id === staff.id || globalCache.grievanceList.some((g: Grievance) => g.id === newRecord?.id)) {
                // Either it was assigned to me and now isn't, OR it was in my cache (e.g. via hostel match) and now isn't relevant
                globalCache.grievanceList = globalCache.grievanceList.filter((g: Grievance) => g.id !== newRecord?.id && g.id !== oldRecord?.id);
              }
            } else if (eventType === 'DELETE') {
              globalCache.grievanceList = globalCache.grievanceList.filter((g: any) => g.id !== oldRecord.id);
            }

            // Persist the updated list to AsyncStorage for cold starts
            const CACHE_KEY = `grievances_cache_${staff?.id}`;
            AsyncStorage.setItem(CACHE_KEY, JSON.stringify(globalCache.grievanceList)).catch(e => console.error("Cache persistence error", e));
          }

          // Broadcase the change
          DeviceEventEmitter.emit('grievance_updated', { payload, id: newRecord?.id || oldRecord?.id });
        }
      )
      .subscribe();

    return () => {
      cleanupNotifications();
      studentSupabase.removeChannel(realtimeChannel);
      studentSupabase.removeChannel(notificationChannel);
      studentSupabase.removeChannel(announcementChannel);
    };
  }, [staff]);

  if (isInitialLoading) {
    return null;
  }

  return (
    <NavThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade_from_bottom',
        presentation: 'card',
        gestureEnabled: true,
      }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar
        key={`statusbar-${theme}`}
        style={theme === 'dark' ? 'light' : 'dark'}
        backgroundColor="transparent"
        translucent={true}
      />

      <NotificationModal
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        deadline={notification.data?.deadline}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
        onViewAction={() => {
          setNotification(prev => ({ ...prev, visible: false }));

          // Add delay to allow modal to close gracefully before navigating
          // This prevents crashes on some devices where navigation happens during modal unmount
          setTimeout(() => {
            if (notification.data?.grievanceId) {
              // Ensure grievanceId is a string before passing
              const gId = String(notification.data.grievanceId);
              if (gId && gId !== 'undefined') {
                router.push({ pathname: "/grievance/[id]", params: { id: gId } });
              }
            } else {
              router.push('/(tabs)');
            }
          }, 300);
        }}
      />

      <AnnouncementModal
        visible={announcement.visible}
        title={announcement.title}
        message={announcement.message}
        priority={announcement.priority}
        onClose={() => setAnnouncement(prev => ({ ...prev, visible: false }))}
      />

      {/* --- App Lock Overlay --- */}
      {isLocked && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={100} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.lockOverlay}>
            <View style={[styles.lockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.lockIconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Feather name="lock" size={40} color="#8B5CF6" />
              </View>
              <Text style={[styles.lockTitle, { color: colors.text }]}>App Locked</Text>
              <Text style={[styles.lockMessage, { color: colors.icon }]}>
                Authentication is required to access the GIET Staff Portal.
              </Text>
              <AnimatedPressable
                onPress={checkBiometricLock}
                style={[styles.unlockButton, { backgroundColor: '#8B5CF6' }]}
              >
                <Text style={styles.unlockButtonText}>Unlock App</Text>
              </AnimatedPressable>
              
              <AnimatedPressable
                onPress={() => {
                  // Allow logging out from lock screen if they can't unlock
                  Alert.alert(
                    "Switch Account?",
                    "Are you sure you want to log out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Log Out", style: "destructive", onPress: async () => {
                        await AsyncStorage.clear();
                        setIsLocked(false);
                        router.replace('/login');
                      }}
                    ]
                  );
                }}
                style={styles.switchAccountButton}
              >
                <Text style={[styles.switchAccountText, { color: '#8B5CF6' }]}>Switch Account</Text>
              </AnimatedPressable>
            </View>
          </BlurView>
        </View>
      )}

      {/* --- Offline Overlay --- */}
      {!isConnected && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.offlineOverlay}>
            <View style={[styles.offlineCard, { backgroundColor: colors.card }]}>
              <View style={[styles.offlineIcon, { backgroundColor: '#EF4444' + '20' }]}>
                <WifiOff size={48} color="#EF4444" />
              </View>
              <Text style={[styles.offlineTitle, { color: colors.text }]}>No Internet Connection</Text>
              <Text style={[styles.offlineMessage, { color: colors.icon }]}>
                Please check your data or Wi-Fi settings. You can still see cached data, but updates require internet.
              </Text>
            </View>
          </BlurView>
        </View>
      )}
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  offlineCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  offlineIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  offlineMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10000,
  },
  lockCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  unlockButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchAccountButton: {
    paddingVertical: 8,
  },
  switchAccountText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
