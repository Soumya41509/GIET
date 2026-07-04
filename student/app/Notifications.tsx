import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, rf } from '../utils/responsive';
import { getNotifications, markNotificationsAsRead, clearNotifications, AppNotification } from '../notificationStorage';

const { width } = Dimensions.get('window');

const formatDate = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const NotificationItem = ({ title, description, time, type, isNew }: any) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'clock';
      case 'info': return 'info';
      default: return 'bell';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'info': return '#0EA5E9';
      default: return '#64748B';
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={styles.notifItem}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '15' }]}>
        <Feather name={getIcon()} size={20} color={getIconColor()} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, isNew && { fontWeight: '800' }]}>{title}</Text>
          {isNew && <View style={styles.newBadge} />}
        </View>
        <Text style={styles.notifDesc} numberOfLines={2}>{description}</Text>
        <Text style={styles.notifTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
    // Mark as read after a short delay or on focus
    setTimeout(async () => {
      await markNotificationsAsRead();
    }, 1000);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleClearAll = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await clearNotifications();
    setNotifications([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Gradients */}
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.filter(n => n.isNew).length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>New</Text>
            </View>
            {notifications.filter(n => n.isNew).map(notif => (
              <NotificationItem 
                key={notif.id} 
                {...notif} 
                time={formatDate(notif.time)} 
              />
            ))}
          </>
        )}

        {notifications.filter(n => !n.isNew).length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionLabel}>Earlier</Text>
            </View>
            {notifications.filter(n => !n.isNew).map(notif => (
              <NotificationItem 
                key={notif.id} 
                {...notif} 
                time={formatDate(notif.time)} 
              />
            ))}
          </>
        )}

        {notifications.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="bell-off" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>We'll notify you when something important happens.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: '900',
    color: '#0F172A',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#0EA5E9',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notifItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  newBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
    marginLeft: 8,
  },
  notifDesc: {
    fontSize: rf(13),
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifTime: {
    fontSize: rf(11),
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: rf(14),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
