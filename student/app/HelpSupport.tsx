import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';



import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 414) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// --- Glass Header (UI Component) ---
const GlassHeader: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => {
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
      </View>
    </View>
  );
};

export default function HelpSupport() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_faqs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Modern Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <GlassHeader
            title=""
            subtitle="Frequently Asked Questions"
          />
        </Animated.View>

        {/* FAQ List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Loading help content...</Text>
            </View>
          ) : faqs.length === 0 ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontWeight: '600' }}>No FAQs available right now.</Text>
            </View>
          ) : (
            faqs.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(100 + index * 50).duration(500)}
              >
                <BlurView intensity={80} tint="light" style={styles.card}>
                  <TouchableOpacity
                    style={styles.questionRow}
                    onPress={() => toggleFAQ(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <Feather name="help-circle" size={moderateScale(20)} color="#06B6D4" />
                    </View>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Feather
                      name={openIndex === index ? "chevron-up" : "chevron-down"}
                      size={moderateScale(20)}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>

                  {openIndex === index && (
                    <View style={styles.answerBox}>
                      <View style={styles.divider} />
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </BlurView>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: moderateScale(22),
    paddingTop: Platform.OS === 'ios' ? moderateScale(10) : moderateScale(30),
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
    maxWidth: width * 0.9,
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  card: {
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(16),
  },
  iconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  questionText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: moderateScale(8),
  },
  answerBox: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: moderateScale(12),
  },
  answerText: {
    fontSize: moderateScale(13),
    color: "#475569",
    lineHeight: moderateScale(22),
  },
});
