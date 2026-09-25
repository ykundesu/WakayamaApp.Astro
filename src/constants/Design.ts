/**
 * Design tokens for spacing, radius, shadows, and other visual properties.
 * Centralized to ensure consistency across the app.
 */

export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Shadow = {
  light: {
    none: {},
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.10,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  },
  dark: {
    none: {},
    sm: {
      shadowColor: '#fff',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    md: {
      shadowColor: '#fff',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    lg: {
      shadowColor: '#fff',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
  },
} as const;

export const IconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

export const MinTouchTarget = 44; // iOS HIG minimum touch target

export const MotionDuration = {
  instant: 100,
  quick: 180,
  regular: 260,
  slow: 380,
  deliberate: 520,
} as const;

export const MotionEasing = {
  standard: [0.2, 0.8, 0.2, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
} as const;

export const MotionSpring = {
  gentle: { damping: 16, stiffness: 180 },
  lively: { damping: 14, stiffness: 220 },
  snappy: { damping: 12, stiffness: 260 },
} as const;
