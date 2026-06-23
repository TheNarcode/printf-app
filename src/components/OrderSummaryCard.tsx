import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, fontSize, spacing } from '../theme/colors';
import type { FileWithSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Text } from '../components/Text';

interface OrderSummaryCardProps {
  items: FileWithSettings[];
  convenienceFee: number;
  total: number;
}

const OrderSummaryCard = memo(
  ({ items, convenienceFee, total }: OrderSummaryCardProps) => {
    const { colors } = useTheme();

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {items.map((item, i) => (
          <View
            key={item.file.id}
            style={[
              styles.line,
              i < items.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
                paddingBottom: spacing.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Text
              style={[styles.itemName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.file.name} × {item.settings.copies}
            </Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>
              {formatCurrency(item.price)}
            </Text>
          </View>
        ))}

        <View
          style={[
            styles.line,
            {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              paddingTop: spacing.md,
              marginTop: spacing.xs,
            },
          ]}
        >
          <Text style={[styles.feeLabel, { color: colors.textMuted }]}>
            Convenience fee
          </Text>
          <Text style={[styles.feePrice, { color: colors.textMuted }]}>
            {formatCurrency(convenienceFee)}
          </Text>
        </View>

        <View
          style={[
            styles.totalLine,
            { borderTopWidth: 1, borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: colors.text }]}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: fontSize.md, flex: 1, marginRight: spacing.md },
  itemPrice: { fontSize: fontSize.md, fontFamily: 'Geist-Medium' },
  feeLabel: { fontSize: fontSize.sm, fontStyle: 'italic' },
  feePrice: { fontSize: fontSize.sm },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginTop: spacing.md,
  },
  totalLabel: { fontSize: fontSize.lg, fontFamily: 'Geist-SemiBold' },
  totalPrice: { fontSize: fontSize.xxl, fontFamily: 'Geist-Bold' },
});

export default OrderSummaryCard;
