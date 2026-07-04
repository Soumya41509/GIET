import { useTheme } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: keyof typeof Feather.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'No Data Found',
    message = 'Everything looks clear for now.',
    icon = 'inbox'
}) => {
    const { colors, theme } = useTheme();
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 2000 }),
                withTiming(0, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={styles.container}>
            <Animated.View
                entering={FadeInDown.delay(200).duration(800)}
                style={[styles.iconContainer, animatedIconStyle]}
            >
                <View style={[styles.glow, { backgroundColor: colors.primary + '20' }]} />
                <Feather name={icon} size={64} color={colors.primary} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    iconContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    glow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        filter: 'blur(30px)',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
