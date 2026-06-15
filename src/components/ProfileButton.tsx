import React, {memo} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {User} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface ProfileButtonProps {
  userName?: string | null;
  onPress: () => void;
}

const ProfileButton = memo(({userName, onPress}: ProfileButtonProps) => {
  const {colors} = useTheme();
  const initial = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, {backgroundColor: colors.surface, borderColor: colors.border}]}>
      {userName ? (
        <Text style={[styles.initial, {color: colors.text}]}>{initial}</Text>
      ) : (
        <User size={moderateScale(16)} color={colors.textMuted} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: scale(36), height: scale(36), borderRadius: scale(18),
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  initial: {fontSize: moderateScale(14), fontFamily: 'Geist-SemiBold'},
});

export default ProfileButton;
