import React, {memo} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Plus} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {scale, moderateScale} from '../utils/responsive';

interface FABProps {
  onPress: () => void;
}

const FAB = memo(({onPress}: FABProps) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.fab,
        {backgroundColor: colors.primary, bottom: insets.bottom + scale(36)},
      ]}>
      <Plus size={moderateScale(22)} color={colors.background} strokeWidth={2.5} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: scale(28),
    width: scale(52),
    height: scale(52),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});

export default FAB;