import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface StatusModalProps {
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
}

export function StatusModal({ visible, type, title, message, onClose }: StatusModalProps) {
    const { colors, theme } = useTheme();

    useEffect(() => {
        if (visible) {
            if (type === 'success') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [visible, type]);

    if (!visible) return null;

    const isSuccess = type === 'success';
    const Icon = isSuccess ? CheckCircle : XCircle;
    const color = isSuccess ? '#10B981' : '#EF4444';

    // Gradients adjusted for light/dark modes
    const bgGradient = theme === 'dark'
        ? (isSuccess
            ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']
            : ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)'])
        : (isSuccess
            ? ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.02)']
            : ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.02)']);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <BlurView
                    intensity={20}
                    tint={theme === 'dark' ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.card,
                            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }
                    ]}
                >
                    <LinearGradient
                        colors={bgGradient as any}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                        <Icon size={40} color={color} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    modalContainer: {
        width: '80%',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
    }
});
