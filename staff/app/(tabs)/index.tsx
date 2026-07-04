import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Grievance, GrievanceCard, GrievanceStatus } from '@/components/GrievanceCard';
import { SwipeableGrievanceRow } from '@/components/grievance/SwipeableGrievanceRow';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { grievanceCategories } from '@/constants/grievanceData';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { studentSupabase } from '@/lib/supabase';

// --- Glass Header ---
const GlassHeader: React.FC<{ name: string; onProfilePress: () => void; topInset: number }> = ({
  name,
  onProfilePress,
  topInset,
}) => {
  const { colors, theme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    scaleAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <View style={styles.headerContainer}>
      <BlurView intensity={90} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.headerGlass}>
        <LinearGradient
          colors={theme === 'dark' ? [
            'rgba(139, 92, 246, 0.15)',
            'rgba(0,0,0,0.2)',
            'rgba(139, 92, 246, 0.10)',
          ] : [
            'rgba(139, 92, 246, 0.25)',
            'rgba(255,255,255,0.3)',
            'rgba(139, 92, 246, 0.20)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.headerContent, { paddingTop: topInset, height: topInset + 60 }]}>
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={[styles.welcomeText, { color: colors.icon }]}>{getGreeting()}</Text>
            <Text style={[styles.nameText, { color: colors.text }]}>{name.split(' ')[0]}</Text>
          </Animated.View>

          <AnimatedPressable
            onPress={onProfilePress}
            style={styles.profileButton}
          >
            <Animated.View style={animatedStyle}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.avatarCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="user" size={22} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </AnimatedPressable>
        </View>
        <View style={{ height: 1, width: '100%', backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)' }} />
      </BlurView>
    </View>
  );
};

import { globalCache } from '@/lib/cache';

import { DeviceEventEmitter } from 'react-native';

export default function HomeScreen() {
  const { colors, theme } = useTheme();
  const { staff } = useAuth();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>(globalCache.grievanceList || []);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(!globalCache.isWarmedUp);
  const [error, setError] = useState<string | null>(null);

  // URGENT THRESHOLD (in minutes)
  const [urgentThreshold, setUrgentThreshold] = useState(15);

  // Confirmation Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string, status: string } | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const normalizeStatus = (status?: string) => {
    const s = (status || '').trim().toLowerCase();
    if (s === 'in progress') return 'in-progress';
    return s;
  };

  useEffect(() => {
    // Ticker to refresh status calculation for deadlines
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Load threshold from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const val = await AsyncStorage.getItem('urgent_threshold');
        if (val) setUrgentThreshold(parseInt(val));
      } catch (e) { }
    };
    loadSettings();

    // Listen for setting changes
    const sub = DeviceEventEmitter.addListener('urgent_threshold_changed', (val) => {
      setUrgentThreshold(val);
    });
    return () => sub.remove();
  }, []);

  // Cache Key for Persistence
  const CACHE_KEY = `grievances_cache_${staff?.id}`;

  const loadCache = async () => {
    try {
      if (globalCache.isWarmedUp) return;
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setGrievances(parsed);
        globalCache.grievanceList = parsed;
        setLoading(false);
      }
    } catch (e) {
      console.log('Cache load error', e);
    }
  };

  const fetchGrievances = async (isRefresh = false) => {
    try {
      if (!staff) return;
      // SWR: Don't show skeleton if we have data in memory
      if (!isRefresh && globalCache.grievanceList === null) setLoading(true);
      if (isRefresh) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError(null);

      // Use targeted status queries (same approach as list filters) to avoid broad-query misses.
      // OPTIMIZED: Fetch by assignment and department separately to overcome Supabase OR complexity
      const [assignedRes, publicDeptRes, hostelRes] = await Promise.all([
        // 1. My Explicit Assignments (Any status, including older resolved/rejected)
        studentSupabase
          .from('grievances')
          .select('*')
          .or(`assigned_staff_id.eq.${staff.id},resolved_by_staff_id.eq.${staff.id},unresponsive_staff_ids.cs.{${staff.id}}`)
          .order('created_at', { ascending: false })
          .limit(2000),

        // 2. Unassigned items in my department
        staff.department ? studentSupabase
          .from('grievances')
          .select('*')
          .eq('category', staff.department)
          .is('assigned_staff_id', null)
          .in('status', ['Submitted', 'Pending', 'Unresponsive', 'submitted', 'pending', 'unresponsive'])
          .order('created_at', { ascending: false })
          .limit(2000) : Promise.resolve({ data: [] }),

        // 3. Unassigned items in my hostel (if applicable)
        staff.hostel_assigned ? studentSupabase
          .from('grievances')
          .select('*')
          .eq('category', 'Hostel')
          .is('assigned_staff_id', null)
          .in('status', ['Submitted', 'Pending', 'Unresponsive', 'submitted', 'pending', 'unresponsive'])
          .order('created_at', { ascending: false })
          .limit(2000) : Promise.resolve({ data: [] }),
      ]);

      if (assignedRes.error) throw assignedRes.error;
      const pubRes = publicDeptRes as any;
      const hosRes = hostelRes as any;
      if (pubRes?.error) throw pubRes.error;
      if (hosRes?.error) throw hosRes.error;

      const rawData = [
        ...(assignedRes.data || []),
        ...(pubRes?.data || []),
        ...(hosRes?.data || [])
      ];

      const mergedMap = new Map<string, any>();
      for (const item of rawData) {
        if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
      }

      const merged = Array.from(mergedMap.values()).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filtered = merged.filter(g => {
        const normalized = normalizeStatus(g.status);

        // 1. Time filter for finalized grievances (Apply to EVERYTHING including my own)
        if (normalized === 'resolved' || normalized === 'rejected') {
          const resolvedTime = new Date(g.updated_at || g.created_at).getTime();
          if (resolvedTime < oneWeekAgo) return false;
        }

        const isAssignedToMe = g.assigned_staff_id === staff.id;
        const isResolvedByMe = g.resolved_by_staff_id === staff.id;
        const isMissedByMe = Array.isArray(g.unresponsive_staff_ids) && g.unresponsive_staff_ids.includes(staff.id);

        // 2. If explicitly mine, always show
        if (isAssignedToMe || isResolvedByMe || isMissedByMe) return true;

        // 3. ASSIGNMENT PRIVACY: If assigned to someone else, hide it immediately
        if (g.assigned_staff_id && g.assigned_staff_id !== staff.id) return false;

        // 4. STATUS PRIVACY: If it's NOT unassigned/unresponsive, hide it from others
        const isPubliclyVisible = normalized === 'submitted' || normalized === 'pending' || normalized === 'unresponsive';
        if (!isPubliclyVisible) return false;

        const grievanceHostel = g.hostel?.trim().toLowerCase() || '';
        const staffHostel = staff.hostel_assigned?.trim().toLowerCase() || '';

        // 5. Strict Hostel/Department Filter for Public (unassigned) items
        if (staffHostel) {
          if (grievanceHostel) {
            const sDigit = staffHostel.match(/\d+/)?.[0];
            const gDigit = grievanceHostel.match(/\d+/)?.[0];

            if (sDigit && gDigit && sDigit !== gDigit) return false;

            const isMatch = grievanceHostel.includes(staffHostel) ||
              staffHostel.includes(grievanceHostel) ||
              (staffHostel.replace(/\s/g, '').includes(grievanceHostel.replace(/\s/g, ''))) ||
              (grievanceHostel.replace(/\s/g, '').includes(staffHostel.replace(/\s/g, '')));

            if (!isMatch) return false;
          } else {
            const isHostelCategory = g.category?.toLowerCase() === 'hostel';
            const isDeptMatch = staff.department && g.category &&
              staff.department.toLowerCase() === g.category.toLowerCase();

            if (!isHostelCategory && !isDeptMatch) return false;
          }
          return true;
        }

        // Department Filter (for non-hostel staff)
        const isDepartmentMatch = staff.department && g.category &&
          staff.department.toLowerCase() === g.category.toLowerCase();

        return isDepartmentMatch;
      });

      setGrievances(filtered as Grievance[]);
      globalCache.grievanceList = filtered;
      globalCache.isWarmedUp = true;
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    } catch (e: any) {
      console.error(e);
      if (!globalCache.isWarmedUp) setError(e.message || 'Failed to load grievances');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };


  useEffect(() => {
    const init = async () => {
      await loadCache();
      fetchGrievances();
    };
    init();

    if (!staff?.id) return;

    // Listen to global updates from _layout.tsx
    const subscription = DeviceEventEmitter.addListener('grievance_updated', () => {
      if (globalCache.grievanceList) {
        setGrievances([...globalCache.grievanceList]);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [staff]);

  const processStatusUpdate = async () => {
    if (!confirmTarget) return;
    const { id, status } = confirmTarget;

    setConfirmVisible(false);

    // Get current grievance for logic check
    const currentGrievance = grievances.find(g => g.id === id);
    if (!currentGrievance) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Optimistic Update for UI
    const oldGrievances = [...grievances];
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: status as GrievanceStatus } : g));

    try {
      // Sequential update logic: if moving from Submitted straight to Resolved
      const currentStatus = normalizeStatus(currentGrievance.status);
      if ((currentStatus === 'submitted' || currentStatus === 'pending') && status === 'Resolved') {
        // Step 1: In-progress
        await studentSupabase
          .from('grievances')
          .update({ status: 'In-progress' })
          .eq('id', id);

        // Brief delay for timeline consistency
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Final status update
      const updateData: any = { status: status };
      if (status === 'Resolved' && staff?.id) {
        updateData.resolved_by_staff_id = staff.id;
      }

      // CRITICAL: When moving to In-progress, assign to the staff who took the action
      if (status === 'In-progress' && staff?.id) {
        updateData.assigned_staff_id = staff.id;
      }

      const { error } = await studentSupabase
        .from('grievances')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error("Failed to update status", e);
      Alert.alert("Update Failed", "Could not update status. Reverting.");
      setGrievances(oldGrievances); // Revert
    } finally {
      setConfirmTarget(null);
    }
  };

  // Memoize stats calculation to avoid recalculating on every render
  const stats = useMemo(() => {
    if (!staff?.id) return { submitted: 0, inProgress: 0, resolved: 0, rejected: 0, unresponsive: 0, total: 0 };
    let submitted = 0;
    let inProgress = 0;
    let resolved = 0;
    let rejected = 0;
    let unresponsive = 0;

    for (const g of grievances) {
      const normalized = normalizeStatus(g.status);
      const isMissedByMe = Array.isArray(g.unresponsive_staff_ids) && g.unresponsive_staff_ids.includes(staff.id);

      if (normalized === 'submitted' || normalized === 'pending') submitted += 1;
      if (normalized === 'in-progress') inProgress += 1;
      if (normalized === 'resolved') resolved += 1;
      if (normalized === 'rejected') rejected += 1;
      if (normalized === 'unresponsive' || isMissedByMe) unresponsive += 1;
    }

    return { submitted, inProgress, resolved, rejected, unresponsive, total: grievances.length };
  }, [grievances, staff?.id, now]);

  const urgentGrievances = useMemo(() => {
    if (!staff?.id) return [];

    const currentTime = now;
    const thresholdMs = urgentThreshold * 60 * 1000;

    return grievances.filter(g => {
      const normalized = normalizeStatus(g.status);
      // Don't show resolved/rejected/unresponsive in urgent list
      if (normalized === 'resolved' || normalized === 'rejected' || normalized === 'unresponsive') return false;

      if (!g.escalation_deadline) return false;

      const deadline = new Date(g.escalation_deadline).getTime();
      const diff = deadline - currentTime;

      // Filter: Deadline within the threshold (e.g. 15 mins) OR already expired (but not yet marked unresponsive)
      return diff <= thresholdMs;
    });
  }, [grievances, urgentThreshold, now, staff?.id]);



  const insets = useSafeAreaInsets();

  // Memoize handlers to prevent recreation on every render
  const handleStatusUpdate = useCallback((id: string, newStatus: string) => {
    setConfirmTarget({ id, status: newStatus });
    setConfirmVisible(true);
  }, []);

  const handleGrievancePress = useCallback((id: string) => {
    // State Warming: Store the item in the detail cache so the NEXT page has it instantly
    const item = grievances.find(g => g.id === id);
    if (item) {
      globalCache.grievances[String(id)] = item;
    }
    router.push({ pathname: "/grievance/[id]", params: { id } });
  }, [router, grievances]);

  // Fixed height for each item improves performance
  const ITEM_HEIGHT = 156;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const navigateToList = (filter: string) => {
    router.push({ pathname: '/grievance/list', params: { filter } });
  };

  if (loading && !refreshing && grievances.length === 0) { // Only show skeleton if NO data
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassHeader name={staff?.name || ''} onProfilePress={() => { }} topInset={insets.top} />
        <View style={styles.statsRow}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={86} style={{ flex: 1, borderRadius: 20 }} />)}
        </View>

        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Skeleton width="40%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
              <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={100} height={24} borderRadius={12} />
                <Skeleton width={60} height={24} borderRadius={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        name={staff?.name || 'Staff Member'}
        onProfilePress={() => router.push('/(tabs)/profile')}
        topInset={insets.top}
      />

      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.statsRow}>
        <AnimatedPressable
          style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#312e81' : '#EEF2FF', borderWidth: 2, borderColor: 'transparent' }]}
          onPress={() => navigateToList('Submitted')}
        >
          <Text style={[styles.statNumber, { color: theme === 'dark' ? '#818cf8' : '#4F46E5' }]}>
            {stats.submitted}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#818cf8' : '#4F46E5' }]}>Submitted</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1e1b4b' : '#E0E7FF', borderWidth: 2, borderColor: 'transparent' }]}
          onPress={() => navigateToList('In-progress')}
        >
          <Text style={[styles.statNumber, { color: theme === 'dark' ? '#6366f1' : '#4338CA' }]}>
            {stats.inProgress}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#6366f1' : '#4338CA' }]}>In Progress</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ECFDF5', borderWidth: 2, borderColor: 'transparent' }]}
          onPress={() => navigateToList('Resolved')}
        >
          <Text style={[styles.statNumber, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>
            {stats.resolved}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Resolved</Text>
        </AnimatedPressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(800)} style={[styles.statsRow, { marginTop: -12 }]}>
        <AnimatedPressable
          style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#450a0a' : '#FEF2F2', borderWidth: 2, borderColor: 'transparent' }]}
          onPress={() => navigateToList('Rejected')}
        >
          <Text style={[styles.statNumber, { color: theme === 'dark' ? '#f87171' : '#DC2626' }]}>
            {stats.rejected}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#f87171' : '#DC2626' }]}>Rejected</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#451a03' : '#FFF7ED', borderWidth: 2, borderColor: 'transparent' }]}
          onPress={() => navigateToList('Unresponsive')}
        >
          <Text style={[styles.statNumber, { color: theme === 'dark' ? '#fb923c' : '#EA580C' }]}>
            {stats.unresponsive}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#fb923c' : '#EA580C' }]}>Unresponsive</Text>
        </AnimatedPressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350).duration(800)} style={[styles.statsRow, { marginTop: -12, marginBottom: 15 }]}>
        <AnimatedPressable
          style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#0f766e' : '#ccf2f4', borderWidth: 2, borderColor: 'transparent' }]}
          onPress={() => navigateToList('All')}
        >
          <Text style={[styles.statNumber, { color: theme === 'dark' ? '#5eead4' : '#00695C' }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: theme === 'dark' ? '#5eead4' : '#00695C' }]}>Total Grievances</Text>
        </AnimatedPressable>
      </Animated.View>

      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Urgent Deadlines</Text>
        <Text style={{ fontSize: 12, color: colors.icon, marginTop: 2 }}>Deadlines within {urgentThreshold} minutes</Text>
      </View>

      <Animated.FlatList
        itemLayoutAnimation={urgentGrievances.length < 50 ? Layout.springify() : undefined}
        data={urgentGrievances}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <SwipeableGrievanceRow
              item={item}
              onSwipeRight={() => handleStatusUpdate(item.id, 'In-progress')}
              onSwipeLeft={() => handleStatusUpdate(item.id, 'Resolved')}
            >
              <GrievanceCard
                grievance={item}
                onPress={() => handleGrievancePress(item.id)}
              />
            </SwipeableGrievanceRow>
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchGrievances(true)} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.errorContainer}>
              <EmptyState
                title="Error Loading Grievances"
                message={error}
                icon="alert-circle"
              />
              <AnimatedPressable
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => fetchGrievances(true)}
              >
                <Text style={styles.retryText}>Retry</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <EmptyState
              title="All Caught Up!"
              message={`No grievances have deadlines within the next ${urgentThreshold} minutes.`}
              icon="check-circle"
            />
          )
        }
      />

      <ConfirmModal
        visible={confirmVisible}
        title="Confirm Action"
        message={`Are you sure you want to mark this grievance as ${confirmTarget?.status}?`}
        onConfirm={processStatusUpdate}
        onCancel={() => {
          setConfirmVisible(false);
          setConfirmTarget(null);
        }}
        confirmText="Confirm"
        cancelText="Cancel"
        icon={confirmTarget?.status === 'Resolved' ? 'check-circle' : 'loader'}
        type={confirmTarget?.status === 'Resolved' ? 'success' : 'primary'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 10,
    backgroundColor: 'transparent',
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  headerGlass: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileButton: {},
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 13,
    marginBottom: 0,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  listContent: {
    padding: 20,
    paddingTop: 0,
  },

  skeletonCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  leftActionContainer: {
    flex: 1,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    marginBottom: 12,
    borderRadius: 14,
  },
  rightActionContainer: {
    flex: 1,
    backgroundColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    marginBottom: 12,
    borderRadius: 14,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
