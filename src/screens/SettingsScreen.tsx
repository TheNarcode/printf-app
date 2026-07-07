import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  FileText,
  Info,
  X,
  Maximize2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import Header from '../components/Header';
import { Text } from '../components/Text';
import { formatFileSize } from '../utils/formatters';
import {
  parsePageRange,
  getSheetPages,
  getTotalSheets,
  generatePdfThumbnails,
} from '../utils/previewUtils';
import {
  scale,
  moderateScale,
  verticalScale,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from '../utils/responsive';
import type { ThemeColors } from '../theme/colors';

const A4_RATIO = 297 / 210;

const SIDES_OPTIONS = [
  { id: 'single', label: 'Single Sided' },
  { id: 'double-long', label: 'Double (Long Edge)' },
  { id: 'double-short', label: 'Double (Short Edge)' },
] as const;

const PAGES_PER_SHEET_OPTS = [1, 2, 4, 6, 9];

interface Props {
  navigation: any;
}

// ── Extracted sub-components (outside parent to avoid re-mounting) ─────────────

interface CompactSegProps {
  options: { id: any; label: string }[];
  value: any;
  onChange: (v: any) => void;
  colors: ThemeColors;
}

function CompactSeg({ options, value, onChange, colors }: CompactSegProps) {
  return (
    <View style={[styles.compactSeg, { backgroundColor: colors.surface }]}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={String(opt.id)}
            onPress={() => onChange(opt.id)}
            style={[
              styles.compactSegBtn,
              active && [
                styles.compactSegBtnActive,
                { backgroundColor: colors.card },
              ],
            ]}
          >
            <Text
              style={[
                styles.compactSegText,
                { color: active ? colors.text : colors.textSecondary },
                active && { fontFamily: 'Geist-SemiBold' },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
  colors: ThemeColors;
}

function SettingRow({
  label,
  children,
  isLast = false,
  colors,
}: SettingRowProps) {
  return (
    <View
      style={[
        styles.settingRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <Text style={[styles.settingRowLabel, { color: colors.text }]}>
        {label}
      </Text>
      <View style={styles.settingRowControl}>{children}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { files, fileSettings, updateFileSettings } = usePrintJob();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showSidesModal, setShowSidesModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [pageRangeError, setPageRangeError] = useState('');

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [thumbLoading, setThumbLoading] = useState(false);
  const [currentSheet, setCurrentSheet] = useState(0);

  const inlineSheetListRef = useRef<FlatList>(null);
  const fullscreenSheetListRef = useRef<FlatList>(null);

  const file = files[selectedIdx];
  const settings = file ? fileSettings[file.id] : null;

  // Derived from file/settings (safe defaults for hook deps when null)
  const isImage = file?.type.includes('image') ?? false;
  const isPdf =
    (file?.type.includes('pdf') || file?.name.toLowerCase().endsWith('.pdf')) ??
    false;
  const isBW = settings?.colorMode === 'bw';

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleContinue = useCallback(() => {
    if (pageRangeError) return;
    navigation.navigate('Payment');
  }, [navigation, pageRangeError]);

  const update = useCallback(
    (key: string, value: any) => {
      if (file) updateFileSettings(file.id, { [key]: value });
    },
    [file, updateFileSettings],
  );

  const handlePageRangeChange = useCallback(
    (text: string) => {
      if (!text || text.trim() === '') {
        setPageRangeError('');
        update('pageRange', 'all');
        return;
      }
      if (!/^[\d\s,-]+$/.test(text)) {
        setPageRangeError('Only numbers, dashes, and commas allowed');
        update('pageRange', text);
        return;
      }
      const parts = text.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        if (trimmed.includes('-')) {
          const segments = trimmed.split('-');
          if (segments.length !== 2) {
            setPageRangeError('Invalid range format');
            update('pageRange', text);
            return;
          }
          const start = parseInt(segments[0].trim(), 10);
          const end = parseInt(segments[1].trim(), 10);
          if (isNaN(start) || isNaN(end)) {
            setPageRangeError('Invalid range numbers');
            update('pageRange', text);
            return;
          }
          if (start > end) {
            setPageRangeError(`Invalid range: ${start} is greater than ${end}`);
            update('pageRange', text);
            return;
          }
          if (start < 1 || end > (file?.pages ?? 1)) {
            setPageRangeError(
              `Pages must be between 1 and ${file?.pages ?? 1}`,
            );
            update('pageRange', text);
            return;
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (isNaN(p)) {
            setPageRangeError('Invalid page number');
            update('pageRange', text);
            return;
          }
          if (p < 1 || p > (file?.pages ?? 1)) {
            setPageRangeError(
              `Page ${p} is out of range (1-${file?.pages ?? 1})`,
            );
            update('pageRange', text);
            return;
          }
        }
      }
      setPageRangeError('');
      update('pageRange', text);
    },
    [file, update],
  );

  const selectedPages = useMemo(
    () => parsePageRange(settings?.pageRange ?? 'all', file?.pages ?? 1),
    [settings?.pageRange, file?.pages],
  );

  const pps = settings?.pagesPerSheet ?? 1;
  const totalSheets = getTotalSheets(selectedPages, pps);

  useEffect(() => {
    setCurrentSheet(0);
  }, [pps, settings?.pageRange, file?.id]);

  // Generate PDF thumbnails — keyed on file.id + selectedPages to avoid
  // re-generating unless the actual page selection changes
  const selectedPagesKey = selectedPages.join(',');
  useEffect(() => {
    if (!isPdf || !file) {
      setThumbnails({});
      return;
    }
    let cancelled = false;
    setThumbLoading(true);
    (async () => {
      try {
        const result = await generatePdfThumbnails(file.uri, selectedPages);
        if (!cancelled) setThumbnails(result);
      } catch (e) {
        console.warn('Thumbnail generation failed:', e);
      } finally {
        if (!cancelled) setThumbLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.uri, file?.id, isPdf, selectedPagesKey]);

  const sheetData = useMemo(
    () =>
      Array.from({ length: totalSheets }, (_, i) => ({
        key: `sheet-${i}`,
        index: i,
      })),
    [totalSheets],
  );

  const onInlineSheetChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentSheet(viewableItems[0].item.index);
  }, []);

  const onFullscreenSheetChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentSheet(viewableItems[0].item.index);
  }, []);

  const goToSheet = useCallback(
    (dir: 1 | -1) => {
      const next = Math.max(0, Math.min(totalSheets - 1, currentSheet + dir));
      setCurrentSheet(next);
      inlineSheetListRef.current?.scrollToIndex({
        index: next,
        animated: true,
      });
      fullscreenSheetListRef.current?.scrollToIndex({
        index: next,
        animated: true,
      });
    },
    [currentSheet, totalSheets],
  );

  const renderFileCard = useCallback(
    ({ item }: { item: any }) => (
      <View style={{ width: SCREEN_WIDTH }}>
        <View
          style={[
            styles.fileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.fileIconBox, { backgroundColor: colors.primaryBg }]}
          >
            <FileText
              size={moderateScale(20)}
              color={colors.primary}
              strokeWidth={1.5}
            />
          </View>
          <View style={styles.fileCardInfo}>
            <Text
              style={[styles.fileCardName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={[styles.fileCardMeta, { color: colors.textMuted }]}>
              {formatFileSize(item.size)} · {item.pages}{' '}
              {item.pages === 1 ? 'page' : 'pages'}
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

  const openSidesModal = useCallback(() => setShowSidesModal(true), []);
  const closeSidesModal = useCallback(() => setShowSidesModal(false), []);
  const openFullscreen = useCallback(() => setShowFullscreen(true), []);
  const closeFullscreen = useCallback(() => setShowFullscreen(false), []);

  // Close fullscreen modal when Android back button is pressed
  useEffect(() => {
    if (!showFullscreen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeFullscreen();
      return true; // prevent default back navigation
    });
    return () => sub.remove();
  }, [showFullscreen, closeFullscreen]);

  // ── Early return after ALL hooks ──────────────────────────────────────────
  if (!file || !settings) return null;

  // Paper dimensions
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

  // Fullscreen dims
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

  // Render a single page cell
  const renderPageCell = (
    pageIdx: number | undefined,
    cellIdx: number,
    pw: number,
    ph: number,
  ) => {
    const cellW = pw / gridCols;
    const cellH = ph / gridRows;
    const pad = pps > 1 ? scale(1.5) : 0;

    if (pageIdx === undefined) {
      return (
        <View
          key={`empty-${cellIdx}`}
          style={{ width: cellW, height: cellH, padding: pad }}
        >
          <View style={[styles.pageCell, { backgroundColor: '#fafafa' }]} />
        </View>
      );
    }

    const renderImage = (uri: string) => (
      <Image source={{ uri }} style={styles.pageCell} resizeMode="contain" />
    );

    if (isImage) {
      return (
        <View
          key={`img-${cellIdx}`}
          style={{ width: cellW, height: cellH, padding: pad }}
        >
          {renderImage(file.uri)}
          {isBW && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: '#000', mixBlendMode: 'color' } as any,
              ]}
            />
          )}
        </View>
      );
    }

    const thumbUri = thumbnails[pageIdx];
    if (thumbUri) {
      return (
        <View
          key={`thumb-${pageIdx}-${cellIdx}`}
          style={{ width: cellW, height: cellH, padding: pad }}
        >
          {renderImage(thumbUri)}
          {isBW && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: '#000', mixBlendMode: 'color' } as any,
              ]}
            />
          )}
        </View>
      );
    }

    return (
      <View
        key={`loading-${cellIdx}`}
        style={{ width: cellW, height: cellH, padding: pad }}
      >
        <View
          style={[
            styles.pageCell,
            {
              backgroundColor: '#f8f8f8',
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          {thumbLoading ? (
            <ActivityIndicator size="small" color="#bbb" />
          ) : (
            <>
              <FileText
                size={moderateScale(pps > 1 ? 10 : 18)}
                color="#ccc"
                strokeWidth={1}
              />
              <Text
                style={{
                  fontSize: moderateScale(7),
                  color: '#bbb',
                  marginTop: 2,
                  fontFamily: 'GeistMono-Regular',
                }}
              >
                Page {(pageIdx ?? 0) + 1}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  // Render a single sheet
  const renderSheet = (sheetIndex: number, pw: number, ph: number) => {
    const pages = getSheetPages(selectedPages, pps, sheetIndex);
    return (
      <View style={[styles.paperSheet, { width: pw, height: ph }]}>
        <View style={styles.ppsGrid}>
          {Array.from({ length: pps }).map((_, cellIdx) =>
            renderPageCell(pages[cellIdx], cellIdx, pw, ph),
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Print Settings"
        subtitle="Step 2 of 3"
        showBack
        onBack={handleBack}
      />

      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        data={[{ key: 'content' }]}
        keyExtractor={item => item.key}
        renderItem={() => null}
        ListHeaderComponent={
          <>
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
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            i === selectedIdx ? colors.primary : colors.border,
                        },
                        i === selectedIdx && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* LIVE PREVIEW */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  PRINT PREVIEW
                </Text>
                <View style={styles.previewHeaderRight}>
                  <TouchableOpacity
                    onPress={openFullscreen}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Maximize2
                      size={moderateScale(14)}
                      color={colors.textMuted}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.previewContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <FlatList
                  ref={inlineSheetListRef}
                  data={sheetData}
                  keyExtractor={d => d.key}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onInlineSheetChange}
                  viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                  snapToInterval={inlineItemW}
                  decelerationRate="fast"
                  style={{ width: inlineItemW }}
                  contentContainerStyle={{ alignItems: 'center' }}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        width: inlineItemW,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {renderSheet(item.index, finalPaperW, finalPaperH)}
                    </View>
                  )}
                />

                <View style={styles.sheetNav}>
                  {totalSheets > 1 && (
                    <TouchableOpacity
                      onPress={() => goToSheet(-1)}
                      disabled={currentSheet === 0}
                      style={[
                        styles.sheetNavBtn,
                        currentSheet === 0 && { opacity: 0.3 },
                      ]}
                    >
                      <ChevronLeft
                        size={moderateScale(16)}
                        color={colors.textSecondary}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  )}
                  <Text
                    style={[styles.sheetNavText, { color: colors.textMuted }]}
                  >
                    {totalSheets > 1
                      ? `Sheet ${currentSheet + 1} of ${totalSheets} · `
                      : ''}
                    {selectedPages.length}{' '}
                    {selectedPages.length === 1 ? 'page' : 'pages'}
                  </Text>
                  {totalSheets > 1 && (
                    <TouchableOpacity
                      onPress={() => goToSheet(1)}
                      disabled={currentSheet === totalSheets - 1}
                      style={[
                        styles.sheetNavBtn,
                        currentSheet === totalSheets - 1 && { opacity: 0.3 },
                      ]}
                    >
                      <ChevronRight
                        size={moderateScale(16)}
                        color={colors.textSecondary}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* SETTINGS LIST */}
            <View style={styles.settingsSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.textMuted, paddingHorizontal: scale(20) },
                ]}
              >
                OPTIONS
              </Text>

              <View
                style={[
                  styles.settingsCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <SettingRow label="Copies" colors={colors}>
                  <View
                    style={[styles.stepper, { borderColor: colors.border }]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        update('copies', Math.max(1, settings.copies - 1))
                      }
                      style={styles.stepBtn}
                    >
                      <Minus
                        size={moderateScale(14)}
                        color={colors.text}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                    <View
                      style={[
                        styles.stepValue,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[styles.stepValueText, { color: colors.text }]}
                      >
                        {settings.copies}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => update('copies', settings.copies + 1)}
                      style={styles.stepBtn}
                    >
                      <Plus
                        size={moderateScale(14)}
                        color={colors.text}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  </View>
                </SettingRow>

                <SettingRow label="Color" colors={colors}>
                  <CompactSeg
                    options={[
                      { id: 'bw', label: 'B&W' },
                      { id: 'color', label: 'Color' },
                    ]}
                    value={settings.colorMode}
                    onChange={v => update('colorMode', v)}
                    colors={colors}
                  />
                </SettingRow>

                <SettingRow label="Orientation" colors={colors}>
                  <CompactSeg
                    options={[
                      { id: 'portrait', label: 'Portrait' },
                      { id: 'landscape', label: 'Landscape' },
                    ]}
                    value={settings.orientation}
                    onChange={v => update('orientation', v)}
                    colors={colors}
                  />
                </SettingRow>

                <SettingRow label="Paper Size" colors={colors}>
                  <CompactSeg
                    options={[
                      { id: 'a4', label: 'A4' },
                      { id: 'a3', label: 'A3' },
                    ]}
                    value={settings.paperSize}
                    onChange={v => update('paperSize', v)}
                    colors={colors}
                  />
                </SettingRow>

                <SettingRow label="Pages / Sheet" colors={colors}>
                  <CompactSeg
                    options={PAGES_PER_SHEET_OPTS.map(n => ({
                      id: n,
                      label: n.toString(),
                    }))}
                    value={settings.pagesPerSheet}
                    onChange={v => update('pagesPerSheet', v)}
                    colors={colors}
                  />
                </SettingRow>

                <SettingRow label="Sides" colors={colors}>
                  <TouchableOpacity
                    onPress={openSidesModal}
                    style={[
                      styles.dropdownRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.dropdownValue, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {SIDES_OPTIONS.find(p => p.id === settings.sides)?.label}
                    </Text>
                    <ChevronRight
                      size={moderateScale(14)}
                      color={colors.textMuted}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </SettingRow>

                {/* Page Range */}
                <View
                  style={[
                    styles.pageRangeSection,
                    { borderTopColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.pageRangeHeader}>
                    <Text
                      style={[styles.settingRowLabel, { color: colors.text }]}
                    >
                      Page Range
                    </Text>
                    <Text
                      style={[
                        styles.pageRangeHint,
                        { color: colors.textMuted },
                      ]}
                    >
                      {file.pages} pages total
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.pageRangeInput,
                      {
                        color: colors.text,
                        borderColor: pageRangeError
                          ? colors.danger
                          : colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    placeholder="All pages — or enter range like 1-5, 8, 11-13"
                    placeholderTextColor={colors.textMuted}
                    value={
                      settings.pageRange === 'all' ? '' : settings.pageRange
                    }
                    onChangeText={handlePageRangeChange}
                  />
                  {pageRangeError ? (
                    <Text
                      style={{
                        fontSize: moderateScale(11),
                        fontFamily: 'Geist-Medium',
                        color: colors.danger,
                        marginTop: scale(4),
                      }}
                    >
                      {pageRangeError}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </>
        }
      />

      {/* Bottom bar */}
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
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!!pageRangeError}
          style={[
            styles.continueBtn,
            {
              backgroundColor: pageRangeError
                ? colors.textMuted
                : colors.primary,
            },
          ]}
        >
          <Text style={[styles.continueBtnText, { color: colors.background }]}>
            Proceed to Payment
          </Text>
        </TouchableOpacity>
      </View>

      {/* FULLSCREEN PREVIEW MODAL */}
      <Modal visible={showFullscreen} animationType="fade" statusBarTranslucent>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View
          style={[
            styles.fsContainer,
            { backgroundColor: colors.background, paddingTop: insets.top },
          ]}
        >
          <View style={[styles.fsHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fsTitle, { color: colors.text }]}>
              Print Preview
            </Text>
            <TouchableOpacity
              onPress={closeFullscreen}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: scale(4) }}
            >
              <X
                size={moderateScale(20)}
                color={colors.textMuted}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.fsPreviewArea,
              { backgroundColor: colors.background },
            ]}
          >
            <FlatList
              ref={fullscreenSheetListRef}
              data={sheetData}
              keyExtractor={d => d.key}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onFullscreenSheetChange}
              viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
              snapToInterval={SCREEN_WIDTH}
              decelerationRate="fast"
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={{ alignItems: 'center' }}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: SCREEN_WIDTH,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: scale(20),
                  }}
                >
                  {renderSheet(item.index, fsPaperW, fsPaperH)}
                </View>
              )}
            />
          </View>

          <View
            style={[
              styles.fsNavBar,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, scale(12)),
              },
            ]}
          >
            <View style={styles.sheetNav}>
              {totalSheets > 1 && (
                <TouchableOpacity
                  onPress={() => goToSheet(-1)}
                  disabled={currentSheet === 0}
                  style={[
                    styles.sheetNavBtn,
                    currentSheet === 0 && { opacity: 0.3 },
                  ]}
                >
                  <ChevronLeft
                    size={moderateScale(16)}
                    color={colors.textSecondary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
              <Text style={[styles.sheetNavText, { color: colors.textMuted }]}>
                {totalSheets > 1
                  ? `Sheet ${currentSheet + 1} of ${totalSheets} · `
                  : ''}
                {selectedPages.length}{' '}
                {selectedPages.length === 1 ? 'page' : 'pages'}
              </Text>
              {totalSheets > 1 && (
                <TouchableOpacity
                  onPress={() => goToSheet(1)}
                  disabled={currentSheet === totalSheets - 1}
                  style={[
                    styles.sheetNavBtn,
                    currentSheet === totalSheets - 1 && { opacity: 0.3 },
                  ]}
                >
                  <ChevronRight
                    size={moderateScale(16)}
                    color={colors.textSecondary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Sides Modal */}
      <Modal visible={showSidesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBgClose}
            activeOpacity={1}
            onPress={closeSidesModal}
          />
          <View
            style={[
              styles.actionSheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + scale(20),
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Duplex / Sides
              </Text>
              <TouchableOpacity onPress={closeSidesModal}>
                <X size={moderateScale(18)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {SIDES_OPTIONS.map(opt => {
              const active = settings.sides === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.sheetOption,
                    { borderBottomColor: colors.borderLight },
                  ]}
                  onPress={() => {
                    update('sides', opt.id);
                    closeSidesModal();
                  }}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      { color: colors.text },
                      active && {
                        fontFamily: 'Geist-SemiBold',
                        color: colors.primary,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {active && (
                    <View
                      style={[
                        styles.radioActive,
                        { borderColor: colors.primary },
                      ]}
                    >
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: scale(32) },
  fileCard: {
    marginHorizontal: scale(20),
    marginTop: scale(12),
    marginBottom: scale(6),
    padding: scale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  fileIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCardInfo: { flex: 1 },
  fileCardName: {
    fontSize: moderateScale(13),
    fontFamily: 'Geist-SemiBold',
    marginBottom: 2,
  },
  fileCardMeta: { fontSize: moderateScale(10) },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: scale(12),
    marginTop: scale(4),
  },
  dot: { width: scale(5), height: scale(5), borderRadius: scale(3) },
  dotActive: { width: scale(12) },
  previewSection: { paddingHorizontal: scale(20), marginBottom: scale(20) },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  previewHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  sectionLabel: {
    fontSize: moderateScale(10),
    fontFamily: 'Geist-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bwBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    borderWidth: 1,
  },
  bwBadgeText: { fontSize: moderateScale(9), fontFamily: 'Geist-Medium' },
  previewContainer: {
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: 'center',
  },
  paperSheet: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  ppsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  pageCell: { flex: 1, width: '100%', height: '100%' },
  sheetNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(10),
    gap: scale(8),
  },
  sheetNavBtn: { padding: scale(6) },
  sheetNavText: {
    fontSize: moderateScale(10),
    fontFamily: 'GeistMono-Regular',
    letterSpacing: 0.3,
  },
  settingsSection: { gap: scale(6) },
  settingsCard: {
    marginHorizontal: scale(20),
    borderRadius: scale(14),
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  settingRowLabel: { fontSize: moderateScale(13), fontFamily: 'Geist-Medium' },
  settingRowControl: { flexDirection: 'row', alignItems: 'center' },
  compactSeg: { flexDirection: 'row', borderRadius: scale(6), padding: 2 },
  compactSegBtn: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    alignItems: 'center',
    borderRadius: scale(4),
  },
  compactSegBtnActive: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  compactSegText: { fontSize: moderateScale(11), fontFamily: 'Geist-Medium' },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    minWidth: scale(100),
  },
  dropdownValue: {
    fontSize: moderateScale(12),
    fontFamily: 'Geist-Medium',
    flex: 1,
    marginRight: scale(6),
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    alignItems: 'center',
  },
  stepValue: { paddingHorizontal: scale(12), paddingVertical: scale(6) },
  stepValueText: { fontSize: moderateScale(13), fontFamily: 'Geist-Bold' },
  pageRangeSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
  },
  pageRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  pageRangeHint: {
    fontSize: moderateScale(11),
    fontFamily: 'GeistMono-Regular',
  },
  pageRangeInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    fontSize: moderateScale(14),
    fontFamily: 'Geist-Medium',
  },
  bottomBar: {
    paddingHorizontal: scale(20),
    paddingTop: scale(14),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  continueBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(13),
    borderRadius: scale(8),
  },
  continueBtnText: {
    fontSize: moderateScale(15),
    fontFamily: 'Geist-SemiBold',
  },
  fsContainer: { flex: 1 },
  fsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingBottom: scale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fsTitle: { fontSize: moderateScale(19), fontFamily: 'Geist-SemiBold' },
  fsPreviewArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fsNavBar: {
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBgClose: { flex: 1 },
  actionSheet: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  sheetTitle: { fontSize: moderateScale(16), fontFamily: 'Geist-Bold' },
  sheetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: { fontSize: moderateScale(14), fontFamily: 'Geist-Medium' },
  radioActive: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { width: scale(10), height: scale(10), borderRadius: scale(5) },
});
