import React, {memo} from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import {User} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface ProfileButtonProps {
  userName?: string | null;
  userPhoto?: string | null;
  onPress: () => void;
}

const ProfileButton = memo(({userName, userPhoto, onPress}: ProfileButtonProps) => {
  const {colors} = useTheme();
  const initial = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {backgroundColor: colors.surface, borderColor: colors.border},
        userPhoto ? {borderWidth: 0} : {},
      ]}>
      {userPhoto ? (
        <Image source={{uri: userPhoto}} style={styles.image} />
      ) : userName ? (
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
    overflow: 'hidden',
  },
  initial: {fontSize: moderateScale(14), fontFamily: 'Geist-SemiBold'},
  image: {width: '100%', height: '100%'},
});

export default ProfileButton;
