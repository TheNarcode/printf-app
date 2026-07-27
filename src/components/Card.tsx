import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface CardProps {
  variant?: 'default' | 'surface' | 'elevated';
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  style,
  children,
  onPress,
  activeOpacity = 0.7,
}) => {
  const { colors, commonStyles } = useTheme();

  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'surface':
        return commonStyles.surfaceCard;
      case 'elevated':
        return {
          ...commonStyles.card,
          backgroundColor: colors.cardElevated,
        };
      case 'default':
      default:
        return commonStyles.card;
    }
  };

  const cardStyle = getCardStyle();

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};