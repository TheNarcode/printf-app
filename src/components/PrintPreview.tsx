import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FileText, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, fontSize, spacing } from '../theme/colors';
import type { UploadedFile } from '../types';
import {
  formatFileSize,
  getFileExtLabel,
  getFileTypeColor,
} from '../utils/formatters';
import { Text } from '../components/Text';

interface PrintPreviewProps {
  file: UploadedFile;
  colorMode: string;
  paperSize: string;
  sides: string;
}

const PrintPreview = memo(
  ({ file, colorMode, paperSize, sides }: PrintPreviewProps) => {
    const { colors } = useTheme();
    const isImage = file.type.includes('image');
    const ext = getFileExtLabel(file.name);
    const fileColor = getFileTypeColor(file.name);

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {isImage && file.uri ? (
          <Image
            source={{ uri: file.uri }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[styles.docPreview, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.docIconBox, { backgroundColor: fileColor + '15' }]}
            >
              {isImage ? (
                <ImageIcon size={32} color={fileColor} strokeWidth={1.5} />
              ) : (
                <FileText size={32} color={fileColor} strokeWidth={1.5} />
              )}
            </View>
            <Text
              style={[styles.fileName, { color: colors.text }]}
              numberOfLines={2}
            >
              {file.name}
            </Text>
            <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
              {ext} · {formatFileSize(file.size)} · {file.pages}{' '}
              {file.pages === 1 ? 'page' : 'pages'}
            </Text>
          </View>
        )}

        <View style={styles.settingsRow}>
          <View style={[styles.tag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
              {paperSize.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
              {colorMode === 'color' ? 'Color' : 'B&W'}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
              {sides === 'single' ? 'Single-sided' : 'Double-sided'}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: 200, backgroundColor: '#F5F5F5' },
  docPreview: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  docIconBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fileName: {
    fontSize: fontSize.md,
    fontFamily: 'Geist-SemiBold',
    textAlign: 'center',
  },
  fileMeta: { fontSize: fontSize.sm },
  settingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    fontSize: fontSize.xxs,
    fontFamily: 'Geist-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default PrintPreview;
