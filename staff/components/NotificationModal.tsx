import { useTheme } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { AnimatedPressable } from './ui/AnimatedPressable';

const { width } = Dimensions.get('window');

interface NotificationModalProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onViewAction?: () => void;
    deadline?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
    visible,
    title,
    message,
    onClose,
    onViewAction,
    deadline
}) => {
    const { colors, theme } = useTheme();
    if (!visible) return null;

    const formatDeadline = (isoString?: string) => {
        if (!isoString) return null;
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' +
                date.toLocaleDateString([], { day: '2-digit', month: 'short' });
        } catch (e) {
            return null;
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />

                <Animated.View
                    entering={ZoomIn.duration(250)}
                    exiting={FadeOut.duration(200)}
                    style={[styles.modalContainer, { shadowColor: colors.primary }]}
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
                                    <View style={[styles.iconContainer, { backgroundColor: theme === 'dark' ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE' }]}>
                                        <Feather name="bell" size={24} color={colors.primary} />
                                    </View>
                                    <AnimatedPressable
                                        onPress={onClose}
                                        style={[styles.closeButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                    >
                                        <Feather name="x" size={18} color={colors.text} />
                                    </AnimatedPressable>
                                </View>

                                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                                <Text style={[styles.message, { color: theme === 'dark' ? '#94A3B8' : '#64748B' }]}>{message}</Text>

                                {deadline && (
                                    <View style={[styles.deadlineBox, { backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#FFF7ED' }]}>
                                        <Feather name="clock" size={14} color="#F59E0B" />
                                        <Text style={styles.deadlineText}>Deadline: {formatDeadline(deadline)}</Text>
                                    </View>
                                )}

                                <View style={styles.footer}>
                                    <AnimatedPressable
                                        style={styles.actionButton}
                                        onPress={() => {
                                            if (onViewAction) {
                                                onViewAction();
                                            } else {
                                                onClose();
                                            }
                                        }}
                                    >
                                        <LinearGradient
                                            colors={['#0EA5E9', '#2563EB']}
                                            style={styles.actionGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.actionText}>View Details</Text>
                                            <Feather name="arrow-right" size={16} color="#FFF" />
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        borderColor: 'rgba(14, 165, 233, 0.2)',
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
    message: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 10, // Adjusted for deadline box
        fontWeight: '500',
    },
    deadlineBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.1)',
    },
    deadlineText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#D97706',
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
