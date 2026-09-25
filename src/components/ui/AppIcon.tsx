import React from 'react';
import { Text } from 'react-native';
import glyphMap from '@/platform/icon-glyphs.json';
export type AppIconProps = {name: string; size?: number; color?: string; style?: any; [key: string]: any};
export const AppIcon = Object.assign(React.forwardRef<any, AppIconProps>(({name,size=24,color,style,...props},ref) => <Text selectable={false} {...props} ref={ref} style={[{fontFamily:'MaterialCommunityIcons',fontSize:size,color,fontWeight:'normal',fontStyle:'normal'},style]}>{String.fromCodePoint((glyphMap as Record<string,number>)[name] || glyphMap['alert-circle-outline'])}</Text>), {glyphMap});
export default AppIcon;
