import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Reanimated, {
  Easing,
  SlideInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';



import { supabase } from '../../lib/supabase';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveGrievance } from '../../dataStorage';
import { useUser } from '../../UserContext';
import { rf, normalize } from '../../utils/responsive';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  is_active: boolean;
}

interface DynamicCategory extends Category {
  subcategories: string[];
}

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 414) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// --- Form Animated Wrapper (Deep Fix for Android Shadows) ---
const FormAnimatedWrapper: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(moderateScale(20));

  useEffect(() => {
    opacity.value = 0;
    translateY.value = moderateScale(20);

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Reanimated.View
      style={animatedStyle}
      renderToHardwareTextureAndroid={true}
      collapsable={false}
    >
      {children}
    </Reanimated.View>
  );
};

// --- Ambient Background Orbs ---
const AmbientOrb = ({ color, size, top, left, right, bottom, opacity = 0.15 }: any) => (
  <View style={{
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    top, left, right, bottom,
    opacity,
  }}>
    <BlurView intensity={120} tint="light" style={StyleSheet.absoluteFill} />
  </View>
);

// Define premium smooth easing - Quad is softer and more fluid than Cubic
const PREMIUM_EASING = Easing.out(Easing.quad);

// --- Glass Header (Clean Style with Sub-line) ---
const GlassHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerWelcome}>{title}</Text>
          <Text style={styles.headerSubtitleText}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

// === Categories Data ===
// Legacy hardcoded constant replaced by dynamic state
// const GRIEVANCE_CATEGORIES = grievanceCategories;

const HOSTEL_LIST = [
  'Boys Hostel 1',
  'Boys Hostel 2',
  'Boys Hostel 3',
  'Boys Hostel 4',
  'Boys Hostel 5',
  'Girls Hostel 1',
];

interface AttachmentItem {
  id: string;
  uri: string;
  type: 'image' | 'document';
  name: string;
  size?: number;
}


