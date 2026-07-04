import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
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
import Animated, { FadeInDown, FadeInUp, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../UserContext';
import { supabase } from '../../lib/supabase';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const { width, height } = Dimensions.get('window');

// Responsive Utilities
const guidelineBaseWidth = 414;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// --- Glass Header (Page Specific) ---
const GlassHeader: React.FC<{
  title: string;
  subtitle?: string;
  onLogoutPress?: () => void;
}> = ({ title, subtitle, onLogoutPress }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View>
          {title ? <Text style={styles.headerGreetingText}>{title}</Text> : null}
          {subtitle && (
            <Text style={styles.headerWelcome} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {onLogoutPress && (
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            activeOpacity={0.7}
            onPress={onLogoutPress}
          >
            <Feather name="log-out" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { user, updateUser, deleteAccount, refreshProfile } = useUser();
  const router = useRouter();

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    department: user.department || '',
  });

  // Fetch fresh profile data on mount
  useEffect(() => {
    refreshProfile();
  }, []);

  // Sync editForm with user data from context
  useEffect(() => {
    if (!isEditModalVisible) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        department: user.department || '',
      });
    }
  }, [user, isEditModalVisible]);
  
  // Form initialization when modal opens
  useEffect(() => {
    if (isEditModalVisible) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        department: user.department || '',
      });
    }
  }, [isEditModalVisible, user]);

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userProfile', 'isLoggedIn']);
      updateUser({
        name: 'Student Name',
        email: 'student@giet.edu',
        role: 'Student',
        department: 'Computer Science',
        avatar: 'SN',
      });
      setLogoutModalVisible(false);
      router.replace('/login');
    } catch {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const performDeleteAccount = async () => {
    try {
      await deleteAccount();
      setDeleteModalVisible(false);
      router.replace('/login');
    } catch {
      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      // 1. Update Supabase Database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          email: editForm.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Update Context (which handles local storage persistence)
      updateUser(editForm);
      setEditModalVisible(false);

      setTimeout(() => {
        setSuccessModalVisible(true);
      }, 400);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <GlassHeader
        title={user.name && user.name !== 'Student Name' ? `Hi, ${user.name.split(' ')[0]}` : ""}
        subtitle="My Profile"
        onLogoutPress={() => setLogoutModalVisible(true)}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContentContainer}>
            <Animated.View
              entering={FadeInDown.delay(200).springify().damping(30).mass(3).stiffness(80)}
              style={styles.glassCardOuter}
            >
              <BlurView intensity={80} tint="light" style={styles.glassCardInner}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.cardContent}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['#0EA5E9', '#38BDF8']}
                      style={styles.avatar}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() ?? 'U'}</Text>
                    </LinearGradient>
                  </View>

                  <Text style={styles.userName}>{user.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user.email || 'email@example.com'}</Text>

                  <View style={styles.roleContainer}>
                    <View style={styles.deptBadge}>
                      <Text style={styles.deptText}>{user.department || 'General'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(6,182,212,0.1)', 'rgba(6,182,212,0.05)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <Feather name="edit-3" size={moderateScale(16)} color="#0891B2" />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).springify().damping(30).mass(3).stiffness(80)}
              style={styles.sectionContainer}
            >
              <Text style={styles.sectionTitle}>Support & Settings</Text>

              <View style={styles.menuContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/HelpSupport')}
                >
                  <BlurView intensity={60} tint="light" style={styles.menuItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                      <Feather name="help-circle" size={moderateScale(22)} color="#0284C7" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>FAQ</Text>
                      <Text style={styles.menuSubtitle}>Frequently asked questions</Text>
                    </View>
                    <Feather name="chevron-right" size={moderateScale(20)} color="#94A3B8" />
                  </BlurView>
                </TouchableOpacity>

                <View style={styles.menuSeparator} />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/AccountSettings')}
                >
                  <BlurView intensity={60} tint="light" style={styles.menuItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                      <Feather name="phone" size={moderateScale(22)} color="#0284C7" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>Contact Support</Text>
                      <Text style={styles.menuSubtitle}>Helpline & emergency</Text>
                    </View>
                    <Feather name="chevron-right" size={moderateScale(20)} color="#94A3B8" />
                  </BlurView>
                </TouchableOpacity>

                <View style={styles.menuSeparator} />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/Feedback')}
                >
                  <BlurView intensity={60} tint="light" style={styles.menuItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                      <Feather name="edit" size={moderateScale(22)} color="#0284C7" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>App Feedback</Text>
                      <Text style={styles.menuSubtitle}>Suggestions or bugs</Text>
                    </View>
                    <Feather name="chevron-right" size={moderateScale(20)} color="#94A3B8" />
                  </BlurView>
                </TouchableOpacity>

                <View style={styles.menuSeparator} />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeleteModalVisible(true)}
                >
                  <BlurView intensity={60} tint="light" style={styles.menuItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                      <Feather name="user-x" size={moderateScale(22)} color="#EF4444" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Delete Account</Text>
                      <Text style={styles.menuSubtitle}>Permanently remove all data</Text>
                    </View>
                    <Feather name="chevron-right" size={moderateScale(20)} color="#94A3B8" />
                  </BlurView>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>
                App Version {Constants.expoConfig?.version || '2.1.1'}
              </Text>
              <Text style={styles.teamText}>
                Made with ❤️ by <Text style={styles.cyanText}>Team Nexus</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        {/* @ts-ignore */}
        <BlurView
          intensity={100}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(20).mass(1.2).stiffness(100)}
            exiting={SlideOutDown.duration(300)}
            style={styles.editModalContainer}
          >
            <View style={styles.editModalOuter}>
              {/* @ts-ignore */}
              <BlurView intensity={80} tint="light" style={styles.editModalInner}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.editModalContent}>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>Edit Profile</Text>
                      <Text style={styles.modalSubtitle}>Update your personal details</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setEditModalVisible(false)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="x" size={moderateScale(20)} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
                    {['name', 'email'].map((field) => (
                      <View key={field} style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </Text>
                        <View style={styles.inputWrapper}>
                          <Feather
                            name={
                              field === 'name' ? 'user' : 'mail'
                            }
                            size={moderateScale(18)}
                            color="#94A3B8"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.textInput}
                            value={editForm[field as keyof typeof editForm]}
                            onChangeText={(text) =>
                              setEditForm((prev) => ({ ...prev, [field]: text }))
                            }
                            placeholder={`Enter your ${field}`}
                            placeholderTextColor="#CBD5E1"
                            keyboardType={field === 'email' ? 'email-address' : 'default'}
                          />
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity onPress={handleSaveProfile} activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#0EA5E9', '#38BDF8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                      >
                        <Text style={styles.saveText}>Save Changes</Text>
                        <Feather name="check" size={moderateScale(18)} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </BlurView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal >

      {/* Success Modal */}
      <Modal visible={isSuccessModalVisible} transparent animationType="none">
        <View style={styles.modalOverlay}>
          {/* @ts-ignore */}
          <BlurView
            intensity={100}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            entering={FadeInUp.springify().damping(25).stiffness(120)}
            exiting={FadeOut.duration(200)}
            style={styles.successCard}
          >
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.successIconCircle}
              >
                <Feather name="check" size={moderateScale(40)} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Profile Updated!</Text>
            <Text style={styles.successMessage}>
              Your changes have been saved successfully.
            </Text>
            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => setSuccessModalVisible(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successDoneGradient}
              >
                <Text style={styles.successDoneText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {/* @ts-ignore */}
          <BlurView
            intensity={100}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            entering={FadeInUp.springify().damping(30).mass(3).stiffness(80)}
            style={styles.logoutCardOuter}
          >
            <View style={styles.logoutCardInner}>
              <View style={styles.logoutIconContainer}>
                <LinearGradient
                  colors={['rgba(254, 242, 242, 0.8)', 'rgba(254, 226, 226, 0.5)']}
                  style={styles.logoutIconBg}
                >
                  <Feather name="log-out" size={moderateScale(28)} color="#EF4444" />
                </LinearGradient>
              </View>

              <Text style={styles.logoutTitle}>Sign Out</Text>
              <Text style={styles.logoutMessage}>
                Are you sure? You will need to sign in again to access your account.
              </Text>

              <View style={styles.logoutButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setLogoutModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={performLogout}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.confirmGradient}
                  >
                    <Text style={styles.confirmText}>Sign Out</Text>
                    <Feather name="arrow-right" size={moderateScale(16)} color="rgba(255,255,255,0.9)" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={isDeleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {/* @ts-ignore */}
          <BlurView
            intensity={100}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            entering={FadeInUp.springify().damping(30).mass(3).stiffness(80)}
            style={styles.logoutCardOuter}
          >
            <View style={styles.logoutCardInner}>
              <View style={styles.logoutIconContainer}>
                <LinearGradient
                  colors={['rgba(254, 242, 242, 0.8)', 'rgba(254, 226, 226, 0.5)']}
                  style={styles.logoutIconBg}
                >
                  <Feather name="user-x" size={moderateScale(28)} color="#EF4444" />
                </LinearGradient>
              </View>

              <Text style={styles.logoutTitle}>Delete Account</Text>
              <Text style={styles.logoutMessage}>
                Warning: This action is permanent and cannot be undone. All your grievances and data will be deleted.
              </Text>

              <View style={styles.logoutButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={performDeleteAccount}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.confirmGradient}
                  >
                    <Text style={styles.confirmText}>Delete</Text>
                    <Feather name="trash-2" size={moderateScale(16)} color="rgba(255,255,255,0.9)" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainContentContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  headerContainer: {
    paddingHorizontal: moderateScale(22),
    paddingTop: Platform.OS === 'ios' ? moderateScale(10) : moderateScale(40),
    paddingBottom: moderateScale(15),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreetingText: {
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerWelcome: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: width * 0.7,
    letterSpacing: -0.5,
  },
  headerLogoutBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  footerInfo: {
    paddingVertical: moderateScale(30),
    alignItems: 'center',
  },
  profileButton: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  glassCardOuter: {
    margin: moderateScale(12),
    borderRadius: moderateScale(32),
    backgroundColor: 'transparent',
  },
  glassCardInner: {
    borderRadius: moderateScale(32),
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardContent: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: moderateScale(8),
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: moderateScale(36),
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: moderateScale(13),
    color: '#64748B',
    marginBottom: moderateScale(8),
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  roleBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  roleText: {
    color: '#0284C7',
    fontSize: moderateScale(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deptBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  deptText: {
    color: '#64748B',
    fontSize: moderateScale(12),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  editButtonText: {
    color: '#0891B2',
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginLeft: moderateScale(8),
  },
  sectionContainer: {
    marginBottom: moderateScale(24),
    paddingHorizontal: moderateScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#334155',
    marginBottom: moderateScale(16),
    marginLeft: 4,
  },
  menuContainer: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
    marginLeft: moderateScale(66),
  },
  iconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: moderateScale(14),
  },
  menuTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  logoutButtonContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  logoutButton: {
    width: '90%',
    borderRadius: moderateScale(28),
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    gap: moderateScale(10),
  },
  logoutButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  versionContainer: {
    marginTop: moderateScale(15),
    alignItems: 'center',
    paddingBottom: moderateScale(20),
  },
  versionText: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  teamText: {
    fontSize: moderateScale(11),
    color: '#475569',
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cyanText: {
    color: '#0EA5E9',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  editModalContainer: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  editModalOuter: {
    borderRadius: moderateScale(32),
    backgroundColor: 'transparent',
  },
  editModalInner: {
    borderRadius: moderateScale(32),
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  editModalContent: {
    padding: moderateScale(28),
    paddingBottom: moderateScale(32),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(28),
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: moderateScale(13),
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  closeButton: {
    padding: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 50,
  },
  modalForm: {
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: moderateScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#475569',
    marginBottom: moderateScale(8),
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: moderateScale(16),
  },
  inputIcon: {
    marginRight: moderateScale(12),
  },
  textInput: {
    flex: 1,
    paddingVertical: moderateScale(16),
    fontSize: moderateScale(15),
    color: '#1E293B',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(18),
    marginTop: moderateScale(12),
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  saveText: {
    color: 'white',
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginRight: moderateScale(8),
  },
  logoutCardOuter: {
    margin: moderateScale(24),
    borderRadius: moderateScale(32),
    alignSelf: 'center',
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'transparent',
  },
  logoutCardInner: {
    borderRadius: moderateScale(32),
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: moderateScale(24),
    paddingVertical: moderateScale(32),
    alignItems: 'center',
  },
  logoutIconContainer: {
    marginBottom: moderateScale(16),
  },
  logoutIconBg: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: moderateScale(21),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: moderateScale(8),
  },
  logoutMessage: {
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: moderateScale(24),
    lineHeight: moderateScale(22),
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmGradient: {
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  confirmText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: 'white',
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: moderateScale(32),
    padding: moderateScale(32),
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: moderateScale(20),
  },
  successIconCircle: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: moderateScale(10),
  },
  successMessage: {
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: moderateScale(28),
    lineHeight: moderateScale(22),
  },
  successDoneBtn: {
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  successDoneGradient: {
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneText: {
    color: 'white',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});
