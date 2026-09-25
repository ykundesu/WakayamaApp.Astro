import { createContext, useContext } from 'react';
import { Pressable } from 'react-native';
export const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });
export const useBottomTabBarHeight = () => 80;
export const FocusContext = createContext(true);
export const useIsFocused = () => useContext(FocusContext);
export const PlatformPressable = Pressable;
export type BottomTabBarButtonProps = any;
