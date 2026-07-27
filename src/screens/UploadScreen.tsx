import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { useFileUpload } from '../hooks/useFileUpload';
import Header from '../components/Header';
import FileDropZone from '../components/FileDropZone';
import FileCard from '../components/FileCard';
import { Button } from '../components/Button';
import { CustomSpinner } from '../components/CustomSpinner';
import { formatFileSize } from '../utils/formatters';
import { startUploads } from '../services/fileUploadManager';
import type { UploadedFile } from '../types';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';
import { CustomAlertAPI } from '../components/CustomAlert';

interface Props {
  navigation: any;
}

function FileSeparator() {
  return <View style={{ height: scale(8) }} />;
}

export default function UploadScreen({ navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { files, addFiles, removeFile } = usePrintJob();
  const { getValidToken } = useAuth();
  const { assertOnline } = useNetwork();
  const { pickFiles, isReading } = useFileUpload();

  const totalSize = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);

  const handleBrowse = useCallback(async () => {
    const picked = await pickFiles();
    if (picked.length > 0) {
      const unique: UploadedFile[] = [];
      const largeFiles: string[] = [];
      const duplicateFiles: string[] = [];

      for (const p of picked) {
        if (p.size > 50 * 1024 * 1024) {
          largeFiles.push(p.name);
          continue;
        }

        const isDuplicate =
          files.some(f => f.name === p.name && f.size === p.size) ||
          unique.some(f => f.name === p.name && f.size === p.size);
        if (isDuplicate) {
          duplicateFiles.push(p.name);
        } else {
          unique.push(p);
        }
      }

      if (unique.length > 0) addFiles(unique);

      if (largeFiles.length > 0 && duplicateFiles.length > 0) {
        CustomAlertAPI.alert(
          'File Selection Notice',
          `We skipped some files to keep your queue running smoothly:\n\n• ${largeFiles.length} ${largeFiles.length === 1 ? 'file' : 'files'} exceeded the 50MB limit\n• ${duplicateFiles.length} ${duplicateFiles.length === 1 ? 'file was' : 'files were'} already added`,
        );
      } else if (largeFiles.length > 0) {
        CustomAlertAPI.alert(
          'File Too Large',
          `Our maximum file size is 50MB to ensure reliable processing. ${largeFiles.length === 1 ? '1 file was' : `${largeFiles.length} files were`} skipped. Please compress and try again.`,
        );
      } else if (duplicateFiles.length > 0) {
        CustomAlertAPI.alert(
          'Already in Queue',
          `You've already added ${duplicateFiles.length === 1 ? 'this file' : 'some of these files'}! We've skipped the ${duplicateFiles.length === 1 ? 'duplicate' : 'duplicates'} to keep your print order organized.`,
        );
      }
    }
  }, [pickFiles, addFiles, files]);

  const handleNext = useCallback(() => {
    if (!assertOnline()) return;
    if (files.length > 0) {
      startUploads(files, getValidToken);
      navigation.navigate('PrintSettings');
    }
  }, [files, navigation, getValidToken, assertOnline]);

  const handleClose = useCallback(() => navigation.goBack(), [navigation]);

  const renderFile = useCallback(
    ({ item }: { item: UploadedFile }) => <FileCard file={item} onRemove={removeFile} />,
    [removeFile],
  );

  const hasFiles = files.length > 0;

  const readingBanner = isReading ? (
    <View style={[styles.readingIndicator, { backgroundColor: colors.primaryBg }]}>
      <CustomSpinner
        size="small"
        color={colors.primary}
        label="Reading files…"
        direction="horizontal"
        labelStyle={styles.readingText}
      />
    </View>
  ) : null;

  return (
    <View style={commonStyles.screenContainer}>
      <Header title="Upload Files" subtitle="Step 1 of 3" showBack onBack={handleClose} />

      {!hasFiles ? (
        <View style={styles.centeredContent}>
          <FileDropZone onBrowse={handleBrowse} />
          {readingBanner}
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.id}
          renderItem={renderFile}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={FileSeparator}
          ListHeaderComponent={
            <View>
              <FileDropZone onBrowse={handleBrowse} />
              {readingBanner}
            </View>
          }
          ListHeaderComponentStyle={{ marginBottom: scale(20) }}
        />
      )}

      {hasFiles && (
        <View style={[commonStyles.bottomBar, { backgroundColor: colors.backgroundSecondary, paddingBottom: Math.max(insets.bottom, scale(16)) }]}>
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {files.length} {files.length === 1 ? 'file' : 'files'} selected ({formatFileSize(totalSize)})
          </Text>
          <Button label="Continue" onPress={handleNext} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContent: { flex: 1, justifyContent: 'center', paddingHorizontal: scale(20) },
  listContent: { paddingHorizontal: scale(20), paddingTop: scale(24), paddingBottom: scale(32) },
  summary: { fontSize: moderateScale(12), fontFamily: 'Geist-Medium', textAlign: 'center', marginBottom: scale(8) },
  readingIndicator: {
    marginTop: scale(14),
    padding: scale(12),
    borderRadius: scale(12),
    alignSelf: 'stretch',
    marginHorizontal: scale(4),
  },
  readingText: { fontSize: moderateScale(13), fontFamily: 'Geist-Medium' },
});