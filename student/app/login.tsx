import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import PumpingGradientButton from '../components/PumpingGradientButton';
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const { updateUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [isResetMode, setIsResetMode] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const orbAnim = useRef(new RNAnimated.Value(0)).current;
  const toastAnim = useRef(new RNAnimated.Value(0)).current;
  const heartAnim = useRef(new RNAnimated.Value(1)).current;

  const router = useRouter();

  useEffect(() => {
    // Slow and gentle pulse animation (bada-chota)
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

    // Start orb animation immediately
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(orbAnim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        RNAnimated.timing(orbAnim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();

  }, [heartAnim, orbAnim]);

  const orb1Translate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const orb2Translate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    RNAnimated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      RNAnimated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast({ visible: false, message: '' }));
    }, 2500);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        showToast('Invalid credentials. Please try again.');
        setLoading(false);
      } else {
        // Store both login status and user profile
        await AsyncStorage.setItem('isLoggedIn', 'true');
        if (data.user) {
          // Fetch full profile matching the UserContext structure
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email, role, department')
            .eq('id', data.user.id)
            .maybeSingle();

          let userToStore;
          if (profile) {
            userToStore = profile;
          } else {
            // Fallback to auth user data if profile is missing
            userToStore = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || 'Student Name',
              role: 'Student',
              department: '',
              avatar: ''
            };
          }
          
          await AsyncStorage.setItem('userProfile', JSON.stringify(userToStore));
          updateUser(userToStore);
        }
        // Navigate to tabs immediately
        router.replace('/(tabs)');
      }
    } catch (error) {
      showToast('Login failed. Please try again.');
      setLoading(false);
    }
  };


  const handleSendResetLink = async () => {
    if (!email) {
      showToast('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim()
      );

      if (error) {
        showToast('Failed to send OTP');
      } else {
        showToast('OTP sent to your email!');
        setIsOtpMode(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async () => {
    if (!otp || !newPassword || !confirmNewPassword) {
      showToast('All fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp,
        type: 'recovery',
      });

      if (verifyError) {
        showToast('Invalid or expired OTP');
        setLoading(false);
        return;
      }

      // 2. Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        showToast('Failed to update password');
      } else {
        Alert.alert('Success', 'Password reset successfully! Please login with your new password.');
        setIsResetMode(false);
        setIsOtpMode(false);
        setOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error) {
      showToast('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setIsResetMode(true);
  };

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

      {/* Floating Orbs - More Colorful */}
      <RNAnimated.View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(14,165,233,0.3)', // Stronger Sky Blue
            top: -width * 0.3,
            right: -width * 0.2,
            transform: [{ translateY: orb1Translate }],
          },
        ]}
      />

      <RNAnimated.View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(99,102,241,0.25)', // Indigo/Purple tint
            bottom: -width * 0.1,
            left: -width * 0.2,
            transform: [{ translateY: orb2Translate }],
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section - Separate from form */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            {isResetMode ? (
              <>
                <Animated.View
                  entering={FadeInUp.delay(300).springify().damping(40).mass(3).stiffness(100)}
                  style={styles.headerContainer}
                >
                  <Text style={styles.headerTitle}>{isOtpMode ? 'Verify OTP' : 'Reset Password'}</Text>
                  <Text style={styles.headerSubtitle}>
                    {isOtpMode
                      ? 'Enter the verification code and your new password.'
                      : 'Enter your email to receive a reset code.'}
                  </Text>
                </Animated.View>

                {!isOtpMode ? (
                  <>
                    <Animated.View
                      entering={FadeInUp.delay(400).springify().damping(40).mass(3).stiffness(100)}
                      style={styles.floatingInputWrapper}
                    >
                      <Feather name="mail" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.floatingInput}
                        placeholder="Email Address"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </Animated.View>

                    <Animated.View
                      entering={FadeInUp.delay(500).springify().damping(40).mass(3).stiffness(100)}
                      style={{ width: '100%' }}
                    >
                      <PumpingGradientButton
                        title={loading ? 'Sending...' : 'Send Reset OTP'}
                        onPress={handleSendResetLink}
                        width="100%"
                      />
                    </Animated.View>
                  </>
                ) : (
                  <>
                    <Animated.View
                      entering={FadeInUp.delay(400).springify().damping(40).mass(3).stiffness(100)}
                      style={styles.floatingInputWrapper}
                    >
                      <Feather name="hash" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.floatingInput}
                        placeholder="Enter OTP Code"
                        placeholderTextColor="#94A3B8"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={8}
                        editable={!loading}
                      />
                    </Animated.View>

                    <Animated.View
                      entering={FadeInUp.delay(500).springify().damping(40).mass(3).stiffness(100)}
                      style={styles.floatingInputWrapper}
                    >
                      <Feather name="lock" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.floatingInput}
                        placeholder="New Password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        editable={!loading}
                      />
                    </Animated.View>

                    <Animated.View
                      entering={FadeInUp.delay(600).springify().damping(40).mass(3).stiffness(100)}
                      style={styles.floatingInputWrapper}
                    >
                      <Feather name="lock" size={20} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.floatingInput}
                        placeholder="Confirm New Password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        editable={!loading}
                      />
                    </Animated.View>

                    <Animated.View
                      entering={FadeInUp.delay(700).springify().damping(40).mass(3).stiffness(100)}
                      style={{ width: '100%' }}
                    >
                      <PumpingGradientButton
                        title={loading ? 'Resetting...' : 'Reset Password'}
                        onPress={handleVerifyOtpAndReset}
                        width="100%"
                      />
                    </Animated.View>
                  </>
                )}

                <Animated.View
                  entering={FadeInUp.delay(800).springify().damping(40).mass(3).stiffness(100)}
                  style={styles.signupContainer}
                >
                  <TouchableOpacity onPress={() => { setIsResetMode(false); setIsOtpMode(false); }}>
                    <Text style={styles.signupLink}>Back to Login</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                <Animated.View
                  entering={FadeInUp.delay(300).springify().damping(40).mass(3).stiffness(100)}
                  style={styles.headerContainer}
                >
                  <Text style={styles.headerTitle}>Welcome Back</Text>
                  <Text style={styles.headerSubtitle}>
                    Sign in to continue your journey.
                  </Text>
                </Animated.View>

                <View style={styles.inputContainer}>
                  <Animated.View
                    entering={FadeInUp.delay(400).springify().damping(40).mass(3).stiffness(100)}
                    style={styles.floatingInputWrapper}
                  >
                    <Feather name="mail" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.floatingInput}
                      placeholder="Email Address"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </Animated.View>

                  <Animated.View
                    entering={FadeInUp.delay(500).springify().damping(40).mass(3).stiffness(100)}
                    style={styles.inputWrapper}
                  >
                    <Feather name="lock" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    entering={FadeInUp.delay(600).springify().damping(40).mass(3).stiffness(100)}
                    style={[
                      styles.forgotPasswordContainer,
                      loading && { opacity: 0.5 }
                    ]}
                  >
                    <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Primary Button */}
                  <Animated.View
                    entering={FadeInUp.delay(700).springify().damping(40).mass(3).stiffness(100)}
                    style={{ width: '100%' }}
                  >
                    <PumpingGradientButton
                      title={loading ? 'Signing In...' : 'Sign In'}
                      onPress={handleLogin}
                      width="100%"
                    />
                  </Animated.View>

                  <Animated.View
                    entering={FadeInUp.delay(800).springify().damping(40).mass(3).stiffness(100)}
                    style={styles.signupContainer}
                  >
                    <Text style={styles.signupText}>New here? </Text>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                      <Text style={styles.signupLink}>Create Account</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            )}
          </View>

          {/* Team Nexus Footer */}
          <View style={styles.footerContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.footerText}>Designed & built with </Text>
              <RNAnimated.View style={{ transform: [{ scale: heartAnim }], marginHorizontal: 2 }}>
                <Text style={{ fontSize: 12 }}>❤️</Text>
              </RNAnimated.View>
              <Text style={styles.footerText}> by </Text>
              <Text style={styles.teamNameText}>TEAM NEXUS</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toast.visible && (
        <RNAnimated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Feather name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </RNAnimated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  orb: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 170,
    height: 170,
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: {
    width: '70%',
    height: '70%',
  },
  // Card style removed
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0EA5E9',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20, // More rounded like pills
    paddingHorizontal: 20,
    paddingVertical: 16, // Taller
    marginBottom: 20,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  floatingInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  floatingInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    marginTop: -10,
    marginRight: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%', // Changed from 75% to match input fields
    height: 56, // moderateScale not imported in login.tsx, using raw 56 for consistency with Welcome
    borderRadius: 28,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    marginBottom: 24,
    overflow: 'hidden',
  },
  glassButton: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  signupText: {
    fontSize: 13,
    color: '#64748B',
  },
  signupLink: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '700',
  },
  footerContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '600',
  },
  teamNameText: {
    fontSize: 11,
    color: '#0EA5E9',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 20,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
    marginTop: 25,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
