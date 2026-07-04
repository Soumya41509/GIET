import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Easing,
  RefreshControl,
  Animated as RNAnimated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable
} from 'react-native';
import { Svg, Circle, G, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  getCachedGrievanceSummary,
  getCachedStats,
  getGrievanceStats,
  loadGrievances,
  loadGrievanceStats,
  savePinnedUpdate,
  getPinnedUpdates,
  mergePinnedWithList,
  transformGrievanceRecord,
  updateCachedGrievanceSummary,
  cacheStats,
  clearGrievanceCache,
  formatDate
} from '../../dataStorage';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../UserContext';
import { normalize, rf } from '../../utils/responsive';
import { addNotification, getNotifications } from '../../notificationStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');

// --- Glass Header (New Version with Enhanced Gradient & Pulse) ---
const GlassHeader: React.FC<{ name: string; onNotifPress: () => void; hasNewNotifs: boolean }> = ({
  name,
  onNotifPress,
  hasNewNotifs,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good Night 🌙';
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    if (hour < 21) return 'Good Evening 🌛';
    return 'Good Night 🌙';
  };

  const getDisplayDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerGreetingText}>{getGreeting()}</Text>
          <Text style={styles.headerWelcome}>{name.split(' ')[0]}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerNotifBtn}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNotifPress();
          }}
        >
          {hasNewNotifs && <View style={styles.notifBadge} />}
          <Feather name="bell" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

// --- Tips Section (Restored Previous Version) ---

