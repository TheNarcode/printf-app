import React, {memo} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {CloudUpload} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface FileDropZoneProps {
  onBrowse: () => void;
}

const FileDropZone = memo(({onBrowse}: FileDropZoneProps) => {
  const {colors} = useTheme();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={onBrowse}
        activeOpacity={0.7}
        style={[styles.container, {borderColor: colors.borderDashed, backgroundColor: colors.shimmer}]}>
        <View style={[styles.iconCircle, {backgroundColor: colors.primaryBg}]}>
          <CloudUpload size={moderateScale(24)} color={colors.textSecondary} strokeWidth={1.5} />
        </View>
        <Text weight="semibold" style={[styles.title, {color: colors.text}]}>Upload files here</Text>
        <Text style={[styles.subtitle, {color: colors.textMuted}]}>
          PDF, JPEG, JPG, PNG supported
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {gap: scale(10)},
  container: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: scale(14),
    paddingVertical: scale(40),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    gap: scale(10),
  },
  iconCircle: {
    width: scale(48), height: scale(48), borderRadius: scale(24),
    justifyContent: 'center', alignItems: 'center', marginBottom: scale(6),
  },
  title: {fontSize: moderateScale(16)},
  subtitle: {fontSize: moderateScale(12), textAlign: 'center'},
});

export default FileDropZone;