export default function SubmitGrievanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused(); // Moved up for effect dependency
  const { user } = useUser(); // OPTIMIZATION: Get user from context
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null); // State for Hostel Block
  // const isFocused = useIsFocused(); // Moved up
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isSubcategoryModalVisible, setSubcategoryModalVisible] = useState(false);
  const [isHostelModalVisible, setHostelModalVisible] = useState(false);
  const [isAttachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch Categories and Subcategories dynamically with Realtime support
  useFocusEffect(
    useCallback(() => {
      const fetchCategories = async () => {
        try {
          setLoadingCategories(true);
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name');

          if (catError) throw catError;

          const { data: subData, error: subError } = await supabase
            .from('subcategories')
            .select('*')
            .eq('is_active', true)
            .order('name');

          if (subError) throw subError;

          const merged: DynamicCategory[] = (catData as Category[]).map(cat => ({
            ...cat,
            subcategories: (subData as Subcategory[])
              .filter(sub => sub.category_id === cat.id)
              .map(sub => sub.name)
          }));

          setCategories(merged);
        } catch (err) {
          // Error fetching categories
        } finally {
          setLoadingCategories(false);
        }
      };

      fetchCategories();

      // Realtime subscription for instant updates
      const categoryChannel = supabase
        .channel('category-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          fetchCategories();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
          fetchCategories();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(categoryChannel);
      };
    }, [])
  );


  const resetForm = () => {
    setTitle('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedHostel(null);
    setDescription('');
    setAttachments([]);
  };

  // Cleanup when navigating away (e.g. to Track)
  useEffect(() => {
    if (!isFocused) {
      setSuccessModalVisible(false);
      // NOTE: Removed resetForm() to prevent data loss when switching tabs.
      // Form will only be reset upon successful submission.
    }
  }, [isFocused]);

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  const titleWords = title.trim().split(/\s+/).filter(w => w).length;
  const descriptionWords = description.trim().split(/\s+/).filter(w => w).length;

  const isFormValid =
    titleWords >= 3 &&
    selectedCategory &&
    (!currentCategory?.name?.toLowerCase().includes('hostel') || selectedHostel) &&
    selectedSubcategory &&
    descriptionWords >= 15;

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setSelectedHostel('');
    setCategoryModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectSubcategory = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setSubcategoryModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectHostel = (hostel: string) => {
    setSelectedHostel(hostel);
    setHostelModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss(); // Dismiss keyboard first for smooth layout

    if (!description.trim() || !selectedCategory || !title.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const grievanceData = {
        title,
        category: currentCategory?.name || selectedCategory,
        subcategory: selectedSubcategory || undefined,
        hostel: selectedHostel || undefined,
        description,
        attachments: attachments.map(a => a.uri),
        status: 'Pending',
        timestamp: new Date().toISOString(),
      };

      if (!user?.id) {
        Alert.alert('Error', 'Please log in to submit a grievance');
        return;
      }

      await saveGrievance(grievanceData as any, user.id);

      // Success: Clear form immediately to prevent stale data
      resetForm();

      // Trigger Haptic Feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show confirmation modal
      setSuccessModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const pickImageFromCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (attachments.length >= 2) {
      Alert.alert('Limit Reached', 'You can only attach a maximum of 2 images.');
      return;
    }

    if (!result.canceled && result.assets[0]) {
      const newAttachment: AttachmentItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        type: 'image',
        name: `Photo_${Date.now()}.jpg`,
        size: result.assets[0].fileSize,
      };
      setAttachments([...attachments, newAttachment]);
      setAttachmentModalVisible(false);
    }
  };

  const pickImageFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Gallery permission is required to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (attachments.length >= 2) {
      Alert.alert('Limit Reached', 'You can only attach a maximum of 2 images.');
      return;
    }

    if (!result.canceled && result.assets[0]) {
      const newAttachment: AttachmentItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        type: 'image',
        name: `Image_${Date.now()}.jpg`,
        size: result.assets[0].fileSize,
      };
      setAttachments([...attachments, newAttachment]);
      setAttachmentModalVisible(false);
    }
  };

  const removeAttachment = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachments(attachments.filter(item => item.id !== id));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Background - Mesh Gradient & Ambient Orbs */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE', '#F8FAFC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Environmental Orbs for Depth */}
        <AmbientOrb color="#BAE6FD" size={300} top={-50} right={-100} />
        <AmbientOrb color="#DDD6FE" size={250} bottom={100} left={-80} opacity={0.12} />

        {/* Soft Vignette Overlay */}
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.05)', 'transparent', 'transparent', 'rgba(15, 23, 42, 0.05)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header - Outside ScrollView for edge-to-edge */}
      <GlassHeader
        title="Submit Grievance"
        subtitle="Help us improve your campus experience"
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            key={isFocused ? 'focused' : 'unfocused'} // Forces re-render on focus to replay animations
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Form Content */}
            {/* Title Input - Soft Float In */}
            <FormAnimatedWrapper delay={0}>
              <View style={styles.solidCard}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
                  <Text style={[styles.counter, titleWords < 3 && styles.counterError]}>
                    {titleWords}/3 words
                  </Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Brief description of your issue"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
            </FormAnimatedWrapper>

            {/* Category Selection */}
            <FormAnimatedWrapper delay={120}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCategoryModalVisible(true)}
                style={styles.solidCard}
              >
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
                </View>
                <View style={styles.selector}>
                  {selectedCategory ? (
                    <View style={styles.selectedItem}>
                      <View style={[styles.iconBox, { backgroundColor: currentCategory?.color }]}>
                        <Feather name={currentCategory?.icon as any} size={moderateScale(18)} color="white" />
                      </View>
                      <Text style={styles.selectedText}>{currentCategory?.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Select Category</Text>
                  )}
                  <Feather name="chevron-down" size={moderateScale(20)} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            </FormAnimatedWrapper>

            {/* Subcategory Selection */}
            {selectedCategory && (
              <FormAnimatedWrapper delay={0}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSubcategoryModalVisible(true)}
                  style={styles.solidCard}
                >
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Subcategory <Text style={styles.required}>*</Text></Text>
                  </View>
                  <View style={styles.selector}>
                    {selectedSubcategory ? (
                      <Text style={styles.selectedText}>{selectedSubcategory}</Text>
                    ) : (
                      <Text style={styles.placeholderText}>Select Subcategory</Text>
                    )}
                    <Feather name="chevron-down" size={moderateScale(20)} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              </FormAnimatedWrapper>
            )}

            {/* Hostel Selection - Only if Category is Hostel */}
            {currentCategory?.name?.toLowerCase().includes('hostel') && (
              <FormAnimatedWrapper delay={0}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setHostelModalVisible(true)}
                  style={styles.solidCard}
                >
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Hostel Block <Text style={styles.required}>*</Text></Text>
                  </View>
                  <View style={styles.selector}>
                    {selectedHostel ? (
                      <Text style={styles.selectedText}>{selectedHostel}</Text>
                    ) : (
                      <Text style={styles.placeholderText}>Select Hostel Block</Text>
                    )}
                    <Feather name="chevron-down" size={moderateScale(20)} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              </FormAnimatedWrapper>
            )}

            {/* Description Input */}
            <FormAnimatedWrapper delay={240}>
              <View style={styles.solidCard}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                  <Text style={[styles.counter, descriptionWords < 15 && styles.counterError]}>
                    {descriptionWords}/15 words
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
            </FormAnimatedWrapper>

            {/* Attachments */}
            <FormAnimatedWrapper delay={360}>
              <View style={styles.solidCard}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Attachments ({attachments.length})</Text>
                  <Text style={styles.counter}>Optional</Text>
                </View>

                {attachments.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentList}>
                    {attachments.map((item) => (
                      <View key={item.id} style={styles.attachmentItem}>
                        <Image source={{ uri: item.uri }} style={styles.attachmentThumb} />
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeAttachment(item.id)}
                        >
                          <Feather name="x" size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => setAttachmentModalVisible(true)}
                >
                  <Feather name="camera" size={moderateScale(20)} color="#6366F1" />
                  <Text style={styles.attachBtnText}>Add Photo / Document</Text>
                </TouchableOpacity>
              </View>
            </FormAnimatedWrapper>

            {/* Submit Button */}
            <FormAnimatedWrapper delay={480}>
              <View
                style={[
                  styles.submitBtnContainer,
                  (!isFormValid || submitting) && styles.disabledBtn
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit}
                  disabled={!isFormValid || submitting}
                >
                  <LinearGradient
                    colors={isFormValid && !submitting ? ['#0EA5E9', '#0284C7'] : ['#CBD5E1', '#94A3B8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    {submitting ? (
                      <Text style={styles.submitBtnText}>Submitting...</Text>
                    ) : isFormValid ? (
                      <>
                        <Text style={styles.submitBtnText}>Submit Grievance</Text>
                        <Feather name="send" size={moderateScale(18)} color="white" />
                      </>
                    ) : (
                      <Text style={styles.submitBtnText}>Fill all fields</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </FormAnimatedWrapper>
          </ScrollView >
        </KeyboardAvoidingView >
      </SafeAreaView >

      {/* Category Modal */}
      < Modal visible={isCategoryModalVisible} transparent animationType="fade" >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Reanimated.View
            entering={SlideInDown.duration(400).easing(PREMIUM_EASING)}
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {loadingCategories ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B' }}>Loading categories...</Text>
                </View>
              ) : (
                categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => handleSelectCategory(cat.id)}
                    style={[
                      styles.categoryCard,
                      selectedCategory === cat.id && styles.activeCategoryCard,
                    ]}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                      <Feather name={cat.icon as any} size={moderateScale(20)} color="white" />
                    </View>
                    <Text style={[
                      styles.categoryName,
                      selectedCategory === cat.id && styles.activeCategoryName,
                    ]}>
                      {cat.name}
                    </Text>
                    {selectedCategory === cat.id && (
                      <Feather name="check-circle" size={moderateScale(18)} color="#0D9488" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Reanimated.View>
        </View>
      </Modal >

      {/* Subcategory Modal */}
      < Modal visible={isSubcategoryModalVisible} transparent animationType="fade" >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Reanimated.View
            entering={SlideInDown.duration(400).easing(PREMIUM_EASING)}
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subcategory</Text>
              <TouchableOpacity onPress={() => setSubcategoryModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {currentCategory?.subcategories.map((sub, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectSubcategory(sub)}
                >
                  <View style={[styles.iconBox, { backgroundColor: currentCategory.color }]}>
                    <Feather name="tag" size={18} color="white" />
                  </View>
                  <Text style={styles.modalItemText}>{sub}</Text>
                  <Feather name="chevron-right" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Reanimated.View>
        </View>
      </Modal >

      {/* Hostel Modal */}
      <Modal visible={isHostelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Reanimated.View
            entering={SlideInDown.duration(400).easing(PREMIUM_EASING)}
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Hostel Block</Text>
              <TouchableOpacity onPress={() => setHostelModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {HOSTEL_LIST.map((hostel, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectHostel(hostel)}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#06B6D4' }]}>
                    <Feather name="home" size={18} color="white" />
                  </View>
                  <Text style={styles.modalItemText}>{hostel}</Text>
                  <Feather name="chevron-right" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Reanimated.View>
        </View>
      </Modal>

      {/* Attachment Modal */}
      < Modal visible={isAttachmentModalVisible} transparent animationType="fade" >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Reanimated.View
            entering={SlideInDown.duration(400).easing(PREMIUM_EASING)}
            style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Attachment</Text>
              <TouchableOpacity onPress={() => setAttachmentModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.attachOptions}>
              <TouchableOpacity style={styles.attachOption} onPress={pickImageFromCamera}>
                <View style={[styles.attachIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Feather name="camera" size={24} color="#06B6D4" />
                </View>
                <Text style={styles.attachText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachOption} onPress={pickImageFromGallery}>
                <View style={[styles.attachIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Feather name="image" size={24} color="#22C55E" />
                </View>
                <Text style={styles.attachText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        </View>
      </Modal >

      {/* Success Modal */}
      < Modal visible={isSuccessModalVisible} transparent animationType="fade" >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Reanimated.View entering={ZoomIn.springify()} style={styles.successCard}>
            <View style={styles.successIcon}>
              <Feather name="check" size={moderateScale(40)} color="white" />
            </View>
            <Text style={styles.successTitle}>Submitted!</Text>
            <Text style={styles.successMessage}>
              Your grievance has been successfully submitted. You can track its status in the Track tab.
            </Text>

            <View style={styles.successBtnContainer}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  // Navigate immediately. The useEffect logic will handle closing/resetting 
                  // once we lose focus, preventing any blink.
                  router.push('/track');
                }}
              >
                <Text style={styles.secondaryBtnText}>Track Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                }}
              >
                <LinearGradient
                  colors={['#0EA5E9', '#0284C7']}
                  style={styles.primaryBtnGradient}
                >
                  <Text style={styles.primaryBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        </View>
      </Modal >

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed as it is now a Gradient
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  // --- Header Styles (Matches Home Page) ---
  headerContainer: {
    paddingTop: (StatusBar.currentHeight || 20) + 5, // Tightly hugged to the status bar
    paddingHorizontal: 24,
    marginBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreetingText: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerWelcome: {
    fontSize: rf(26),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitleText: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  headerNotifBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 1,
  },
  // --- End Header Styles ---
  solidCard: {
    backgroundColor: 'white',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  label: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#EF4444',
  },
  counter: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
  },
  counterError: {
    color: '#EF4444',
  },
  input: {
    fontSize: moderateScale(15),
    color: '#1E293B',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  textArea: {
    minHeight: moderateScale(100),
    borderBottomWidth: 0,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  selectedText: {
    fontSize: moderateScale(15),
    color: '#1E293B',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: moderateScale(15),
    color: '#94A3B8',
  },
  attachmentList: {
    flexDirection: 'row',
    marginBottom: moderateScale(12),
  },
  attachmentItem: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(10),
    position: 'relative',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(12),
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'white',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
  },
  attachBtnText: {
    marginLeft: moderateScale(8),
    color: '#6366F1', // Indigo
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  submitBtnContainer: {
    marginTop: moderateScale(10),
    shadowColor: '#6366F1', // Indigo Glow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledBtn: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(16),
  },
  submitBtnText: {
    color: 'white',
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginRight: moderateScale(8),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: 0, // Ensure no padding at bottom
    width: '100%',
    maxHeight: '75%', // Increased for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(19),
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: moderateScale(4),
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    flex: 1,
    fontSize: moderateScale(15),
    color: '#334155',
    fontWeight: '500',
  },
  attachOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: moderateScale(20),
  },
  attachOption: {
    alignItems: 'center',
  },
  attachIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  attachText: {
    fontSize: moderateScale(13),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: moderateScale(24),
    padding: moderateScale(32),
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  successIcon: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(24),
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: moderateScale(23),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: moderateScale(8),
  },
  successMessage: {
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: moderateScale(24),
    lineHeight: moderateScale(20),
  },
  successBtnContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#475569',
  },
  primaryBtn: {
    flex: 1,
  },
  primaryBtnGradient: {
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: 'white',
  },
  modalScroll: {
    maxHeight: 400,
    marginBottom: moderateScale(20),
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: moderateScale(12),
    backgroundColor: '#F8FAFC',
  },
  activeCategoryCard: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  categoryIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  categoryName: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#334155',
  },
  activeCategoryName: {
    color: '#0D9488',
  },
});
