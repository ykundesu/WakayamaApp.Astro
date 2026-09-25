import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import {
  motionTimingConfig,
  MotionDurationKey,
  MotionEasingKey,
} from '@/utils/motion';

export type MountAnimationOptions = {
  delay?: number;
  duration?: MotionDurationKey;
  easing?: MotionEasingKey;
  axis?: 'x' | 'y';
  offset?: number;
  fromOpacity?: number;
  trigger?: unknown;
};

export function useMountAnimation({
  delay = 0,
  duration = 'regular',
  easing = 'entrance',
  axis = 'y',
  offset = 12,
  fromOpacity = 0,
  trigger,
}: MountAnimationOptions = {}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;

  const initial = useRef(true);
  useEffect(() => {
    if (initial.current) { initial.current = false; return; }
    opacity.setValue(fromOpacity);
    translate.setValue(offset);

    const timingConfig = motionTimingConfig(duration, easing);
    const translateConfig = { ...timingConfig, useNativeDriver: true };
    const opacityConfig = { ...timingConfig, useNativeDriver: true };

    const run = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        ...opacityConfig,
      }),
      Animated.timing(translate, {
        toValue: 0,
        ...translateConfig,
      }),
    ]);

    const animation = delay ? Animated.sequence([Animated.delay(delay), run]) : run;
    animation.start();

    return () => {
      animation.stop();
    };
  }, [axis, delay, duration, easing, fromOpacity, offset, opacity, translate, trigger]);

  return {
    opacity,
    transform: [
      axis === 'x'
        ? { translateX: translate }
        : { translateY: translate },
    ],
  };
}