// --- Glass Tips Section ---
const TipsSection: React.FC = () => {
  const [tips, setTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState(0);
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('student_tips')
        .select('content')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setTips(data.map(t => t.content));
      }
    } catch (err) {
      // Failed to fetch tips
    }
  };

  useEffect(() => {
    fetchTips();

    // Real-time listener for tips management
    const channel = supabase
      .channel('public:student_tips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_tips' }, () => {
        fetchTips();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (containerWidth === 0 || tips.length <= 1) {
      translateX.setValue(0);
      return;
    }

    const interval = setInterval(() => {
      RNAnimated.timing(translateX, {
        toValue: -containerWidth,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        const next = (currentTip + 1) % tips.length;
        setCurrentTip(next);
        translateX.setValue(containerWidth);
        RNAnimated.timing(translateX, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [currentTip, containerWidth, tips.length, translateX]);

  // If no tips are available, show a single welcome message with same glass effect
  if (tips.length === 0) {
    return (
      <View style={styles.glassTipsContainer}>
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[
              'rgba(14,165,233,0.22)',
              'rgba(255,255,255,0.12)',
              'rgba(14,165,233,0.16)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>
        <View style={styles.tipRow}>
          <Feather name="shield" size={18} color="#0EA5E9" style={{ marginRight: 8 }} />
          <Text style={styles.tipText}>Welcome to GIET Grievance Redressal Portal</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.glassTipsContainer}>
      <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[
            'rgba(14,165,233,0.22)',
            'rgba(255,255,255,0.12)',
            'rgba(14,165,233,0.16)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>

      <View style={styles.tipRow}>
        <Feather name="info" size={18} color="#0EA5E9" style={{ marginRight: 8 }} />
        <View
          style={{ flex: 1, overflow: 'hidden' }}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          <RNAnimated.View style={{ transform: [{ translateX }] }}>
            <Text style={styles.tipText} numberOfLines={1}>
              {tips[currentTip]}
            </Text>
          </RNAnimated.View>
        </View>
      </View>
    </View>
  );
};

// --- Premium Liquid Glass Colors ---
const LIQUID_COLORS = {
  red: '#FB7185',    // Soft Rose (Rejected)
  yellow: '#FBBF24', // Soft Amber (Submitted)
  green: '#34D399',  // Soft Emerald (Resolved)
  blue: '#FBBF24',   // Polished Yellow (Active)
};

// --- Donut Chart (Sharp Segmented Style) ---
const DonutChart: React.FC<{ total: number; submitted: number; inProgress: number; resolved: number; rejected: number }> = ({ total, submitted, inProgress, resolved, rejected }) => {
  const size = 110;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const cx = size / 2;
  const cy = size / 2;

  const activeCount = submitted + inProgress;
  const rejectedCount = Math.max(0, total - (resolved + activeCount));

  // Pre-calculate all segment positions
  let d = 0;
  const yellowStart = d;
  const yellowLen = total > 0 ? (activeCount / total) * circumference : 0;
  d += yellowLen;

  const greenStart = d;
  const greenLen = total > 0 ? (resolved / total) * circumference : 0;
  d += greenLen;

  const redStart = d;
  const redLen = total > 0 ? (rejectedCount / total) * circumference : 0;

  // Junctions where separators will be drawn
  const junctions = [yellowStart, greenStart, redStart];

  return (
    <View style={styles.donutContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id="d-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FDE68A" />
            <Stop offset="100%" stopColor="#FBBF24" />
          </SvgLinearGradient>
          <SvgLinearGradient id="d-green" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6EE7B7" />
            <Stop offset="100%" stopColor="#34D399" />
          </SvgLinearGradient>
          <SvgLinearGradient id="d-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FDA4AF" />
            <Stop offset="100%" stopColor="#FB7185" />
          </SvgLinearGradient>
        </Defs>

        <G transform={`translate(${size}, 0) scale(-1, 1) rotate(-90, ${cx}, ${cy})`}>
          {total === 0 && (
            <Circle cx={cx} cy={cy} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none" opacity={0.5} />
          )}

          {/* Yellow segment - sharp butt cap */}
          {activeCount > 0 && (
            <Circle cx={cx} cy={cy} r={radius}
              stroke="url(#d-yellow)" strokeWidth={strokeWidth}
              strokeDasharray={`${yellowLen} ${circumference}`}
              strokeDashoffset={-yellowStart}
              strokeLinecap="butt" fill="none"
            />
          )}

          {/* Green segment - sharp butt cap */}
          {resolved > 0 && (
            <Circle cx={cx} cy={cy} r={radius}
              stroke="url(#d-green)" strokeWidth={strokeWidth}
              strokeDasharray={`${greenLen} ${circumference}`}
              strokeDashoffset={-greenStart}
              strokeLinecap="butt" fill="none"
            />
          )}

          {/* Red segment - sharp butt cap */}
          {rejectedCount > 0 && (
            <Circle cx={cx} cy={cy} r={radius}
              stroke="url(#d-red)" strokeWidth={strokeWidth}
              strokeDasharray={`${redLen} ${circumference}`}
              strokeDashoffset={-redStart}
              strokeLinecap="butt" fill="none"
            />
          )}

          {/* Subtle dark separator lines at each segment junction */}
          {junctions.map((jPos, i) => (
            <Circle key={`sep-${i}`} cx={cx} cy={cy} r={radius}
              stroke="#1E293B" strokeWidth={strokeWidth}
              strokeDasharray={`1 ${circumference}`}
              strokeDashoffset={-jPos}
              strokeLinecap="butt" fill="none" opacity={0.3}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.donutInnerContent}>
        <Text style={styles.donutTotalText}>{total}</Text>
        <Text style={styles.donutTotalLabel}>Total</Text>
      </View>
    </View>
  );
};


// --- Animated Google AI / Gemini Border Button ---
const AnimatedBorderButton = ({ onPress, title }: { onPress: () => void, title: string }) => {
  const spinAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={{
        borderRadius: 20,
        overflow: 'hidden',
        padding: 1.5, // Subtle border thickness
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <RNAnimated.View style={{
          position: 'absolute',
          width: '200%',
          height: '400%',
          transform: [{ rotate: spin }]
        }}>
          <LinearGradient
            colors={[LIQUID_COLORS.blue, LIQUID_COLORS.red, LIQUID_COLORS.yellow, LIQUID_COLORS.green, LIQUID_COLORS.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </RNAnimated.View>
        <View style={{
          backgroundColor: '#FFFFFF', // Solid inside to reveal animated border
          borderRadius: 18,
          paddingHorizontal: 12,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '700' }}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Summary Glass Card ---
const SummaryCard: React.FC<{ stats: any; onViewDetails: () => void }> = ({ stats, onViewDetails }) => {
  return (
    <View style={styles.summaryCardWrapper}>
      <BlurView intensity={90} tint="light" style={[styles.summaryCardInner, { flexDirection: 'column', alignItems: 'stretch' }]}>

        {/* Top Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <View>
            <Text style={styles.summaryTitle}>My Complaints</Text>
            <Text style={[styles.summarySubtitle, { marginBottom: 0 }]}>Track your submitted issues</Text>
          </View>
          <AnimatedBorderButton onPress={onViewDetails} title="View All" />
        </View>

        {/* Bottom Chart & Stats Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>

          {/* 4 Statuses Left (2x2 Grid of Thin Pills) */}
          {/* 3 Statuses List (Compact 1-1-1 Layout) */}
          {/* 3 Statuses List (Left Aligned Layout) */}
          <View style={{ flex: 1, paddingRight: 4, alignItems: 'flex-start' }}>

            {/* Active Card */}
            <View style={{ backgroundColor: LIQUID_COLORS.blue + '15', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 6, minWidth: '70%' }}>
              <View style={{ backgroundColor: LIQUID_COLORS.blue, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: LIQUID_COLORS.blue, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2.5 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>{stats.submitted + stats.inProgress}</Text>
              </View>
              <Text style={{ fontSize: rf(13), fontWeight: '700', color: '#475569', marginLeft: 10 }}>Active</Text>
            </View>

            {/* Resolved Card */}
            <View style={{ backgroundColor: LIQUID_COLORS.green + '15', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 6, minWidth: '70%' }}>
              <View style={{ backgroundColor: LIQUID_COLORS.green, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: LIQUID_COLORS.green, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2.5 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>{stats.resolved}</Text>
              </View>
              <Text style={{ fontSize: rf(13), fontWeight: '700', color: '#475569', marginLeft: 10 }}>Resolved</Text>
            </View>

            {/* Rejected Card */}
            <View style={{ backgroundColor: LIQUID_COLORS.red + '15', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 0, minWidth: '70%' }}>
              <View style={{ backgroundColor: LIQUID_COLORS.red, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: LIQUID_COLORS.red, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2.5 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>{stats.rejected}</Text>
              </View>
              <Text style={{ fontSize: rf(13), fontWeight: '700', color: '#475569', marginLeft: 10 }}>Rejected</Text>
            </View>

          </View>

          {/* Donut Right */}
          <View>
            <DonutChart
              total={stats.total}
              submitted={stats.submitted}
              inProgress={stats.inProgress}
              resolved={stats.resolved}
              rejected={stats.rejected}
            />
          </View>

        </View>

      </BlurView>
    </View>
  );
};


// --- Live Relative Time Component ---
const LiveTime = ({ timestamp }: { timestamp: string }) => {
  const [display, setDisplay] = useState(formatDate(timestamp));

  useEffect(() => {
    // Safety check: if it's not a valid ISO date string, don't start timer
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      setDisplay(timestamp); // Fallback to raw string
      return;
    }

    // Initial update in case it was just now
    setDisplay(formatDate(timestamp));

    // Interval to keep it fresh
    const timer = setInterval(() => {
      setDisplay(formatDate(timestamp));
    }, 60000);

    return () => clearInterval(timer);
  }, [timestamp]);

  return <Text style={styles.itemDate}>{display}</Text>;
};

// --- Recent Complaints Section (List Style) ---
const ComplaintListCard: React.FC<{ grievances: any[]; onViewAll: () => void; isLoading?: boolean; refreshing?: boolean }> = ({ grievances, onViewAll, isLoading, refreshing }) => {
  const router = useRouter();


  const getStatusText = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('submitted')) return '#3B82F6'; // Blue
    if (s.includes('progress') || s.includes('review')) return '#F59E0B'; // Amber
    if (s.includes('resolved') || s.includes('completed')) return '#10B981'; // Green
    if (s.includes('rejected') || s.includes('declined')) return '#EF4444'; // Red
    if (s.includes('unresponsive')) return '#8B5CF6'; // Purple
    return '#64748B'; // Default Slate
  };

  const recentGrievances = grievances.slice(0, 3);

  return (
    <View style={styles.complaintListWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Updates</Text>
      </View>

      {(isLoading || refreshing) && grievances.length === 0 ? (
        // Rendering 3 skeleton items
        [1, 2, 3].map((_, i) => (
          <View key={`skeleton-${i}`} style={[styles.complaintItem, styles.skeletonItem]}>
            <View style={styles.skeletonIcon} />
            <View style={styles.itemContent}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonTime} />
            </View>
          </View>
        ))
      ) : grievances.length === 0 ? (
        <View style={styles.emptyListState}>
          <Text style={styles.emptyText}>No complaints yet</Text>
        </View>
      ) : (
        recentGrievances.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.complaintItem,
              {
                backgroundColor: '#F8FAFC', // Refined Pearl White
                borderLeftWidth: 16,
                borderLeftColor: getStatusText(item.status),
                borderWidth: 1,
                borderColor: '#F1F5F9'
              }
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/GrievanceDetail',
                params: { id: item.id }
              });
            }}
          >
            {/* Absolute Vertical Text inside the left border gap */}
            <View style={{ position: 'absolute', left: -16, top: 0, bottom: 0, width: 16, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
              <View style={{ transform: [{ rotate: '-90deg' }], width: 100, alignItems: 'center' }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 7,
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }} numberOfLines={1}>
                  {item.status.toLowerCase().includes('pending') || item.status.toLowerCase().includes('progress') || item.status.toLowerCase().includes('submitted') ? 'Active' : item.status}
                </Text>
              </View>
            </View>
            <View style={[styles.itemIconContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
              <Feather
                name={item.title.toLowerCase().includes('wifi') ? 'wifi' : 'file-text'}
                size={18}
                color="#64748B"
              />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <LiveTime timestamp={item.rawDate || item.date} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

// --- AI Floating Action Button (Glass Design) ---
const AIFAB: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  const scale = useRef(new RNAnimated.Value(1)).current;
  const spinAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Feel the press down
    RNAnimated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    RNAnimated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <RNAnimated.View
      style={[
        styles.fabWrapper,
        {
          transform: [{ scale }],
          bottom: 95 + insets.bottom, // Dynamic 'Jugad' for different nav styles
        },
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.fabPressable, { backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }]}
      >
        {/* Animated Gradient Background */}
        <RNAnimated.View style={{
          position: 'absolute',
          width: 150,
          height: 150,
          top: -42.5,
          left: -42.5,
          transform: [{ rotate: spin }]
        }}>
          <LinearGradient
            colors={['#BAE6FD', '#DDD6FE', '#FECDD3', '#FEF08A', '#BAE6FD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: '100%', height: '100%' }}
          />
        </RNAnimated.View>

        {/* Inner Solid/Frosted Cap */}
        <BlurView
          intensity={100}
          tint="light"
          style={[styles.fabBlur, { flex: 0, width: 60, height: 60, borderWidth: 0, borderRadius: 30, backgroundColor: '#FFFFFF', overflow: 'hidden' }]}
        >
          <View style={styles.fabInner}>
            <Image
              source={require('../../Futuristic glowing N logo design_LE_upscale_prime.jpg')}
              style={styles.fabBotLogo}
              contentFit="contain"
            />
            <View style={styles.fabRefraction} />
          </View>
        </BlurView>
      </Pressable>
    </RNAnimated.View>
  );
};

// --- Main Screen ---
export default function HomeScreen() {
  const { user, updateUser, refreshProfile } = useUser();
  const router = useRouter();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewNotifs, setHasNewNotifs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false); // REF-BASED LOADING GUARD (doesn't trigger re-renders)
  const isInitialMountRef = useRef(true); // Track if this is the very first load to show skeleton if needed

  // Track sequence of updates for the "flow" effect (Ref ensures reloader sees latest)
  const recentlyTouchedIdsRef = useRef<string[]>([]);
  const lastLoadTimeRef = useRef<number>(0);

  // ============================================================================
  // PRE-LOAD CACHE ON MOUNT (Makes tab switching immediate)
  // ============================================================================
  useEffect(() => {
    const hydrateFromCache = async () => {
      try {
        // 1. Instant Cache Pull
        const [pinned, cachedSummary, cachedStats, savedProfile] = await Promise.all([
          getPinnedUpdates(),
          getCachedGrievanceSummary(),
          getCachedStats(),
          AsyncStorage.getItem('userProfile')
        ]);

        if (pinned.length > 0 || cachedSummary.length > 0) {
          const initialList = pinned.length > 0 ? mergePinnedWithList(pinned, cachedSummary) : cachedSummary;
          setGrievances(initialList);
        }

        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.name && parsed.name !== 'Student Name') updateUser(parsed);
        }
      } catch (err) {
        // Cache hydration error
      }
    };

    hydrateFromCache();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkNewNotifs = async () => {
        const list = await getNotifications();
        setHasNewNotifs(list.some(n => n.isNew));
      };

      const loadData = async () => {
        const now = Date.now();
        const isCooldownActive = now - lastLoadTimeRef.current < 120000;

        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        // Show skeleton ONLY on first-ever load if no data exists
        if (grievances.length === 0 && isInitialMountRef.current) {
          setIsLoading(true);
        }

        try {
          if (isCooldownActive && grievances.length > 0) {
            isLoadingRef.current = false;
            setIsLoading(false);
            return;
          }

          // Step 1: BACKGROUND - Fetch fresh profile
          await refreshProfile();

          // Step 2: BACKGROUND - Fetch fresh data
          const freshData = await loadGrievances(0, 30, false);
          if (freshData && freshData.length > 0) {
            const pinnedItems = await getPinnedUpdates();
            setGrievances(prev => {
              const merged = mergePinnedWithList(pinnedItems, freshData);
              const prevIds = prev.map(g => g.id).join(',');
              const nextIds = merged.map(g => g.id).join(',');
              return prevIds === nextIds ? prev : merged;
            });
          } else if (freshData && freshData.length === 0) {
            setGrievances([]);
            await clearGrievanceCache();
          }

          // Step 3: Refresh stats
          const freshStats = await loadGrievanceStats();
          if (freshStats) setServerStats(freshStats);

          lastLoadTimeRef.current = Date.now();
          isInitialMountRef.current = false; // Mark initial load complete
        } finally {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      };

      checkNewNotifs();
      loadData();
    }, [user?.id])
  );
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [data, pinnedOnRefresh] = await Promise.all([
        loadGrievances(0, 30, false),
        getPinnedUpdates()
      ]);

      const merged = mergePinnedWithList(pinnedOnRefresh || [], data || []);

      // If server returned no data, clear the list and cache
      if (!data || data.length === 0) {
        setGrievances([]);
        await clearGrievanceCache();
      } else {
        setGrievances(merged);
      }

      const freshStats = await loadGrievanceStats();
      if (freshStats) setServerStats(freshStats);
    } catch (err) {
      console.error('❌ Error refreshing:', err);
    }
    setRefreshing(false);
  };

  // --- Real-time Sync (ULTRA-FAST & SYNCHRONIZED) ---
  useEffect(() => {
    if (!user?.id) return;

    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel('home-realtime-master')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        async (payload) => {
          const item = (payload.new || payload.old) as any;
          if (item?.user_id !== user.id) return;

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const formatted = transformGrievanceRecord(payload.new);

            // 1. Maintain Pinned Updates
            await savePinnedUpdate(formatted);

            // 2. Update local list surgically (Top 30 only)
            setGrievances(prev => {
              const without = prev.filter(g => g.id !== item.id);
              const next = [formatted, ...without];
              updateCachedGrievanceSummary(next.slice(0, 30));
              return next;
            });

            // 3. RE-FETCH GLOBAL STATS (Direct from DB to ensure accurate count)
            const freshStats = await loadGrievanceStats();
            if (freshStats) setServerStats(freshStats);

            // 4. Trigger Notification on status change
            if (payload.eventType === 'UPDATE') {
              addNotification({
                title: 'Complaint Updated',
                description: `"${item.title}" is now ${item.status}.`,
                type: item.status.toLowerCase().includes('resolved') ? 'success' : 'info',
                relatedId: item.id,
              });
              setHasNewNotifs(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }

          if (payload.eventType === 'DELETE') {
            setGrievances(prev => {
              const next = prev.filter(g => g.id !== item.id);
              updateCachedGrievanceSummary(next.slice(0, 30));
              return next;
            });
            // Re-fetch stats after delete
            const freshStats = await loadGrievanceStats();
            if (freshStats) setServerStats(freshStats);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'grievance_timeline' },
        async (payload) => {
          const gId = (payload.new as any).grievance_id;
          if (!gId) return;

          // Sync the parent grievance on any timeline activity
          const { data: fresh } = await supabase
            .from('grievances')
            .select('*')
            .eq('id', gId)
            .single();

          if (fresh && fresh.user_id === user.id) {
            const formatted = transformGrievanceRecord(fresh);
            setGrievances(prev => {
              const without = prev.filter(g => g.id !== gId);
              return [formatted, ...without];
            });

            addNotification({
              title: 'New Update',
              description: (payload.new as any).description || 'Activity on your complaint.',
              type: 'info',
              relatedId: gId,
            });
            setHasNewNotifs(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      )
      // 4. Profile Sync (Instant name/dept update)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            updateUser(payload.new);
            AsyncStorage.setItem('userProfile', JSON.stringify(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          addNotification({
            title: `📢 ${payload.new.title}`,
            description: payload.new.message,
            type: 'warning',
            relatedId: payload.new.id
          });
          setHasNewNotifs(true);
        }
      )
      .subscribe();

    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // SOURCE OF TRUTH: Always use serverStats from DB for the summary cards (Total/Pending/Resolved)
  // localStats from the 'grievances' array are only used as a fallback (initial load) 
  // because the local array is limited to the top 30 most recent items.
  const stats = serverStats || getGrievanceStats(grievances);
  const statsData: { title: string; count: number; color: string; icon: keyof typeof Feather.glyphMap }[] = [
    { title: 'Total', count: stats.total, color: '#6366F1', icon: 'file-text' },
    { title: 'Pending', count: stats.pending, color: '#F59E0B', icon: 'clock' },
    { title: 'Resolved', count: stats.resolved, color: '#10B981', icon: 'check-circle' },
  ];

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

      <GlassHeader name={user?.name || 'Student'} onNotifPress={() => router.push('/Notifications')} hasNewNotifs={hasNewNotifs} />

      <TipsSection />

      <SummaryCard
        stats={stats}
        onViewDetails={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({ pathname: '/track', params: { filter: 'Total' } });
        }}
      />

      <ComplaintListCard
        grievances={grievances}
        onViewAll={() => router.push('/track')}
        isLoading={isLoading}
        refreshing={refreshing}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
      >
        {/* Placeholder if needed or extra content */}
      </ScrollView>

      {/* AI Floating Button */}
      <AIFAB onPress={() => router.push({ pathname: '/NexaChat', params: { mode: 'new' } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Header Styles (Image Style)
  headerContainer: {
    paddingTop: (StatusBar.currentHeight || 20) + 5, // Tightly hugged to the status bar
    paddingHorizontal: 24,
    marginBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreetingText: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerWelcome: {
    fontSize: rf(26), // Back to slightly larger for the name when stacked
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerDateText: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: 6,
  },
  headerNotifBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 1,
  },

  // Tips (Matching Image Feel)
  glassTipsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(14,165,233,0.15)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  tipRow: { flexDirection: 'row', alignItems: 'center' },
  tipText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  // Summary Card Styles
  summaryCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryCardInner: {
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryTextSection: {
    flex: 1,
    marginRight: 10,
  },
  summaryTitle: {
    fontSize: rf(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  summarySubtitle: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  summaryStatsRow: {
    marginBottom: 16,
  },
  summaryCountText: {
    fontSize: rf(24),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryDetailText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  viewMoreText: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#0EA5E9',
  },

  // Donut Chart Styles
  donutContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutInnerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutTotalText: {
    fontSize: rf(22),
    fontWeight: '800',
    color: '#1E293B',
  },
  donutTotalLabel: {
    fontSize: rf(10),
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  // Complaint List Styles
  complaintListWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  sublabelText: {
    fontSize: rf(14),
    color: '#64748B',
    marginBottom: 16,
  },
  complaintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: rf(15),
    fontWeight: '600',
    color: '#1E293B',
  },
  itemDate: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: rf(11),
    fontWeight: '700',
  },
  emptyListState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },

  // AI FAB Styles
  fabWrapper: {
    position: 'absolute',
    bottom: 99, // Added extra spacing above tab bar
    right: 20,
    zIndex: 999,
  },
  fabPressable: {
    borderRadius: 32.5,
    width: 65,
    height: 65,
    overflow: 'hidden',
    shadowColor: '#10B981', // Vibrant emerald green shadow to compliment pastel border
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  fabBlur: {
    flex: 1,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)', // Sharp bright edge
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Frosted white base
  },
  fabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabRefraction: {
    position: 'absolute',
    top: 3,
    left: '15%',
    right: '15%',
    height: '40%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: -1, // Back to logo can sit on top but catch refraction
  },
  fabBotLogo: {
    width: 155,
    height: 155,
    borderRadius: 10,
  },
  skeletonItem: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderLeftWidth: 16,
    borderLeftColor: '#CBD5E1',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 16,
  },
  skeletonTitle: {
    width: '60%',
    height: rf(14),
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  skeletonTime: {
    width: '30%',
    height: rf(10),
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
});
