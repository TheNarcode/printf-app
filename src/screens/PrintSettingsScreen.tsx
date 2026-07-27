import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import Header from '../components/Header';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { PrintPreviewSection } from '../components/PrintPreviewSection';
import { PrintSettingsOptions } from '../components/PrintSettingsOptions';
import { formatFileSize } from '../utils/formatters';
import { parsePageRange, getTotalSheets, generatePdfThumbnails } from '../utils/previewUtils';
import { getStatuses, retryFailed } from '../services/fileUploadManager';
import { CustomAlertAPI } from '../components/CustomAlert';
import { scale, moderateScale, verticalScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

const A4_RATIO = 297 / 210;

interface Props {
  navigation: any;
}

export default function PrintSettingsScreen({ navigation }: Props) {
  const { colors, commonStyles, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { files, fileSettings, updateFileSettings, resetFlow } = usePrintJob();
  const { getValidToken } = useAuth();
  const { assertOnline } = useNetwork();

  const [uploadState, setUploadState] = useState<'uploading' | 'done' | 'failed'>('uploading');
  const alertFiredRef = useRef(false);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [pageRangeError, setPageRangeError] = useState('');

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [thumbLoading, setThumbLoading] = useState(false);
  const [currentSheet, setCurrentSheet] = useState(0);

  const file = files[selectedIdx];
  const settings = file ? fileSettings[file.id] : null;

  const isImage = file?.type.includes('image') ?? false;
  const isPdf = (file?.type.includes('pdf') || file?.name.toLowerCase().endsWith('.pdf')) ?? false;
  const isBW = settings?.colorMode === 'bw';

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  useEffect(() => {
    const check = () => {
      const statuses = getStatuses();
      const vals = Object.values(statuses);
      if (vals.length === 0 || vals.every(s => s === 'done')) {
        setUploadState('done');
        alertFiredRef.current = false;
        return;
      }
      if (vals.some(s => s === 'error')) { setUploadState('failed'); return; }
      setUploadState('uploading');
    };
    check();
    const timer = setInterval(check, 500);
    return () => clearInterval(timer);
  }, []);

  const showUploadFailedAlert = useCallback(() => {
    CustomAlertAPI.alert(
      'Upload Failed',
      'Some files could not be uploaded. Would you like to try again?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            resetFlow();
            navigation.navigate('Home');
          },
        },
        {
          text: 'Retry',
          onPress: () => {
            setUploadState('uploading');
            retryFailed(files, getValidToken);
          },
        },
      ],
    );
  }, [navigation, resetFlow, files, getValidToken]);

  useEffect(() => {
    if (uploadState === 'failed' && !alertFiredRef.current) {
      alertFiredRef.current = true;
      showUploadFailedAlert();
    }
  }, [uploadState, showUploadFailedAlert]);

  useEffect(() => {
    const onBackPress = () => {
      if (uploadState === 'uploading') {
        CustomAlertAPI.alert(
          'Upload in Progress',
          'Files are still uploading. Leaving will cancel the upload.',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => {
                resetFlow();
                navigation.navigate('Home');
              },
            },
          ],
        );
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [uploadState, navigation, resetFlow]);

  const update = useCallback(
    (key: string, val: any) => {
      if (!file) return;
      updateFileSettings(file.id, { [key]: val });
    },
    [file, updateFileSettings],
  );

  const handleContinue = useCallback(() => {
    if (!assertOnline()) return;
    if (uploadState === 'failed') { showUploadFailedAlert(); return; }
    if (uploadState === 'uploading') return;
    navigation.navigate('Payment');
  }, [navigation, uploadState, showUploadFailedAlert, assertOnline]);

  const handlePageRangeChange = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setPageRangeError('');
        update('pageRange', 'all');
        return;
      }

      const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes('-')) {
          const [startStr, endStr] = part.split('-').map(s => s.trim());
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > (file?.pages ?? 1)) {
            setPageRangeError(`Invalid range: ${part} (1-${file?.pages ?? 1})`);
            update('pageRange', text);
            return;
          }
        } else {
          const p = parseInt(part, 10);
          if (isNaN(p)) { setPageRangeError('Invalid page number'); update('pageRange', text); return; }
          if (p < 1 || p > (file?.pages ?? 1)) { setPageRangeError(`Page ${p} is out of range (1-${file?.pages ?? 1})`); update('pageRange', text); return; }
        }
      }
      setPageRangeError('');
      update('pageRange', text);
    },
    [file, update],
  );

  const selectedPages = useMemo(() => parsePageRange(settings?.pageRange ?? 'all', file?.pages ?? 1), [settings?.pageRange, file?.pages]);
  const pps = settings?.pagesPerSheet ?? 1;
  const totalSheets = getTotalSheets(selectedPages, pps);

  useEffect(() => { setCurrentSheet(0); }, [pps, settings?.pageRange, file?.id]);

  const selectedPagesKey = selectedPages.join(',');
  useEffect(() => {
    if (!isPdf || !file) { setThumbnails({}); return; }
    let cancelled = false;
    setThumbLoading(true);
    (async () => {
      try {
        const result = await generatePdfThumbnails(file.uri, selectedPages);
        if (!cancelled) setThumbnails(result);
      } catch (e) {
        // silent fallback
      } finally {
        if (!cancelled) setThumbLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file?.uri, file?.id, isPdf, selectedPagesKey]);

  const sheetData = useMemo(() => Array.from({ length: totalSheets }, (_, i) => ({ key: `sheet-${i}`, index: i })), [totalSheets]);

  const renderFileCard = useCallback(
    ({ item }: { item: any }) => (
      <View style={{ width: SCREEN_WIDTH }}>
        <View style={[styles.fileCard, { backgroundColor: colors.card, borderColor: item.uploadError ? colors.danger : colors.border }]}>
          <View style={[styles.fileIconBox, { backgroundColor: colors.primaryBg }]}>
            <FileText size={moderateScale(20)} color={colors.primary} strokeWidth={1.5} />
          </View>
          <View style={styles.fileCardInfo}>
            <Text weight="semibold" style={[styles.fileCardName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.fileCardMeta, { color: colors.textMuted }]}>
              {formatFileSize(item.size)} · {item.pages} {item.pages === 1 ? 'page' : 'pages'}
            </Text>
          </View>
        </View>
      </View>
    ),
    [colors],
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setSelectedIdx(viewableItems[0].index);
  }, []);

  if (!file || !settings) return null;

  const isLandscape = settings.orientation === 'landscape';
  const paperRatio = isLandscape ? 1 / A4_RATIO : A4_RATIO;
  const containerW = SCREEN_WIDTH - scale(40);
  const paperW = Math.min(containerW, scale(300));
  const paperH = paperW * paperRatio;
  const maxH = verticalScale(300);
  const finalPaperH = Math.min(paperH, maxH);
  const finalPaperW = finalPaperH / paperRatio;

  const gridCols = pps <= 2 ? pps : pps <= 4 ? 2 : 3;
  const gridRows = Math.ceil(pps / gridCols);

  const fsMaxW = SCREEN_WIDTH - scale(32);
  const fsMaxH = SCREEN_HEIGHT - insets.top - insets.bottom - scale(140);
  let fsPaperW: number, fsPaperH: number;
  if (fsMaxW * paperRatio <= fsMaxH) {
    fsPaperW = fsMaxW;
    fsPaperH = fsMaxW * paperRatio;
  } else {
    fsPaperH = fsMaxH;
    fsPaperW = fsMaxH / paperRatio;
  }

  const inlineItemW = SCREEN_WIDTH - scale(40) - scale(24);

  return (
    <View style={commonStyles.screenContainer}>
      <Header title="Print Settings" subtitle="Step 2 of 3" showBack onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* File Carousel */}
        <View>
          <FlatList
            data={files}
            keyExtractor={f => f.id}
            renderItem={renderFileCard}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          />
          {files.length > 1 && (
            <View style={styles.dotsRow}>
              {files.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i === selectedIdx ? colors.primary : colors.border }, i === selectedIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* PRINT PREVIEW SECTION */}
        <PrintPreviewSection
          colors={colors}
          isDark={isDark}
          insets={insets}
          sheetData={sheetData}
          inlineItemW={inlineItemW}
          finalPaperW={finalPaperW}
          finalPaperH={finalPaperH}
          fsPaperW={fsPaperW}
          fsPaperH={fsPaperH}
          selectedPages={selectedPages}
          pps={pps}
          gridCols={gridCols}
          gridRows={gridRows}
          isImage={isImage}
          isBW={isBW}
          fileUri={file.uri}
          thumbnails={thumbnails}
          thumbLoading={thumbLoading}
          totalSheets={totalSheets}
          currentSheet={currentSheet}
          setCurrentSheet={setCurrentSheet}
        />

        {/* OPTIONS SECTION */}
        <PrintSettingsOptions
          colors={colors}
          insets={insets}
          settings={settings}
          file={file}
          update={update}
          pageRangeError={pageRangeError}
          handlePageRangeChange={handlePageRangeChange}
        />
      </ScrollView>

      <View style={[commonStyles.bottomBar, { backgroundColor: colors.backgroundSecondary, paddingBottom: Math.max(insets.bottom, scale(16)) }]}>
        <Button
          label={uploadState === 'uploading' ? 'Uploading…' : 'Proceed to Payment'}
          onPress={handleContinue}
          isLoading={uploadState === 'uploading'}
          disabled={!!pageRangeError || uploadState === 'uploading'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: scale(32), paddingTop: scale(24) },
  fileCard: { marginHorizontal: scale(20), marginTop: scale(12), marginBottom: scale(6), padding: scale(10), borderRadius: scale(12), borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  fileIconBox: { width: scale(36), height: scale(36), borderRadius: scale(8), justifyContent: 'center', alignItems: 'center' },
  fileCardInfo: { flex: 1 },
  fileCardName: { fontSize: moderateScale(13), marginBottom: 2 },
  fileCardMeta: { fontSize: moderateScale(11) },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: scale(5), marginBottom: scale(12), marginTop: scale(4) },
  dot: { width: scale(5), height: scale(5), borderRadius: scale(3) },
  dotActive: { width: scale(12) },
});
