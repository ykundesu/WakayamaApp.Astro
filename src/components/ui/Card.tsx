import React from 'react';
import { ViewProps } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Radius, Shadow } from '@/constants/Design';

export type CardProps = ViewProps & {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  noPadding?: boolean;
};

export function Card({ 
  style, 
  elevation = 'md',
  noPadding = false,
  ...props 
}: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const baseShadow = elevation === 'none' ? {} : Shadow[scheme][elevation];
  
  return (
    <ThemedView
      variant="card"
      style={[
        { 
          borderRadius: Radius.xl, 
          padding: noPadding ? 0 : Spacing.md,
        }, 
        baseShadow, 
        style
      ]}
      {...props}
    />
  );
}

