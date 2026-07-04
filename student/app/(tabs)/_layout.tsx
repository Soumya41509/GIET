import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, Pressable, View, Dimensions } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_HEIGHT = 65;
const TAB_SIZE = 58; // Square base for the circle
const ROUTES_COUNT = 4;
const BAR_WIDTH = (ROUTES_COUNT * TAB_SIZE) + 12; // Dynamic but structured

const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.33, 1, 0.68, 1), // Custom 'slick' easing
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const pressedIndex = useSharedValue(-1);

  const handlePress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.container}>
        <BlurView
          intensity={95}
          tint="light"
          style={styles.pill}
        >
          {/* Top Edge Rim Lighting (Specular highlight) */}
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, zIndex: 10 }}
          />

          {/* Bottom Edge Thickness Shadow (Subtle dark bevel) */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, zIndex: 10 }}
          />

          {/* Tab Icons Row */}
          <View style={styles.tabRow}>
            {routes.map((route: any, index: number) => {
              const isFocused = state.index === index;
              let iconName: keyof typeof Feather.glyphMap = 'home';
              if (route.name === 'index') iconName = 'home';
              else if (route.name === 'submit') iconName = 'plus';
              else if (route.name === 'track') iconName = 'list';
              else if (route.name === 'profile') iconName = 'user';

              const animatedButtonStyle = useAnimatedStyle(() => ({
                transform: [{
                  scale: withSpring(pressedIndex.value === index ? 0.92 : 1, {
                    damping: 20,
                    stiffness: 400,
                    mass: 0.5
                  })
                }],
              }));

              return (
                <Pressable
                  key={route.key}
                  onPress={() => handlePress(route, isFocused)}
                  onPressIn={() => (pressedIndex.value = index)}
                  onPressOut={() => (pressedIndex.value = -1)}
                  style={styles.tab}
                >
                  <Reanimated.View style={[styles.tabButtonBase, animatedButtonStyle]}>
                    {/* Pulsar Expansion Layer - LIQUID BLOOM */}
                    <Reanimated.View style={[
                      styles.pulsarLayer,
                      useAnimatedStyle(() => ({
                        // Start from nearly 0 for a true 'from core' effect
                        transform: [{
                          scale: isFocused
                            ? withSpring(1, { damping: 30, stiffness: 450, mass: 0.7 })
                            : withTiming(0.1, { duration: 150 })
                        }],
                        // Use a smoother Bezier for opacity to avoid any flicker
                        opacity: isFocused
                          ? withTiming(1, { duration: 200, easing: Easing.bezier(0.2, 0, 0, 1) })
                          : withTiming(0, { duration: 150 }),
                        // Dynamic Shadow Bloom
                        shadowRadius: isFocused ? withSpring(15, { damping: 30 }) : withTiming(0),
                        shadowOpacity: isFocused ? withSpring(0.5, { damping: 30 }) : withTiming(0),
                      }))
                    ]}>
                      <LinearGradient
                        colors={['#06B6D4', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                      />
                    </Reanimated.View>

                    {/* Inactive Circular Base - RECESSED EFFECT (Inner Shadow simulation) */}
                    <Reanimated.View style={[
                      styles.inactiveBase,
                      useAnimatedStyle(() => ({
                        opacity: isFocused
                          ? withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) })
                          : withTiming(1, { duration: 200 }),
                      }))
                    ]}>
                      <LinearGradient
                        colors={['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.1)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                      />
                    </Reanimated.View>

                    {/* Icon - ORGANIC POP */}
                    <Reanimated.View style={useAnimatedStyle(() => ({
                      transform: [{
                        scale: isFocused
                          ? withSpring(1.28, { damping: 12, stiffness: 450, mass: 0.6 })
                          : withSpring(1, { damping: 20, stiffness: 300 })
                      }],
                    }))}>
                      <Feather
                        name={iconName}
                        size={24}
                        color={isFocused ? '#FFFFFF' : '#334155'}
                      />
                    </Reanimated.View>
                  </Reanimated.View>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="submit" options={{ title: 'Raise' }} />
      <Tabs.Screen name="track" options={{ title: 'Track' }} />
      <Tabs.Screen name="profile" options={{ title: 'Me' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  container: {
    width: BAR_WIDTH,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  pill: {
    height: BAR_HEIGHT,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tab: {
    width: TAB_SIZE,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonBase: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsarLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  inactiveBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 41, 59, 0.06)',
    overflow: 'hidden',
  },
});
