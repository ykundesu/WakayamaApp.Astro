const React = require('react');
const {
  Animated: RNAnimated,
  Easing: RNEasing,
  FlatList,
  ScrollView,
  View,
} = require('react-native');

function stripAnimationProps(props) {
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

function createWrapper(Component) {
  return React.forwardRef((props, ref) => React.createElement(Component, { ...stripAnimationProps(props), ref }));
}

const AnimatedView = createWrapper(RNAnimated.View);
const AnimatedScrollView = createWrapper(RNAnimated.ScrollView || ScrollView);
const AnimatedFlatList = createWrapper(RNAnimated.FlatList || FlatList);

const AnimatedDefault = {
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  createAnimatedComponent(Component) {
    return createWrapper(Component);
  },
};

function linearInterpolate(value, inputRange, outputRange) {
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

const chainableNoop = new Proxy(
  function (...args) {
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

function useSharedValue(initialValue) {
  return React.useRef({ value: initialValue }).current;
}

function useAnimatedStyle(updater) {
  return updater();
}

function useAnimatedRef() {
  return React.useRef(null);
}

function useScrollViewOffset() {
  return useSharedValue(0);
}

function withTiming(value, _config, callback) {
  if (typeof callback === 'function') {
    callback(true);
  }
  return value;
}

function withSequence(...values) {
  return values[values.length - 1];
}

function withRepeat(value) {
  return value;
}

function withDelay(_delay, value) {
  return value;
}

function runOnJS(fn) {
  return (...args) => fn(...args);
}

function interpolateColor(value, inputRange, outputRange) {
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

const transitionBuilder = new Proxy(
  {},
  {
    get() {
      return () => transitionBuilder;
    },
  },
);

const exportsObject = {
  __esModule: true,
  default: AnimatedDefault,
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  createAnimatedComponent: AnimatedDefault.createAnimatedComponent,
  Easing: RNEasing,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useScrollViewOffset,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  interpolate: linearInterpolate,
  interpolateColor,
  FadeIn: transitionBuilder,
  FadeOut: transitionBuilder,
  FadeInDown: transitionBuilder,
  FadeOutDown: transitionBuilder,
  cancelAnimation: () => {},
  useEvent: () => chainableNoop,
  useHandler: () => chainableNoop,
  useAnimatedGestureHandler: () => chainableNoop,
  useAnimatedProps: () => ({}),
  useAnimatedReaction: () => {},
  useDerivedValue: (updater) => ({ value: updater() }),
  useAnimatedScrollHandler: () => chainableNoop,
  makeMutable: (value) => ({ value }),
  runOnUI: (fn) => (...args) => fn(...args),
  useFrameCallback: () => {},
  measure: () => null,
};

module.exports = new Proxy(exportsObject, {
  get(target, property) {
    if (property in target) {
      return target[property];
    }

    return chainableNoop;
  },
});
