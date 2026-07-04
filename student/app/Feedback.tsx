import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';

const { width } = Dimensions.get('window');

export default function FeedbackScreen() {
    const router = useRouter();
    const { user } = useUser();
    const insets = useSafeAreaInsets();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

    const fetchHistory = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setIsLoadingHistory(true);
            
            if (!user?.id) {
                setIsLoadingHistory(false);
                setRefreshing(false);
                return;
            }

            const { data, error } = await supabase
                .from('student_feedback')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                // Graceful fallback if table is still named 'feedbacks'
                if (error.code === '42P01') {
                    const { data: legacyData, error: legacyError } = await supabase
                        .from('feedbacks')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (!legacyError) {
                        setHistory(legacyData || []);
                        return;
                    }
                }
                throw error;
            } else {
                setHistory(data || []);
            }
        } catch (e) {
            console.error('Error fetching feedback history:', e);
        } finally {
            setIsLoadingHistory(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory(false);
    };

    const handleSubmit = async () => {
        if (!user?.id || user.id === '') {
            Alert.alert('Not Logged In', 'Please wait for your profile to load or try logging in again.');
            return;
        }

        if (!subject.trim() || !message.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Missing Details', 'Please enter a subject and your message so we can help you better.');
            return;
        }

        try {
            setIsSubmitting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            // Attempt to insert into student_feedback, fallback to feedbacks if necessary
            const { error: insertError } = await supabase
                .from('student_feedback')
                .insert({
                    user_id: user.id,
                    subject: subject.trim(),
                    message: message.trim(),
                });

            if (insertError) {
                // Graceful fallback if table is still named 'feedbacks'
                if (insertError.code === '42P01') {
                    const { error: legacyError } = await supabase
                        .from('feedbacks')
                        .insert({
                            user_id: user.id,
                            subject: subject.trim(),
                            message: message.trim(),
                        });
                    if (legacyError) throw legacyError;
                } else {
                    throw insertError;
                }
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsSuccessModalVisible(true);

            setSubject('');
            setMessage('');
            fetchHistory(false);
        } catch (e: any) {
            console.error('Feedback submission error:', e.message || e);
            Alert.alert('Submission Failed', 'Something went wrong while sending your feedback. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.bgGlowContainer}>
                <View style={[styles.glow, { backgroundColor: '#E0F2FE', top: -100, left: -100 }]} />
                <View style={[styles.glow, { backgroundColor: '#F0F9FF', bottom: -100, right: -100 }]} />
            </View>

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.headerAction} />
                    <Text style={styles.headerTitleText}>Feedback Hub</Text>
                    <View style={styles.headerAction} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <FlatList
                        data={history}
                        ListHeaderComponent={
                            <View style={styles.contentHeader}>
                                <View style={styles.formCard}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>WHAT IS THIS ABOUT?</Text>
                                        <View style={styles.inputContainer}>
                                            <Feather name="bookmark" size={18} color="#0EA5E9" style={styles.fieldIcon} />
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="e.g. App Bug, Feature Suggestion"
                                                placeholderTextColor="#94A3B8"
                                                value={subject}
                                                onChangeText={setSubject}
                                                maxLength={100}
                                            />
                                        </View>
                                    </View>

                                    <View style={[styles.inputGroup, { marginBottom: 24 }]}>
                                        <Text style={styles.label}>SHARE YOUR THOUGHTS</Text>
                                        <View style={[styles.inputContainer, styles.textAreaContainer]}>
                                            <Feather name="edit-3" size={18} color="#0EA5E9" style={[styles.fieldIcon, { marginTop: 14 }]} />
                                            <TextInput
                                                style={[styles.textInput, styles.textArea]}
                                                placeholder="Detailed description..."
                                                placeholderTextColor="#94A3B8"
                                                multiline
                                                numberOfLines={5}
                                                value={message}
                                                onChangeText={setMessage}
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={isSubmitting}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#0EA5E9', '#0284C7']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        {isSubmitting ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <View style={styles.submitContent}>
                                                <Text style={styles.submitText}>Send Feedback</Text>
                                                <Feather name="chevron-right" size={20} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.historySectionHeader}>
                                    <Text style={styles.historyTitle}>Recent Activity</Text>
                                    <View style={styles.historyBadge}>
                                        <Text style={styles.historyBadgeText}>{history.length}</Text>
                                    </View>
                                </View>
                            </View>
                        }
                        renderItem={({ item, index }) => (
                            <View style={styles.historyItem}>
                                <View style={styles.historyTop}>
                                    <View style={styles.subjectRow}>
                                        <View style={styles.bullet} />
                                        <Text style={styles.historySubject} numberOfLines={1}>{item.subject}</Text>
                                    </View>
                                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                                </View>
                                <Text style={styles.historyMessage} numberOfLines={3}>{item.message}</Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContainer}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#0EA5E9"
                            />
                        }
                        ListEmptyComponent={
                            !isLoadingHistory ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIllustration}>
                                        <Feather name="inbox" size={40} color="#CBD5E1" />
                                    </View>
                                    <Text style={styles.emptyStateText}>No submissions yet</Text>
                                    <Text style={styles.emptyStateSubtext}>Your history will appear here once you send your first report.</Text>
                                </View>
                            ) : (
                                <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />
                            )
                        }
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Success Modal */}
            <Modal visible={isSuccessModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <Reanimated.View entering={ZoomIn.springify()} style={styles.successCard}>
                        <View style={styles.successIcon}>
                            <Feather name="check" size={40} color="white" />
                        </View>
                        <Text style={styles.successTitle}>Feedback Sent!</Text>
                        <Text style={styles.successMessage}>
                            We've received your thoughts. Thank you for helping us make GIET better for everyone!
                        </Text>

                        <TouchableOpacity
                            style={styles.modalPrimaryBtn}
                            onPress={() => {
                                setIsSuccessModalVisible(false);
                                router.replace('/(tabs)');
                            }}
                        >
                            <LinearGradient
                                colors={['#0EA5E9', '#0284C7']}
                                style={styles.modalPrimaryBtnGradient}
                            >
                                <Text style={styles.modalPrimaryBtnText}>Back to Dashboard</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Reanimated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    bgGlowContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerAction: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    listContainer: {
        paddingBottom: 40,
    },
    contentHeader: {
        paddingHorizontal: 24,
    },
    heroSection: {
        marginTop: 10,
        marginBottom: 32,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        lineHeight: 24,
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#E0F2FE',
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 10,
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        paddingHorizontal: 16,
    },
    textAreaContainer: {
        alignItems: 'flex-start',
    },
    fieldIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        paddingVertical: 16,
        fontWeight: '600',
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    submitButton: {
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    historySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    historyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    historyBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyBadgeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0EA5E9',
    },
    historyItem: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    historyTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    bullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0EA5E9',
        marginRight: 10,
    },
    historySubject: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    historyDate: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    historyMessage: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 40,
    },
    emptyIllustration: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    successCard: {
        backgroundColor: 'white',
        width: width * 0.85,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    modalPrimaryBtn: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalPrimaryBtnGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalPrimaryBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    }
});

