import React, {memo, useCallback} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {FileText, Image as ImageIcon, X} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import type {UploadedFile} from '../types';
import {formatFileSize, getFileExtLabel, getFileTypeColor} from '../utils/formatters';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface FileCardProps {
  file: UploadedFile;
  onRemove?: (id: string) => void;
}

const FileCard = memo(({file, onRemove}: FileCardProps) => {
  const {colors} = useTheme();
  const ext = getFileExtLabel(file.name);
  const fileColor = getFileTypeColor(file.name);
  const isImage = file.type.includes('image');
  const Icon = isImage ? ImageIcon : FileText;

  const handleRemove = useCallback(() => onRemove?.(file.id), [file.id, onRemove]);

  return (
    <View style={[styles.container, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={[styles.iconBox, {backgroundColor: fileColor + '18'}]}>
        <Icon size={moderateScale(16)} color={fileColor} strokeWidth={1.8} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, {color: colors.text}]} numberOfLines={1}>{file.name}</Text>
        <Text style={[styles.meta, {color: colors.textMuted}]}>
          {ext} · {formatFileSize(file.size)} · {file.pages} {file.pages === 1 ? 'page' : 'pages'}
        </Text>
      </View>

      {onRemove && (
        <TouchableOpacity onPress={handleRemove} hitSlop={{top: 12, right: 12, bottom: 12, left: 12}} style={styles.removeBtn}>
          <X size={moderateScale(14)} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    padding: scale(10), borderRadius: scale(10),
    borderWidth: 1, gap: scale(10),
  },
  iconBox: {
    width: scale(36), height: scale(36), borderRadius: scale(8),
    justifyContent: 'center', alignItems: 'center',
  },
  info: {flex: 1, gap: 2},
  name: {fontSize: moderateScale(14), fontFamily: 'Geist-Medium'},
  meta: {fontSize: moderateScale(10)},
  removeBtn: {padding: scale(4)},
});

export default FileCard;
