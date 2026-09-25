import { View, type ViewProps, Platform } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewVariant = 'background' | 'surface' | 'card';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: ThemedViewVariant;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'background',
  ...otherProps 
}: ThemedViewProps) {
  // Determine which color key to use based on variant
  const colorKey = variant === 'card' ? 'card' : variant === 'surface' ? 'surface' : 'background';
  
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    colorKey as 'background'
  );

  // Web環境でのフラッシュ防止用スタイル
  const webOptimizedStyle = Platform.OS === 'web' 
    ? {
        // 即座に背景色を適用し、遷移時のフラッシュを防ぐ
        backgroundColor,
        transition: 'none',
        // レンダリング最適化
        willChange: 'auto',
      }
    : { backgroundColor };

  return <View style={[webOptimizedStyle, style]} {...otherProps} />;
}
