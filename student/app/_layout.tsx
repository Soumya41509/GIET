import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Network from 'expo-network';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, Easing, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from '../components/ErrorBoundary';
import { useOTAUpdate } from '../hooks/useOTAUpdate';
import { UserProvider } from '../UserContext';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 414) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export default function RootLayout() {
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const [checking, setChecking] = useState(true);

    // Initialize silent OTA updates
    useOTAUpdate();

    const checkConnection = async () => {
        setChecking(true);
        try {
            const state = await Network.getNetworkStateAsync();
            const connected = state.isConnected ?? false;
            setIsConnected(connected);
        } catch {
            setIsConnected(false);
        } finally {
            setTimeout(() => {
                setChecking(false);
            }, 800);
        }
    };

    const [pulseAnim] = useState(new RNAnimated.Value(1));
    const [spinAnim] = useState(new RNAnimated.Value(0));

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 2000,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                }),
                RNAnimated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    useEffect(() => {
        if (checking) {
            RNAnimated.loop(
                RNAnimated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.setValue(0);
        }
    }, [checking, spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    useEffect(() => {
        (Text as any).defaultProps = (Text as any).defaultProps || {};
        (Text as any).defaultProps.allowFontScaling = false;
        checkConnection();
    }, []);

    if (!isConnected) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <LinearGradient
                    colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.content}>
                    <RNAnimated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: [0.9, 1] }) }]}>
                        <Feather name="wifi-off" size={moderateScale(48)} color="#0EA5E9" />
                    </RNAnimated.View>
                    <Text style={styles.title}>No Internet Connection</Text>
                    <Text style={styles.subtitle}>
                        Please check your network settings and try again to continue.
                    </Text>

                    <TouchableOpacity
                        onPress={checkConnection}
                        style={[styles.button, checking && styles.disabledButton]}
                        disabled={checking}
                        activeOpacity={0.8}
                    >
                        <View style={styles.glassButton}>
                            <View style={styles.buttonBase} />
                            <LinearGradient
                                colors={[
                                    'rgba(255, 255, 255, 0.45)',
                                    'rgba(255, 255, 255, 0.25)',
                                    'rgba(14, 165, 233, 0.1)',
                                ]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <View style={styles.buttonBorder} />
                            <View style={styles.btnContent}>
                                <RNAnimated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Feather
                                        name="refresh-cw"
                                        size={moderateScale(18)}
                                        color="#0EA5E9"
                                        style={styles.btnIcon}
                                    />
                                </RNAnimated.View>
                                <Text style={styles.buttonText}>
                                    {checking ? 'Checking...' : 'Retry Connection'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
                <UserProvider>
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="welcome" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="signup" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen
                            name="NexaChat"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_bottom',
                                contentStyle: { backgroundColor: '#F8FAFC' }
                            }}
                        />
                        <Stack.Screen
                            name="HelpSupport"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_right',
                                contentStyle: { backgroundColor: '#F8FAFC' }
                            }}
                        />
                        <Stack.Screen
                            name="AccountSettings"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_right',
                                contentStyle: { backgroundColor: '#F8FAFC' }
                            }}
                        />
                        <Stack.Screen
                            name="Feedback"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_right',
                                contentStyle: { backgroundColor: '#F8FAFC' }
                            }}
                        />
                    </Stack>
                </UserProvider>
            </ErrorBoundary>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    content: {
        alignItems: 'center',
        padding: moderateScale(32),
        width: '100%',
    },
    iconContainer: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(50),
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: moderateScale(24),
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    title: {
        fontSize: moderateScale(23),
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: moderateScale(12),
        textAlign: 'center',
    },
    subtitle: {
        fontSize: moderateScale(15),
        color: '#64748B',
        textAlign: 'center',
        marginBottom: moderateScale(32),
        lineHeight: moderateScale(24),
    },
    button: {
        width: '75%',
        maxWidth: 300,
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        marginBottom: moderateScale(32),
        overflow: 'hidden',
    },
    disabledButton: {
        opacity: 0.7,
    },
    glassButton: {
        flex: 1,
        borderRadius: moderateScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: moderateScale(28),
        borderWidth: 2,
        borderColor: '#0EA5E9',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    btnIcon: {
        marginRight: moderateScale(10),
    },
    buttonText: {
        color: '#0F172A',
        fontSize: moderateScale(18),
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});
