import React, {useCallback, useState} from 'react';
import {Dimensions, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View, TextInput, FlatList} from 'react-native';
import {ChevronDown, Minus, Plus, FileText, CheckCircle2, Info} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {usePrintJob} from '../context/PrintJobContext';
import Header from '../components/Header';
import {Text} from '../components/Text';
import {formatFileSize} from '../utils/formatters';
import {getSafePreviewUri} from '../utils/pdfModifier';
import {scale, moderateScale, SCREEN_WIDTH} from '../utils/responsive';

let PdfView: any = null;
try {
  PdfView = require('react-native-pdf').default;
} catch (_) {}

interface Props {
  navigation: any;
}

const PAPER_SIZES = [
  {id: 'a4', label: 'A4'},
  {id: 'a3', label: 'A3'},
  {id: 'letter', label: 'Letter'},
] as const;

const SIDES_OPTIONS = [
  {id: 'single', label: 'Single Sided'},
  {id: 'double-long', label: 'Double (Long Edge)'},
  {id: 'double-short', label: 'Double (Short Edge)'},
] as const;

const PAGES_PER_SHEET_OPTS = [1, 2, 4, 6, 9];

export default function SettingsScreen({navigation}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {files, fileSettings, updateFileSettings} = usePrintJob();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showSidesModal, setShowSidesModal] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const file = files[selectedIdx];
  const settings = file ? fileSettings[file.id] : null;

  if (!file || !settings) return null;

  const isImage = file.type.includes('image');
  const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleContinue = useCallback(() => navigation.navigate('Payment'), [navigation]);

  const update = useCallback(
    (key: string, value: any) => {
      if (file) updateFileSettings(file.id, {[key]: value});
    },
    [file, updateFileSettings],
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isImage) {
        setPreviewUri(file.uri);
      } else if (isPdf) {
        const safeUri = await getSafePreviewUri(file.uri);
        if (!cancelled) setPreviewUri(safeUri);
      } else {
        setPreviewUri(null);
      }
    })();
    return () => { cancelled = true; };
  }, [file.uri, file.id, isImage, isPdf]);

  const isLandscape = settings.orientation === 'landscape';
  const paperAspect = isLandscape ? 1.414 : 1 / 1.414;
  const previewW = SCREEN_WIDTH - scale(40);
  const previewH = previewW / paperAspect;
  const maxPreviewH = scale(260);
  const finalPreviewH = Math.min(previewH, maxPreviewH);
  const finalPreviewW = finalPreviewH * paperAspect;

  const pps = settings.pagesPerSheet;
  const gridCols = pps <= 2 ? pps : pps <= 4 ? 2 : 3;
  const gridRows = Math.ceil(pps / gridCols);

  const renderFileCard = useCallback(({item}: {item: any}) => {
    return (
      <View style={{width: SCREEN_WIDTH}}>
        <View style={[styles.fileCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={[styles.fileIconBox, {backgroundColor: colors.primaryBg}]}>
            <FileText size={moderateScale(20)} color={colors.primary} strokeWidth={1.5} />
          </View>
          <View style={styles.fileCardInfo}>
            <Text style={[styles.fileCardName, {color: colors.text}]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.fileCardMeta, {color: colors.textMuted}]}>
              {formatFileSize(item.size)} · {item.pages} {item.pages === 1 ? 'page' : 'pages'}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [colors]);

  const onViewableItemsChanged = useCallback(({viewableItems}: any) => {
    if (viewableItems.length > 0) setSelectedIdx(viewableItems[0].index);
  }, []);

  const CompactSeg = ({options, value, onChange}: {options: {id: any; label: string}[]; value: any; onChange: (v: any) => void}) => (
    <View style={[styles.compactSeg, {backgroundColor: colors.surface}]}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[styles.compactSegBtn, active && [styles.compactSegBtnActive, {backgroundColor: colors.card}]]}>
            <Text style={[styles.compactSegText, {color: active ? colors.text : colors.textSecondary}, active && {fontFamily: 'Geist-SemiBold'}]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const SettingRow = ({label, children, isLast = false}: {label: string; children: React.ReactNode; isLast?: boolean}) => (
    <View style={[styles.settingRow, !isLast && {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight}]}>
      <Text style={[styles.settingRowLabel, {color: colors.text}]}>{label}</Text>
      <View style={styles.settingRowControl}>{children}</View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
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
            viewabilityConfig={{viewAreaCoveragePercentThreshold: 50}}
          />
          {files.length > 1 && (
            <View style={styles.dotsRow}>
              {files.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {backgroundColor: i === selectedIdx ? colors.primary : colors.border},
                    i === selectedIdx && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── LIVE PREVIEW PANE ─── */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>PRINT PREVIEW</Text>
            {settings.colorMode === 'bw' && (
              <View style={[styles.bwBadge, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                <Info size={moderateScale(10)} color={colors.textMuted} />
                <Text style={[styles.bwBadgeText, {color: colors.textSecondary}]}>Preview in Color, Prints in B&W</Text>
              </View>
            )}
          </View>
          
          <View style={[styles.previewContainer, {backgroundColor: colors.surface}]}>
            <View style={[
              styles.paperSheet,
              {
                width: finalPreviewW,
                height: finalPreviewH,
                backgroundColor: '#FFFFFF',
              },
            ]}>
              <View style={[styles.ppsGrid, {flexDirection: 'row', flexWrap: 'wrap'}]}>
                {Array.from({length: pps}).map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: `${100 / gridCols}%`,
                      height: `${100 / gridRows}%`,
                      padding: pps > 1 ? scale(2) : 0,
                    }}>
                    {previewUri && isImage ? (
                      <Image
                        source={{uri: previewUri}}
                        style={[
                          styles.previewImage,
                          settings.colorMode === 'bw' && {opacity: 0.8, tintColor: '#888'},
                        ]}
                        resizeMode="contain"
                      />
                    ) : previewUri && isPdf && PdfView ? (
                      <PdfView
                        source={{uri: previewUri}}
                        page={pps > 1 ? idx + 1 : 1}
                        singlePage={pps > 1}
                        horizontal={true}
                        style={{flex: 1, backgroundColor: 'transparent'}}
                      />
                    ) : previewUri && isPdf ? (
                      <View style={[styles.previewImage, {backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center'}]}>
                        <FileText size={moderateScale(pps > 1 ? 14 : 28)} color="#ccc" strokeWidth={1} />
                      </View>
                    ) : (
                      <View style={[styles.previewImage, {backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center'}]}>
                        <ActivityIndicator size="small" color="#ccc" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ─── UNIFIED SETTINGS LIST ─── */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionLabel, {color: colors.textMuted, paddingHorizontal: scale(20)}]}>OPTIONS</Text>
          
          <View style={[styles.settingsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            
            <SettingRow label="Copies">
              <View style={[styles.stepper, {borderColor: colors.border}]}>
                <TouchableOpacity onPress={() => update('copies', Math.max(1, settings.copies - 1))} style={styles.stepBtn}>
                  <Minus size={moderateScale(14)} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
                <View style={[styles.stepValue, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.stepValueText, {color: colors.text}]}>{settings.copies}</Text>
                </View>
                <TouchableOpacity onPress={() => update('copies', settings.copies + 1)} style={styles.stepBtn}>
                  <Plus size={moderateScale(14)} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </SettingRow>

            <SettingRow label="Color">
              <CompactSeg
                options={[{id: 'bw', label: 'B&W'}, {id: 'color', label: 'Color'}]}
                value={settings.colorMode}
                onChange={v => update('colorMode', v)}
              />
            </SettingRow>

            <SettingRow label="Orientation">
              <CompactSeg
                options={[{id: 'portrait', label: 'Portrait'}, {id: 'landscape', label: 'Landscape'}]}
                value={settings.orientation}
                onChange={v => update('orientation', v)}
              />
            </SettingRow>

            <SettingRow label="Pages Per Sheet">
              <CompactSeg
                options={PAGES_PER_SHEET_OPTS.map(n => ({id: n, label: n.toString()}))}
                value={settings.pagesPerSheet}
                onChange={v => update('pagesPerSheet', v)}
              />
            </SettingRow>

            <SettingRow label="Paper Size">
              <TouchableOpacity onPress={() => setShowPaperModal(true)} style={[styles.dropdownRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                <Text style={[styles.dropdownValue, {color: colors.text}]} numberOfLines={1}>
                  {PAPER_SIZES.find(p => p.id === settings.paperSize)?.label}
                </Text>
                <ChevronDown size={moderateScale(14)} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </SettingRow>

            <SettingRow label="Duplex / Sides">
              <TouchableOpacity onPress={() => setShowSidesModal(true)} style={[styles.dropdownRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                <Text style={[styles.dropdownValue, {color: colors.text}]} numberOfLines={1}>
                  {SIDES_OPTIONS.find(p => p.id === settings.sides)?.label}
                </Text>
                <ChevronDown size={moderateScale(14)} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </SettingRow>

            <SettingRow label="Page Range" isLast>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                placeholder="All (e.g. 1-5, 8)"
                placeholderTextColor={colors.textMuted}
                value={settings.pageRange === 'all' ? '' : settings.pageRange}
                onChangeText={(text) => update('pageRange', text || 'all')}
              />
            </SettingRow>

          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, {backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, scale(16))}]}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.8} style={[styles.continueBtn, {backgroundColor: colors.primary}]}>
          <Text style={[styles.continueBtnText, {color: colors.background}]}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Modals omitted for brevity - kept exactly the same logic */}
      <Modal visible={showPaperModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBgClose} activeOpacity={1} onPress={() => setShowPaperModal(false)} />
          <View style={[styles.actionSheet, {backgroundColor: colors.card, paddingBottom: insets.bottom + scale(20)}]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, {color: colors.text}]}>Paper Size</Text>
              <TouchableOpacity onPress={() => setShowPaperModal(false)}>
                <X size={moderateScale(18)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {PAPER_SIZES.map((paper) => (
              <TouchableOpacity
                key={paper.id}
                style={[styles.sheetOption, {borderBottomColor: colors.borderLight}]}
                onPress={() => {
                  update('paperSize', paper.id);
                  setShowPaperModal(false);
                }}>
                <Text style={[styles.sheetOptionText, {color: colors.text}, settings.paperSize === paper.id && {fontFamily: 'Geist-SemiBold', color: colors.primary}]}>
                  {paper.label}
                </Text>
                {settings.paperSize === paper.id && <CheckCircle2 size={moderateScale(16)} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showSidesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBgClose} activeOpacity={1} onPress={() => setShowSidesModal(false)} />
          <View style={[styles.actionSheet, {backgroundColor: colors.card, paddingBottom: insets.bottom + scale(20)}]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, {color: colors.text}]}>Duplex / Sides</Text>
              <TouchableOpacity onPress={() => setShowSidesModal(false)}>
                <X size={moderateScale(18)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {SIDES_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sheetOption, {borderBottomColor: colors.borderLight}]}
                onPress={() => {
                  update('sides', opt.id);
                  setShowSidesModal(false);
                }}>
                <Text style={[styles.sheetOptionText, {color: colors.text}, settings.sides === opt.id && {fontFamily: 'Geist-SemiBold', color: colors.primary}]}>
                  {opt.label}
                </Text>
                {settings.sides === opt.id && <CheckCircle2 size={moderateScale(16)} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const X = ({size, color}: any) => {
  const LucideX = require('lucide-react-native').X;
  return <LucideX size={size} color={color} />;
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollContent: {paddingBottom: scale(32)},

  fileCard: {
    marginHorizontal: scale(20), marginTop: scale(12), marginBottom: scale(6),
    padding: scale(10), borderRadius: scale(12), borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: scale(10),
  },
  fileIconBox: {width: scale(36), height: scale(36), borderRadius: scale(8), justifyContent: 'center', alignItems: 'center'},
  fileCardInfo: {flex: 1},
  fileCardName: {fontSize: moderateScale(13), fontFamily: 'Geist-SemiBold', marginBottom: 2},
  fileCardMeta: {fontSize: moderateScale(10)},
  dotsRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: scale(5), marginBottom: scale(12), marginTop: scale(4)},
  dot: {width: scale(5), height: scale(5), borderRadius: scale(3)},
  dotActive: {width: scale(12)},

  previewSection: {paddingHorizontal: scale(20), marginBottom: scale(24)},
  previewHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(8)},
  sectionLabel: {fontSize: moderateScale(10), fontFamily: 'Geist-Bold', letterSpacing: 1, textTransform: 'uppercase'},
  bwBadge: {flexDirection: 'row', alignItems: 'center', gap: scale(4), paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4), borderWidth: 1},
  bwBadgeText: {fontSize: moderateScale(9), fontFamily: 'Geist-Medium'},
  
  previewContainer: {
    borderRadius: scale(12), padding: scale(16),
    alignItems: 'center', justifyContent: 'center',
  },
  paperSheet: {
    elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.12, shadowRadius: 6,
    borderRadius: scale(3), overflow: 'hidden',
  },
  ppsGrid: {flex: 1},
  previewImage: {flex: 1, width: '100%', height: '100%'},

  settingsSection: {gap: scale(6)},
  settingsCard: {
    marginHorizontal: scale(20), borderRadius: scale(14), borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: scale(12), paddingHorizontal: scale(16),
  },
  settingRowLabel: {fontSize: moderateScale(13), fontFamily: 'Geist-Medium'},
  settingRowControl: {flexDirection: 'row', alignItems: 'center'},

  compactSeg: {flexDirection: 'row', borderRadius: scale(6), padding: 2},
  compactSegBtn: {paddingVertical: scale(6), paddingHorizontal: scale(12), alignItems: 'center', borderRadius: scale(4)},
  compactSegBtnActive: {elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, shadowRadius: 2},
  compactSegText: {fontSize: moderateScale(11), fontFamily: 'Geist-Medium'},

  dropdownRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: scale(6),
    minWidth: scale(100),
  },
  dropdownValue: {fontSize: moderateScale(12), fontFamily: 'Geist-Medium', flex: 1, marginRight: scale(8)},

  stepper: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: scale(6), overflow: 'hidden'},
  stepBtn: {paddingHorizontal: scale(10), paddingVertical: scale(6), alignItems: 'center'},
  stepValue: {paddingHorizontal: scale(12), paddingVertical: scale(6)},
  stepValueText: {fontSize: moderateScale(13), fontFamily: 'Geist-Bold'},
  
  input: {
    borderWidth: 1, borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: scale(6), 
    fontSize: moderateScale(12), fontFamily: 'Geist-Medium', minWidth: scale(100), textAlign: 'right'
  },

  bottomBar: {
    paddingHorizontal: scale(20), paddingTop: scale(14),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  continueBtn: {width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: scale(13), borderRadius: scale(8)},
  continueBtnText: {fontSize: moderateScale(15), fontFamily: 'Geist-SemiBold'},

  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalBgClose: {flex: 1},
  actionSheet: {borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20), paddingHorizontal: scale(20), paddingTop: scale(20)},
  sheetHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12)},
  sheetTitle: {fontSize: moderateScale(16), fontFamily: 'Geist-Bold'},
  sheetOption: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: scale(14), borderBottomWidth: StyleSheet.hairlineWidth},
  sheetOptionText: {fontSize: moderateScale(14), fontFamily: 'Geist-Medium'},
});
