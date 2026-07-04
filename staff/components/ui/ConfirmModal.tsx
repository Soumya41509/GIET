import { useTheme } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, Modal, StyleSheet, Text, View, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import Animated, { FadeOut, SlideInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from './AnimatedPressable';

const { width } = Dimensions.get('window');

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    icon?: keyof typeof Feather.glyphMap;
    type?: 'primary' | 'danger' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    icon = 'help-circle',
    type = 'primary'
}) => {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();

    const getColors = (): readonly [string, string, ...string[]] => {
        switch (type) {
            case 'danger': return ['#EF4444', '#DC2626'];
            case 'success': return ['#10B981', '#059669'];
            default: return ['#8B5CF6', '#7C3AED'];
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onCancel}
            >
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={theme === 'dark' ? "dark" : "light"} />

                <TouchableWithoutFeedback>
                    <Animated.View
                        entering={SlideInDown.duration(300).springify().damping(18)}
                        exiting={FadeOut.duration(200)}
                        style={[
                            styles.modalContainer,
                            {
                                backgroundColor: colors.card,
                                paddingBottom: Math.max(insets.bottom, 24)
                            }
                        ]}
                    >
                        <View style={styles.modalIndicator} />

                        <View style={styles.content}>
                            <View style={styles.header}>
                                <View style={[styles.iconContainer, {
                                    backgroundColor: type === 'danger' ? '#EF444415' : (type === 'success' ? '#10B98115' : colors.primary + '15'),
                                    borderColor: type === 'danger' ? '#EF444430' : (type === 'success' ? '#10B98130' : colors.primary + '30')
                                }]}>
                                    <Feather name={icon} size={32} color={type === 'primary' ? colors.primary : (type === 'danger' ? '#EF4444' : '#10B981')} />
                                </View>
                            </View>

                            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                            <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>

                            <View style={styles.footer}>
                                <AnimatedPressable
                                    style={[styles.button, styles.cancelButton, { backgroundColor: colors.border + '30' }]}
                                    onPress={onCancel}
                                >
                                    <Text style={[styles.cancelText, { color: colors.text }]}>{cancelText}</Text>
                                </AnimatedPressable>

                                <AnimatedPressable
                                    style={[styles.button, styles.confirmButton]}
                                    onPress={onConfirm}
                                >
                                    <LinearGradient
                                        colors={getColors()}
                                        style={styles.actionGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.confirmText}>{confirmText}</Text>
                                    </LinearGradient>
                                </AnimatedPressable>
                            </View>
                        </View>
                    </Animated.View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#FFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 24,
        paddingTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
    },
    modalIndicator: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(128,128,128,0.2)',
        alignSelf: 'center',
        marginBottom: 20,
    },
    content: {
        alignItems: 'center',
    },
    header: {
        marginBottom: 16,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 58,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cancelButton: {
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    confirmButton: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    actionGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontWeight: '700',
        fontSize: 16,
    },
    confirmText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
});
