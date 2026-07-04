import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusModal } from '@/components/ui/StatusModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { studentSupabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Camera, Check, CheckCircle, ChevronDown, Clock, Eye, Image as ImageIcon, Layers, MessageSquare, Paperclip, RefreshCw, Send, Trash2, Upload, User, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, DeviceEventEmitter, Platform, TouchableWithoutFeedback } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalCache } from '@/lib/cache';

const { width, height } = Dimensions.get('window');

// --- REJECTION TEMPLATES (same as admin panel) ---
const REJECTION_TEMPLATES = [
    { id: 'out_of_scope', label: 'Out of Institutional Scope', reason: 'This grievance does not fall under institutional jurisdiction. Please contact the relevant external department for assistance.' },
    { id: 'insufficient_info', label: 'Insufficient Information', reason: 'The grievance lacks sufficient details for us to take action. Please submit a new grievance with complete information including dates, locations, and specific incidents.' },
    { id: 'duplicate', label: 'Duplicate Submission', reason: 'This grievance is a duplicate of a previously submitted case. Please refer to your original submission for updates.' },
    { id: 'inappropriate', label: 'Inappropriate Content', reason: 'This grievance contains inappropriate or offensive content that violates institutional guidelines. Please submit a new grievance with professional language.' },
    { id: 'resolved_already', label: 'Already Resolved', reason: 'This issue has already been resolved through other channels. If you believe this is incorrect, please contact the grievance office directly.' },
    { id: 'custom', label: 'Custom Reason', reason: '' },
];


// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1.5,
        marginBottom: 4,
    },
    timerIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    timerContent: {
        flex: 1,
    },
    timerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    timerValue: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    timerUnit: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
        marginTop: 6,
    },
    urgentBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    urgentText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
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
        borderRadius: 14,
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
        paddingTop: 10,
        gap: 20,
    },
    cardContainer: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1.5,
    },
    cardGlass: {
        width: '100%',
    },
    cardContent: {
        padding: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    date: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.7,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    chainContainer: {
        paddingLeft: 10,
    },
    chainItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 20,
        position: 'relative',
    },
    chainLine: {
        position: 'absolute',
        left: 17,
        top: 10,
        width: 2.5,
        borderRadius: 5,
    },
    chainCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    chainText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
    },
    chainContent: {
        marginLeft: 16,
    },
    chainLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    attachmentsContainer: {
        marginTop: 20,
        flexDirection: 'row',
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    attachmentText: {
        fontSize: 13,
        fontWeight: '700',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    detailItem: {
        width: '45%',
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 6,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    separator: {
        height: 1,
        marginVertical: 20,
        opacity: 0.5,
    },
    statusSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timelineList: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        position: 'relative',
        minHeight: 80,
    },
    timelineIndicator: {
        width: 40,
        alignItems: 'center',
        paddingTop: 4, // Offset for better alignment with content
    },
    timelineLine: {
        position: 'absolute',
        top: 42,
        bottom: -24, // Connect to next item's top
        width: 2,
        borderRadius: 1,
        left: 19, // Center of indicator
        zIndex: 1,
    },
    timelineIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5, // Higher than line
        borderWidth: 1.5,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 16,
        padding: 18,
        borderRadius: 24,
        borderWidth: 1.5,
        marginBottom: 24,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    timelineDate: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.5,
    },
    timelineDesc: {
        fontSize: 14,
        marginTop: 8,
        lineHeight: 20,
        opacity: 0.9,
    },
    latestBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    latestText: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 24,
        paddingTop: 16,
        // paddingBottom will be handled inline via insets
        gap: 12,
        width: '100%',
        // Add shadow for better separation without dark overlay
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    modalIndicator: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(128,128,128,0.3)',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    closeButton: {
        marginTop: 8,
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
    },
    closeButtonText: {
        fontWeight: '700',
        fontSize: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullPreviewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closePreviewButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 8,
    },
    previewContent: {
        width: width,
        height: height * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '95%',
        height: '100%',
        borderRadius: 20,
    },
    previewFooter: {
        padding: 30,
        alignItems: 'center',
    },
    previewTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    previewSubtitle: {
        color: '#94A3B8',
        fontSize: 14,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    retryButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    uploadButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    helperText: {
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 18,
        opacity: 0.8,
    },
    proofScroll: {
        marginHorizontal: -4,
    },
    proofContainer: {
        paddingHorizontal: 4,
        gap: 12,
        paddingBottom: 4,
    },
    emptyProof: {
        width: 120,
        height: 120,
        borderRadius: 16,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    emptyProofText: {
        fontSize: 12,
        fontWeight: '600',
    },
    proofItem: {
        width: 120,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    proofImage: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    deleteProofButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    deleteIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    manualEscalateButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        gap: 10,
    },
    manualEscalateText: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusLockedMsg: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 12,
        width: '100%',
    },
    statusLockedText: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1, // Ensure text wraps correctly
        lineHeight: 18,
    },
    popupContent: {
        width: width * 0.85,
        borderRadius: 36,
        padding: 24,
        alignSelf: 'center',
    },
});

// --- Interfaces ---
interface TimelineEvent {
    id: string;
    status: string;
    description: string;
    created_at: string;
}

// --- Components ---

const GlassCard: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
    const { theme, colors } = useTheme();
    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)' }, style]}>
            <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.cardGlass}>
                <LinearGradient
                    colors={theme === 'dark' ?
                        ['rgba(30, 30, 30, 0.7)', 'rgba(30, 30, 30, 0.3)'] :
                        ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardContent}>{children}</View>
            </BlurView>
        </View>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const { colors } = useTheme();
    let color = colors.status.submitted;

    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'pending') color = colors.status.pending;
    else if (lowerStatus === 'in-progress' || lowerStatus === 'in progress') color = colors.status.inProgress;
    else if (lowerStatus === 'resolved') color = colors.status.resolved;
    else if (lowerStatus === 'rejected') color = '#EF4444';
    else if (lowerStatus === 'unresponsive') color = '#F97316'; // orange — needs admin attention

    return (
        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{status}</Text>
        </View>
    );
};

