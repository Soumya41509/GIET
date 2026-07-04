import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef, useReducer } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
  Alert,
  FlatList,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeOut,
  Layout,
  SlideInRight,
  SlideInLeft,
  SlideInDown,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useUser } from '../UserContext';
import {
  loadGrievances,
  loadGrievanceStats,
  nudgeGrievance,
  reopenGrievance,
  saveFeedback,
  submitGrievanceFromBot,
  escalateGrievance,
  getEscalationContacts,
  GrievanceItem
} from '../dataStorage';
import { normalize, rf } from '../utils/responsive';

const { width } = Dimensions.get('window');

import {
  fetchChatSessions,
  fetchChatMessagesForSession,
  createChatSession,
  deleteChatSession,
  ChatSession
} from '../lib/nexa-engine/chatHistoryService';

import {
  nexaReducer,
  INITIAL_STATE,
  processUserMessage,
  getStepOptions
} from '../lib/nexa-engine/EngineCore';
import { useNexaPersistence } from '../lib/nexa-engine/persistence';
import { FLOW_CONFIG } from '../lib/nexa-engine/FlowConfig';
import { NexaModule, MessagePayload, StepConfig, MessageAction } from '../lib/nexa-engine/types';
// --- Constants ---
const BOT_GREETINGS = [
  "Hello! I'm NEXA. How can I help you today?",
  "Hi there! I'm NEXA. What's on your mind?",
  "Welcome! I'm NEXA. How can I assist you?"
];

// --- Sub-Components ---

