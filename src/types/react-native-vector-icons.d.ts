declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextProps, ImageSourcePropType } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string
    ): Promise<ImageSourcePropType>;
    static getImageSourceSync(
      name: string,
      size?: number,
      color?: string
    ): ImageSourcePropType;
    static loadFont(
      file?: string
    ): Promise<void>;
    static hasIcon(name: string): boolean;
  }
} 