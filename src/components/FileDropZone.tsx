import React, {memo} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {CloudUpload} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import {Text} from '../components/Text';
import GoogleDriveLogo from '../components/GoogleDriveLogo';
import {scale, moderateScale} from '../utils/responsive';

interface FileDropZoneProps {
  onBrowse: () => void;
  onDrive?: () => void;
}

const FileDropZone = memo(({onBrowse, onDrive}: FileDropZoneProps) => {
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
        <Text style={[styles.title, {color: colors.text}]}>Tap to upload files</Text>
        <Text style={[styles.subtitle, {color: colors.textMuted}]}>
          PDF, DOC, DOCX, JPG, PNG supported
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDrive}
        activeOpacity={0.7}
        style={[styles.driveBtn, {borderColor: colors.border}]}>
        <GoogleDriveLogo size={moderateScale(14)} color={colors.textMuted} />
        <Text style={[styles.driveText, {color: colors.textSecondary}]}>Upload from Cloud</Text>
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
  title: {fontSize: moderateScale(16), fontFamily: 'Geist-SemiBold'},
  subtitle: {fontSize: moderateScale(12), textAlign: 'center'},
  driveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6),
    paddingVertical: scale(6),
  },
  driveText: {fontSize: moderateScale(12), fontFamily: 'Geist-Medium', textDecorationLine: 'underline'},
});

export default FileDropZone;
