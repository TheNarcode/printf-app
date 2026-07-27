import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
  italic?: boolean;
  mono?: boolean;
}

export function Text({
  style,
  weight = 'regular',
  italic = false,
  mono = false,
  ...props
}: TextProps) {
  const prefix = mono ? 'GeistMono' : 'Geist';
  let suffix = 'Regular';

  switch (weight) {
    case 'medium':
      suffix = italic ? 'MediumItalic' : 'Medium';
      break;
    case 'semibold':
      suffix = italic ? 'SemiBoldItalic' : 'SemiBold';
      break;
    case 'bold':
      suffix = italic ? 'BoldItalic' : 'Bold';
      break;
    case 'black':
      suffix = italic ? 'BlackItalic' : 'Black';
      break;
    default:
      suffix = italic ? 'RegularItalic' : 'Regular';
      break;
  }

  const fontFamily = `${prefix}-${suffix}`;

  return <RNText style={[{ fontFamily }, style]} {...props} />;
}
