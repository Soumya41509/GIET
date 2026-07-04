import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { AnimatedPressable } from './ui/AnimatedPressable';

const { width } = Dimensions.get('window');

type PriorityColors = readonly [string, string, ...string[]];

interface AnnouncementModalProps {
    visible: boolean;
    title: string;
    message: string;
    priority: string;
    onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
    visible,
    title,
    message,
    priority,
    onClose,
}) => {
    const { colors, theme } = useTheme();
    if (!visible) return null;

    const getPriorityColors = (): PriorityColors => {
        switch (priority?.toLowerCase()) {
            case 'critical': return ['#EF4444', '#DC2626'];
            case 'high': return ['#F59E0B', '#D97706'];
            default: return ['#10B981', '#059669'];
        }
    };

    const priorityColors = getPriorityColors();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]} />

                <Animated.View
                    entering={ZoomIn.duration(300).springify()}
                    exiting={FadeOut.duration(200)}
                    style={[styles.modalContainer, { shadowColor: priorityColors[0] }]}
                >
                    <View style={styles.glassBorder}>
                        <LinearGradient
                            colors={theme === 'dark' ?
                                ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)'] :
                                ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)']}
                            style={styles.gradient}
                        >
                            <View style={styles.content}>
                                <View style={styles.header}>
                                    <View style={[styles.iconContainer, { backgroundColor: theme === 'dark' ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE', borderColor: priorityColors[0] + '40' }]}>
                                        <Feather name="bell" size={24} color={priorityColors[0]} />
                                    </View>
                                    <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <AnimatedPressable
                                            onPress={onClose}
                                            style={[styles.closeButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                        >
                                            <Feather name="x" size={18} color={colors.text} />
                                        </AnimatedPressable>
                                        <LinearGradient
                                            colors={priorityColors}
                                            style={styles.priorityBadgeCompact}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.priorityText}>{priority || 'Normal'}</Text>
                                        </LinearGradient>
                                    </View>
                                </View>

                                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                                <ScrollView 
                                    style={styles.messageScroll} 
                                    showsVerticalScrollIndicator={false}
                                    bounces={true}
                                >
                                    <Text style={[styles.message, { color: theme === 'dark' ? '#94A3B8' : '#64748B' }]}>
                                        {message}
                                    </Text>
                                </ScrollView>

                                <View style={styles.footer}>
                                    <AnimatedPressable
                                        style={styles.actionButton}
                                        onPress={onClose}
                                    >
                                        <LinearGradient
                                            colors={priorityColors}
                                            style={styles.actionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.actionText}>Acknowledge</Text>
                                            <Feather name="check" size={18} color="#FFF" />
                                        </LinearGradient>
                                    </AnimatedPressable>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        borderRadius: 28,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
    },
    glassBorder: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gradient: {
        padding: 24,
    },
    content: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    priorityBadgeCompact: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priorityText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    messageScroll: {
        maxHeight: 250,
        marginBottom: 20,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 8,
    },
    actionText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
});
