import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Reanimated, { FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { GrievanceItem, getCachedGrievanceDetail, loadSingleGrievance, reopenGrievance } from '../dataStorage';
import { rf } from '../utils/responsive';

const { width } = Dimensions.get('window');

// --- Standard Appalachian Header (One-Line, No Back Button) ---
const GlassHeader: React.FC = () => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <Text style={styles.headerWelcome}>Grievance Details</Text>
            </View>
        </View>
    );
};

export default function GrievanceDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const grievanceId = params.id as string;

    const [grievance, setGrievance] = useState<GrievanceItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [reopenModalVisible, setReopenModalVisible] = useState(false);
    const [pickerModalVisible, setPickerModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [reopenImages, setReopenImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadGrievanceDetail();
    }, [grievanceId]);

    const loadGrievanceDetail = async () => {
        try {
            setLoading(true);

            // Try cache first
            const cached = await getCachedGrievanceDetail(grievanceId);
            if (cached) {
                setGrievance(cached);
                setLoading(false);
            }

            // Load fresh data
            const data = await loadSingleGrievance(grievanceId);
            if (data) {
                setGrievance(data);
            }
        } catch (error) {
            console.error('Error loading grievance:', error);
        } finally {
            setLoading(false);
        }
    };



    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('submitted')) return '#3B82F6'; // Blue
        if (s.includes('progress') || s.includes('review')) return '#F59E0B'; // Amber
        if (s.includes('resolved') || s.includes('completed')) return '#10B981'; // Green
        if (s.includes('rejected') || s.includes('declined')) return '#EF4444'; // Red
        if (s.includes('unresponsive')) return '#8B5CF6'; // Purple
        if (s.includes('reopened')) return '#D946EF'; // Fuchsia
        if (s.includes('closed')) return '#64748B'; // Slate
        return '#64748B'; // Dflt
    };

    const handlePickImage = async () => {
        setPickerModalVisible(true);
    };

    const handleLibraryPick = async () => {
        setPickerModalVisible(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const uris = result.assets.map(asset => asset.uri);
            setReopenImages([...reopenImages, ...uris]);
        }
    };

    const handleCameraCapture = async () => {
        setPickerModalVisible(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need camera access to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled) {
            setReopenImages([...reopenImages, result.assets[0].uri]);
        }
    };

    const handleRemoveImage = (index: number) => {
        const updated = [...reopenImages];
        updated.splice(index, 1);
        setReopenImages(updated);
    };

    const isReopenAvailable = () => {
        if (!grievance || grievance.status !== 'Resolved') return false;
        if (!grievance.resolved_at) return true; // Fallback for old records without timestamp

        const resolvedDate = new Date(grievance.resolved_at);
        const now = new Date();
        const diffInHours = (now.getTime() - resolvedDate.getTime()) / (1000 * 60 * 60);

        return diffInHours <= 48;
    };

    const handleReopenSubmit = async () => {
        if (!reopenReason.trim()) {
            Alert.alert('Reason Required', 'Please provide a reason for reopening this grievance.');
            return;
        }

        if (reopenImages.length === 0) {
            Alert.alert('Proof Required', 'You must upload at least one image as proof that the issue is not resolved.');
            return;
        }

        try {
            setSubmitting(true);
            await reopenGrievance(grievanceId, reopenReason, reopenImages);
            setReopenModalVisible(false);
            setSuccessModalVisible(true);
            setReopenReason('');
            setReopenImages([]);
            loadGrievanceDetail();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to reopen grievance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <LinearGradient
                    colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
                    style={StyleSheet.absoluteFill}
                />

                <GlassHeader />

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    {/* Skeleton Status Badge */}
                    <Reanimated.View entering={FadeInUp.delay(100)} style={styles.statusBadgeContainer}>
                        <View style={[styles.skeletonBadge, styles.shimmer]} />
                    </Reanimated.View>

                    {/* Skeleton Title */}
                    <Reanimated.View entering={FadeInUp.delay(200)}>
                        <View style={[styles.skeletonTitle, styles.shimmer]} />
                        <View style={[styles.skeletonDate, styles.shimmer]} />
                    </Reanimated.View>

                    {/* Skeleton Location Bar */}
                    <Reanimated.View entering={FadeInUp.delay(300)} style={styles.skeletonBarContainer}>
                        <View style={[styles.skeletonBar, styles.shimmer]} />
                    </Reanimated.View>

                    {/* Skeleton Description */}
                    <Reanimated.View entering={FadeInUp.delay(400)} style={styles.section}>
                        <View style={[styles.skeletonSectionTitle, styles.shimmer]} />
                        <View style={[styles.descriptionCard, styles.shimmer]}>
                            <View style={[styles.skeletonLine, styles.shimmer]} />
                            <View style={[styles.skeletonLine, styles.shimmer, { width: '90%' }]} />
                            <View style={[styles.skeletonLine, styles.shimmer, { width: '70%' }]} />
                        </View>
                    </Reanimated.View>

                    {/* Skeleton Timeline */}
                    <Reanimated.View entering={FadeInUp.delay(500)} style={styles.section}>
                        <View style={[styles.skeletonSectionTitle, styles.shimmer]} />
                        <View style={styles.timelineContainer}>
                            {[1, 2, 3].map((_, index) => (
                                <View key={index} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, styles.shimmer]} />
                                        {index < 2 && <View style={[styles.timelineLine, styles.shimmer]} />}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <View style={[styles.skeletonTimelineStatus, styles.shimmer]} />
                                        <View style={[styles.skeletonTimelineDesc, styles.shimmer]} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Reanimated.View>

                    {/* Loading Text */}
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text style={styles.loadingText}>Loading details...</Text>
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (!grievance) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <LinearGradient
                    colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
                    style={StyleSheet.absoluteFill}
                />
                <Feather name="alert-circle" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Grievance not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Main Background Gradient (Matched to App) */}
            <LinearGradient
                colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <GlassHeader />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <Reanimated.View entering={FadeInUp.delay(100)} style={styles.statusBadgeContainer}>
                    <View style={styles.glassStatusBadgeWrapper}>
                        <BlurView intensity={60} tint="light" style={styles.statusBadgeGlass}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(grievance.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(grievance.status) }]}>
                                {grievance.status}
                            </Text>
                        </BlurView>
                    </View>
                </Reanimated.View>

                {/* Title and Date */}
                <Reanimated.View entering={FadeInUp.delay(200)} style={styles.mainTitleContainer}>
                    <Text style={styles.title}>{grievance.title}</Text>
                    <View style={styles.dateBadge}>
                        <Feather name="calendar" size={14} color="#64748B" />
                        <Text style={styles.date}>{grievance.date}</Text>
                    </View>
                </Reanimated.View>

                {/* Compact Location Bar */}
                {grievance.hostel && (
                    <Reanimated.View entering={FadeInUp.delay(300)} style={styles.hostelBarContainer}>
                        <BlurView intensity={40} tint="light" style={styles.hostelBar}>
                            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                                <Feather name="home" size={14} color="#10B981" />
                            </View>
                            <Text style={styles.hostelLabel}>Location:</Text>
                            <Text style={styles.hostelValue}>{grievance.hostel}</Text>
                        </BlurView>
                    </Reanimated.View>
                )}

                {/* Description */}
                <Reanimated.View entering={FadeInUp.delay(400)} style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Feather name="file-text" size={18} color="#0EA5E9" style={{ marginRight: 8 }} /> Description
                    </Text>
                    <BlurView intensity={60} tint="light" style={styles.descriptionCard}>
                        <Text style={styles.description}>{grievance.description}</Text>
                    </BlurView>
                </Reanimated.View>

                {/* Attachments Section */}
                {grievance.image_paths && grievance.image_paths.length > 0 && (
                    <Reanimated.View entering={FadeInUp.delay(450)} style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            <Feather name="paperclip" size={18} color="#0EA5E9" style={{ marginRight: 8 }} /> Attachments
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentList}>
                            {grievance.image_paths.map((path, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.attachmentWrapper}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedImage(`https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}`)}
                                >
                                    <BlurView intensity={20} tint="light" style={styles.attachmentGlass}>
                                        <Image
                                            source={{ uri: `https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}` }}
                                            style={styles.attachmentImage}
                                            contentFit="cover"
                                            transition={500}
                                        />
                                    </BlurView>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Reanimated.View>
                )}

                {/* Staff Attachments Section (Visible only when Resolved/Closed) */}
                {grievance.staff_image_paths && grievance.staff_image_paths.length > 0 &&
                    (grievance.status === 'Resolved' || grievance.status === 'Closed') && (
                        <Reanimated.View entering={FadeInUp.delay(480)} style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>
                                    <Feather name="image" size={18} color="#10B981" style={{ marginRight: 8 }} /> Resolution Evidence
                                </Text>
                                <View style={styles.tempBadge}>
                                    <Feather name="clock" size={10} color="#B45309" />
                                    <Text style={styles.tempBadgeText}>Expiring in 72h</Text>
                                </View>
                            </View>

                            <View style={styles.warningContainer}>
                                <Text style={styles.warningText}>
                                    Staff uploaded images are temporary and will be automatically deleted after 72 hours to save space.
                                </Text>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentList}>
                                {grievance.staff_image_paths.map((path, index) => (
                                    <TouchableOpacity
                                        key={`staff-${index}`}
                                        style={[styles.attachmentWrapper, { shadowColor: '#10B981' }]}
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedImage(`https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}`)}
                                    >
                                        <BlurView intensity={20} tint="light" style={styles.attachmentGlass}>
                                            <Image
                                                source={{ uri: `https://rfgvinaslrmofqkeixxu.supabase.co/storage/v1/object/public/grievances/${path}` }}
                                                style={styles.attachmentImage}
                                                contentFit="cover"
                                                transition={500}
                                                // Handle error if image is deleted
                                                onError={() => console.log('Image load failed - possibly deleted')}
                                            />
                                            <View style={styles.staffTag}>
                                                <Text style={styles.staffTagText}>STAFF</Text>
                                            </View>
                                        </BlurView>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </Reanimated.View>
                    )}

                {/* Timeline - FLIPKART STYLE! */}
                {grievance.timeline && grievance.timeline.length > 0 && (
                    <Reanimated.View entering={FadeInUp.delay(500)} style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            <Feather name="activity" size={18} color="#0EA5E9" style={{ marginRight: 8 }} /> Timeline Tracker
                        </Text>

                        <BlurView intensity={80} tint="light" style={styles.timelineContainer}>
                            {grievance.timeline.map((entry, index) => (
                                <View key={index} style={styles.timelineItem}>
                                    {/* Timeline Connector */}
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineDot,
                                            {
                                                backgroundColor: entry.completed ? getStatusColor(entry.status) : '#F1F5F9',
                                                borderColor: entry.completed ? getStatusColor(entry.status) : '#E2E8F0',
                                                shadowColor: entry.completed ? getStatusColor(entry.status) : '#000',
                                                shadowOpacity: entry.completed ? 0.4 : 0.05,
                                            }
                                        ]}>
                                            {entry.completed ? (
                                                <Feather name="check" size={14} color="#FFFFFF" />
                                            ) : (
                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' }} />
                                            )}
                                        </View>
                                        {index < grievance.timeline!.length - 1 && (
                                            <View style={styles.timelineLine} />
                                        )}
                                    </View>

                                    {/* Timeline Content */}
                                    <View style={styles.timelineRight}>
                                        <Text style={[
                                            styles.timelineStatus,
                                            { color: entry.completed ? getStatusColor(entry.status) : '#64748B' }
                                        ]}>
                                            {entry.status}
                                        </Text>
                                        {entry.description && (
                                            <Text style={styles.timelineDescription}>{entry.description}</Text>
                                        )}
                                        <View style={styles.timelineTimeContainer}>
                                            <Feather name="clock" size={10} color="#94A3B8" style={{ marginRight: 4 }} />
                                            <Text style={styles.timelineTime}>
                                                {entry.date} • {entry.time}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </BlurView>
                    </Reanimated.View>
                )}

                {/* Reopen Action Button (Only if Resolved & within 48h) */}
                {isReopenAvailable() && (
                    <Reanimated.View entering={FadeInUp.delay(600)} style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.reopenButton}
                            activeOpacity={0.8}
                            onPress={() => setReopenModalVisible(true)}
                        >
                            <LinearGradient
                                colors={['#F43F5E', '#E11D48']}
                                style={styles.reopenButtonGradient}
                            >
                                <Feather name="refresh-cw" size={20} color="white" />
                                <Text style={styles.reopenButtonText}>Reopen Grievance</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={styles.reopenNote}>
                            Challenge the resolution if the issue persists. Mandatory proof required.
                        </Text>
                    </Reanimated.View>
                )}

                {/* Bottom Spacing */}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Reopen Modal */}
            <Modal
                visible={reopenModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => !submitting && setReopenModalVisible(false)}
            >
                <View style={styles.reopenModalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Reanimated.View
                        entering={FadeInUp.duration(400)}
                        style={styles.reopenModalContent}
                    >
                        <LinearGradient
                            colors={['#FFFFFF', '#F8FAFC']}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.reopenModalHeader}>
                            <View>
                                <Text style={styles.reopenModalTitle}>Reopen Case</Text>
                                <Text style={styles.reopenModalSubtitle}>Challenge the resolution</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setReopenModalVisible(false)}
                                disabled={submitting}
                            >
                                <Feather name="x" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>Challenge Reason</Text>
                                <View style={styles.textAreaContainer}>
                                    <TextInput
                                        style={styles.premiumTextArea}
                                        placeholder="Explain precisely why the issue persists..."
                                        multiline
                                        numberOfLines={4}
                                        value={reopenReason}
                                        onChangeText={setReopenReason}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.inputLabel}>Visual Evidence</Text>
                                    <Text style={styles.requiredTag}>MANDATORY</Text>
                                </View>
                                <Text style={styles.inputSubLabel}>Photos confirming the unresolved state.</Text>

                                <View style={styles.reopenImageGrid}>
                                    {reopenImages.map((uri, index) => (
                                        <Reanimated.View
                                            key={index}
                                            entering={FadeInUp.delay(index * 50)}
                                            style={styles.reopenImageWrapper}
                                        >
                                            <Image source={{ uri }} style={styles.reopenImage} />
                                            <TouchableOpacity
                                                style={styles.removeImageButton}
                                                onPress={() => handleRemoveImage(index)}
                                            >
                                                <Feather name="trash-2" size={12} color="white" />
                                            </TouchableOpacity>
                                        </Reanimated.View>
                                    ))}

                                    {reopenImages.length < 5 && (
                                        <TouchableOpacity
                                            style={styles.addImagePremiumButton}
                                            onPress={handlePickImage}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={['#F0F9FF', '#E0F2FE']}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <View style={styles.plusCircle}>
                                                <Feather name="plus" size={24} color="#0EA5E9" />
                                            </View>
                                            <Text style={styles.addImagePremiumText}>Add Proof</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.premiumSubmitButton, (submitting || !reopenReason.trim() || reopenImages.length === 0) && styles.disabledButton]}
                                onPress={handleReopenSubmit}
                                disabled={submitting}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={submitting || !reopenReason.trim() || reopenImages.length === 0 ? ['#94A3B8', '#64748B'] : ['#0F172A', '#1E293B']}
                                    style={styles.submitGradient}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitButtonText}>Submit Challenge</Text>
                                            <Feather name="arrow-right" size={18} color="white" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.securityNote}>
                                <Feather name="shield" size={10} color="#64748B" /> Sensitive data is encrypted.
                            </Text>
                        </ScrollView>
                    </Reanimated.View>
                </View>
            </Modal>

            {/* Full Screen Image Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    <StatusBar hidden />
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setSelectedImage(null)}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <BlurView intensity={40} tint="dark" style={styles.closeButtonBlur}>
                            <Feather name="x" size={24} color="white" />
                        </BlurView>
                    </TouchableOpacity>

                    {selectedImage && (
                        <View style={styles.fullImageContainer}>
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullImage}
                                contentFit="contain"
                                transition={300}
                            />
                        </View>
                    )}
                </View>
            </Modal>

            {/* Custom Image Picker Modal */}
            <Modal
                visible={pickerModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPickerModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setPickerModalVisible(false)}
                >
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Reanimated.View
                        entering={FadeInUp.duration(300)}
                        style={styles.pickerContent}
                    >
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Verification Evidence</Text>
                            <Text style={styles.pickerSubtitle}>How would you like to add proof?</Text>
                        </View>

                        <View style={styles.pickerGrid}>
                            <TouchableOpacity
                                style={[styles.pickerOption, { backgroundColor: '#F0FDF4' }]}
                                onPress={handleCameraCapture}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.pickerIconBg, { backgroundColor: '#DCFCE7' }]}>
                                    <Feather name="camera" size={24} color="#16A34A" />
                                </View>
                                <Text style={[styles.pickerOptionText, { color: '#16A34A' }]}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pickerOption, { backgroundColor: '#EFF6FF' }]}
                                onPress={handleLibraryPick}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.pickerIconBg, { backgroundColor: '#DBEAFE' }]}>
                                    <Feather name="image" size={24} color="#2563EB" />
                                </View>
                                <Text style={[styles.pickerOptionText, { color: '#2563EB' }]}>Gallery</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.pickerCancelButton}
                            onPress={() => setPickerModalVisible(false)}
                        >
                            <Text style={styles.pickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </Reanimated.View>
                </TouchableOpacity>
            </Modal>

            {/* Premium Success Modal */}
            <Modal
                visible={successModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSuccessModalVisible(false)}
            >
                <View style={styles.successOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <Reanimated.View
                        entering={FadeInUp.duration(500)}
                        style={styles.successContent}
                    >
                        <View style={styles.successIconContainer}>
                            <Reanimated.View
                                entering={ZoomIn.delay(300).duration(400)}
                                style={styles.successIconBg}
                            >
                                <Feather name="check" size={40} color="white" />
                            </Reanimated.View>
                        </View>

                        <Text style={styles.successTitle}>Submitted Successfully!</Text>
                        <Text style={styles.successSubtitle}>
                            Your challenge has been recorded. Admin will review the evidence and reassign the staff shortly.
                        </Text>

                        <TouchableOpacity
                            style={styles.successDoneButton}
                            onPress={() => setSuccessModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.successDoneGradient}
                            >
                                <Text style={styles.successDoneText}>Back to Grievance</Text>
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
        backgroundColor: '#F0F9FF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: rf(14),
        color: '#64748B',
    },
    errorText: {
        marginTop: 16,
        fontSize: rf(18),
        fontWeight: '600',
        color: '#1E293B',
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#0EA5E9',
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: rf(16),
        fontWeight: '600',
    },

    // Header Styles (Standard Appalachian Style)
    headerContainer: {
        paddingTop: (StatusBar.currentHeight || 20) + 5,
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerWelcome: {
        fontSize: rf(26),
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },

    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
    },
    statusBadgeContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    glassStatusBadgeWrapper: {
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.7)',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    statusBadgeGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: rf(12),
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mainTitleContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: rf(24),
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(14,165,233,0.1)',
    },
    date: {
        fontSize: rf(13),
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 30,
    },
    infoCard: {
        flex: 1,
        minWidth: (width - 60) / 2,
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    hostelBarContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    hostelBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    hostelLabel: {
        fontSize: rf(12),
        color: '#64748B',
        fontWeight: '600',
        marginRight: 6,
    },
    hostelValue: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#1E293B',
    },
    skeletonBarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    skeletonBar: {
        width: '60%',
        height: 44,
        borderRadius: 22,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: rf(17),
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    descriptionCard: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden',
    },
    description: {
        fontSize: rf(15),
        lineHeight: 24,
        color: '#475569',
        fontWeight: '400',
    },
    timelineContainer: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden',
    },
    timelineItem: {
        flexDirection: 'row',
        paddingBottom: 24,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
    },
    timelineDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        zIndex: 1,
    },
    timelineLine: {
        position: 'absolute',
        top: 30,
        bottom: -24,
        width: 1.5,
        backgroundColor: '#E2E8F0',
        borderRadius: 1,
    },
    timelineRight: {
        flex: 1,
        paddingTop: 4,
    },
    timelineStatus: {
        fontSize: rf(16),
        fontWeight: '800',
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    timelineDescription: {
        fontSize: rf(14),
        color: '#4B5563',
        marginBottom: 8,
        lineHeight: 20,
        fontWeight: '400',
    },
    timelineTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineTime: {
        fontSize: rf(12),
        color: '#9CA3AF',
        fontWeight: '600',
    },

    // Skeleton Loader Styles
    shimmer: {
        backgroundColor: '#E2E8F0',
        opacity: 0.6,
    },
    skeletonBadge: {
        width: 140,
        height: 40,
        borderRadius: 20,
        marginBottom: 16,
    },
    skeletonTitle: {
        width: '85%',
        height: 32,
        borderRadius: 10,
        marginBottom: 14,
        alignSelf: 'center',
    },
    skeletonDate: {
        width: 120,
        height: 20,
        borderRadius: 8,
        marginBottom: 24,
        alignSelf: 'center',
    },
    skeletonSectionTitle: {
        width: 160,
        height: 24,
        borderRadius: 8,
        marginBottom: 16,
    },
    skeletonLine: {
        width: '100%',
        height: 16,
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonTimelineStatus: {
        width: 140,
        height: 20,
        borderRadius: 8,
        marginBottom: 10,
    },
    skeletonTimelineDesc: {
        width: '95%',
        height: 40,
        borderRadius: 8,
    },
    // Attachment Styles
    attachmentList: {
        flexDirection: 'row',
        marginTop: 8,
    },
    attachmentWrapper: {
        marginRight: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    attachmentGlass: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 16,
    },
    attachmentImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
    },
    // Staff Section Styles
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tempBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    tempBadgeText: {
        fontSize: rf(10),
        color: '#B45309',
        fontWeight: '700',
        marginLeft: 4,
    },
    warningContainer: {
        backgroundColor: 'rgba(254, 243, 199, 0.6)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(252, 211, 77, 0.3)',
    },
    warningText: {
        fontSize: rf(12),
        color: '#92400E',
        lineHeight: 18,
    },
    staffTag: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    staffTagText: {
        fontSize: rf(8),
        color: 'white',
        fontWeight: '800',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 20,
    },
    closeButtonBlur: {
        padding: 10,
        borderRadius: 20,
        overflow: 'hidden',
    },
    fullImageContainer: {
        width: width,
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    // Reopen Flow Styles
    actionContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    reopenButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    reopenButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    reopenButtonText: {
        color: 'white',
        fontSize: rf(16),
        fontWeight: '700',
    },
    reopenNote: {
        marginTop: 12,
        fontSize: rf(12),
        color: '#64748B',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    reopenModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    reopenModalContent: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 30,
        paddingBottom: 40,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
        overflow: 'hidden',
    },
    reopenModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    reopenModalTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    reopenModalSubtitle: {
        fontSize: rf(13),
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    closeModalButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputSection: {
        marginBottom: 28,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: rf(16),
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    requiredTag: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#E11D48',
        backgroundColor: '#FFF1F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    inputSubLabel: {
        fontSize: rf(13),
        color: '#64748B',
        marginBottom: 16,
        lineHeight: 18,
    },
    textAreaContainer: {
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    premiumTextArea: {
        padding: 18,
        fontSize: rf(15),
        color: '#1E293B',
        textAlignVertical: 'top',
        minHeight: 120,
        fontWeight: '500',
    },
    reopenImageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    reopenImageWrapper: {
        width: (width - 100) / 3,
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    reopenImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(225, 29, 72, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'white',
    },
    addImagePremiumButton: {
        width: (width - 100) / 3,
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#0EA5E9',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    plusCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    addImagePremiumText: {
        fontSize: rf(11),
        color: '#0369A1',
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    premiumSubmitButton: {
        borderRadius: 20,
        height: 64,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    submitGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    submitButtonText: {
        color: 'white',
        fontSize: rf(17),
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    securityNote: {
        marginTop: 18,
        fontSize: rf(11),
        color: '#94A3B8',
        textAlign: 'center',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.8,
    },
    // Picker Styles
    pickerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 24,
    },
    pickerHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    pickerTitle: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    pickerSubtitle: {
        fontSize: rf(13),
        color: '#64748B',
    },
    pickerGrid: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        marginBottom: 10,
    },
    pickerOption: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    pickerIconBg: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerOptionText: {
        fontSize: rf(14),
        fontWeight: '800',
    },
    pickerCancelButton: {
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    pickerCancelText: {
        fontSize: rf(15),
        color: '#64748B',
        fontWeight: '700',
    },
    // Success Modal Styles
    successOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    successContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 36,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 24,
    },
    successIconContainer: {
        marginBottom: 24,
    },
    successIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    successTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: rf(14),
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    successDoneButton: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
    },
    successDoneGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successDoneText: {
        fontSize: rf(16),
        fontWeight: '800',
        color: 'white',
    },
});

