import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

interface PumpingGradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  icon?: keyof typeof Feather.glyphMap;
  textColor?: string;
  width?: DimensionValue;
  height?: number;
}

const PumpingGradientButton: React.FC<PumpingGradientButtonProps> = ({
  title,
  onPress,
  colors = ['#0EA5E9', '#3B82F6', '#0284C7', '#38BDF8', '#0EA5E9'], // App Theme Blue/Cyan Spectrum Mix
  icon,
  textColor = '#FFFFFF',
  width = '100%',
  height = 56,
}) => {
  const scaleAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 }],
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '0deg' },
      { scale: 1 }
    ],
  }));

  // Ensure colors has at least two elements to satisfy LinearGradient requirements
  const safeColors = (colors && colors.length >= 2 ? colors : ['#f2a9acff', '#FECFEF']) as [string, string, ...string[]];

  return (
    <Animated.View style={[styles.container, { width }, animatedContainerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.button, { height }]}
      >
        <View style={styles.gradientContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.gradientWrapper, animatedGradientStyle]}>
            <LinearGradient
              colors={safeColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <View style={styles.content}>
          {icon && <Feather name={icon} size={24} color={textColor} style={styles.icon} />}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientWrapper: {
    width: '200%', // Larger than container to cover rotation
    height: '400%', // Much taller for rotation
    top: '-150%', // Centering
    left: '-50%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default PumpingGradientButton;
