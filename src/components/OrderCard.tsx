import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Order } from '../types';
import { formatDateTime } from '../utils/formatters';
import { Text } from './Text';
import { scale, moderateScale } from '../utils/responsive';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

function getBadgeStyle(order: Order, colors: any) {
  if (!order.paid && order.paymentRequestId) {
    return { bg: colors.warningBg, border: colors.warning, text: colors.warning, label: 'Unpaid' };
  }
  switch (order.status) {
    case 2:
      return { bg: colors.dangerBg, border: colors.danger, text: colors.danger, label: 'Failed' };
    case 1:
      return { bg: colors.successBg, border: colors.success, text: colors.success, label: 'Completed' };
    case 3:
      return { bg: colors.collectedBg, border: colors.collected, text: colors.collected, label: 'Collected' };
    default:
      return { bg: colors.infoBg, border: colors.info, text: colors.info, label: 'Pending' };
  }
}

const OrderCard = memo(({ order, onPress }: OrderCardProps) => {
  const { colors } = useTheme();
  const badge = getBadgeStyle(order, colors);
  const firstFile = order.files[0]?.file;
  const isImage = firstFile?.type.includes('image');
  const Icon = order.status === 2 ? AlertTriangle : isImage ? ImageIcon : FileText;

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
          <Icon size={moderateScale(16)} color={colors.textSecondary} strokeWidth={1.5} />
        </View>

        <View style={styles.infoColumn}>
          <View style={styles.titleRow}>
            <Text weight="medium" style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {order.orderRef}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text weight="medium" style={[styles.badgeText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {order.totalCopies} {order.totalCopies === 1 ? 'Copy' : 'Copies'} • {formatDateTime(order.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  iconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoColumn: {
    flex: 1,
    gap: scale(4),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(14),
    flex: 1,
    marginRight: scale(8),
  },
  badge: {
    paddingVertical: scale(3),
    paddingHorizontal: scale(8),
    borderRadius: scale(100),
    borderWidth: 1,
  },
  badgeText: {
    fontSize: moderateScale(10),
  },
  metaText: {
    fontSize: moderateScale(12),
  },
});

export default OrderCard;