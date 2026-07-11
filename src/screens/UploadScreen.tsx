import React, { useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { useFileUpload } from '../hooks/useFileUpload';
import Header from '../components/Header';
import FileDropZone from '../components/FileDropZone';
import FileCard from '../components/FileCard';
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { files, addFiles, removeFile } = usePrintJob();
  const { getValidToken } = useAuth();
  const { assertOnline } = useNetwork();
  const { pickFiles, isReading } = useFileUpload();

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

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

        const isDuplicate = files.some(f => f.name === p.name && f.size === p.size) ||
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
          `We skipped some files to keep your queue running smoothly:\n\n• ${largeFiles.length} ${largeFiles.length === 1 ? 'file' : 'files'} exceeded the 50MB limit\n• ${duplicateFiles.length} ${duplicateFiles.length === 1 ? 'file was' : 'files were'} already added`
        );
      } else if (largeFiles.length > 0) {
        CustomAlertAPI.alert(
          'File Too Large',
          `Our maximum file size is 50MB to ensure reliable processing. ${largeFiles.length === 1 ? '1 file was' : `${largeFiles.length} files were`} skipped. Please compress and try again.`
        );
      } else if (duplicateFiles.length > 0) {
        CustomAlertAPI.alert(
          'Already in Queue',
          `You've already added ${duplicateFiles.length === 1 ? 'this file' : 'some of these files'}! We've skipped the ${duplicateFiles.length === 1 ? 'duplicate' : 'duplicates'} to keep your print order organized.`
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
    ({ item }: { item: UploadedFile }) => (
      <FileCard file={item} onRemove={removeFile} />
    ),
    [removeFile],
  );

  const hasFiles = files.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Upload Files"
        subtitle="Step 1 of 3"
        showBack
        onBack={handleClose}
      />

      {!hasFiles ? (
        <View style={styles.centeredContent}>
          <FileDropZone onBrowse={handleBrowse} />
          {isReading && (
            <View style={[styles.readingIndicator, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.text} style={{ marginRight: scale(10) }} />
              <Text style={{ color: colors.text, fontSize: moderateScale(13), fontFamily: 'Geist-Medium' }}>Reading files...</Text>
            </View>
          )}
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
              {isReading && (
                <View style={[styles.readingIndicator, { backgroundColor: colors.surface, marginTop: scale(12) }]}>
                  <ActivityIndicator size="small" color={colors.text} style={{ marginRight: scale(10) }} />
                  <Text style={{ color: colors.text, fontSize: moderateScale(13), fontFamily: 'Geist-Medium' }}>Reading files...</Text>
                </View>
              )}
            </View>
          }
          ListHeaderComponentStyle={{ marginBottom: scale(20) }}
        />
      )}

      {hasFiles && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.backgroundSecondary,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, scale(16)),
            },
          ]}
        >
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {files.length} {files.length === 1 ? 'file' : 'files'} selected (
            {formatFileSize(totalSize)})
          </Text>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.nextBtnText, { color: colors.background }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(20),
  },
  listContent: { paddingHorizontal: scale(20), paddingTop: scale(24), paddingBottom: scale(32) },
  bottomBar: {
    paddingHorizontal: scale(20),
    paddingTop: scale(24),
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: scale(10),
  },
  summary: {
    fontSize: moderateScale(12),
    fontFamily: 'Geist-Medium',
    textAlign: 'center',
  },
  nextBtn: {
    paddingVertical: scale(13),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    alignItems: 'center',
    width: '100%',
  },
  nextBtnText: {
    fontSize: moderateScale(15),
    fontFamily: 'Geist-SemiBold',
  },
  readingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(16),
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    alignSelf: 'center',
  },
});
