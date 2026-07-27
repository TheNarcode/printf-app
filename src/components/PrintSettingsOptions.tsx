import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Minus, Plus, X } from 'lucide-react-native';
import { Text } from './Text';
import { scale, moderateScale } from '../utils/responsive';
import type { ThemeColors } from '../theme/colors';

const SIDES_OPTIONS = [
  { id: 'single', label: 'Single Sided' },
  { id: 'double-long', label: 'Double (Long Edge)' },
  { id: 'double-short', label: 'Double (Short Edge)' },
] as const;

const PAGES_PER_SHEET_OPTS = [1, 2, 4, 6, 9];

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
            style={[styles.compactSegBtn, active && styles.compactSegBtnActive, active && { backgroundColor: colors.card }]}
          >
            <Text style={[styles.compactSegText, { color: active ? colors.text : colors.textSecondary }, active && { fontFamily: 'Geist-SemiBold' }]}>
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

function SettingRow({ label, children, isLast = false, colors }: SettingRowProps) {
  return (
    <View style={[styles.settingRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.settingRowLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.settingRowControl}>{children}</View>
    </View>
  );
}

interface PrintSettingsOptionsProps {
  colors: ThemeColors;
  insets: any;
  settings: any;
  file: any;
  update: (key: string, val: any) => void;
  pageRangeError: string;
  handlePageRangeChange: (text: string) => void;
}

export function PrintSettingsOptions({
  colors,
  insets,
  settings,
  file,
  update,
  pageRangeError,
  handlePageRangeChange,
}: PrintSettingsOptionsProps) {
  const [showSidesModal, setShowSidesModal] = useState(false);

  const openSidesModal = useCallback(() => setShowSidesModal(true), []);
  const closeSidesModal = useCallback(() => setShowSidesModal(false), []);

  return (
    <>
      <View style={styles.settingsSection}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted, paddingHorizontal: scale(20) }]}>OPTIONS</Text>

        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow label="Copies" colors={colors}>
            <View style={[styles.stepper, { borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => update('copies', Math.max(1, settings.copies - 1))} style={styles.stepBtn}>
                <Minus size={moderateScale(14)} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
              <View style={[styles.stepValue, { backgroundColor: colors.surface }]}>
                <Text style={[styles.stepValueText, { color: colors.text }]}>{settings.copies}</Text>
              </View>
              <TouchableOpacity onPress={() => update('copies', settings.copies + 1)} style={styles.stepBtn}>
                <Plus size={moderateScale(14)} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </SettingRow>

          <SettingRow label="Color" colors={colors}>
            <CompactSeg
              options={[{ id: 'bw', label: 'B&W' }, { id: 'color', label: 'Color' }]}
              value={settings.colorMode}
              onChange={v => update('colorMode', v)}
              colors={colors}
            />
          </SettingRow>

          <SettingRow label="Orientation" colors={colors}>
            <CompactSeg
              options={[{ id: 'portrait', label: 'Portrait' }, { id: 'landscape', label: 'Landscape' }]}
              value={settings.orientation}
              onChange={v => update('orientation', v)}
              colors={colors}
            />
          </SettingRow>

          <SettingRow label="Paper Size" colors={colors}>
            <CompactSeg
              options={[{ id: 'a4', label: 'A4' }, { id: 'a3', label: 'A3' }]}
              value={settings.paperSize}
              onChange={v => update('paperSize', v)}
              colors={colors}
            />
          </SettingRow>

          <SettingRow label="Pages / Sheet" colors={colors}>
            <CompactSeg
              options={PAGES_PER_SHEET_OPTS.map(n => ({ id: n, label: n.toString() }))}
              value={settings.pagesPerSheet}
              onChange={v => update('pagesPerSheet', v)}
              colors={colors}
            />
          </SettingRow>

          <SettingRow label="Sides" colors={colors}>
            <TouchableOpacity onPress={openSidesModal} style={[styles.dropdownRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.dropdownValue, { color: colors.text }]} numberOfLines={1}>
                {SIDES_OPTIONS.find(p => p.id === settings.sides)?.label}
              </Text>
              <ChevronRight size={moderateScale(14)} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </SettingRow>

          <View style={[styles.pageRangeSection, { borderTopColor: colors.borderLight }]}>
            <View style={styles.pageRangeHeader}>
              <Text style={[styles.settingRowLabel, { color: colors.text }]}>Page Range</Text>
              <Text style={[styles.pageRangeHint, { color: colors.textMuted }]}>{file.pages} pages total</Text>
            </View>
            <TextInput
              style={[styles.pageRangeInput, { color: colors.text, borderColor: pageRangeError ? colors.danger : colors.border, backgroundColor: colors.surface }]}
              placeholder="All pages — or enter range like 1-5, 8, 11-13"
              placeholderTextColor={colors.textMuted}
              value={settings.pageRange === 'all' ? '' : settings.pageRange}
              onChangeText={handlePageRangeChange}
            />
            {pageRangeError ? (
              <Text style={{ fontSize: moderateScale(11), fontFamily: 'Geist-Medium', color: colors.danger, marginTop: scale(4) }}>
                {pageRangeError}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <Modal visible={showSidesModal} transparent animationType="fade" onRequestClose={closeSidesModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBgClose} activeOpacity={1} onPress={closeSidesModal} />
          <View style={[styles.actionSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + scale(20) }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Duplex / Sides</Text>
              <TouchableOpacity onPress={closeSidesModal}>
                <X size={moderateScale(18)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {SIDES_OPTIONS.map(opt => {
              const active = settings.sides === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sheetOption, { borderBottomColor: colors.borderLight }]}
                  onPress={() => {
                    update('sides', opt.id);
                    closeSidesModal();
                  }}
                >
                  <Text style={[styles.sheetOptionText, { color: colors.text }, active && { fontFamily: 'Geist-SemiBold', color: colors.primary }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={[styles.radioActive, { borderColor: colors.primary }]}>
                      <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: moderateScale(10), fontFamily: 'Geist-Bold', letterSpacing: 1, textTransform: 'uppercase' },
  settingsSection: { gap: scale(6) },
  settingsCard: { marginHorizontal: scale(20), borderRadius: scale(14), borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(12), paddingHorizontal: scale(16) },
  settingRowLabel: { fontSize: moderateScale(13), fontFamily: 'Geist-Medium' },
  settingRowControl: { flexDirection: 'row', alignItems: 'center' },
  compactSeg: { flexDirection: 'row', borderRadius: scale(6), padding: 2 },
  compactSegBtn: { paddingVertical: scale(6), paddingHorizontal: scale(10), alignItems: 'center', borderRadius: scale(4) },
  compactSegBtnActive: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  compactSegText: { fontSize: moderateScale(11), fontFamily: 'Geist-Medium' },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: scale(6), minWidth: scale(100) },
  dropdownValue: { fontSize: moderateScale(12), fontFamily: 'Geist-Medium', flex: 1, marginRight: scale(6) },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: scale(6), overflow: 'hidden' },
  stepBtn: { paddingHorizontal: scale(10), paddingVertical: scale(6), alignItems: 'center' },
  stepValue: { paddingHorizontal: scale(12), paddingVertical: scale(6) },
  stepValueText: { fontSize: moderateScale(13), fontFamily: 'Geist-Bold' },
  pageRangeSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: scale(14), paddingHorizontal: scale(16) },
  pageRangeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(8) },
  pageRangeHint: { fontSize: moderateScale(11), fontFamily: 'GeistMono-Regular' },
  pageRangeInput: { borderWidth: 1, borderRadius: scale(8), paddingHorizontal: scale(14), paddingVertical: scale(12), fontSize: moderateScale(14), fontFamily: 'Geist-Medium' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBgClose: { flex: 1 },
  actionSheet: { borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20), paddingHorizontal: scale(20), paddingTop: scale(20) },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) },
  sheetTitle: { fontSize: moderateScale(16), fontFamily: 'Geist-Bold' },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: scale(14), borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: moderateScale(14), fontFamily: 'Geist-Medium' },
  radioActive: { width: scale(20), height: scale(20), borderRadius: scale(10), borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: scale(10), height: scale(10), borderRadius: scale(5) },
});
