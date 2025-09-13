/**
 * NDI Landlord tenant app theme colors
 * Matching the admin dashboard design system with primary color #2D5A4A
 */

import { Platform } from 'react-native';

const primaryColor = '#2D5A4A'; // Primary green from admin dashboard
const successColor = '#10B981'; // Success green
const errorColor = '#EF4444'; // Error red
const warningColor = '#F59E0B'; // Warning amber

export const Colors = {
  light: {
    text: '#374151', // Cool gray 700
    background: '#FFFFFF',
    tint: primaryColor,
    icon: '#6B7280', // Cool gray 500
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryColor,
    cardBackground: '#F3F4F6', // Cool gray 100
    border: '#E5E7EB', // Cool gray 200
    primary: primaryColor,
    success: successColor,
    error: errorColor,
    warning: warningColor,
    muted: '#9CA3AF', // Cool gray 400
  },
  dark: {
    text: '#F3F4F6',
    background: '#1F2937',
    tint: '#4ADE80', // Lighter green for dark mode
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#4ADE80',
    cardBackground: '#374151',
    border: '#4B5563',
    primary: '#4ADE80',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    muted: '#6B7280',
  },
};

// Color palette for NativeWind classes
export const colorPalette = {
  primary: {
    50: '#F0F8F5',
    100: '#DCEDDF',
    200: '#B6D9BC',
    300: '#8BC596',
    400: '#5F9F6F',
    500: '#2D5A4A', // Main primary color
    600: '#254B3C',
    700: '#1E3C2F',
    800: '#162D23',
    900: '#0F1E18',
  },
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  gray: {
    50: '#F8F9FA',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});