const CountdownTimer: React.FC<{ deadline: string; status: string }> = ({ deadline, status }) => {
    const { colors, theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number; total: number }>({ h: 0, m: 0, s: 0, total: 0 });

    useEffect(() => {
        const calculate = () => {
            const now = new Date().getTime();
            const target = new Date(deadline).getTime();
            const diff = target - now;

            if (diff <= 0) return { h: 0, m: 0, s: 0, total: 0 };

            return {
                h: Math.floor((diff / (1000 * 60 * 60))),
                m: Math.floor((diff / (1000 * 60)) % 60),
                s: Math.floor((diff / 1000) % 60),
                total: diff
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculate());
        }, 1000);

        setTimeLeft(calculate());
        return () => clearInterval(timer);
    }, [deadline]);

    if (status === 'Resolved' || status === 'Rejected' || status === 'Unresponsive' || timeLeft.total <= 0) return null;

    const isUrgent = timeLeft.total < 15 * 60 * 1000; // < 15 mins
    const isWarning = timeLeft.total < 45 * 60 * 1000; // < 45 mins

    const accentColor = isUrgent ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981');

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.timerContainer, { borderColor: accentColor + '40', backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)' }]}>
            <View style={[styles.timerIcon, { backgroundColor: accentColor + '20' }]}>
                <Clock size={20} color={accentColor} />
            </View>
            <View style={styles.timerContent}>
                <Text style={[styles.timerLabel, { color: colors.icon }]}>ESCALATION DEADLINE</Text>
                <View style={styles.row}>
                    <Text style={[styles.timerValue, { color: colors.text }]}>
                        {timeLeft.h.toString().padStart(2, '0')}:
                        {timeLeft.m.toString().padStart(2, '0')}:
                        {timeLeft.s.toString().padStart(2, '0')}
                    </Text>
                    <Text style={[styles.timerUnit, { color: colors.icon }]}> remaining</Text>
                </View>
            </View>
            {isUrgent && (
                <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT</Text>
                </View>
            )}
        </Animated.View>
    );
};