const ChatBubble = ({
  message,
  onReply,
  onAction
}: {
  message: MessagePayload,
  onReply: (text: string) => void,
  onAction?: (action: MessageAction) => void
}) => {
  const isBot = message.type === 'bot';
  const quickReplies = message.data?.quickReplies as string[] | undefined;
  const action = message.action;

  return (
    <Animated.View
      entering={isBot ? FadeInLeft.duration(300) : FadeInDown.duration(300)}
      style={[
        styles.bubbleWrapper,
        isBot ? styles.botWrapper : styles.userWrapper
      ]}
    >
      <View style={isBot ? styles.botBubbleGroup : styles.userBubbleGroup}>
        <BlurView
          intensity={isBot ? 80 : 40}
          tint={isBot ? "light" : "dark"}
          style={[
            styles.bubble,
            isBot ? styles.botBubble : styles.userBubble
          ]}
        >
          <Text style={[styles.bubbleText, isBot ? styles.botText : styles.userText]}>
            {message.content}
          </Text>

          {/* Action Button (Deep Link) */}
          {isBot && action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onAction?.(action)}
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionText}>{action.label}</Text>
                <Feather name="external-link" size={14} color="#FFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </BlurView>

        {/* Inline Quick Replies */}
        {isBot && quickReplies && (
          <View style={styles.inlineQuickReplies}>
            {quickReplies.map((reply, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => onReply(reply)}
                style={styles.inlineReplyButton}
              >
                <BlurView intensity={70} tint="light" style={styles.inlineReplyBlur}>
                  <Text style={styles.inlineReplyText}>{reply}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const Dot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const TypingIndicator = () => (
  <Animated.View
    entering={FadeInLeft}
    style={[styles.bubbleWrapper, styles.botWrapper]}
  >
    <BlurView intensity={80} tint="light" style={[styles.bubble, styles.botBubble, { paddingVertical: 12 }]}>
      <View style={styles.typingDots}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </View>
    </BlurView>
  </Animated.View>
);

const HistoryModal = ({
  visible,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}: {
  visible: boolean,
  onClose: () => void,
  sessions: ChatSession[],
  currentSessionId?: string,
  onSelectSession: (session: ChatSession) => void,
  onNewChat: () => void,
  onDeleteSession: (sessionId: string) => void
}) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={StyleSheet.absoluteFill}
    >
      <View style={styles.historyOverlay}>
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE', '#F8FAFC']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Your Conversations</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newChatBanner} onPress={onNewChat}>
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              style={styles.newChatGradient}
            >
              <Feather name="plus-circle" size={20} color="#FFF" />
              <Text style={styles.newChatText}>Start New Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyList}
            renderItem={({ item }) => {
              const isActive = item.id === currentSessionId;
              const date = new Date(item.updated_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              });

              const renderRightActions = () => (
                <RectButton
                  style={styles.deleteAction}
                  onPress={() => onDeleteSession(item.id)}
                >
                  <Animated.View entering={FadeInLeft}>
                    <Feather name="trash-2" size={22} color="#FFF" />
                  </Animated.View>
                </RectButton>
              );

              return (
                <Swipeable
                  renderRightActions={renderRightActions}
                  overshootRight={false}
                  friction={2}
                >
                  <TouchableOpacity
                    style={[styles.historyItem, isActive && styles.activeHistoryItem]}
                    onPress={() => onSelectSession(item)}
                  >
                    <View style={styles.historyItemLeft}>
                      <View style={[styles.historyIcon, isActive && styles.activeHistoryIcon]}>
                        <Feather name="message-square" size={18} color={isActive ? "#FFF" : "#64748B"} />
                      </View>
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle} numberOfLines={1}>
                          {item.title || 'New Conversation'}
                        </Text>
                        <Text style={styles.historyItemSnippet} numberOfLines={1}>
                          {item.last_message || 'No messages yet...'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyItemDate}>{date}</Text>
                  </TouchableOpacity>
                </Swipeable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyHistory}>
                <Feather name="archive" size={48} color="#CBD5E1" />
                <Text style={styles.emptyHistoryText}>No chat history yet.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>
    </Animated.View>
  );
};

export default function NexaChat() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const [state, dispatch] = useReducer(nexaReducer, INITIAL_STATE);

  const [inputValue, setInputValue] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const { user, greeting: timeGreet } = useUser();
  const flatListRef = useRef<FlatList>(null);
  const hasGreeted = useRef(false);
  const textInputRef = useRef<TextInput>(null);

  const { messages, isTyping, currentModule, currentStepId, wizardData, sessionId } = state;

  // Persistence Hook (Cloud + Local)
  useNexaPersistence(state, dispatch, user?.id, mode === 'new');

  const currentStep = (FLOW_CONFIG[currentModule] as StepConfig[]).find((s: StepConfig) => s.id === currentStepId);
  const options = currentStep ? getStepOptions(currentStep, state) : [];
  const isInputDisabled = options && options.length > 0;

  // New Effect to fetch dynamic categories for the engine
  useEffect(() => {
    const loadCategories = async () => {
      try {
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

        const merged = (catData as any[]).map(cat => ({
          ...cat,
          subcategories: (subData as any[])
            .filter(sub => sub.category_id === cat.id)
            .map(sub => sub.name)
        }));

        dispatch({ type: 'SET_CATEGORIES', payload: merged });
      } catch (err) {
        console.error("Nexa failed to load dynamic categories:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;

    const greet = async () => {
      // Small hack: update session start on fresh greet to keep persistence happy
      dispatch({ type: 'UPDATE_CONTEXT', payload: { sessionStarted: new Date() } });

      const firstName = user?.name ? user.name.split(' ')[0] : 'there';
      const personalizedGreeting = `${timeGreet} ${firstName}, I'm NEXA.`;

      const welcomeMsg: MessagePayload = {
        id: 'msg-start-' + Date.now(),
        type: 'bot',
        content: `${personalizedGreeting} How can I help you today?`,
        timestamp: new Date(),
        data: { quickReplies: FLOW_CONFIG[NexaModule.MAIN][0].options }
      };

      dispatch({ type: 'ADD_MESSAGE', payload: welcomeMsg });
    };

    greet();
  }, [messages.length]);

  const addBotMessage = (text: string, quickReplies?: string[], action?: MessageAction) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: Math.random().toString(36).substring(7),
        type: 'bot',
        content: text,
        data: { quickReplies },
        action,
        timestamp: new Date()
      } as MessagePayload
    });
  };

  const addUserMessage = (text: string) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: Math.random().toString(36).substring(7),
        type: 'user',
        content: text,
        timestamp: new Date()
      } as MessagePayload
    });
    handleResponse(text);
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const success = await deleteChatSession(sessionIdToDelete);
    if (success) {
      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
      // If the deleted session was the active one, start a new chat
      if (sessionIdToDelete === sessionId) {
        handleNewChat();
      }
    } else {
      Alert.alert("Error", "Could not delete this conversation. Please try again.");
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    addUserMessage(text);
    Keyboard.dismiss();
  };

  const openHistory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user?.id) {
      const fetched = await fetchChatSessions(user.id);
      setSessions(fetched);
    }
    setHistoryVisible(true);
  };

  const handleSelectSession = async (session: ChatSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const messages = await fetchChatMessagesForSession(session.id);
    dispatch({
      type: 'SWITCH_SESSION',
      payload: {
        sessionId: session.id,
        messages,
        title: session.title
      }
    });
    setHistoryVisible(false);
  };

  const handleNewChat = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!user?.id) return;

    const newId = await createChatSession(user.id, `New Chat ${new Date().toLocaleDateString()}`);
    if (newId) {
      dispatch({ type: 'START_NEW_SESSION', payload: { sessionId: newId } });
      setHistoryVisible(false);
    }
  };



  const handleResponse = async (input: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 1. Process via Engine
    const result = processUserMessage(input, state);

    if (result.error) {
      addBotMessage(`⚠️ ${result.error}`);
      return;
    }

    // 2. Typing Simulation
    dispatch({ type: 'SET_TYPING', payload: true });
    const delay = Math.min(Math.max(input.length * 30, 800), 2000);
    await new Promise(resolve => setTimeout(resolve, delay));
    dispatch({ type: 'SET_TYPING', payload: false });

    // 3. Update State
    if (result.wizardUpdate) {
      dispatch({ type: 'UPDATE_WIZARD', payload: result.wizardUpdate });
    }

    const { nextModule, nextStepId } = result;
    const mergedWizard = { ...state.wizardData, ...result.wizardUpdate };

    // 4. Send Response
    const nextStep = (FLOW_CONFIG[nextModule] as StepConfig[]).find((s: StepConfig) => s.id === nextStepId);
    let finalResponse = result.botResponse || nextStep?.prompt || "How can I help you?";
    let options = getStepOptions(nextStep!, mergedWizard);

    // --- Special Case: Tracking Fetching ---
    if (nextModule === NexaModule.TRACKING && nextStepId === 'SEARCH_GRIEVANCE') {
      try {
        const grievances = await loadGrievances(0, 5, true, true); // Fetch 5 with timeline
        if (grievances && grievances.length > 0) {
          finalResponse = `🔍 I found ${grievances.length} recent ${grievances.length === 1 ? 'issue' : 'issues'} in your history. Which one would you like to check?`;
          options = grievances.map(g => g.title);
          // Store for lookup
          dispatch({ type: 'UPDATE_WIZARD', payload: { recentGrievances: grievances } });
        } else {
          addBotMessage("I couldn't find any grievances filed under your account. Would you like to file a new one?");
          dispatch({ type: 'SWITCH_MODULE', payload: { module: NexaModule.MAIN, stepId: 'START' } });
          return;
        }
      } catch (err) {
        addBotMessage("Sorry, I had trouble fetching your records. Try again later?");
        dispatch({ type: 'SWITCH_MODULE', payload: { module: NexaModule.MAIN, stepId: 'START' } });
        return;
      }
    }

    // --- Special Case: Tracking Details ---
    if (nextModule === NexaModule.TRACKING && nextStepId === 'VIEW_DETAILS') {
      const recent = mergedWizard.recentGrievances as GrievanceItem[];
      const selected = recent?.find(g => g.title === input);

      if (selected) {
        const latestRemark = selected.timeline && selected.timeline.length > 0
          ? selected.timeline[selected.timeline.length - 1]
          : null;

        finalResponse = `📄 GRIEVANCE REPORT\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📌 Title: ${selected.title}\n` +
          `📂 Category: ${selected.category}\n` +
          `📅 Filed: ${selected.date}\n` +
          `⭐ Status: ${selected.status.toUpperCase()}\n\n` +
          (latestRemark
            ? `🕒 LATEST ACTIVITY:\n"${latestRemark.description}"\n(${latestRemark.date} at ${latestRemark.time})`
            : `⏳ No specific remarks yet. Your issue is currently ${selected.status.toLowerCase()}.`);

        const deepLinkAction: MessageAction = {
          label: 'View Detailed Timeline',
          type: 'navigate',
          screen: '/GrievanceDetail',
          params: { id: selected.id }
        };

        addBotMessage(finalResponse, ['Main Menu'], deepLinkAction);
        dispatch({
          type: 'SWITCH_MODULE',
          payload: { module: nextModule, stepId: nextStepId }
        });
        return;
      } else {
        finalResponse = "I couldn't find details for that specific issue. Would you like to see your recent list again?";
        options = ['Track Status', 'Main Menu'];
      }
    }

    // --- Special Case: Filing Summary ---
    if (nextModule === NexaModule.FILING && nextStepId === 'CONFIRM_SUBMISSION') {
      finalResponse = `📋 GRIEVANCE SUMMARY\n\n` +
        `📂 Category: ${mergedWizard.categoryName}\n` +
        `📍 Area: ${mergedWizard.subCategory}\n` +
        (mergedWizard.hostel ? `🏠 Hostel: ${mergedWizard.hostel}\n` : '') +
        `📝 Title: ${mergedWizard.title}\n\n` +
        `Ready to submit this issue?`;
    }

    // --- Special Case: FAQ Link ---
    if (nextModule === NexaModule.SUPPORT && nextStepId === 'SHOW_FAQ') {
      const faqAction: MessageAction = {
        label: 'Open FAQ Hub',
        type: 'navigate',
        screen: '/HelpSupport'
      };
      addBotMessage(finalResponse, options, faqAction);
      dispatch({ type: 'SWITCH_MODULE', payload: { module: nextModule, stepId: nextStepId } });
      return;
    }

    dispatch({
      type: 'SWITCH_MODULE',
      payload: {
        module: nextModule,
        stepId: nextStepId
      }
    });

    addBotMessage(finalResponse, options);

    // 5. Handle Final Actions
    if (nextModule === NexaModule.MAIN && nextStepId === 'START' && state.currentModule === NexaModule.FILING) {
      if (input.includes('Submit Now')) {
        try {
          const categories = state.categories;
          const catId = categories.find((c: any) => c.name === mergedWizard.categoryName)?.id || 'others';
          await submitGrievanceFromBot({
            title: mergedWizard.title,
            description: mergedWizard.description,
            category: catId,
            subcategory: mergedWizard.subCategory,
            hostel: mergedWizard.hostel,
            priority: 'Medium', // Default for bot
            attachments: mergedWizard.photo ? [mergedWizard.photo] : []
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addBotMessage("✅ Grievance filed successfully! You can track it in your profile.");
        } catch (err) {
          addBotMessage("❌ Failed to submit. Please try again later.");
        }
      }
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background */}
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Glass Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={openHistory}
            >
              <Feather name="clock" size={20} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerWelcome}>NEXA Chat</Text>
              <View style={styles.onlineBadge}>
                <View style={[styles.dotLive, { backgroundColor: '#10B981' }]} />
                <Text style={styles.onlineText}>Assistant Online</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleNewChat}
            >
              <Feather name="plus" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.FlatList
          entering={FadeIn.duration(400)}
          key={sessionId} // Force-animate the whole list on session switch
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: MessagePayload) => item.id}
          style={styles.chatList}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }: { item: MessagePayload }) => (
            <ChatBubble
              message={item}
              onReply={addUserMessage}
              onAction={(action) => {
                if (action.type === 'navigate') {
                  router.push({
                    pathname: action.screen as any,
                    params: action.params
                  });
                }
              }}
            />
          )}
          ListFooterComponent={() => isTyping ? <TypingIndicator /> : null}
        />

        {/* Dynamic Input Footer */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <BlurView intensity={90} tint="light" style={styles.footerContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={textInputRef}
                style={[styles.input, isInputDisabled && styles.inputDisabled]}
                placeholder={isInputDisabled ? "Please select an option above" : "Type your message..."}
                placeholderTextColor="#94A3B8"
                value={inputValue}
                onChangeText={setInputValue}
                editable={!isInputDisabled && !isTyping}
                multiline={false}
                onSubmitEditing={handleSend}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputValue.trim() || isTyping) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!inputValue.trim() || isTyping}
              >
                <LinearGradient
                  colors={inputValue.trim() ? ['#0EA5E9', '#0284C7'] : ['#E2E8F0', '#CBD5E1']}
                  style={styles.sendGradient}
                >
                  <Feather name="send" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: normalize(20),
    paddingTop: Platform.OS === 'ios' ? normalize(10) : normalize(20),
    paddingBottom: normalize(15),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  headerTitleGroup: {
    alignItems: 'center',
    flex: 1,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  headerWelcome: {
    fontSize: rf(22),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  onlineText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bubbleWrapper: {
    maxWidth: '80%',
    marginBottom: 16,
  },
  botWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: '#1E293B',
    fontWeight: '500',
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  botBubbleGroup: {
    alignItems: 'flex-start',
    width: '100%',
  },
  userBubbleGroup: {
    alignItems: 'flex-end',
    width: '100%',
  },
  inlineQuickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
    maxWidth: '100%',
  },
  inlineReplyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  inlineReplyBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inlineReplyText: {
    color: '#0EA5E9',
    fontWeight: '700',
    fontSize: 13,
  },
  actionButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  footer: {
    height: 40,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  inputDisabled: {
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    color: '#94A3B8',
    borderColor: 'rgba(226, 232, 240, 0.4)',
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // History Modal Styles
  historyOverlay: {
    flex: 1,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  historyTitle: {
    fontSize: rf(24),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 8,
  },
  newChatBanner: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  newChatText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyList: {
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  activeHistoryItem: {
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    borderColor: 'rgba(14, 165, 233, 0.5)',
    borderWidth: 1.5,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeHistoryIcon: {
    backgroundColor: '#0EA5E9',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  historyItemSnippet: {
    fontSize: 13,
    color: '#64748B',
  },
  historyItemDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 10,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 16,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 25,
    borderRadius: 16,
    marginBottom: 12,
    height: '84%', // Match historyItem padding/height roughly or use flex
  },
});
