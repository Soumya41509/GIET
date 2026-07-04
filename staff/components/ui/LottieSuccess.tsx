import { useTheme } from '@/contexts/ThemeContext';
import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LottieSuccessProps {
    size?: number;
    autoPlay?: boolean;
    loop?: boolean;
}

export const LottieSuccess: React.FC<LottieSuccessProps> = ({
    size = 150,
    autoPlay = true,
    loop = false
}) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <LottieView
                source={{ uri: 'https://lottie.host/8e89f5bc-5d9c-4e8c-8594-852652a92c01/UoWp0v27Iu.json' }} // Modern clean checkmark
                autoPlay={autoPlay}
                loop={loop}
                style={{ width: size, height: size }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
