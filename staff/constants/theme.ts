
import { Platform } from 'react-native';

const primary = '#8B5CF6';
const primaryDark = '#7C3AED';
const primaryLight = '#A78BFA';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F8FAFC',
    tint: primary,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primary,
    primary: primary,
    primaryDark: primaryDark,
    primaryLight: primaryLight,
    status: {
      pending: '#FACC15',
      submitted: '#F97316',
      inProgress: '#3B82F6',
      resolved: '#22C55E',
      highPriority: '#EF4444',
    },
    card: '#FFFFFF',
    border: '#E2E8F0',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primary,
    primary: primary,
    primaryDark: primaryDark,
    primaryLight: primaryLight,
    status: {
      pending: '#FACC15',
      submitted: '#F97316',
      inProgress: '#3B82F6',
      resolved: '#22C55E',
      highPriority: '#EF4444',
    },
    card: '#2A2A2A',
    border: '#404040',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Times New Roman',
    rounded: 'System',
    mono: 'Courier New',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'sans-serif-rounded',
    mono: 'monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-rounded',
    mono: 'monospace',
  },
});
