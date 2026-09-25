import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { motionTimingConfig } from '@/utils/motion';

let Haptics: typeof import('expo-haptics') | null = null;

export function HapticTab({
  style,
  onPressIn,
  onPressOut,
  ...rest
}: BottomTabBarButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animatedScaleStyle = { transform: [{ scale }] };

  const handlePressIn: BottomTabBarButtonProps['onPressIn'] = (event) => {
    if (process.env.EXPO_OS === 'ios') {
      if (!Haptics) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        Haptics = require('expo-haptics');
      }
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.timing(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      ...motionTimingConfig('quick', 'standard'),
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut: BottomTabBarButtonProps['onPressOut'] = (event) => {
    Animated.timing(scale, {
      toValue: 1,
      useNativeDriver: true,
      ...motionTimingConfig('quick', 'standard'),
    }).start();
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[styles.container, animatedScaleStyle]}>
      <PlatformPressable
        {...rest}
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
