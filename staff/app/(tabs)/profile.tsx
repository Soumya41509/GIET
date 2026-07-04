
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StatusModal } from '@/components/ui/StatusModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Building, ChevronRight, Fingerprint, LogOut, MessageSquare, Monitor, Moon, Sun, User, Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View, DeviceEventEmitter } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const URGENT_OPTIONS = [
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '1h', value: 60 },
    { label: '3h', value: 180 },
    { label: '6h', value: 360 },
];

export default function ProfileScreen() {
    const { staff, signOut } = useAuth();
    const { colors, theme, preference, setPreference: updatePreference } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [urgentThreshold, setUrgentThreshold] = useState(15);

    // Status Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    // Logout Confirmation State
    const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);


    const showStatus = (type: 'success' | 'error', title: string, message: string) => {
        setModalType(type);
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    useEffect(() => {
        checkBiometricSupport();
        loadSettings();
    }, []);

    const checkBiometricSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);
    };

    const loadSettings = async () => {
        try {
            const biometricStored = await AsyncStorage.getItem('biometric_enabled');
            setIsBiometricEnabled(biometricStored === 'true');
            
            const thresholdStored = await AsyncStorage.getItem('urgent_threshold');
            if (thresholdStored) setUrgentThreshold(parseInt(thresholdStored));
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const toggleBiometric = async (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const promptMessage = value
            ? 'Authenticate to enable App Lock'
            : 'Authenticate to disable App Lock';

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
        });

        if (result.success) {
            if (value) {
                await AsyncStorage.setItem('biometric_enabled', 'true');
                setIsBiometricEnabled(true);
                showStatus('success', 'App Lock Enabled', 'App will now require authentication to open.');
            } else {
                await AsyncStorage.setItem('biometric_enabled', 'false');
                setIsBiometricEnabled(false);
                showStatus('success', 'App Lock Disabled', 'Biometric security has been turned off.');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            showStatus('error', 'Authentication Failed', 'Verification required to change settings.');
        }
    };

    const handleThresholdChange = async (val: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setUrgentThreshold(val);
        await AsyncStorage.setItem('urgent_threshold', val.toString());
        DeviceEventEmitter.emit('urgent_threshold_changed', val);
    };

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLogoutConfirmVisible(true);
    };

    const confirmLogout = async () => {
        setLogoutConfirmVisible(false);
        await signOut();
    };

    const setPreference = async (pref: 'light' | 'dark' | 'auto') => {
        await updatePreference(pref);
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Custom Immersive Header */}
            <View style={styles.headerContainer}>
                <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.headerGlass}>
                    <LinearGradient
                        colors={theme === 'dark' ?
                            ['rgba(139, 92, 246, 0.15)', 'rgba(0,0,0,0.2)', 'rgba(139, 92, 246, 0.10)'] :
                            ['rgba(139, 92, 246, 0.25)', 'rgba(255,255,255,0.3)', 'rgba(139, 92, 246, 0.20)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.headerContent, { paddingTop: insets.top, height: insets.top + 60 }]}>
                        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
                                <ArrowLeft size={24} color={colors.text} />
                            </AnimatedPressable>
                            <Text style={[styles.headerTitle, { color: colors.text, marginLeft: 8 }]}>My Profile</Text>
                        </Animated.View>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={{ height: 1, width: '100%', backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)' }} />
                </BlurView>
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.profileCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {staff?.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                            </Text>
                        </View>
                        <Text style={[styles.name, { color: colors.text }]}>{staff?.name || 'Staff Member'}</Text>
                        <Text style={[styles.role, { color: colors.icon }]}>{staff?.role || 'Staff Role'}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Briefcase size={20} color={colors.icon} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.icon }]}>Department</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{staff?.department || 'N/A'}</Text>
                            </View>
                        </View>

                        <View style={[styles.separator, { backgroundColor: colors.border }]} />

                        <View style={styles.infoRow}>
                            <User size={20} color={colors.icon} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.icon }]}>Staff ID</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{staff?.staff_id || 'N/A'}</Text>
                            </View>
                        </View>

                        {staff?.hostel_assigned && (
                            <>
                                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                <View style={styles.infoRow}>
                                    <Building size={20} color={colors.icon} />
                                    <View style={styles.infoContent}>
                                        <Text style={[styles.infoLabel, { color: colors.icon }]}>Assigned Hostel</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{staff.hostel_assigned}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Settings Section */}
                <View style={[styles.themeSection, { backgroundColor: colors.card, marginBottom: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
                    
                    {isBiometricSupported && (
                        <View style={[styles.securityRow, { marginBottom: 16 }]}>
                            <View style={styles.securityInfo}>
                                <Fingerprint size={24} color={colors.primary} />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[styles.securityLabel, { color: colors.text }]}>App Lock</Text>
                                    <Text style={[styles.securitySubLabel, { color: colors.icon }]}>
                                        FaceID / Fingerprint
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isBiometricEnabled}
                                onValueChange={toggleBiometric}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>
                    )}

                    <View style={styles.urgentSettingContainer}>
                        <View style={styles.securityInfo}>
                            <Clock size={24} color={colors.primary} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.securityLabel, { color: colors.text }]}>Urgent Warning</Text>
                                <Text style={[styles.securitySubLabel, { color: colors.icon }]}>
                                    Deadline threshold for Home
                                </Text>
                            </View>
                        </View>
                        <View style={styles.urgentOptionsGrid}>
                            {URGENT_OPTIONS.map((opt) => (
                                <AnimatedPressable
                                    key={opt.value}
                                    onPress={() => handleThresholdChange(opt.value)}
                                    style={[
                                        styles.urgentOption,
                                        { backgroundColor: colors.background, borderColor: colors.border },
                                        urgentThreshold === opt.value && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                                    ]}
                                >
                                    <Text style={[
                                        styles.urgentOptionText,
                                        { color: colors.text },
                                        urgentThreshold === opt.value && { color: colors.primary, fontWeight: '700' }
                                    ]}>
                                        {opt.label}
                                    </Text>
                                </AnimatedPressable>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Support Section */}
                <View style={[styles.themeSection, { backgroundColor: colors.card, marginBottom: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
                    <AnimatedPressable
                        style={styles.securityRow}
                        onPress={() => {
                            router.push('/feedback');
                        }}
                    >
                        <View style={styles.securityInfo}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                                <MessageSquare size={20} color={colors.primary} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.securityLabel, { color: colors.text }]}>Report Issue</Text>
                                <Text style={[styles.securitySubLabel, { color: colors.icon }]}>
                                    Find a bug? Let us know.
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color={colors.icon} />
                    </AnimatedPressable>
                </View>

                {/* Theme Selection Section */}
                <View style={[styles.themeSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                    <View style={styles.themeGrid}>
                        <AnimatedPressable
                            style={[
                                styles.themeOption,
                                { backgroundColor: colors.background, borderColor: colors.border },
                                preference === 'light' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => setPreference('light')}
                        >
                            <Sun size={20} color={preference === 'light' ? colors.primary : colors.icon} />
                            <Text style={[styles.themeOptionText, { color: colors.icon }, preference === 'light' && { color: colors.primary, fontWeight: '700' }]}>Light</Text>
                        </AnimatedPressable>

                        <AnimatedPressable
                            style={[
                                styles.themeOption,
                                { backgroundColor: colors.background, borderColor: colors.border },
                                preference === 'dark' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => setPreference('dark')}
                        >
                            <Moon size={20} color={preference === 'dark' ? colors.primary : colors.icon} />
                            <Text style={[styles.themeOptionText, { color: colors.icon }, preference === 'dark' && { color: colors.primary, fontWeight: '700' }]}>Dark</Text>
                        </AnimatedPressable>

                        <AnimatedPressable
                            style={[
                                styles.themeOption,
                                { backgroundColor: colors.background, borderColor: colors.border },
                                preference === 'auto' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => setPreference('auto')}
                        >
                            <Monitor size={20} color={preference === 'auto' ? colors.primary : colors.icon} />
                            <Text style={[styles.themeOptionText, { color: colors.icon }, preference === 'auto' && { color: colors.primary, fontWeight: '700' }]}>Auto</Text>
                        </AnimatedPressable>
                    </View>
                </View>

                <AnimatedPressable
                    style={styles.logoutButton}
                    onPress={() => {
                        handleLogout();
                    }}
                >
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </AnimatedPressable>

                <Text style={[styles.versionText, { color: colors.icon }]}>Version 2.0.4</Text>
            </ScrollView>

            <StatusModal
                visible={modalVisible}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />

            <ConfirmModal
                visible={logoutConfirmVisible}
                title="Log Out?"
                message="Are you sure you want to sign out of your account?"
                onConfirm={confirmLogout}
                onCancel={() => setLogoutConfirmVisible(false)}
                confirmText="Log Out"
                type="danger"
                icon="log-out"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        zIndex: 100,
        marginBottom: 10,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    headerGlass: {
        width: '100%',
        overflow: 'hidden',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    content: {
        padding: 20,
    },
    profileCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    role: {
        fontSize: 16,
        textTransform: 'capitalize',
        textAlign: 'center',
    },
    infoSection: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        marginLeft: 36,
    },
    themeSection: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    themeGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    themeOption: {
        flex: 1,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    themeOptionText: {
        fontSize: 13,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FAC7C7',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 12,
        paddingBottom: 20,
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    securityLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    securitySubLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    urgentSettingContainer: {
        marginTop: 8,
    },
    urgentOptionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    urgentOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 50,
        alignItems: 'center',
    },
    urgentOptionText: {
        fontSize: 12,
    }
});
