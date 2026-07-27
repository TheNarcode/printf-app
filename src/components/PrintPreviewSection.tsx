import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight, FileText, Maximize2, X } from 'lucide-react-native';
import { Text } from './Text';
import { CustomSpinner } from './CustomSpinner';
import { scale, moderateScale, SCREEN_WIDTH } from '../utils/responsive';
import { getSheetPages } from '../utils/previewUtils';
import type { ThemeColors } from '../theme/colors';

interface PageCellProps {
  pageIdx: number | undefined;
  cellIdx: number;
  pw: number;
  ph: number;
  gridCols: number;
  gridRows: number;
  pps: number;
  isImage: boolean;
  isBW: boolean;
  fileUri: string;
  thumbnails: Record<number, string>;
  thumbLoading: boolean;
}

function PageCell({
  pageIdx,
  cellIdx,
  pw,
  ph,
  gridCols,
  gridRows,
  pps,
  isImage,
  isBW,
  fileUri,
  thumbnails,
  thumbLoading,
}: PageCellProps) {
  const cellW = pw / gridCols;
  const cellH = ph / gridRows;
  const pad = pps > 1 ? scale(1.5) : 0;

  if (pageIdx === undefined) {
    return (
      <View style={{ width: cellW, height: cellH, padding: pad }}>
        <View style={[styles.pageCell, { backgroundColor: '#fafafa' }]} />
      </View>
    );
  }

  const renderImg = (uri: string) => (
    <Image source={{ uri }} style={styles.pageCell} resizeMode="contain" />
  );

  if (isImage) {
    return (
      <View style={{ width: cellW, height: cellH, padding: pad }}>
        {renderImg(fileUri)}
        {isBW && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', mixBlendMode: 'color' } as any]} />
        )}
      </View>
    );
  }

  const thumbUri = thumbnails[pageIdx];
  if (thumbUri) {
    return (
      <View style={{ width: cellW, height: cellH, padding: pad }}>
        {renderImg(thumbUri)}
        {isBW && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', mixBlendMode: 'color' } as any]} />
        )}
      </View>
    );
  }

  return (
    <View style={{ width: cellW, height: cellH, padding: pad }}>
      <View style={[styles.pageCell, { backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' }]}>
        {thumbLoading ? (
          <CustomSpinner size="small" color="#bbb" />
        ) : (
          <>
            <FileText size={moderateScale(pps > 1 ? 10 : 18)} color="#ccc" strokeWidth={1} />
            <Text style={{ fontSize: moderateScale(7), color: '#bbb', marginTop: 2, fontFamily: 'GeistMono-Regular' }}>
              Page {(pageIdx ?? 0) + 1}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function SheetPreview({
  sheetIndex,
  pw,
  ph,
  selectedPages,
  pps,
  gridCols,
  gridRows,
  isImage,
  isBW,
  fileUri,
  thumbnails,
  thumbLoading,
}: any) {
  const pages = getSheetPages(selectedPages, pps, sheetIndex);
  return (
    <View style={[styles.paperSheet, { width: pw, height: ph }]}>
      <View style={styles.ppsGrid}>
        {Array.from({ length: pps }).map((_, cellIdx) => (
          <PageCell
            key={cellIdx}
            pageIdx={pages[cellIdx]}
            cellIdx={cellIdx}
            pw={pw}
            ph={ph}
            gridCols={gridCols}
            gridRows={gridRows}
            pps={pps}
            isImage={isImage}
            isBW={isBW}
            fileUri={fileUri}
            thumbnails={thumbnails}
            thumbLoading={thumbLoading}
          />
        ))}
      </View>
    </View>
  );
}

interface PrintPreviewSectionProps {
  colors: ThemeColors;
  isDark: boolean;
  insets: any;
  sheetData: any[];
  inlineItemW: number;
  finalPaperW: number;
  finalPaperH: number;
  fsPaperW: number;
  fsPaperH: number;
  selectedPages: number[];
  pps: number;
  gridCols: number;
  gridRows: number;
  isImage: boolean;
  isBW: boolean;
  fileUri: string;
  thumbnails: Record<number, string>;
  thumbLoading: boolean;
  totalSheets: number;
  currentSheet: number;
  setCurrentSheet: (sheet: number) => void;
}

export function PrintPreviewSection({
  colors,
  isDark,
  insets,
  sheetData,
  inlineItemW,
  finalPaperW,
  finalPaperH,
  fsPaperW,
  fsPaperH,
  selectedPages,
  pps,
  gridCols,
  gridRows,
  isImage,
  isBW,
  fileUri,
  thumbnails,
  thumbLoading,
  totalSheets,
  currentSheet,
  setCurrentSheet,
}: PrintPreviewSectionProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const inlineSheetListRef = useRef<FlatList>(null);
  const fullscreenSheetListRef = useRef<FlatList>(null);

  const openFullscreen = useCallback(() => setShowFullscreen(true), []);
  const closeFullscreen = useCallback(() => setShowFullscreen(false), []);

  const onInlineSheetChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentSheet(viewableItems[0].item.index);
  }, [setCurrentSheet]);

  const onFullscreenSheetChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentSheet(viewableItems[0].item.index);
  }, [setCurrentSheet]);

  const goToSheet = useCallback(
    (dir: 1 | -1) => {
      const next = Math.max(0, Math.min(totalSheets - 1, currentSheet + dir));
      setCurrentSheet(next);
      inlineSheetListRef.current?.scrollToIndex({ index: next, animated: true });
      fullscreenSheetListRef.current?.scrollToIndex({ index: next, animated: true });
    },
    [currentSheet, totalSheets, setCurrentSheet],
  );

  return (
    <>
      <View style={styles.previewSection}>
        <View style={styles.previewHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PRINT PREVIEW</Text>
          <TouchableOpacity onPress={openFullscreen} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Maximize2 size={moderateScale(14)} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={[styles.previewContainer, { backgroundColor: colors.surface }]}>
          <FlatList
            ref={inlineSheetListRef}
            data={sheetData}
            keyExtractor={d => d.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onInlineSheetChange}
            onScrollToIndexFailed={() => {}}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            snapToInterval={inlineItemW}
            decelerationRate="fast"
            style={{ width: inlineItemW }}
            contentContainerStyle={{ alignItems: 'center' }}
            renderItem={({ item }) => (
              <View style={{ width: inlineItemW, alignItems: 'center', justifyContent: 'center' }}>
                <SheetPreview
                  sheetIndex={item.index}
                  pw={finalPaperW}
                  ph={finalPaperH}
                  selectedPages={selectedPages}
                  pps={pps}
                  gridCols={gridCols}
                  gridRows={gridRows}
                  isImage={isImage}
                  isBW={isBW}
                  fileUri={fileUri}
                  thumbnails={thumbnails}
                  thumbLoading={thumbLoading}
                />
              </View>
            )}
          />

          <View style={styles.sheetNav}>
            {totalSheets > 1 && (
              <TouchableOpacity onPress={() => goToSheet(-1)} disabled={currentSheet === 0} style={[styles.sheetNavBtn, currentSheet === 0 && { opacity: 0.3 }]}>
                <ChevronLeft size={moderateScale(16)} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
            <Text style={[styles.sheetNavText, { color: colors.textMuted }]}>
              {totalSheets > 1 ? `Sheet ${currentSheet + 1} of ${totalSheets} · ` : ''}
              {selectedPages.length} {selectedPages.length === 1 ? 'page' : 'pages'}
            </Text>
            {totalSheets > 1 && (
              <TouchableOpacity onPress={() => goToSheet(1)} disabled={currentSheet === totalSheets - 1} style={[styles.sheetNavBtn, currentSheet === totalSheets - 1 && { opacity: 0.3 }]}>
                <ChevronRight size={moderateScale(16)} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* FULLSCREEN PREVIEW MODAL */}
      <Modal visible={showFullscreen} animationType="fade" statusBarTranslucent onRequestClose={closeFullscreen}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[styles.fsContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={[styles.fsHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fsTitle, { color: colors.text }]}>Print Preview</Text>
            <TouchableOpacity onPress={closeFullscreen} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: scale(4) }}>
              <X size={moderateScale(20)} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={[styles.fsPreviewArea, { backgroundColor: colors.background }]}>
            <FlatList
              ref={fullscreenSheetListRef}
              data={sheetData}
              keyExtractor={d => d.key}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onFullscreenSheetChange}
              onScrollToIndexFailed={() => {}}
              viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
              snapToInterval={SCREEN_WIDTH}
              decelerationRate="fast"
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={{ alignItems: 'center' }}
              renderItem={({ item }) => (
                <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center', paddingVertical: scale(20) }}>
                  <SheetPreview
                    sheetIndex={item.index}
                    pw={fsPaperW}
                    ph={fsPaperH}
                    selectedPages={selectedPages}
                    pps={pps}
                    gridCols={gridCols}
                    gridRows={gridRows}
                    isImage={isImage}
                    isBW={isBW}
                    fileUri={fileUri}
                    thumbnails={thumbnails}
                    thumbLoading={thumbLoading}
                  />
                </View>
              )}
            />
          </View>

          <View style={[styles.fsNavBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, scale(12)) }]}>
            <View style={styles.sheetNav}>
              {totalSheets > 1 && (
                <TouchableOpacity onPress={() => goToSheet(-1)} disabled={currentSheet === 0} style={[styles.sheetNavBtn, currentSheet === 0 && { opacity: 0.3 }]}>
                  <ChevronLeft size={moderateScale(16)} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              )}
              <Text style={[styles.sheetNavText, { color: colors.textMuted }]}>
                {totalSheets > 1 ? `Sheet ${currentSheet + 1} of ${totalSheets} · ` : ''}
                {selectedPages.length} {selectedPages.length === 1 ? 'page' : 'pages'}
              </Text>
              {totalSheets > 1 && (
                <TouchableOpacity onPress={() => goToSheet(1)} disabled={currentSheet === totalSheets - 1} style={[styles.sheetNavBtn, currentSheet === totalSheets - 1 && { opacity: 0.3 }]}>
                  <ChevronRight size={moderateScale(16)} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  previewSection: { paddingHorizontal: scale(20), marginBottom: scale(20) },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(8) },
  sectionLabel: { fontSize: moderateScale(10), fontFamily: 'Geist-Bold', letterSpacing: 1, textTransform: 'uppercase' },
  previewContainer: { borderRadius: scale(12), padding: scale(12), alignItems: 'center' },
  paperSheet: { backgroundColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, borderRadius: scale(2), overflow: 'hidden' },
  ppsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  pageCell: { flex: 1, width: '100%', height: '100%' },
  sheetNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: scale(10), gap: scale(8) },
  sheetNavBtn: { padding: scale(6) },
  sheetNavText: { fontSize: moderateScale(10), fontFamily: 'GeistMono-Regular', letterSpacing: 0.3 },
  fsContainer: { flex: 1 },
  fsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(20), paddingBottom: scale(10), borderBottomWidth: StyleSheet.hairlineWidth },
  fsTitle: { fontSize: moderateScale(19), fontFamily: 'Geist-SemiBold' },
  fsPreviewArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fsNavBar: { paddingHorizontal: scale(20), paddingTop: scale(10), borderTopWidth: StyleSheet.hairlineWidth },
});
