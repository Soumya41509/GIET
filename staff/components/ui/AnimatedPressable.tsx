import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
    children: React.ReactNode;
    scaleTo?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    children,
    scaleTo = 0.96,
    onPressIn,
    onPressOut,
    onPress,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressableBase
            {...props}
            onPressIn={(e) => {
                scale.value = withSpring(scaleTo, { damping: 10, stiffness: 200 });
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withSpring(1, { damping: 10, stiffness: 200 });
                onPressOut?.(e);
            }}
            onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress?.(e);
            }}
            style={[animatedStyle, props.style as any]}
        >
            {children}
        </AnimatedPressableBase>
    );
};
