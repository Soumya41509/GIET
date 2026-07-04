import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Easing,
    Image,
    Animated as RNAnimated,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PumpingGradientButton from '../components/PumpingGradientButton';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const orbAnim = useRef(new RNAnimated.Value(0)).current;
  const heartAnim = useRef(new RNAnimated.Value(1)).current;
  const dotAnim = useRef(new RNAnimated.Value(0)).current;
  const contentFadeAnim = useRef(new RNAnimated.Value(0)).current;
  const loadingFadeAnim = useRef(new RNAnimated.Value(1)).current;

  // Floating orbs for gentle motion
  useEffect(() => {
    // Pulse animation for heart
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(heartAnim, {
          toValue: 1.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(heartAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dot animation sequence
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(dotAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(dotAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(orbAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(orbAnim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initial loading timer (3 seconds)
    const timer = setTimeout(() => {
      // Transition from loading to content
      RNAnimated.timing(loadingFadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIsLoading(false);
        RNAnimated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [orbAnim, heartAnim, dotAnim, loadingFadeAnim, contentFadeAnim]);

  const orb1Translate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const orb2Translate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#E6F7FF" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#DFF7FF', '#EBFAFF', '#F6FCFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Orbs */}
      <RNAnimated.View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(14,165,233,0.25)',
            top: -width * 0.4,
            right: -width * 0.3,
            transform: [{ translateY: orb1Translate }],
          },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(59,130,246,0.20)',
            bottom: -width * 0.2,
            left: -width * 0.25,
            transform: [{ translateY: orb2Translate }],
          },
        ]}
      />

      <View style={styles.mainContent}>
        {/* --- Logo Section --- */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.appName}>GIET</Text>
          <View style={styles.glowLine} />
          <Text style={styles.appSubname}>GRIEVANCE</Text>
        </View>

        {/* --- Bottom Section --- */}
        <View style={styles.bottomSection}>
          {isLoading ? (
            /* Loading Dots */
            <RNAnimated.View style={[styles.loadingContainer, { opacity: loadingFadeAnim }]}>
              <RNAnimated.View
                style={[
                  styles.dot,
                  {
                    opacity: dotAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 0.3, 1],
                    }),
                  },
                ]}
              />
              <RNAnimated.View
                style={[
                  styles.dot,
                  {
                    opacity: dotAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1, 0.3],
                    }),
                  },
                ]}
              />
              <RNAnimated.View
                style={[
                  styles.dot,
                  {
                    opacity: dotAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.3, 1],
                    }),
                  },
                ]}
              />
            </RNAnimated.View>
          ) : (
            /* Get Started Content */
            <RNAnimated.View style={{ width: '100%', alignItems: 'center', opacity: contentFadeAnim }}>
              <PumpingGradientButton 
                title="Get Started"
                onPress={() => router.push('/login')}
                width="80%"
              />
            </RNAnimated.View>
          )}
        </View>
      </View>

      {/* Footer Credit - Fixed at Bottom */}
      <View style={styles.creditContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.creditText}>Designed & built with </Text>
          <RNAnimated.View style={{ transform: [{ scale: heartAnim }], marginHorizontal: 2 }}>
            <Text style={{ fontSize: 12 }}>❤️</Text>
          </RNAnimated.View>
          <Text style={styles.creditText}> by </Text>
          <Text style={styles.teamName}>TEAM NEXUS</Text>
        </View>
      </View>
    </SafeAreaView >
  );
}

/* --- Styles --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF7FF' },

  orb: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    opacity: 0.45,
  },

  mainContent: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 10,
  },

  /* --- Logo --- */
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 170,
    height: 170,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(14,165,233,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },
  logo: { width: 110, height: 110 },
  appName: {
    fontSize: 45,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 20,
  },
  glowLine: {
    width: 80,
    height: 3,
    backgroundColor: '#0EA5E9',
    marginVertical: 10,
    borderRadius: 2,
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  appSubname: {
    fontSize: 19,
    fontWeight: '600',
    color: '#0EA5E9',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },

  /* --- Bottom --- */
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    minHeight: 120, // Enough for button/loader
  },

  /* Loading */
  loadingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 50,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },

  glassButton: {
    width: '70%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Base layer
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    marginBottom: 30,
    overflow: 'hidden',
  },

  buttonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },

  glassButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  /* --- Credit --- */
  creditContainer: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  creditText: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
  },
  teamName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
    letterSpacing: 0.5,
  },
});
