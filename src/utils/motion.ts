import { Easing } from 'react-native';
import {
  MotionDuration,
  MotionEasing,
  MotionSpring,
} from '@/constants/Design';

export type MotionDurationKey = keyof typeof MotionDuration;
export type MotionEasingKey = keyof typeof MotionEasing;
export type MotionSpringKey = keyof typeof MotionSpring;

export const motionDuration = (key: MotionDurationKey) => MotionDuration[key];

export const motionEasing = (key: MotionEasingKey) => {
  const [x1, y1, x2, y2] = MotionEasing[key];
  return Easing.bezier(x1, y1, x2, y2);
};

export const motionTimingConfig = (
  duration: MotionDurationKey,
  easing: MotionEasingKey,
) => ({
  duration: motionDuration(duration),
  easing: motionEasing(easing),
});

export const motionSpringConfig = (key: MotionSpringKey) => MotionSpring[key];
