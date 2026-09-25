import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, PressableProps } from 'react-native';

type NativePressable = typeof Pressable;

export type DragSafePressableProps = PressableProps & {
  /**
   * 押下中に適用する不透明度。TouchableOpacity と同等の挙動を提供するためのオプション。
   */
  activeOpacity?: number;
  /**
   * スクロールなどのドラッグ操作とみなす移動のしきい値（px）。
   */
  movementThreshold?: number;
};

type PressableStyleProp = PressableProps['style'];

const DEFAULT_ACTIVE_OPACITY = 0.7;
const DEFAULT_MOVEMENT_THRESHOLD = 6;

/**
 * スクロール操作時にタップ演出が発火しないようガードする Pressable。
 *
 * - 指が一定距離以上移動した場合は押下状態を解除し、onPress 系コールバックを抑止します。
 * - TouchableOpacity と同様の `activeOpacity` 指定に対応します。
 */
export const DragSafePressable = forwardRef<React.ElementRef<NativePressable>, DragSafePressableProps>(
  (
    {
      activeOpacity = DEFAULT_ACTIVE_OPACITY,
      movementThreshold = DEFAULT_MOVEMENT_THRESHOLD,
      style,
      onPressIn,
      onPressOut,
      onPress,
      onLongPress,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const startPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const moved = useRef(false);
    const [isActive, setIsActive] = useState(false);

    const resetState = useCallback(() => {
      moved.current = false;
      setIsActive(false);
    }, []);

    const handleTouchStart = useCallback(
      (event: GestureResponderEvent) => {
        const { pageX, pageY } = event.nativeEvent;
        startPoint.current = { x: pageX, y: pageY };
        moved.current = false;
      },
      [],
    );

    const handleTouchMove = useCallback(
      (event: GestureResponderEvent) => {
        if (moved.current) {
          return;
        }
        const { pageX, pageY } = event.nativeEvent;
        const dx = Math.abs(pageX - startPoint.current.x);
        const dy = Math.abs(pageY - startPoint.current.y);

        if (dx > movementThreshold || dy > movementThreshold) {
          moved.current = true;
          setIsActive(false);
        }
      },
      [movementThreshold],
    );

    const invokeIfAllowed = useCallback(
      (callback: ((event: GestureResponderEvent) => void) | null | undefined, event: GestureResponderEvent) => {
        if (!moved.current) {
          callback?.(event);
        }
      },
      [],
    );

    const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
      (event) => {
        if (disabled) {
          return;
        }
        moved.current = false;
        setIsActive(true);
        invokeIfAllowed(onPressIn, event);
      },
      [disabled, invokeIfAllowed, onPressIn],
    );

    const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
      (event) => {
        const wasMoved = moved.current;
        setIsActive(false);
        if (!wasMoved) {
          onPressOut?.(event);
        }
        moved.current = false;
      },
      [onPressOut],
    );

    const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
      (event) => {
        if (!moved.current) {
          onPress?.(event);
        }
        resetState();
      },
      [onPress, resetState],
    );

    const handleLongPress = useCallback<NonNullable<PressableProps['onLongPress']>>(
      (event) => {
        if (!moved.current) {
          onLongPress?.(event);
        }
      },
      [onLongPress],
    );

    const resolvedStyle = useMemo<PressableStyleProp>(() => {
      if (typeof style === 'function') {
        return (state) => {
          const base = style({ ...state, pressed: state.pressed && isActive });
          if (!isActive || activeOpacity === 1) {
            return base;
          }
          return [base, { opacity: activeOpacity }];
        };
      }

      if (!isActive || activeOpacity === 1) {
        return style;
      }

      return [style, { opacity: activeOpacity }];
    }, [style, isActive, activeOpacity]);

    return (
      <Pressable
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
        style={resolvedStyle}
        {...rest}
      />
    );
  },
);

DragSafePressable.displayName = 'DragSafePressable';

export type DragSafeTouchableOpacityProps = DragSafePressableProps;

export const DragSafeTouchableOpacity = forwardRef<React.ElementRef<NativePressable>, DragSafeTouchableOpacityProps>((props, ref) => (
  <DragSafePressable ref={ref} {...props} />
));

DragSafeTouchableOpacity.displayName = 'DragSafeTouchableOpacity';


