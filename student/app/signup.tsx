import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import PumpingGradientButton from '../components/PumpingGradientButton';
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SignupScreen() {
  const { updateUser } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success',
  });

  const orbAnim = useRef(new RNAnimated.Value(0)).current;
  const toastAnim = useRef(new RNAnimated.Value(0)).current;
  const heartAnim = useRef(new RNAnimated.Value(1)).current;

  const router = useRouter();

  useEffect(() => {
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

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(orbAnim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        RNAnimated.timing(orbAnim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
  }, [orbAnim, heartAnim]);

  const orb1Translate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const orb2Translate = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
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
      }).start(() =>
        setToast({ visible: false, message: '', type: 'error' })
      );
    }, 2500);
  };

  const handleSignup = async () => {
    if (!name || !email || !department || !rollNo || !password || !confirmPassword) {
      showToast('All fields are mandatory.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords must match.');
      return;
    }

    setLoading(true);
    const cleanRollNo = rollNo.trim();

    try {
      // Check if roll number already exists
      const { data: existingRoll } = await supabase
        .from('profiles')
        .select('id')
        .eq('roll_no', cleanRollNo)
        .maybeSingle();

      if (existingRoll) {
        showToast('Roll Number already registered.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });

      if (signUpError) {
        showToast(signUpError.message || 'Signup failed. Try again.');
        return;
      }

      if (data.user) {
        const userProfile = {
          id: data.user.id,
          name,
          email: email.toLowerCase().trim(),
          department,
          roll_no: cleanRollNo,
          role: 'Student',
        };

        const { error: insertError } = await supabase.from('profiles').insert([userProfile]);
        
        if (insertError) {
          showToast('Profile creation failed. Please try again.');
          console.error('Insert error:', insertError);
          return;
        }

        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
        updateUser(userProfile);
        
        showToast('Account created successfully!', 'success');

        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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

      {/* Floating Orbs */}
      <RNAnimated.View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(14,165,233,0.3)',
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
            backgroundColor: 'rgba(99,102,241,0.25)',
            bottom: -width * 0.1,
            left: -width * 0.2,
            transform: [{ translateY: orb2Translate }],
          },
        ]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.mainContent}>
          {/* Header Logo */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={{ width: '100%' }}>
            <Animated.View
              entering={FadeInUp.delay(300).springify().damping(40).mass(3).stiffness(100)}
            >
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the GIET grievance portal</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(400).springify().damping(40).mass(3).stiffness(100)}
              style={styles.inputWrapper}
            >
              <Feather name="user" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(500).springify().damping(40).mass(3).stiffness(100)}
              style={styles.inputWrapper}
            >
              <Feather name="mail" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(600).springify().damping(40).mass(3).stiffness(100)}
              style={styles.inputWrapper}
            >
              <Feather name="book" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Department"
                placeholderTextColor="#94A3B8"
                value={department}
                onChangeText={setDepartment}
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(700).springify().damping(40).mass(3).stiffness(100)}
              style={styles.inputWrapper}
            >
              <Feather name="list" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Roll No/Registration No"
                placeholderTextColor="#94A3B8"
                value={rollNo}
                onChangeText={setRollNo}
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(800).springify().damping(40).mass(3).stiffness(100)}
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
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(900).springify().damping(40).mass(3).stiffness(100)}
              style={styles.inputWrapper}
            >
              <Feather name="lock" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Signup Button */}
            <Animated.View
              entering={FadeInUp.delay(1000).springify().damping(40).mass(3).stiffness(100)}
              style={{ width: '100%' }}
            >
              <PumpingGradientButton
                title={loading ? 'Creating...' : 'Sign Up'}
                onPress={handleSignup}
                width="100%"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(1100).springify().damping(40).mass(3).stiffness(100)}
              style={styles.signupContainer}
            >
              <Text style={styles.signupText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.signupLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer */}
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
        </View>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toast.visible && (
        <RNAnimated.View
          style={[
            styles.toast,
            {
              backgroundColor:
                toast.type === 'success' ? '#10B981' : '#EF4444',
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
          <Feather
            name={toast.type === 'success' ? 'check-circle' : 'alert-circle'}
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </RNAnimated.View>
      )}
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  orb: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    opacity: 0.4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500', paddingVertical: 0 },
  primaryButton: {
    width: '100%', // Changed from 75% to match input fields
    height: 56,
    borderRadius: 28,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    marginBottom: 16,
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
  buttonDisabled: { opacity: 0.7 },
  signupContainer: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { fontSize: 13, color: '#64748B' },
  signupLink: { fontSize: 13, color: '#0EA5E9', fontWeight: '700' },
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

});