export default function GrievanceDetails() {
    const { colors, theme } = useTheme();
    const { staff } = useAuth();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [grievance, setGrievance] = useState<any>(globalCache.grievances[String(id)] || null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(!grievance);
    const [fetchingDetails, setFetchingDetails] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [escalationSteps, setEscalationSteps] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);

    // UI Modals for Actions
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [escalateModalVisible, setEscalateModalVisible] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);

    // Reject Modal State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRejectTemplate, setSelectedRejectTemplate] = useState('custom');
    const [rejecting, setRejecting] = useState(false);

    // Feedback Status Modal
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
    const [feedbackTitle, setFeedbackTitle] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // Attachment Preview
    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const showFeedback = (type: 'success' | 'error', title: string, message: string) => {
        setFeedbackType(type);
        setFeedbackTitle(title);
        setFeedbackMessage(message);
        setFeedbackVisible(true);
    };

    const handleOpenAttachment = () => {
        if (grievance?.attachment_path) {
            const url = `https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${grievance.attachment_path}`;
            setPreviewImageUrl(url);
            setAttachmentModalVisible(true);
        }
    };

    const timelineLineHeight = useSharedValue(0);

    // Optimized: Only re-render when deadline actually passes, not every second
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

    useEffect(() => {
        if (!grievance?.escalation_deadline) return;

        const checkDeadline = () => {
            const now = Date.now();
            const target = new Date(grievance.escalation_deadline).getTime();
            const passed = target < now;
            setIsDeadlinePassed(passed);
            return { passed, target, now };
        };

        const { passed, target, now } = checkDeadline();
        if (passed) return;

        // Schedule a single update for exactly when the deadline hits
        const timeUntilDeadline = target - now;
        if (timeUntilDeadline > 0 && timeUntilDeadline < 2147483647) { // Max 32-bit int (~24 days)
            const timeout = setTimeout(() => setIsDeadlinePassed(true), timeUntilDeadline);
            return () => clearTimeout(timeout);
        }
    }, [grievance?.escalation_deadline]);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    // Real-time: Listen to global updates from _layout.tsx
    useEffect(() => {
        if (!id) return;
        const subscription = DeviceEventEmitter.addListener('grievance_updated', () => {
            const cached = globalCache.grievances[String(id)];
            if (cached) {
                setGrievance({ ...cached });
                if (cached.grievance_timeline) {
                    setTimeline([...cached.grievance_timeline].sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ));
                }
            }
        });
        return () => subscription.remove();
    }, [id]);

    const fetchData = async () => {
        try {
            // SWR: Only show loading if we don't have cached data
            if (!grievance) setLoading(true);
            setFetchingDetails(true);
            setError(null);

            // Combined query - fetch grievance with timeline in one go
            const { data: gData, error: gError } = await studentSupabase
                .from('grievances')
                .select(`
                    *,
                    grievance_timeline (
                        id,
                        status,
                        description,
                        created_at
                    )
                `)
                .eq('id', id)
                .single();

            if (gError) throw gError;

            setGrievance(gData);
            globalCache.grievances[String(id)] = gData;

            // Timeline is already included in the response
            const timelineData = gData?.grievance_timeline || [];
            setTimeline(timelineData.sort((a: TimelineEvent, b: TimelineEvent) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ));

            // Fetch Flow Steps and Staff names
            if (gData.flow_snapshot_id) {
                const [stepsRes, staffRes] = await Promise.all([
                    studentSupabase.from('escalation_steps').select('*').eq('flow_id', gData.flow_snapshot_id).order('step_order', { ascending: true }),
                    studentSupabase.from('staff_profiles').select('id, name') // Use staff_profiles if available in student DB or adjust based on schema
                ]);

                if (stepsRes.data) setEscalationSteps(stepsRes.data);
                if (staffRes.data) setStaffList(staffRes.data);
            }

            // Snappier timeline line height
            timelineLineHeight.value = withTiming(1, { duration: 600 });
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to load grievance details');
        } finally {
            setFetchingDetails(false);
        }
    };

    const processImageUpload = async (uri: string) => {
        try {
            setUploadingImage(true);

            // 1. Compress Image (Target 100-200KB)
            const compressed = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
            );

            // 2. Upload to Supabase Storage (Using Blobs - Memory Efficient)
            const fileExt = 'jpg';
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${id}/staff/${fileName}`;

            // Fetch URI as blob - React Native multi-threaded implementation
            const response = await fetch(compressed.uri);
            const blob = await response.blob();

            const { error: uploadError } = await studentSupabase.storage
                .from('grievances')
                .upload(filePath, blob, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Update Database
            const currentPaths = grievance.image_paths || [];
            const newPaths = [...currentPaths, filePath];

            const { error: dbError } = await studentSupabase
                .from('grievances')
                .update({ image_paths: newPaths })
                .eq('id', id);

            if (dbError) throw dbError;

            // 4. Update Local State
            setGrievance((prev: any) => ({ ...prev, image_paths: newPaths }));
            showFeedback('success', 'Image Uploaded', 'Staff proof image added successfully');

        } catch (e: any) {
            console.error('Upload failed:', e);
            showFeedback('error', 'Upload Failed', e.message || 'Could not upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCameraLaunch = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                await processImageUpload(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Camera error', error);
        }
    };

    const handleGalleryLaunch = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                await processImageUpload(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Gallery error', error);
        }
    };

    const handleStaffImageUpload = () => {
        // Verify status first
        if (grievance.status !== 'Resolved') {
            showFeedback('error', 'Action Not Allowed', 'Images can only be uploaded for Resolved grievances');
            return;
        }

        // Check Limit (Max 2)
        if (grievance.image_paths && grievance.image_paths.length >= 2) {
            showFeedback('error', 'Limit Reached', 'Maximum 2 proof images allowed.');
            return;
        }

        setUploadModalVisible(true);
    };

    const handleOpenStaffImage = (path: string) => {
        const url = `https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}`;
        setPreviewImageUrl(url);
        setAttachmentModalVisible(true);
    };

    const handleDeleteStaffImage = (path: string) => {
        setImageToDelete(path);
        setDeleteModalVisible(true);
    };

    const confirmDeleteImage = async () => {
        if (!imageToDelete) return;

        try {
            setDeleteModalVisible(false);
            setUploadingImage(true);

            // 1. Delete from Storage
            const { error: storageError } = await studentSupabase.storage
                .from('grievances')
                .remove([imageToDelete]);

            if (storageError) throw storageError;

            // 2. Update Database
            const currentPaths = grievance.image_paths || [];
            const newPaths = currentPaths.filter((p: string) => p !== imageToDelete);

            const { error: dbError } = await studentSupabase
                .from('grievances')
                .update({ image_paths: newPaths })
                .eq('id', id);

            if (dbError) throw dbError;

            setGrievance((prev: any) => ({ ...prev, image_paths: newPaths }));
            showFeedback('success', 'Image Deleted', 'Staff image removed successfully');

        } catch (e: any) {
            console.error('Delete failed:', e);
            showFeedback('error', 'Delete Failed', e.message);
        } finally {
            setUploadingImage(false);
            setImageToDelete(null);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (updating || newStatus === grievance.status) {
            setStatusModalVisible(false);
            return;
        }

        // Close selection modal immediately
        setStatusModalVisible(false);

        try {
            setUpdating(true);

            // Sequential update logic: if moving from Submitted straight to Resolved
            if (grievance.status.toLowerCase() === 'submitted' && newStatus === 'Resolved') {
                await studentSupabase
                    .from('grievances')
                    .update({ status: 'In-progress' })
                    .eq('id', id);

                // Small delay to ensure timeline entry order
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const updatePayload: any = {
                status: newStatus,
                last_modified_by_name: staff?.name || 'Staff'
            };
            // Track who handled it — set assigned_staff_id so it stays in staff's list
            if ((newStatus === 'Resolved' || newStatus === 'In-progress') && staff?.id) {
                updatePayload.assigned_staff_id = staff.id;
            }
            if (newStatus === 'Resolved' && staff?.id) {
                updatePayload.resolved_by_staff_id = staff.id;
            }

            const { error: updateError } = await studentSupabase
                .from('grievances')
                .update(updatePayload)
                .eq('id', Array.isArray(id) ? id[0] : id);

            if (updateError) throw updateError;

            setGrievance((prev: any) => ({ ...prev, status: newStatus, resolved_by_staff_id: updatePayload.resolved_by_staff_id || prev?.resolved_by_staff_id }));
            await fetchData();
            showFeedback('success', 'Status Updated', `Grievance marked as ${newStatus}`);
        } catch (e: any) {
            showFeedback('error', 'Update Failed', e.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleManualEscalate = () => {
        // Hard guard — check deadline at the moment of button press
        if (grievance?.escalation_deadline && new Date(grievance.escalation_deadline).getTime() < Date.now()) {
            showFeedback('error', 'Action Blocked', 'Deadline has passed. This grievance has been auto-escalated.');
            return;
        }
        if (!grievance || !escalationSteps.length) return;
        const currentStepOrder = grievance.current_step || 1;
        const nextStep = escalationSteps.find(s => s.step_order === currentStepOrder + 1);

        if (!nextStep) {
            showFeedback('error', 'Limit Reached', 'This grievance is already at the highest level.');
            return;
        }
        setEscalateModalVisible(true);
    };

    const handleRejectGrievance = async () => {
        // Prevent multiple rejections or rejecting a resolved grievance
        if (grievance.status === 'Rejected' || grievance.status === 'Resolved') {
            showFeedback('error', 'Action Blocked', `Grievance is already ${grievance.status}`);
            setRejectModalVisible(false);
            return;
        }

        const wordCount = rejectReason.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 10) {
            showFeedback('error', 'Reason Too Short', 'Please provide at least 10 words explaining the rejection.');
            return;
        }
        try {
            setRejecting(true);
            
            // Optimistic update
            const oldGrievance = { ...grievance };
            setGrievance((prev: any) => ({ ...prev, status: 'Rejected', rejection_reason: rejectReason.trim() }));
            setRejectModalVisible(false);

            const { error } = await studentSupabase
                .from('grievances')
                .update({
                    status: 'Rejected',
                    rejection_reason: rejectReason.trim(),
                    rejection_template: selectedRejectTemplate,
                    rejected_at: new Date().toISOString(),
                    rejected_by: (staff as any)?.name || 'Senior Authority',
                    last_modified_by_name: (staff as any)?.name || 'Staff'
                })
                .eq('id', Array.isArray(id) ? id[0] : id);
            
            if (error) {
                setGrievance(oldGrievance);
                throw error;
            }

            setRejectReason('');
            setSelectedRejectTemplate('custom');
            showFeedback('success', 'Grievance Rejected', 'The grievance has been rejected with the provided justification.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e: any) {
            showFeedback('error', 'Rejection Failed', e.message);
        } finally {
            setRejecting(false);
        }
    };

    const confirmManualEscalation = async () => {
        const currentId = Array.isArray(id) ? id[0] : id;
        if (!currentId) return;

        const currentStepOrder = grievance?.current_step || 1;
        const nextStep = escalationSteps.find(s => s.step_order === currentStepOrder + 1);

        if (!nextStep) {
            setEscalateModalVisible(false);
            showFeedback('error', 'Limit Reached', 'No higher authority is defined for this grievance flow.');
            return;
        }

        try {
            setEscalateModalVisible(false);
            setUpdating(true);
            const newDeadline = new Date(Date.now() + (nextStep.sla_minutes ?? 60) * 60000).toISOString();

            const { error } = await studentSupabase
                .from('grievances')
                .update({
                    current_step: nextStep.step_order,
                    assigned_staff_id: nextStep.staff_id,
                    escalation_deadline: newDeadline,
                    last_modified_by_name: (staff as any)?.name || 'Staff'
                })
                .eq('id', currentId);

            if (error) throw error;

            showFeedback('success', 'Moved Up', `Grievance escalated to Level ${nextStep.step_order}`);
            await fetchData();
        } catch (e: any) {
            console.error('Escalation error:', e);
            showFeedback('error', 'Failed', e.message || 'Could not escalate grievance');
        } finally {
            setUpdating(false);
        }
    };

    const getTimelineStyle = (status: string) => {
        const lower = status.toLowerCase();
        if (lower === 'submitted') return { icon: <Send size={16} color={colors.primary} />, color: colors.primary };
        if (lower === 'in-progress' || lower === 'in progress') return { icon: <RefreshCw size={16} color="#3B82F6" />, color: '#3B82F6' };
        if (lower === 'resolved') return { icon: <CheckCircle size={16} color="#10B981" />, color: '#10B981' };
        if (lower === 'rejected') return { icon: <XCircle size={16} color="#EF4444" />, color: '#EF4444' };
        if (lower === 'escalated') return { icon: <Layers size={16} color="#F59E0B" />, color: '#F59E0B' };
        if (lower === 'unresponsive') return { icon: <AlertCircle size={16} color="#F97316" />, color: '#F97316' };
        return { icon: <Clock size={16} color={colors.primary} />, color: colors.primary };
    };

    const timelineLineStyle = useAnimatedStyle(() => ({
        height: `${timelineLineHeight.value * 100}%`,
    }));

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.headerContainer}>
                    <BlurView intensity={80} tint={theme} style={styles.headerGlass}>
                        <View style={[styles.headerContent, { paddingTop: insets.top, height: insets.top + 60 }]}>
                            <View style={{ width: 44 }}><Skeleton width={40} height={40} borderRadius={12} /></View>
                            <Skeleton width={180} height={20} />
                            <View style={{ width: 44 }} />
                        </View>
                        <View style={{ height: 1, width: '100%', backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)' }} />
                    </BlurView>
                </View>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                    {/* Main Card Skeleton */}
                    <View style={[styles.cardContainer, { height: 200, marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={{ padding: 24 }}>
                            <View style={[styles.rowBetween, { marginBottom: 16 }]}>
                                <Skeleton width={100} height={24} borderRadius={20} />
                                <Skeleton width={80} height={16} />
                            </View>
                            <Skeleton width="90%" height={28} style={{ marginBottom: 12 }} />
                            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                            <Skeleton width="60%" height={16} />
                        </View>
                    </View>

                    {/* Chain/Steps Skeleton */}
                    <View style={[styles.cardContainer, { height: 160, marginBottom: 16, backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={{ padding: 24 }}>
                            <Skeleton width={140} height={24} style={{ marginBottom: 24 }} />
                            <View style={styles.row}>
                                <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 16 }} />
                                <Skeleton width={150} height={16} />
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons Skeleton */}
                    <View style={[styles.rowBetween, { marginTop: 12, gap: 16 }]}>
                        <Skeleton width="48%" height={56} borderRadius={28} />
                        <Skeleton width="48%" height={56} borderRadius={28} />
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.headerContainer}>
                    <BlurView intensity={90} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.headerGlass}>
                        <LinearGradient
                            colors={theme === 'dark' ?
                                ['rgba(139, 92, 246, 0.15)', 'rgba(0,0,0,0.2)', 'rgba(139, 92, 246, 0.10)'] :
                                ['rgba(139, 92, 246, 0.25)', 'rgba(255,255,255,0.3)', 'rgba(139, 92, 246, 0.20)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[styles.headerContent, { paddingTop: insets.top, height: insets.top + 60 }]}>
                            <AnimatedPressable
                                onPress={() => router.back()}
                                style={[styles.backButton, { backgroundColor: 'transparent' }]}
                            >
                                <ArrowLeft size={24} color={colors.text} />
                            </AnimatedPressable>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Error</Text>
                            <View style={{ width: 44 }} />
                        </View>
                    </BlurView>
                </View>
                <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <AlertCircle size={64} color={colors.status.highPriority} style={{ marginBottom: 16 }} />
                    <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to Load Grievance</Text>
                    <Text style={[styles.errorMessage, { color: colors.icon }]}>{error}</Text>
                    <AnimatedPressable
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={fetchData}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </AnimatedPressable>
                </View>
            </View>
        );
    }

    if (!grievance) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.headerContainer}>
                <BlurView intensity={90} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.headerGlass}>
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
                            <AnimatedPressable
                                onPress={() => router.back()}
                                style={[styles.backButton, { backgroundColor: 'transparent' }]}
                            >
                                <ArrowLeft size={24} color={colors.text} />
                            </AnimatedPressable>
                            <Text style={[styles.headerTitle, { color: colors.text, marginLeft: 8 }]}>Grievance Details</Text>
                        </Animated.View>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={{ height: 1, width: '100%', backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)' }} />
                </BlurView>
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {grievance.escalation_deadline && grievance.assigned_staff_id === staff?.id && (
                    <CountdownTimer deadline={grievance.escalation_deadline} status={grievance.status} />
                )}

                {/* --- Main Info Card --- */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <GlassCard style={styles.section}>
                        <View style={styles.rowBetween}>
                            <StatusBadge status={grievance.status} />
                            <Text style={[styles.date, { color: colors.icon }]}>
                                {new Date(grievance.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </Text>
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>{grievance.title}</Text>
                        <Text style={[styles.description, { color: theme === 'dark' ? '#CBD5E1' : '#475569' }]}>{grievance.description}</Text>

                        {grievance.attachment_count > 0 && (
                            <AnimatedPressable
                                onPress={handleOpenAttachment}
                                style={styles.attachmentsContainer}
                            >
                                <View style={[styles.attachmentBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                                    <View style={styles.row}>
                                        <Paperclip size={14} color={colors.primary} />
                                        <Text style={[styles.attachmentText, { color: colors.primary }]}>View Attachment</Text>
                                    </View>
                                    <Eye size={14} color={colors.primary} />
                                </View>
                            </AnimatedPressable>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Escalation Chain Section */}
                {grievance.status !== 'Resolved' && grievance.status !== 'Rejected' && (fetchingDetails || escalationSteps.length > 0) && (() => {
                    const isNotMine = grievance.assigned_staff_id && grievance.assigned_staff_id !== staff?.id;
                    const wasEscalatedAway = (isDeadlinePassed || isNotMine)
                        && grievance.status !== 'Resolved' && grievance.status !== 'Rejected';

                    return (
                        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                            <GlassCard style={styles.section}>
                                <View style={styles.row}>
                                    <Layers size={18} color={colors.primary} style={{ marginRight: 10 }} />
                                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Escalation Chain</Text>
                                </View>

                                {fetchingDetails ? (
                                    <View style={{ marginTop: 24 }}>
                                        <View style={[styles.row, { marginBottom: 20 }]}>
                                            <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 16 }} />
                                            <Skeleton width={120} height={16} />
                                        </View>
                                        <View style={[styles.row, { marginBottom: 20 }]}>
                                            <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 16 }} />
                                            <Skeleton width={150} height={16} />
                                        </View>
                                        <View style={[styles.row]}>
                                            <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 16 }} />
                                            <Skeleton width={100} height={16} />
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <View style={[styles.chainContainer, { marginTop: 20 }]}>
                                            {escalationSteps.map((step, idx) => {
                                                const isActive = grievance.current_step === step.step_order;
                                                const isPast = grievance.current_step > step.step_order;
                                                const isCurrentButEscalated = isActive && wasEscalatedAway;

                                                return (
                                                    <View key={idx} style={styles.chainItem}>
                                                        <View style={[styles.chainCircle,
                                                        isCurrentButEscalated ? { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' } :
                                                            isActive ? { backgroundColor: colors.primary, borderColor: colors.primary } :
                                                                isPast ? { backgroundColor: colors.primary + '20', borderColor: colors.primary } :
                                                                    { backgroundColor: 'transparent', borderColor: colors.border }
                                                        ]}>
                                                            {isPast ? <Check size={12} color={colors.primary} /> :
                                                                isCurrentButEscalated ? <AlertCircle size={12} color="#F59E0B" /> :
                                                                    <Text style={[styles.chainText, isActive && { color: '#FFF' }]}>{step.step_order}</Text>}
                                                        </View>
                                                        <View style={styles.chainContent}>
                                                            <Text style={[styles.chainLabel, { color: isActive ? colors.text : colors.icon }]}>
                                                                Level {step.step_order} {staffList.find(s => s.id === step.staff_id)?.name ? `(${staffList.find(s => s.id === step.staff_id)?.name})` : ''}{' '}
                                                                {isCurrentButEscalated ?
                                                                    (isDeadlinePassed ? '⚠️ (Auto-escalated)' : '⚠️ (Escalated to higher authority)') :
                                                                    isActive ? '(Currently with you)' : ''}
                                                            </Text>
                                                        </View>
                                                        {idx < escalationSteps.length - 1 && (
                                                            <View style={[styles.chainLine, { backgroundColor: colors.border }]} />
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>

                                        {/* Escalation Banner */}
                                        {wasEscalatedAway && (
                                            <View style={[styles.statusLockedMsg, { backgroundColor: '#F59E0B15', marginTop: 16 }]}>
                                                <AlertCircle size={16} color="#F59E0B" />
                                                <Text style={[styles.statusLockedText, { color: '#F59E0B', fontSize: 13 }]}>
                                                    {isDeadlinePassed ? 'Deadline passed. Automatically escalated.' : 'This grievance has been escalated to a higher authority.'}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Manual Escalation Button — hide if deadline passed or already escalated away */}
                                        {!wasEscalatedAway &&
                                            grievance.status !== 'Resolved' && grievance.status !== 'Rejected' &&
                                            grievance.assigned_staff_id === staff?.id &&
                                            escalationSteps.some(s => s.step_order > (grievance.current_step || 1)) && (
                                                <Animated.View entering={FadeInDown.delay(200)}>
                                                    <TouchableOpacity
                                                        style={[styles.manualEscalateButton, { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
                                                        onPress={handleManualEscalate}
                                                        disabled={updating}
                                                    >
                                                        <Layers size={16} color={colors.primary} />
                                                        <Text style={[styles.manualEscalateText, { color: colors.primary }]}>
                                                            {updating ? 'Processing...' : 'Escalate to Next Level'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <Text style={[styles.helperText, { color: colors.icon, marginTop: 10, textAlign: 'center' }]}>
                                                        Use this if you are unable to resolve this issue yourself.
                                                    </Text>
                                                </Animated.View>
                                            )}
                                    </>
                                )}
                            </GlassCard>
                        </Animated.View>
                    );
                })()}

                {/* --- Details Grid --- */}
                <View>
                    <GlassCard style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Information</Text>
                        <View style={styles.detailsGrid}>
                            {[
                                { label: 'CATEGORY', value: grievance.category },
                                { label: 'SUBCATEGORY', value: grievance.subcategory || '-' },
                                { label: 'HOSTEL', value: grievance.hostel },
                                { label: 'PRIORITY', value: grievance.priority, isPriority: true }
                            ].map((item, idx) => (
                                item.value && (
                                    <Animated.View
                                        key={item.label}
                                        entering={FadeInDown.duration(400)}
                                        style={styles.detailItem}
                                    >
                                        <Text style={styles.detailLabel}>{item.label}</Text>
                                        <View style={styles.row}>
                                            {item.isPriority && item.value === 'High' && <AlertCircle size={14} color={colors.status.highPriority} style={{ marginRight: 4 }} />}
                                            <Text style={[styles.detailValue, { color: colors.text }, item.isPriority && item.value === 'High' && { color: colors.status.highPriority }]}>
                                                {item.value}
                                            </Text>
                                        </View>
                                    </Animated.View>
                                )
                            ))}
                        </View>

                        <View style={[styles.separator, { backgroundColor: colors.border }]} />

                        <Text style={styles.detailLabel}>UPDATE STATUS</Text>
                        {(() => {
                            const isFinalized = grievance.status === 'Resolved' || grievance.status === 'Rejected' || grievance.status === 'Unresponsive';
                            const isNotMine = !isFinalized && grievance.assigned_staff_id && grievance.assigned_staff_id !== staff?.id;
                            // canEdit if not finalized, not deadline passed, and assigned to following staff
                            const canEdit = !isFinalized && !isDeadlinePassed && !isNotMine;

                            return (
                                <>
                                    <AnimatedPressable
                                        style={[styles.statusSelector, { backgroundColor: colors.background, borderColor: colors.border },
                                        !canEdit && { opacity: 0.6, borderStyle: 'dashed' }]}
                                        onPress={() => canEdit && setStatusModalVisible(true)}
                                        disabled={!canEdit || updating}
                                    >
                                        <View style={styles.row}>
                                            <StatusBadge status={grievance.status} />
                                        </View>
                                        {canEdit && <ChevronDown size={20} color={colors.icon} />}
                                    </AnimatedPressable>

                                    {/* Resolved / Rejected lock */}
                                    {(grievance.status === 'Resolved' || grievance.status === 'Rejected') && (
                                        <View style={[styles.statusLockedMsg, { backgroundColor: (grievance.status === 'Resolved' ? '#10B981' : '#EF4444') + '10' }]}>
                                            <CheckCircle size={14} color={grievance.status === 'Resolved' ? '#10B981' : '#EF4444'} />
                                            <Text style={[styles.statusLockedText, { color: grievance.status === 'Resolved' ? '#10B981' : '#EF4444' }]}>
                                                This grievance is {grievance.status} and cannot be modified.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Unresponsive lock */}
                                    {grievance.status === 'Unresponsive' && (
                                        <View style={[styles.statusLockedMsg, { backgroundColor: '#F9731610' }]}>
                                            <AlertCircle size={14} color="#F97316" />
                                            <Text style={[styles.statusLockedText, { color: '#F97316' }]}>
                                                🔒 Locked — No authority responded within deadline. Contact administration.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Deadline passed (Auto-escalation) lock */}
                                    {!isFinalized && isDeadlinePassed && (
                                        <View style={[styles.statusLockedMsg, { backgroundColor: '#F59E0B10' }]}>
                                            <AlertCircle size={14} color="#F59E0B" />
                                            <Text style={[styles.statusLockedText, { color: '#F59E0B' }]}>
                                                Deadline passed — auto-escalated to higher authority. You can no longer update this.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Manually re-assigned lock */}
                                    {!isFinalized && !isDeadlinePassed && isNotMine && (
                                        <View style={[styles.statusLockedMsg, { backgroundColor: '#F59E0B10' }]}>
                                            <AlertCircle size={14} color="#F59E0B" />
                                            <Text style={[styles.statusLockedText, { color: '#F59E0B' }]}>
                                                Assignee changed (Manually escalated). You no longer have edit access.
                                            </Text>
                                        </View>
                                    )}
                                </>
                            );
                        })()}
                    </GlassCard>
                </View>

                {/* --- Reject Grievance (Last Authority Only) --- */}
                {(() => {
                    const isFinalized = grievance.status === 'Resolved' || grievance.status === 'Rejected' || grievance.status === 'Unresponsive';
                    const lastStep = escalationSteps.length > 0 ? escalationSteps[escalationSteps.length - 1] : null;
                    const isHighestAuthority = !!(lastStep && lastStep.staff_id === staff?.id && grievance.assigned_staff_id === staff?.id);

                    // Hide the entire reject section if already rejected or resolved
                    const canReject = isHighestAuthority && !isFinalized && !isDeadlinePassed;
                    if (!canReject) return null;
                    return (
                        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                            <GlassCard style={[styles.section, { borderColor: '#EF444430', borderWidth: 1 }]}>
                                <View style={[styles.row, { marginBottom: 10 }]}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EF444415', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <XCircle size={18} color="#EF4444" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.sectionTitle, { color: '#EF4444', marginBottom: 2 }]}>Reject Grievance</Text>
                                        <Text style={[styles.helperText, { color: colors.icon }]}>
                                            As the highest authority in this escalation chain, you can permanently reject this grievance.
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setRejectReason('');
                                        setSelectedRejectTemplate('custom');
                                        setRejectModalVisible(true);
                                    }}
                                    disabled={rejecting}
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                        gap: 8, paddingVertical: 14, borderRadius: 12,
                                        backgroundColor: '#EF444410', borderWidth: 1.5, borderColor: '#EF444440',
                                    }}
                                >
                                    <XCircle size={16} color="#EF4444" />
                                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>
                                        {rejecting ? 'Processing...' : 'Reject This Grievance'}
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        </Animated.View>
                    );
                })()}

                {/* --- Staff Proof Images (Only for Resolved) --- */}
                {grievance.status === 'Resolved' && (
                    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                        <GlassCard style={styles.section}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Resolution Proof</Text>
                                <AnimatedPressable
                                    onPress={handleStaffImageUpload}
                                    style={[styles.uploadButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? (
                                        <View style={styles.statusDot} /> // Placeholder for spinner if needed, or just standard dot
                                    ) : (
                                        <Camera size={16} color={colors.primary} />
                                    )}
                                    <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                                        {uploadingImage ? 'Uploading...' : 'Add Image'}
                                    </Text>
                                </AnimatedPressable>
                            </View>

                            <Text style={[styles.helperText, { color: colors.icon }]}>
                                Upload images as proof of resolution. These will be auto-deleted after 72 hours.
                            </Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proofScroll} contentContainerStyle={styles.proofContainer}>
                                {(!grievance.image_paths || grievance.image_paths.length === 0) && !uploadingImage && (
                                    <View style={[styles.emptyProof, { borderColor: colors.border, borderStyle: 'dashed' }]}>
                                        <Upload size={24} color={colors.icon} />
                                        <Text style={[styles.emptyProofText, { color: colors.icon }]}>No images uploaded</Text>
                                    </View>
                                )}

                                {(grievance.image_paths || []).map((path: string, index: number) => (
                                    <View key={index} style={styles.proofItem}>
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => handleOpenStaffImage(path)}
                                            style={StyleSheet.absoluteFill}
                                        >
                                            <Image
                                                source={{ uri: `https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}` }}
                                                style={styles.proofImage}
                                                contentFit="cover"
                                                transition={500}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteProofButton}
                                            onPress={() => handleDeleteStaffImage(path)}
                                        >
                                            <Trash2 size={14} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {uploadingImage && (
                                    <View style={styles.proofItem}>
                                        <Skeleton width={120} height={120} borderRadius={16} />
                                    </View>
                                )}
                            </ScrollView>
                        </GlassCard>
                    </Animated.View>
                )}

                {/* --- Timeline --- */}
                {/* --- Timeline Section --- */}
                <Animated.View entering={FadeInDown.duration(400).delay(150)}>
                    <GlassCard style={styles.section}>
                        <View style={styles.row}>
                            <Clock size={18} color={colors.primary} style={{ marginRight: 10 }} />
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Grievance Timeline</Text>
                        </View>

                        <View style={{ marginTop: 24 }}>
                            {fetchingDetails && timeline.length === 0 ? (
                                // Granular skeleton for timeline
                                [1, 2, 3].map(i => (
                                    <View key={i} style={[styles.timelineItem, { paddingBottom: 24 }]}>
                                        <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 16 }} />
                                        <View style={{ flex: 1 }}>
                                            <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                                            <Skeleton width="80%" height={12} />
                                        </View>
                                    </View>
                                ))
                            ) : (
                                timeline.map((event, index) => {
                                    const { icon, color } = getTimelineStyle(event.status);
                                    const isLatest = index === 0;
                                    return (
                                        <View key={event.id} style={styles.timelineItem}>
                                            <View style={styles.timelineIndicator}>
                                                <View style={[
                                                    styles.timelineIconContainer,
                                                    { backgroundColor: colors.card, borderColor: color + '30' },
                                                    isLatest && { borderStyle: 'solid', borderColor: color }
                                                ]}>
                                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: color + '10', borderRadius: 14 }]} />
                                                    {icon}
                                                </View>
                                                {index < timeline.length - 1 && (
                                                    <Animated.View style={[styles.timelineLine, { backgroundColor: colors.border }, timelineLineStyle]} />
                                                )}
                                            </View>
                                            <Animated.View
                                                entering={FadeInDown.delay(index * 100)}
                                                style={[
                                                    styles.timelineContent,
                                                    { backgroundColor: colors.card, borderColor: colors.border },
                                                    isLatest && { backgroundColor: color + '05', borderColor: color + '20' }
                                                ]}
                                            >
                                                <View style={styles.rowBetween}>
                                                    <View style={styles.row}>
                                                        <Text style={[styles.timelineTitle, { color: isLatest ? color : colors.text }]}>{event.status}</Text>
                                                        {isLatest && (
                                                            <View style={[styles.latestBadge, { backgroundColor: color }]}>
                                                                <Text style={[styles.latestText, { color: '#FFF' }]}>LATEST</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={[styles.timelineDate, { color: colors.icon }]}>
                                                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.timelineDesc, { color: colors.icon }]}>
                                                    {event.description || `Status updated to ${event.status}`}
                                                </Text>
                                            </Animated.View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </GlassCard>
                </Animated.View>
            </ScrollView>

            {/* --- Status Modal --- */}
            <Modal
                visible={statusModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setStatusModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.card,
                                paddingBottom: Math.max(insets.bottom, 36) // Dynamic padding for button vs gesture nav
                            }
                        ]}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalIndicator} />
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Update Status</Text>
                                <Text style={{ color: colors.icon, fontSize: 13, marginTop: 4 }}>Select the current progress of this grievance</Text>
                            </View>

                            <View style={{ gap: 10, marginTop: 10 }}>
                                {['Submitted', 'In-progress', 'Resolved'].map((s) => {
                                    if (s === 'Submitted' && grievance.status.toLowerCase() !== 'submitted') return null;
                                    if (s === 'In-progress' && grievance.status.toLowerCase() === 'resolved') return null;

                                    const { icon, color } = getTimelineStyle(s);
                                    const isSelected = grievance.status === s;

                                    return (
                                        <AnimatedPressable
                                            key={s}
                                            style={[
                                                styles.modalOption,
                                                { backgroundColor: colors.background, borderColor: colors.border },
                                                isSelected && { borderColor: color, backgroundColor: color + '08' }
                                            ]}
                                            onPress={() => handleStatusUpdate(s)}
                                        >
                                            <View style={styles.row}>
                                                <View style={[styles.optionIcon, { backgroundColor: color + '15', width: 44, height: 44, borderRadius: 14 }]}>
                                                    {React.cloneElement(icon as React.ReactElement<any>, { size: 20, color: color })}
                                                </View>
                                                <View style={{ marginLeft: 14 }}>
                                                    <Text style={[styles.optionTitle, { color: isSelected ? color : colors.text, marginBottom: 0 }]}>{s}</Text>
                                                    <Text style={{ color: colors.icon, fontSize: 12 }}>{s === 'Resolved' ? 'Issue is fully addressed' : s === 'In-progress' ? 'Currently working on it' : 'New submission'}</Text>
                                                </View>
                                            </View>
                                            {isSelected && (
                                                <Check size={20} color={color} />
                                            )}
                                        </AnimatedPressable>
                                    );
                                })}
                            </View>

                            <AnimatedPressable
                                style={[styles.closeButton, { backgroundColor: colors.border + '30', marginTop: 16 }]}
                                onPress={() => setStatusModalVisible(false)}
                            >
                                <Text style={[styles.closeButtonText, { color: colors.text }]}>Dismiss</Text>
                            </AnimatedPressable>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* --- Attachment Preview Modal --- */}
            <Modal
                visible={attachmentModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAttachmentModalVisible(false)}
            >
                <View style={styles.fullPreviewOverlay}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity
                        style={styles.closePreviewButton}
                        onPress={() => setAttachmentModalVisible(false)}
                    >
                        <ChevronDown size={32} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.previewContent}>
                        {previewImageUrl ? (
                            <Image
                                source={{ uri: previewImageUrl }}
                                style={styles.fullImage}
                                contentFit="contain"
                                transition={1000}
                                cachePolicy="disk"
                            />
                        ) : (
                            <Skeleton width={width * 0.9} height={height * 0.6} borderRadius={20} />
                        )}
                    </View>

                    <View style={styles.previewFooter}>
                        <Text style={styles.previewTitle}>{grievance?.title || 'Attachment'}</Text>
                        <Text style={styles.previewSubtitle}>Evidence for this grievance</Text>
                    </View>
                </View>
            </Modal>

            {/* --- Upload Options Modal --- */}
            <Modal
                visible={uploadModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setUploadModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setUploadModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={FadeInDown.duration(300)}
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: colors.card,
                                    paddingBottom: Math.max(insets.bottom, 36)
                                }
                            ]}
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.modalIndicator} />
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Upload Proof</Text>
                                <Text style={[styles.helperText, { color: colors.icon, textAlign: 'center', marginBottom: 20 }]}>
                                    Choose how you want to add the image
                                </Text>
                            </View>

                            <AnimatedPressable
                                style={[styles.modalOption, { backgroundColor: colors.background, borderColor: colors.border, marginBottom: 12 }]}
                                onPress={() => {
                                    setUploadModalVisible(false);
                                    handleCameraLaunch();
                                }}
                            >
                                <View style={styles.row}>
                                    <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                                        <Camera size={24} color={colors.primary} />
                                    </View>
                                    <View style={{ marginLeft: 16 }}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>Take Photo</Text>
                                        <Text style={[styles.optionSubtitle, { color: colors.icon }]}>Use camera to capture proof</Text>
                                    </View>
                                </View>
                            </AnimatedPressable>

                            <AnimatedPressable
                                style={[styles.modalOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => {
                                    setUploadModalVisible(false);
                                    handleGalleryLaunch();
                                }}
                            >
                                <View style={styles.row}>
                                    <View style={[styles.optionIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                                        <ImageIcon size={24} color="#8B5CF6" />
                                    </View>
                                    <View style={{ marginLeft: 16 }}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>Choose from Gallery</Text>
                                        <Text style={[styles.optionSubtitle, { color: colors.icon }]}>Select existing photo</Text>
                                    </View>
                                </View>
                            </AnimatedPressable>

                            <AnimatedPressable
                                style={[styles.closeButton, { backgroundColor: colors.border + '50', marginTop: 24 }]}
                                onPress={() => setUploadModalVisible(false)}
                            >
                                <Text style={[styles.closeButtonText, { color: colors.text }]}>Cancel</Text>
                            </AnimatedPressable>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* --- Delete Confirmation Modal --- */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDeleteModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={FadeInDown.duration(300)}
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: colors.card,
                                    paddingBottom: Math.max(insets.bottom, 36)
                                }
                            ]}
                        >
                            <View style={[styles.modalHeader, { marginBottom: 0 }]}>
                                <View style={[styles.deleteIconContainer, { backgroundColor: '#EF4444' + '20' }]}>
                                    <Trash2 size={32} color="#EF4444" />
                                </View>
                                <Text style={[styles.modalTitle, { color: colors.text, marginTop: 16 }]}>Delete Image?</Text>
                                <Text style={[styles.helperText, { color: colors.icon, textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>
                                    This action cannot be undone. Are you sure you want to delete this proof image?
                                </Text>
                            </View>

                            <View style={styles.rowBetween}>
                                <AnimatedPressable
                                    style={[styles.actionButton, { backgroundColor: colors.border + '50', flex: 1, marginRight: 8 }]}
                                    onPress={() => setDeleteModalVisible(false)}
                                >
                                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
                                </AnimatedPressable>

                                <AnimatedPressable
                                    style={[styles.actionButton, { backgroundColor: '#EF4444', flex: 1, marginLeft: 8 }]}
                                    onPress={confirmDeleteImage}
                                >
                                    <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Delete</Text>
                                </AnimatedPressable>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* --- Manual Escalation Confirmation Modal --- */}
            <Modal
                visible={escalateModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEscalateModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setEscalateModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={FadeInDown.duration(300)}
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: colors.card,
                                    paddingBottom: Math.max(insets.bottom, 36)
                                }
                            ]}
                        >
                            <View style={[styles.modalHeader, { marginBottom: 0 }]}>
                                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20', width: 64, height: 64, borderRadius: 32 }]}>
                                    <Layers size={32} color={colors.primary} />
                                </View>
                                <Text style={[styles.modalTitle, { color: colors.text, marginTop: 16 }]}>Confirm Escalation?</Text>
                                <Text style={[styles.helperText, { color: colors.icon, textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>
                                    Are you sure you want to escalate this to Level {(grievance?.current_step || 1) + 1}? It will be assigned to a higher authority immediately.
                                </Text>
                            </View>

                            <View style={styles.rowBetween}>
                                <AnimatedPressable
                                    style={[styles.actionButton, { backgroundColor: colors.border + '50', flex: 1, marginRight: 8 }]}
                                    onPress={() => setEscalateModalVisible(false)}
                                >
                                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Back</Text>
                                </AnimatedPressable>

                                <AnimatedPressable
                                    style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1, marginLeft: 8 }]}
                                    onPress={confirmManualEscalation}
                                >
                                    <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Escalate</Text>
                                </AnimatedPressable>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* --- Reject Grievance Modal (Last Authority Only) --- */}
            <Modal
                visible={rejectModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => !rejecting && setRejectModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => !rejecting && setRejectModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={FadeInDown.duration(350)}
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: colors.card,
                                    maxHeight: '90%',
                                    paddingBottom: Math.max(insets.bottom, 24)
                                }
                            ]}
                        >
                            <View style={styles.modalIndicator} />
                            {/* Red header */}
                            <View style={{ backgroundColor: '#EF4444', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, alignItems: 'center' }}>
                                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                    <XCircle size={28} color="#FFF" />
                                </View>
                                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Reject Grievance</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 }}>This action is irreversible</Text>
                            </View>

                            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                                {/* Template selection */}
                                <Text style={[styles.detailLabel, { marginBottom: 10 }]}>SELECT REJECTION REASON</Text>
                                {REJECTION_TEMPLATES.map(tmpl => (
                                    <TouchableOpacity
                                        key={tmpl.id}
                                        onPress={() => {
                                            setSelectedRejectTemplate(tmpl.id);
                                            if (tmpl.id !== 'custom') setRejectReason(tmpl.reason);
                                            else setRejectReason('');
                                        }}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center',
                                            padding: 12, borderRadius: 12, marginBottom: 8,
                                            borderWidth: 1.5,
                                            borderColor: selectedRejectTemplate === tmpl.id ? '#EF4444' : colors.border,
                                            backgroundColor: selectedRejectTemplate === tmpl.id ? '#EF444410' : colors.background,
                                        }}
                                    >
                                        <View style={{
                                            width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                                            borderColor: selectedRejectTemplate === tmpl.id ? '#EF4444' : colors.icon,
                                            backgroundColor: selectedRejectTemplate === tmpl.id ? '#EF4444' : 'transparent',
                                            marginRight: 12, alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {selectedRejectTemplate === tmpl.id && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: selectedRejectTemplate === tmpl.id ? '#EF4444' : colors.text }}>
                                                {tmpl.label}
                                            </Text>
                                            {tmpl.id === 'custom' && (
                                                <Text style={{ fontSize: 11, color: colors.icon }}>Write your own reason below</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}

                                {/* Reason textarea */}
                                <Text style={[styles.detailLabel, { marginTop: 16, marginBottom: 8 }]}>JUSTIFICATION *</Text>
                                <TextInput
                                    value={rejectReason}
                                    onChangeText={text => { if (text.length <= 500) setRejectReason(text); }}
                                    placeholder="Provide a specific reason for rejection (min 10 words)..."
                                    placeholderTextColor={colors.icon}
                                    multiline
                                    numberOfLines={4}
                                    style={{
                                        borderWidth: 1.5,
                                        borderColor: colors.border,
                                        borderRadius: 12,
                                        padding: 14,
                                        fontSize: 14,
                                        color: colors.text,
                                        backgroundColor: colors.background,
                                        minHeight: 100,
                                        textAlignVertical: 'top',
                                        marginBottom: 6,
                                    }}
                                />
                                {/* Word count feedback */}
                                {(() => {
                                    const wc = rejectReason.trim().split(/\s+/).filter(w => w.length > 0).length;
                                    return (
                                        <Text style={{ fontSize: 12, color: wc >= 10 ? '#10B981' : colors.icon, marginBottom: 4 }}>
                                            {wc >= 10 ? `✓ Valid (${wc} words)` : wc > 0 ? `${10 - wc} more words needed` : 'Minimum 10 words required'}
                                            {'  '}{rejectReason.length}/500
                                        </Text>
                                    );
                                })()}
                                <View style={{ height: 20 }} />
                            </ScrollView>

                            {/* Footer buttons */}
                            <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { flex: 1, backgroundColor: colors.border + '50' }]}
                                    onPress={() => setRejectModalVisible(false)}
                                    disabled={rejecting}
                                >
                                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { flex: 1, backgroundColor: '#EF4444', opacity: rejecting ? 0.6 : 1 }]}
                                    onPress={handleRejectGrievance}
                                    disabled={rejecting}
                                >
                                    <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                                        {rejecting ? 'Processing...' : 'Confirm Rejection'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <StatusModal
                visible={feedbackVisible}
                type={feedbackType}
                title={feedbackTitle}
                message={feedbackMessage}
                onClose={() => setFeedbackVisible(false)}
            />
        </View>
    );
}

