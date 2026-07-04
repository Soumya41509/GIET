import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { StatusModal } from '@/components/ui/StatusModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { colors, theme } = useTheme();
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);

    // Status Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    // Focus state animations
    const [isStaffIdFocused, setIsStaffIdFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const staffIdFocus = useSharedValue(0);
    const passwordFocus = useSharedValue(0);

    const staffIdStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(staffIdFocus.value ? colors.primary : (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'), { duration: 200 }),
        borderWidth: withTiming(staffIdFocus.value ? 2 : (theme === 'dark' ? 1 : 0), { duration: 200 }),
        backgroundColor: withTiming(staffIdFocus.value
            ? (theme === 'dark' ? 'rgba(15, 23, 42, 1)' : '#fff')
            : (theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#fff'),
            { duration: 200 }
        ),
    }));

    const passwordStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(passwordFocus.value ? colors.primary : (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'), { duration: 200 }),
        borderWidth: withTiming(passwordFocus.value ? 2 : (theme === 'dark' ? 1 : 0), { duration: 200 }),
        backgroundColor: withTiming(passwordFocus.value
            ? (theme === 'dark' ? 'rgba(15, 23, 42, 1)' : '#fff')
            : (theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#fff'),
            { duration: 200 }
        ),
    }));

    // Floating animation for decorative circles - Matching reference flow
    const orb1TranslateY = useSharedValue(0);
    const orb2TranslateY = useSharedValue(0);

    useEffect(() => {
        orb1TranslateY.value = withRepeat(
            withTiming(12, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        orb2TranslateY.value = withRepeat(
            withTiming(-14, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const orb1Style = useAnimatedStyle(() => ({
        transform: [{ translateY: orb1TranslateY.value }],
    }));

    const orb2Style = useAnimatedStyle(() => ({
        transform: [{ translateY: orb2TranslateY.value }],
    }));


    const handleLogin = async () => {
        setError('');
        const trimmedStaffId = staffId.trim();
        const trimmedPassword = password.trim();

        if (!trimmedStaffId && !trimmedPassword) {
            setError('Please enter your Staff ID and Password');
            return;
        }
        if (!trimmedStaffId) {
            setError('Please enter your Staff ID');
            return;
        }
        if (!trimmedPassword) {
            setError('Please enter your Password');
            return;
        }

        setError('');
        setIsSigningIn(true);
        const result = await signIn(trimmedStaffId, trimmedPassword);
        setIsSigningIn(false);

        if (result.error) {
            const errorMsg = result.error;
            setTimeout(() => {
                setError(errorMsg);
            }, 0);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient - Exact Reference Colors */}
            <LinearGradient
                colors={theme === 'dark'
                    ? ['#020617', '#070E21', '#111827'] // Deep Midnight Palette
                    : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Floating Orbs - Exact Reference Positioning & Colors */}
            <Animated.View style={[
                styles.orb,
                {
                    backgroundColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14,165,233,0.3)', // Vibrant Sky
                    top: -width * 0.3,
                    right: -width * 0.2,
                },
                orb1Style
            ]} />
            <Animated.View style={[
                styles.orb,
                {
                    backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99,102,241,0.25)', // Deep Violet
                    bottom: -width * 0.1,
                    left: -width * 0.2,
                },
                orb2Style
            ]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.centerContent}>
                        {/* Logo Section - Exact Reference Styling */}
                        <Animated.View
                            entering={FadeIn.duration(800)}
                            style={styles.logoContainer}
                        >
                            <View style={[
                                styles.logoWrapper,
                                {
                                    backgroundColor: 'transparent',
                                    shadowColor: 'transparent',
                                    borderColor: 'transparent',
                                    borderWidth: 0,
                                }
                            ]}>
                                <Image
                                    source={require('../assets/images/icon.png')}
                                    style={styles.logo}
                                    contentFit="contain"
                                    transition={1000}
                                />
                            </View>
                        </Animated.View>

                        {/* Header Section - Typography from Reference */}
                        <Animated.View
                            entering={FadeInUp.delay(100).duration(800)}
                            style={styles.headerContainer}
                        >
                            <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#F8FAFC' : '#0F172A' }]}>
                                GIET STAFF
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#94A3B8' : '#64748B' }]}>
                                Sign in to continue
                            </Text>
                        </Animated.View>

                        {/* Form Section */}
                        <Animated.View
                            entering={FadeInUp.delay(200).duration(800)}
                            style={styles.formSection}
                        >
                            {/* Error Message */}
                            {error ? (
                                <Animated.View
                                    entering={FadeInDown.duration(400)}
                                    style={[
                                        styles.errorContainer,
                                        {
                                            backgroundColor: theme === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
                                            borderLeftColor: '#DC2626'
                                        }
                                    ]}
                                >
                                    <AlertCircle size={18} color="#DC2626" />
                                    <Text style={[styles.errorText, { color: theme === 'dark' ? '#FCA5A5' : '#DC2626' }]}>
                                        {error}
                                    </Text>
                                </Animated.View>
                            ) : null}

                            {/* Staff ID Input - Reference Style Pill */}
                            <View style={styles.inputContainer}>
                                <Animated.View style={[
                                    styles.inputWrapper,
                                    staffIdStyle
                                ]}>
                                    <User
                                        size={20}
                                        color={isStaffIdFocused ? colors.primary : (theme === 'dark' ? '#64748B' : '#64748B')}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, { color: theme === 'dark' ? '#F8FAFC' : '#0F172A' }]}
                                        placeholder="Staff ID"
                                        placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
                                        value={staffId}
                                        onChangeText={setStaffId}
                                        autoCapitalize="none"
                                        onFocus={() => {
                                            staffIdFocus.value = 1;
                                            setIsStaffIdFocused(true);
                                        }}
                                        onBlur={() => {
                                            staffIdFocus.value = 0;
                                            setIsStaffIdFocused(false);
                                        }}
                                    />
                                </Animated.View>
                            </View>

                            {/* Password Input - Reference Style Pill */}
                            <View style={styles.inputContainer}>
                                <Animated.View style={[
                                    styles.inputWrapper,
                                    passwordStyle
                                ]}>
                                    <Lock
                                        size={20}
                                        color={isPasswordFocused ? colors.primary : (theme === 'dark' ? '#64748B' : '#64748B')}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, { color: theme === 'dark' ? '#F8FAFC' : '#0F172A' }]}
                                        placeholder="Password"
                                        placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        onSubmitEditing={handleLogin}
                                        onFocus={() => {
                                            passwordFocus.value = 1;
                                            setIsPasswordFocused(true);
                                        }}
                                        onBlur={() => {
                                            passwordFocus.value = 0;
                                            setIsPasswordFocused(false);
                                        }}
                                    />
                                    <AnimatedPressable onPress={() => setShowPassword(!showPassword)}>
                                        <View style={{ padding: 4 }}>
                                            {showPassword ? (
                                                <Eye size={20} color={theme === 'dark' ? '#94A3B8' : '#94A3B8'} />
                                            ) : (
                                                <EyeOff size={20} color={theme === 'dark' ? '#94A3B8' : '#94A3B8'} />
                                            )}
                                        </View>
                                    </AnimatedPressable>
                                </Animated.View>
                            </View>

                            {/* Sign In Button - Vibrant Gradient & Shadow */}
                            <AnimatedPressable
                                style={styles.signInButton}
                                onPress={handleLogin}
                                disabled={isSigningIn}
                            >
                                <LinearGradient
                                    colors={['#0EA5E9', '#2563EB']} // Exact Reference Gradient
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                {isSigningIn ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signInButtonText}>Sign In</Text>
                                )}
                            </AnimatedPressable>

                        </Animated.View>

                    </View>

                    {/* Footer - Team Nexus */}
                    <View style={styles.footerContainer}>
                        <Text style={[styles.footerText, { color: theme === 'dark' ? '#0EA5E9' : '#0369A1' }]}>
                            Designed & built with ❤️ by TEAM NEXUS
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <StatusModal
                visible={modalVisible}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    orb: {
        position: 'absolute',
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        opacity: 0.4,
        zIndex: -1,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoWrapper: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    headerContainer: {
        marginBottom: 40,
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 40,
        width: '100%',
        paddingHorizontal: 20,
    },
    headerSubtitle: {
        fontSize: 16, // Exact reference
        textAlign: 'center',
        fontWeight: '500',
    },
    formSection: {
        width: '100%',
        maxWidth: 400,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        marginBottom: 24,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 12, // Exact reference
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500', // Exact reference
        paddingVertical: 0,
    },
    signInButton: {
        width: '100%',
        minHeight: 60,
        paddingVertical: 16,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        overflow: 'hidden',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
    },
    footerContainer: {
        width: '100%',
        marginTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '700',
        opacity: 0.9,
        textAlign: 'center',
        lineHeight: 20,
    },
    centerContent: {
        flexGrow: 1,
        justifyContent: 'center',
        width: '100%',
        alignItems: 'center',
        paddingBottom: 60,
    },
});
