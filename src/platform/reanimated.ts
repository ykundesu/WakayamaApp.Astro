import React from 'react';
import {Animated as RNAnimated, Easing as RNEasing, FlatList, ScrollView, View} from 'react-native';
function stripAnimationProps(props: any) {
  if (!props) {
    return props;
  }

  const {
    entering,
    exiting,
    layout,
    sharedTransitionTag,
    itemLayoutAnimation,
    ...rest
  } = props;

  return rest;
}

function createWrapper(Component: any) {
  return React.forwardRef<any, any>((props, ref) => React.createElement(Component, { ...stripAnimationProps(props), ref }));
}

const AnimatedView = createWrapper(RNAnimated.View);
const AnimatedScrollView = createWrapper(RNAnimated.ScrollView || ScrollView);
const AnimatedFlatList = createWrapper(RNAnimated.FlatList || FlatList);

const AnimatedDefault = {
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  createAnimatedComponent(Component: any) {
    return createWrapper(Component);
  },
};

function linearInterpolate(value: number, inputRange: number[], outputRange: number[]) {
  if (!Array.isArray(inputRange) || !Array.isArray(outputRange) || inputRange.length < 2 || outputRange.length < 2) {
    return outputRange?.[0] ?? value;
  }

  if (value <= inputRange[0]) {
    return outputRange[0];
  }

  for (let index = 1; index < inputRange.length; index += 1) {
    if (value <= inputRange[index]) {
      const startInput = inputRange[index - 1];
      const endInput = inputRange[index];
      const startOutput = outputRange[index - 1];
      const endOutput = outputRange[index];
      const progress = endInput === startInput ? 0 : (value - startInput) / (endInput - startInput);
      return startOutput + (endOutput - startOutput) * progress;
    }
  }

  return outputRange[outputRange.length - 1];
}

const chainableNoop: any = new Proxy(
  function (...args: any[]) {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      callback(true);
    }
    return args[0];
  },
  {
    get(_target, property) {
      if (property === '__esModule') return true;
      if (property === 'default') return chainableNoop;
      return chainableNoop;
    },
    apply(_target, _thisArg, args) {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback(true);
      }
      return args[0];
    },
  },
);

function useSharedValue<T>(initialValue: T) {
  return React.useRef({ value: initialValue }).current;
}

function useAnimatedStyle<T>(updater: () => T) {
  return updater();
}

function useAnimatedRef() {
  return React.useRef(null);
}

function useScrollViewOffset() {
  return useSharedValue(0);
}

function withTiming<T>(value: T, _config?: any, callback?: (done: boolean) => void) {
  if (typeof callback === 'function') {
    callback(true);
  }
  return value;
}

function withSequence<T>(...values: T[]) {
  return values[values.length - 1];
}

function withRepeat<T>(value: T, ..._options: any[]) {
  return value;
}

function withDelay<T>(_delay: number, value: T) {
  return value;
}

function runOnJS(fn: (...args: any[]) => any) {
  return (...args: any[]) => fn(...args);
}

function interpolateColor(value: number, inputRange: number[], outputRange: string[]) {
  if (!Array.isArray(outputRange) || outputRange.length === 0) {
    return value;
  }
  if (!Array.isArray(inputRange) || inputRange.length < 2) {
    return outputRange[0];
  }
  return value >= (inputRange[0] + inputRange[inputRange.length - 1]) / 2
    ? outputRange[outputRange.length - 1]
    : outputRange[0];
}

const transitionBuilder: any = new Proxy(
  {},
  {
    get() {
      return () => transitionBuilder;
    },
  },
);

export default AnimatedDefault;
export {useSharedValue,useAnimatedStyle,useAnimatedRef,useScrollViewOffset,withTiming,withSequence,withRepeat,withDelay,runOnJS,interpolateColor};
export const Easing = RNEasing;
export const FadeIn = transitionBuilder, FadeOut = transitionBuilder, FadeInDown = transitionBuilder, FadeOutDown = transitionBuilder;
export const interpolate = linearInterpolate;
export const cancelAnimation = () => {};
