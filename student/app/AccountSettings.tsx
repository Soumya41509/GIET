import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';

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

export default function AccountSettings() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_contacts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWhatsApp = (number: string) => {
    Linking.openURL(`https://wa.me/91${number}`);
  };

  return (
    <View style={styles.safe}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Modern Header */}
        <GlassHeader
          title="SUPPORT"
          subtitle="Emergency Contacts"
        />

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontWeight: '600' }}>Loading contacts...</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ color: '#94A3B8', fontWeight: '600' }}>No support contacts available.</Text>
            </View>
          ) : (
            contacts.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <BlurView intensity={80} tint="light" style={styles.card}>
                  <LinearGradient
                    colors={item.type === 'emergency' ? ["#FEF2F2", "#FFF1F2"] : ["#E0F2FE", "#F0FDFA"]}
                    style={styles.iconBox}
                  >
                    <Feather
                      name={
                        item.type === 'email' ? 'mail' :
                          item.type === 'phone' ? 'phone' :
                            item.type === 'whatsapp' ? 'message-circle' : 'shield'
                      }
                      size={22}
                      color={item.type === 'emergency' ? "#EF4444" : "#06B6D4"}
                    />
                  </LinearGradient>

                  <View style={styles.info}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.detail}</Text>
                  </View>

                  <View style={styles.actions}>
                    {item.type === 'email' ? (
                      <TouchableOpacity onPress={() => handleEmail(item.detail)}>
                        <Feather name="send" size={20} color="#06B6D4" />
                      </TouchableOpacity>
                    ) : item.type === 'whatsapp' ? (
                      <TouchableOpacity onPress={() => handleWhatsApp(item.detail)}>
                        <Feather name="message-circle" size={20} color="#06B6D4" />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handleCall(item.detail)}>
                          <Feather
                            name={item.type === 'emergency' ? "alert-triangle" : "phone-call"}
                            size={20}
                            color={item.type === 'emergency' ? "#EF4444" : "#06B6D4"}
                          />
                        </TouchableOpacity>
                        {item.type === 'phone' && (
                          <TouchableOpacity onPress={() => handleWhatsApp(item.detail)}>
                            <Feather name="message-circle" size={20} color="#06B6D4" />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </BlurView>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  container: {
    paddingBottom: 40,
    paddingTop: moderateScale(10),
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

  cardWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(94,234,212,0.3)",
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  info: { flex: 1 },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});
