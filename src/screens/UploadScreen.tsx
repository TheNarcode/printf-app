import React, {useCallback} from 'react';
import {Alert, FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {usePrintJob} from '../context/PrintJobContext';
import {useFileUpload} from '../hooks/useFileUpload';
import Header from '../components/Header';
import FileDropZone from '../components/FileDropZone';
import FileCard from '../components/FileCard';
import {formatFileSize} from '../utils/formatters';
import type {UploadedFile} from '../types';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface Props {
  navigation: any;
}

export default function UploadScreen({navigation}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {files, addFiles, removeFile} = usePrintJob();
  const {pickFiles} = useFileUpload();

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleBrowse = useCallback(async () => {
    const picked = await pickFiles();
    if (picked.length > 0) addFiles(picked);
  }, [pickFiles, addFiles]);

  const handleNext = useCallback(() => {
    if (files.length > 0) navigation.navigate('Settings');
  }, [files.length, navigation]);

  const handleClose = useCallback(() => navigation.goBack(), [navigation]);

  const renderFile = useCallback(
    ({item}: {item: UploadedFile}) => <FileCard file={item} onRemove={removeFile} />,
    [removeFile],
  );

  const hasFiles = files.length > 0;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Upload Files" subtitle="Step 1 of 3" showBack onBack={handleClose} />

      {!hasFiles ? (
        <View style={styles.centeredContent}>
          <FileDropZone onBrowse={handleBrowse} />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.id}
          renderItem={renderFile}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{height: scale(8)}} />}
          ListHeaderComponent={<FileDropZone onBrowse={handleBrowse} />}
          ListHeaderComponentStyle={{marginBottom: scale(20)}}
        />
      )}

      {hasFiles && (
        <View style={[styles.bottomBar, {backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, scale(16))}]}>
          <Text style={[styles.summary, {color: colors.textSecondary}]}>
            {files.length} {files.length === 1 ? 'file' : 'files'} selected ({formatFileSize(totalSize)})
          </Text>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={[styles.nextBtn, {backgroundColor: colors.primary}]}>
            <Text style={[styles.nextBtnText, {color: colors.background}]}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  centeredContent: {flex: 1, justifyContent: 'center', paddingHorizontal: scale(20)},
  listContent: {paddingHorizontal: scale(20), paddingBottom: scale(32)},
  bottomBar: {
    paddingHorizontal: scale(20), paddingTop: scale(16),
    borderTopWidth: StyleSheet.hairlineWidth, gap: scale(10),
  },
  summary: {fontSize: moderateScale(12), fontFamily: 'Geist-Medium', textAlign: 'center'},
  nextBtn: {
    paddingVertical: scale(13), paddingHorizontal: scale(20),
    borderRadius: scale(8), alignItems: 'center', width: '100%',
  },
  nextBtnText: {fontSize: moderateScale(15), fontFamily: 'Geist-SemiBold'},
});
