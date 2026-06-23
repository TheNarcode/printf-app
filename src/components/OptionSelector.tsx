import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, fontSize, spacing } from '../theme/colors';
import { Text } from '../components/Text';

interface OptionSelectorProps {
  label: string;
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}

const OptionSelector = memo(
  ({ label, options, selected, onSelect }: OptionSelectorProps) => {
    const { colors } = useTheme();

    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <View style={styles.optionsRow}>
          {options.map(opt => {
            const isActive = opt.key === selected;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => onSelect(opt.key)}
                style={[
                  styles.option,
                  { borderColor: colors.borderLight },
                  isActive && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    isActive && {
                      color: '#FFFFFF',
                      fontFamily: 'Geist-SemiBold',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: 'Geist-SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: fontSize.md,
    fontFamily: 'Geist-Medium',
  },
});

export default OptionSelector;
