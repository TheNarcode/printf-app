import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';

export interface CustomSpinnerProps {
  size?: number | 'small' | 'large';
  color?: string;
  label?: string;
  labelStyle?: TextStyle;
  direction?: 'vertical' | 'horizontal';
  style?: ViewStyle;
}

export const CustomSpinner: React.FC<CustomSpinnerProps> = ({
  size = 24,
  color,
  label,
  labelStyle,
  direction = 'vertical',
  style,
}) => {
  const { colors } = useTheme();

  // Normalize size for compatibility with ActivityIndicator props or explicit numbers
  const spinnerSize = typeof size === 'number' ? size : size === 'large' ? 32 : 18;
  const spinnerColor = color || colors.primary;

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerCircle = (
    <Animated.View
      style={[
        {
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: spinnerSize / 2,
          borderWidth: Math.max(2, Math.round(spinnerSize / 10)),
          borderColor: spinnerColor,
          borderTopColor: 'transparent',
          transform: [{ rotate: spin }],
        },
        !label ? style : undefined,
      ]}
    />
  );

  if (!label) {
    return spinnerCircle;
  }

  const isHorizontal = direction === 'horizontal';

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: isHorizontal ? 'row' : 'column',
        },
        style,
      ]}
    >
      {spinnerCircle}
      <Text
        weight="medium"
        style={[
          {
            fontSize: 14,
            color: color || colors.textSecondary,
            marginTop: isHorizontal ? 0 : 16,
            marginLeft: isHorizontal ? 10 : 0,
          },
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

