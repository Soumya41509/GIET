import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Reanimated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCachedGrievanceSummary, getGrievanceStats, GrievanceItem, loadGrievances, loadGrievanceStats, getCachedStats } from '../../dataStorage';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../UserContext';
import { normalize, rf } from '../../utils/responsive';

const { width } = Dimensions.get('window');

// Responsive Utilities
const guidelineBaseWidth = 414;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const CYAN = {
  main: '#06B6D4',
  light: '#22D3EE',
};

const getStatusColor = (status: string) => {
  if (status.includes('Submitted')) return '#0EA5E9'; // Sky Blue
  if (status.includes('Resolved') || status.includes('Completed')) return '#10B981'; // Green
  if (status.includes('Progress') || status.includes('Review')) return '#F59E0B'; // Amber
  if (status.includes('Rejected') || status.includes('Declined')) return '#EF4444'; // Red
  if (status.includes('Unresponsive')) return '#8B5CF6'; // Violet
  return '#06B6D4'; // Cyan
};

const AnimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  safeArea: {
    flex: 1,
  },

  // --- New Minimal Header Styles ---
  headerContainer: {
    paddingHorizontal: moderateScale(22),
    paddingTop: Platform.OS === 'ios' ? moderateScale(10) : moderateScale(40),
    paddingBottom: moderateScale(15),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerWelcome: {
    fontSize: rf(26),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitleText: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '500',
    marginTop: moderateScale(2),
  },
  // --- End New Minimal Header Styles ---
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // --- Filter Bar Styles ---
  filterBarContainer: {
    height: moderateScale(40), // Stabilize height to prevent content jump
    marginBottom: moderateScale(20),
    justifyContent: 'center',
  },
  filterScrollView: {
    paddingHorizontal: moderateScale(20),
  },
  pill: {
    paddingHorizontal: moderateScale(16),
    height: moderateScale(40), // Match tickerContainer height exactly
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(15, 23, 42, 0.05)', // Dark glass tint
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  pillActive: {
    borderWidth: 0,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  pillGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: moderateScale(20),
  },
  pillGlassGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: moderateScale(20),
  },
  pillText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#1E293B', // Darker text for glass effect
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  pillCountText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#1E293B',
  },
  pillCountTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(100),
  },
  trackCard: {
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Back to light glass
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#1E293B', // Back to dark text
    flex: 1,
    marginRight: moderateScale(12),
    lineHeight: moderateScale(21),
  },
  cardDescription: {
    fontSize: moderateScale(13),
    color: '#64748B',
    lineHeight: moderateScale(19),
    marginBottom: moderateScale(16),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  statusText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  timelineContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: moderateScale(16),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(14,165,233,0.1)',
  },
  timelineTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.3,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: moderateScale(16),
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: moderateScale(12),
    width: moderateScale(20),
  },
  timelineDotContainer: {
    position: 'relative',
  },
  timelineDot: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -8,
    borderRadius: 2,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 0,
  },
  timelineContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100,116,139,0.05)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  timelineDate: {
    fontSize: moderateScale(9),
    color: '#64748B',
    fontWeight: '600',
  },
  timelineDescription: {
    fontSize: moderateScale(11),
    color: '#64748B',
    lineHeight: moderateScale(17),
  },
  emptyState: {
    paddingHorizontal: moderateScale(30),
    marginTop: moderateScale(80),
    alignItems: 'center',
  },
  emptyCard: {
    padding: moderateScale(40),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Back to light glass
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
  },
  emptyIconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(24),
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: moderateScale(19),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    marginTop: moderateScale(10),
    lineHeight: moderateScale(20),
    paddingHorizontal: moderateScale(10),
  },
  emptyActionBtn: {
    marginTop: moderateScale(28),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    gap: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  loaderSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  premiumSyncIndicator: {
    alignSelf: 'center',
    borderRadius: moderateScale(25),
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  syncBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    gap: moderateScale(10),
  },
  syncText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#0369A1',
  },
  hintCard: {
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.05)', // Subtle dark tint
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  hintBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    paddingRight: moderateScale(8),
    gap: 12,
  },
  hintContent: {
    flex: 1,
  },
  hintText: {
    fontSize: moderateScale(12),
    color: '#334155', // Back to dark text
    fontWeight: '600',
    lineHeight: moderateScale(17),
  },
  dismissHint: {
    padding: 4,
  },
  tickerContainer: {
    height: moderateScale(40),
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    marginHorizontal: moderateScale(22),
    borderRadius: moderateScale(20),
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 10, // Ensure enough room for long text without truncation
  },
  tickerText: {
    fontSize: moderateScale(12),
    color: '#334155',
    fontWeight: '600',
    paddingHorizontal: moderateScale(20),
  },
  tickerIconBox: {
    paddingLeft: moderateScale(14),
    zIndex: 10,
  },
  // --- End Ticker Styles ---

  floatingHintContainer: {
    position: 'absolute',
    top: moderateScale(130),
    left: moderateScale(20),
    right: moderateScale(20),
    zIndex: 100,
  },
});


