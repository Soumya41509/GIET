import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const SNOWFLAKE_COUNT = 25;

const Snowflake = ({ delay }: { delay: number }) => {
    const startX = Math.random() * width;
    const size = Math.random() * 8 + 4;
    const opacity = Math.random() * 0.6 + 0.2;

    const translateY = useSharedValue(-20);
    const translateX = useSharedValue(startX);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(height + 20, {
                    duration: Math.random() * 5000 + 5000,
                    easing: Easing.linear,
                }),
                -1,
                false
            )
        );

        translateX.value = withDelay(
            delay,
            withRepeat(
                withTiming(startX + (Math.random() * 40 - 20), {
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                }),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
        ],
    }));

    return (
        <Animated.Text
            style={[
                styles.snowflake,
                { fontSize: size, opacity },
                animatedStyle,
            ]}
        >
            ❄
        </Animated.Text>
    );
};

export const Snowfall = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(SNOWFLAKE_COUNT)].map((_, i) => (
                <Snowflake key={i} delay={i * 400} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    snowflake: {
        position: 'absolute',
        color: '#FFFFFF',
    },
});
