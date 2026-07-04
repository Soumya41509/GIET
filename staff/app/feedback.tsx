import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { StatusModal } from '@/components/ui/StatusModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { adminSupabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Clock, FileText, Send, Tag } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedbackScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const { staff } = useAuth();
    const insets = useSafeAreaInsets();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Feedback Status
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<'success' | 'error'>('success');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (staff) {
            fetchHistory();
        }
    }, [staff]);

    const fetchHistory = async () => {
        try {
            const { data, error } = await adminSupabase
                .from('staff_feedback')
                .select('*')
                .eq('staff_id', staff?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSubmit = async () => {
        if (!subject.trim()) {
            showStatus('error', 'Subject Required', 'Please enter a subject.');
            return;
        }

        if (!message.trim()) {
            showStatus('error', 'Description Required', 'Please describe the issue.');
            return;
        }

        if (!staff) {
            showStatus('error', 'Error', 'Staff info missing.');
            return;
        }

        try {
            setIsSubmitting(true);
            const { error } = await adminSupabase
                .from('staff_feedback')
                .insert({
                    staff_id: staff.id,
                    subject: subject,
                    message: message,
                });

            if (error) throw error;

            showStatus('success', 'Report Submitted', 'We will look into it.');

            // Refresh history
            fetchHistory();

            // Reset form
            setSubject('');
            setMessage('');

        } catch (e: any) {
            showStatus('error', 'Failed', e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showStatus = (type: 'success' | 'error', title: string, statusMsg: string) => {
        setStatusType(type);
        setStatusTitle(title);
        setStatusMessage(statusMsg);
        setStatusVisible(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };



    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Report an Issue</Text>
                    </View>
                    <View style={{ height: 1, width: '100%', backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)' }} />
                </BlurView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.content}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 10 }}>
                            <Text style={[styles.subHeading, { color: colors.icon }]}>
                                Found a bug or have a suggestion? We'd love to hear from you.
                            </Text>

                            <View style={[styles.formContainer, { backgroundColor: colors.card, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>SUBJECT</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                                        <Tag size={20} color={colors.primary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="e.g. Login Error"
                                            placeholderTextColor={colors.icon}
                                            value={subject}
                                            onChangeText={setSubject}
                                            maxLength={100}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>DESCRIPTION</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderColor: colors.border, alignItems: 'flex-start', paddingTop: 14 }]}>
                                        <FileText size={20} color={colors.primary} style={[styles.inputIcon, { marginTop: 4 }]} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text, height: 120, textAlignVertical: 'top' }]}
                                            placeholder="Describe what happened..."
                                            placeholderTextColor={colors.icon}
                                            multiline
                                            numberOfLines={6}
                                            value={message}
                                            onChangeText={setMessage}
                                            maxLength={1000}
                                        />
                                    </View>
                                </View>

                                <AnimatedPressable
                                    style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1, shadowColor: colors.primary }]}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    <Send size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitText}>
                                        {isSubmitting ? 'Sending Report...' : 'Submit Report'}
                                    </Text>
                                </AnimatedPressable>
                            </View>

                            <View style={styles.recentHeader}>
                                <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Reports</Text>
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.historyHeader}>
                                <Text style={[styles.historySubject, { color: colors.text }]} numberOfLines={1}>{item.subject}</Text>
                                <View style={styles.dateContainer}>
                                    <Clock size={12} color={colors.icon} style={{ marginRight: 4 }} />
                                    <Text style={[styles.historyDate, { color: colors.icon }]}>{formatDate(item.created_at)}</Text>
                                </View>
                            </View>
                            <Text style={[styles.historyMessage, { color: colors.icon }]} numberOfLines={2}>
                                {item.message}
                            </Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        !isLoadingHistory ? (
                            <Text style={[styles.emptyText, { color: colors.icon }]}>No reports found.</Text>
                        ) : null
                    }
                />
            </KeyboardAvoidingView>

            <StatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                onClose={() => setStatusVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        marginLeft: 4,
    },
    content: {
        padding: 24,
        paddingTop: 10,
        paddingBottom: 40,
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
        paddingHorizontal: 20,
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
    subHeading: {
        fontSize: 16,
        marginBottom: 32,
        lineHeight: 24,
        opacity: 0.8,
    },
    formContainer: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        opacity: 0.8,
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 16,
    },
    submitButton: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    submitText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    recentHeader: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    recentTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    historyCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historySubject: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyDate: {
        fontSize: 12,
    },
    historyMessage: {
        fontSize: 14,
        lineHeight: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    }
});