// --- Ambient Background Orbs ---
const AmbientOrb = ({ color, size, top, left, right, bottom, opacity = 0.15 }: any) => (
  <View style={{
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    top, left, right, bottom,
    opacity,
  }}>
    <BlurView intensity={120} tint="light" style={StyleSheet.absoluteFill} />
  </View>
);

// --- Glass Header (Clean Style with Sub-line) ---
const GlassHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerWelcome}>{title}</Text>
          <Text style={styles.headerSubtitleText}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

// --- Stats Card (Vibrant Glass Tile - Matched to Home) ---
// --- Filter Pill Bar ---
const FilterPill: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  index: number;
}> = ({ label, isActive, onPress, index }) => {
  return (
    <AnimatedTouchableOpacity
      style={[styles.pill, isActive && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Inactive Glass Depth Gradient (Matched to Navbar Buttons) */}
      {!isActive && (
        <LinearGradient
          colors={['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.1)']}
          style={styles.pillGlassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {isActive && (
        <LinearGradient
          colors={['#0EA5E9', '#0284C7']}
          style={styles.pillGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {label}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

// --- High-Performance Scrolling Marquee (The 'Butter' Version) ---
const ScrollingTicker = ({ text }: { text: string }) => {
  const translateX = useSharedValue(width);
  const textWidth = useSharedValue(text.length * 10); // Better initial estimate

  useEffect(() => {
    if (textWidth.value > 0) {
      // Precise distance: from right edge to completely disappearing on left
      const totalDistance = width + textWidth.value + 100;
      const velocity = 105; // Slightly faster for a crisper, more energetic flow
      const duration = (totalDistance / velocity) * 1000;

      // Smooth entry from right
      translateX.value = width;
      translateX.value = withRepeat(
        withTiming(-textWidth.value - 100, {
          duration: duration,
          easing: Easing.linear,
        }),
        -1, // Infinite loop
        false // Do not reverse
      );
    }
  }, [text]); // Only restart if text content changes

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { perspective: 1000 }, // Ultra-smooth GPU rendering
      { rotate: '0.01deg' }   // Sub-pixel stabilization
    ],
  }));

  return (
    <Reanimated.View
      entering={FadeInDown.duration(800)}
      exiting={FadeOutUp.duration(400)}
      style={styles.tickerContainer}
      renderToHardwareTextureAndroid={true}
    >
      <View style={styles.tickerIconBox}>
        <Feather name="info" size={moderateScale(16)} color="#0EA5E9" />
      </View>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Reanimated.View
          style={[styles.tickerContent, animatedStyle]}
          onLayout={(e) => {
            const measured = e.nativeEvent.layout.width;
            if (measured > 0 && measured < width * 9) { // Don't use the 'width * 10' container size
              textWidth.value = measured;
            } else if (measured === 0) {
              // Fallback if measurement fails
              textWidth.value = text.length * 9;
            }
          }}
        >
          {/* Internal wrapper to measure ONLY the text, while parent provides the width * 10 buffer */}
          <View onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) textWidth.value = w;
          }} style={{ flexDirection: 'row' }}>
            <Text numberOfLines={1} style={styles.tickerText}>{text}</Text>
          </View>
        </Reanimated.View>
      </View>
    </Reanimated.View>
  );
}


const GrievanceCard = React.memo(({
  item,
  index,
  router
}: {
  item: GrievanceItem;
  index: number;
  router: any;
}) => {
  const handlePress = () => {
    router.push({
      pathname: '/GrievanceDetail',
      params: { id: item.id }
    });
  };

  // Only apply entering animation to the first few items to keep scrolling smooth
  const isInitialRendering = index < 10;

  return (
    <Reanimated.View
      entering={isInitialRendering ? FadeInDown.delay(index * 50).duration(400) : undefined}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.trackCard} // Use optimized static background instead of BlurView
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: moderateScale(11), color: '#64748B' }}>{item.date}</Text>
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="tag" size={moderateScale(10)} color="#0EA5E9" />
                <Text style={{ fontSize: moderateScale(11), color: '#475569' }}>{item.category}</Text>
              </View>
            </View>
          </View>
          <View
            style={{
              ...styles.statusBadge,
              backgroundColor: `${getStatusColor(item.status)}15`,
            }}
          >
            <Feather
              name={
                item.status.includes('Resolved') ? 'check-circle' :
                  item.status.includes('Rejected') ? 'x-circle' :
                    item.status.includes('Progress') ? 'clock' : 'activity'
              }
              size={moderateScale(10)}
              color={getStatusColor(item.status)}
            />
            <Text
              style={{
                ...styles.statusText,
                color: getStatusColor(item.status),
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {item.hostel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Feather name="home" size={moderateScale(10)} color="#0EA5E9" />
            <Text style={{ fontSize: moderateScale(11), color: '#475569' }}>{item.hostel}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Reanimated.View>
  );
});


export default function TrackGrievanceScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [showIntroTicker, setShowIntroTicker] = useState(true);
  const [showCards, setShowCards] = useState(true); // Now true by default

  // ============================================================================
  // OPTIMIZED DATA LOADING with Pagination & Smart Caching
  // ============================================================================
  const loadData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        // Step 1: INSTANT - Show cached data immediately (50ms)
        const cached = await getCachedGrievanceSummary();
        if (cached.length > 0) {
          setGrievances(cached);
          setIsLoading(false);
        }
        const cachedStats = await getCachedStats();
        if (cachedStats) {
          setStats({
            total: cachedStats.total || 0,
            pending: (cachedStats.submitted || 0) + (cachedStats.inProgress || 0),
            resolved: cachedStats.resolved || 0
          });
        }
      }

      // Step 2: BACKGROUND - Load first 20 grievances with active filter
      const data = await loadGrievances(0, 20, false, true, activeFilter);
      if (data) {
        setGrievances(data);
        setPage(0);
        setHasMore(data.length === 20);
      }

      // Step 3: BACKGROUND - Fetch accurate server stats
      const freshStats = await loadGrievanceStats();
      if (freshStats) {
        setStats({
          total: freshStats.total || 0,
          pending: (freshStats.submitted || 0) + (freshStats.inProgress || 0),
          resolved: freshStats.resolved || 0
        });
      }
    } catch (error) {
      // Error loading data
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  const handleLoadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const newData = await loadGrievances(nextPage, 20, false, true, activeFilter);
      if (newData && newData.length > 0) {
        // Keep existing items, append new ones. 
        // Note: filteredGrievances relies on the global 'grievances' array!
        setGrievances(prev => {
          // Prevent duplicates by ID just in case
          const existingIds = new Set(prev.map(g => g.id));
          const uniqueNew = newData.filter(n => !existingIds.has(n.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(newData.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      // Error loading more
    } finally {
      setIsFetchingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(true);

      // FIX: Use a small timeout to let the screen transition finish 
      // before triggering the intro state changes. This prevents 
      // Reanimated from getting stuck in a 'hidden' state.
      const focusTimer = setTimeout(() => {
        setShowIntroTicker(true);
        setShowCards(true);
      }, 100);

      const revealTimer = setTimeout(() => {
        setShowIntroTicker(false);
      }, 8500); // Increased slightly to show 2 full smooth transitions

      return () => {
        clearTimeout(focusTimer);
        clearTimeout(revealTimer);
      };
    }, [loadData])
  );

  // ============================================================================
  // OPTIMIZED REAL-TIME: Debounced Updates (No spam reloading!)
  // ============================================================================
  useEffect(() => {
    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;
    let updateCount = 0;

    const channel = supabase
      .channel('grievance-realtime-track')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        (payload) => {
          updateCount++;

          // Surgical Update for UPDATE events
          if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new;
            setGrievances(prev => {
              const index = prev.findIndex(g => g.id === updatedItem.id);
              if (index === -1) return prev;

              const newGrievances = [...prev];
              // Transform using the same helper as loadGrievances
              newGrievances[index] = {
                ...prev[index],
                status: updatedItem.status,
                // Only update status for now in the list view
              };
              return newGrievances;
            });
          }

          // OPTIMIZATION: Debounce full reload for complex changes (INSERT/DELETE)
          if (reloadTimeout) clearTimeout(reloadTimeout);
          reloadTimeout = setTimeout(() => {
            if (payload.eventType !== 'UPDATE') {
              loadData();
            }
            updateCount = 0;
          }, 1000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'grievance_timeline' },
        () => {
          // Timeline updates don't need full reload (detail view handles it)
          // console.log('📝 Track: Timeline update (ignoring)');
        }
      )
      .subscribe();

    // console.log('✅ Track: Real-time connected');

    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      supabase.removeChannel(channel);
      // console.log('🔌 Track: Real-time disconnected');
    };
  }, []); // ✅ Empty array - stable subscription!

  const filteredGrievances = useMemo(() => {
    if (activeFilter === 'All') return grievances;
    // Map filter label to status strings used in DB
    const statusMap: Record<string, string> = {
      'Submitted': 'Submitted',
      'In Progress': 'In Progress',
      'Resolved': 'Resolved',
      'Rejected': 'Rejected',
      'Unresponsive': 'Unresponsive'
    };

    const targetStatus = statusMap[activeFilter];
    if (targetStatus) {
      return grievances.filter(g => g.status === targetStatus);
    }

    return grievances;
  }, [grievances, activeFilter]);

  const renderItem = useCallback(({ item, index }: { item: GrievanceItem; index: number }) => (
    <GrievanceCard
      item={item}
      index={index}
      router={router}
    />
  ), [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Background - Mesh Gradient & Ambient Orbs */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE', '#F8FAFC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Environmental Orbs for Depth */}
        <AmbientOrb color="#BAE6FD" size={300} top={-50} right={-100} />
        <AmbientOrb color="#DDD6FE" size={250} bottom={100} left={-80} opacity={0.12} />

        {/* Soft Vignette Overlay */}
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.05)', 'transparent', 'transparent', 'rgba(15, 23, 42, 0.05)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header */}
      <GlassHeader
        title="Track Status"
        subtitle="Monitor your campus requests"
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Filter Bar Section / Ticker Phase */}
        <View style={styles.filterBarContainer}>
          {showIntroTicker ? (
            <ScrollingTicker
              text="Tip: Tap on any grievance card to view its complete timeline and live status updates."
            />
          ) : (
            <Reanimated.ScrollView
              entering={FadeIn.duration(400)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollView}
            >
              {['All', 'Submitted', 'In Progress', 'Resolved', 'Rejected', 'Unresponsive'].map((filter, index) => (
                <FilterPill
                  key={filter}
                  index={index}
                  label={filter}
                  isActive={activeFilter === filter}
                  onPress={() => setActiveFilter(filter)}
                />
              ))}
            </Reanimated.ScrollView>
          )}
        </View>

        {/* Content Phase */}
        <View style={{ flex: 1 }}>
          {showCards && (
            <Reanimated.FlatList
              data={filteredGrievances}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              // ULTRA OPTIMIZATION: Turbo Flow Mode
              decelerationRate="normal"
              overScrollMode="never"
              initialNumToRender={6}
              maxToRenderPerBatch={3}
              windowSize={3}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              getItemLayout={(data, index) => ({
                length: moderateScale(105),
                offset: moderateScale(105) * index,
                index,
              })}
              scrollEventThrottle={16}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingMore ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Feather name="loader" size={24} color={CYAN.main} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !isLoading ? (
                  <Reanimated.View
                    entering={FadeInUp.duration(800)}
                    style={styles.emptyState}
                  >
                    <BlurView intensity={60} tint="light" style={styles.emptyCard}>
                      {/* Animated Decorative Orb inside Card */}
                      <View
                        style={{
                          position: 'absolute',
                          top: -50,
                          right: -50,
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                          backgroundColor: '#BAE6FD',
                          opacity: 0.2
                        }}
                      />

                      <View style={styles.emptyIconContainer}>
                        <Feather
                          name={
                            activeFilter === 'All' ? 'plus-circle' :
                              activeFilter === 'Submitted' ? 'file-text' :
                                activeFilter === 'In Progress' ? 'clock' :
                                  activeFilter === 'Resolved' ? 'check-circle' :
                                    activeFilter === 'Rejected' ? 'x-circle' : 'alert-circle'
                          }
                          size={moderateScale(48)}
                          color={CYAN.main}
                        />
                      </View>

                      <Text style={styles.emptyTitle}>
                        {activeFilter === 'All' ? 'No Grievances Yet' : `No ${activeFilter}`}
                      </Text>

                      <Text style={styles.emptyText}>
                        {activeFilter === 'All'
                          ? 'Your grievance list is currently empty. Start by sharing your feedback or reporting an issue.'
                          : `We couldn't find any grievances with the status "${activeFilter.toLowerCase()}".`}
                      </Text>

                      <TouchableOpacity
                        style={styles.emptyActionBtn}
                        onPress={() => {
                          if (activeFilter === 'All') {
                            router.push('/(tabs)/submit');
                          } else {
                            setActiveFilter('All');
                          }
                        }}
                      >
                        <LinearGradient
                          colors={['#0EA5E9', '#0284C7']}
                          style={styles.emptyActionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Feather
                            name={activeFilter === 'All' ? 'plus' : 'filter'}
                            size={moderateScale(16)}
                            color="white"
                          />
                          <Text style={styles.emptyActionText}>
                            {activeFilter === 'All' ? 'Raise New Grievance' : 'View All Grievances'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </BlurView>
                  </Reanimated.View>
                ) : null
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}




