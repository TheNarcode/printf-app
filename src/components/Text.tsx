import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
  italic?: boolean;
}

export function Text({
  style,
  weight = 'regular',
  italic = false,
  ...props
}: TextProps) {
  let fontFamily = 'Geist-Regular';

  switch (weight) {
    case 'medium':
      fontFamily = italic ? 'Geist-MediumItalic' : 'Geist-Medium';
      break;
    case 'semibold':
      fontFamily = italic ? 'Geist-SemiBoldItalic' : 'Geist-SemiBold';
      break;
    case 'bold':
      fontFamily = italic ? 'Geist-BoldItalic' : 'Geist-Bold';
      break;
    case 'black':
      fontFamily = italic ? 'Geist-BlackItalic' : 'Geist-Black';
      break;
    default:
      fontFamily = italic ? 'Geist-RegularItalic' : 'Geist-Regular';
      break;
  }

  // Inter font is linked natively, we can just apply the fontFamily
  return <RNText style={[{ fontFamily }, style]} {...props} />;
}
