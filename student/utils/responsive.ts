import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base width/height for scaling (standard mobile screen size)
const BASE_WIDTH = 375;

/**
 * Responsive Width
 * Calculates width as a percentage of the screen width.
 */
export const rw = (percentage: number | string): number => {
    const value = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * value) / 100);
};

/**
 * Responsive Height
 * Calculates height as a percentage of the screen height.
 */
export const rh = (percentage: number | string): number => {
    const value = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * value) / 100);
};

/**
 * Responsive Font Size
 * Scales font size based on screen width but with dampening for larger screens.
 */
export const rf = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;

    // Dampen the scaling for larger devices to prevent "huge" UI
    // If scale is > 1, we only take 20% of the extra scale for tighter control
    const dampenedScale = scale > 1 ? 1 + (scale - 1) * 0.2 : scale;

    const newSize = size * dampenedScale;

    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        // Android sometimes scales too aggressively
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
    }
};

/**
 * Normalize Size
 * General purpose scaler for padding, margin, icons etc.
 */
export const normalize = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    // Dampen the scaling for larger devices (20% of extra scale)
    const dampenedScale = scale > 1 ? 1 + (scale - 1) * 0.2 : scale;
    return Math.round(PixelRatio.roundToNearestPixel(size * dampenedScale));
};

export const SCREEN_DIMS = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
