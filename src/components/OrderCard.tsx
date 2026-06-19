import React, {memo} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {FileText, Image as ImageIcon, AlertTriangle} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import type {Order} from '../types';
import {formatDateTime, formatTime} from '../utils/formatters';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  variant?: 'home' | 'list';
}

export const getStatusStyle = (status: number, colors: any) => {
  switch (status) {
    case 2: return { bg: colors.successBg, text: colors.textSecondary, border: colors.borderLight, dot: colors.success, label: 'Completed' };
    case 0: return { bg: colors.borderLight, text: colors.textSecondary, border: colors.border, dot: colors.textMuted, label: 'Pending' };
    case 1: return { bg: colors.dangerBg, text: colors.danger, border: colors.dangerBorder, dot: colors.danger, label: 'Error' };
    default: return { bg: colors.surface, text: colors.textMuted, border: colors.border, dot: colors.textMuted, label: 'Unknown' };
  }
};

const OrderCard = memo(({order, onPress, variant = 'list'}: OrderCardProps) => {
  const {colors} = useTheme();
  const statusStyle = getStatusStyle(order.status, colors);
  const firstFile = order.files[0]?.file;
  const isImage = firstFile?.type.includes('image');
  const Icon = order.status === 1 ? AlertTriangle : (isImage ? ImageIcon : FileText);
  const iconBg = order.status === 1 ? colors.dangerBg : colors.primaryBg;
  const iconColor = order.status === 1 ? colors.danger : colors.primary;

  const isHome = variant === 'home';

  if (isHome) {
    return (
      <TouchableOpacity
        onPress={() => onPress(order)}
        activeOpacity={0.6}
        style={[styles.homeContainer, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
        
        <View style={[styles.iconBox, {backgroundColor: iconBg}]}>
          <Icon size={moderateScale(20)} color={iconColor} strokeWidth={1.5} />
        </View>

        <View style={styles.homeContent}>
          <View style={styles.homeTopRow}>
            <Text style={[styles.homeTitle, {color: colors.text}]} numberOfLines={1}>
              {order.orderRef}
            </Text>
            <View style={[styles.badge, {backgroundColor: statusStyle.bg, borderColor: statusStyle.border}]}>
              <View style={[styles.badgeDot, {backgroundColor: statusStyle.dot}]} />
              <Text style={[styles.badgeText, {color: statusStyle.text}]}>{statusStyle.label}</Text>
            </View>
          </View>
          
          <View style={styles.homeBottomRow}>
            <Text style={[styles.homeSubtitle, {color: colors.textMuted}]} numberOfLines={1}>
              {order.totalCopies} Copies • {order.printerName}
            </Text>
            <Text style={[styles.homeTime, {color: colors.textSecondary}]}>
              {order.status === 2 ? formatTime(order.createdAt) : 
               order.status === 1 ? 'Out of Paper' : 
               order.status === 0 ? 'Queued' : `${order.progress}%`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // List Variant (All Orders page)
  const isFailedOrCancelled = order.status === 1;
  const listBadgeStyle = isFailedOrCancelled ? { bg: colors.dangerBg, text: colors.danger, label: 'Cancelled' } : 
                         order.status === 2 ? { bg: colors.successBg, text: colors.success, label: 'Completed' } :
                         { bg: colors.warningBg, text: colors.warning, label: 'Pending' };

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      activeOpacity={0.6}
      style={[styles.listContainer, {backgroundColor: colors.card, borderColor: colors.border}]}>
      
      <View style={styles.listTop}>
        <View style={[styles.listIconBox, {backgroundColor: colors.surface}]}>
          <Icon size={moderateScale(16)} color={colors.textSecondary} strokeWidth={1.5} />
        </View>
        <View style={styles.listInfo}>
          <View style={styles.listTitleRow}>
            <Text style={[styles.listTitle, {color: isFailedOrCancelled ? colors.textMuted : colors.text}]} numberOfLines={1}>
              {isFailedOrCancelled ? <Text style={{textDecorationLine: 'line-through'}}>{order.orderRef}</Text> : order.orderRef}
            </Text>
            <View style={[styles.listBadge, {backgroundColor: listBadgeStyle.bg}]}>
              <Text style={[styles.listBadgeText, {color: listBadgeStyle.text}]}>{listBadgeStyle.label}</Text>
            </View>
          </View>
          <Text style={[styles.listMeta, {color: colors.textMuted}]}>
            {order.totalCopies} Copies • {order.status === 2 ? `Done ${formatDateShort(order.createdAt)}` : formatDateTime(order.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'});
}

const styles = StyleSheet.create({
  // Home Variant
  homeContainer: {
    flexDirection: 'row',
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: scale(10),
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeContent: {flex: 1, gap: scale(3)},
  homeTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  homeTitle: {fontSize: moderateScale(14), fontFamily: 'Geist-SemiBold', flex: 1, marginRight: scale(8)},
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: scale(5),
    paddingVertical: scale(3), paddingHorizontal: scale(7),
    borderRadius: scale(100), borderWidth: 1,
  },
  badgeDot: {width: scale(5), height: scale(5), borderRadius: scale(3)},
  badgeText: {fontSize: moderateScale(9), fontFamily: 'Geist-Medium', textTransform: 'uppercase', letterSpacing: 0.2},
  homeBottomRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  homeSubtitle: {fontSize: moderateScale(12), flex: 1, marginRight: scale(8)},
  homeTime: {fontSize: moderateScale(10), fontFamily: 'Geist-Medium'},

  // List Variant
  listContainer: {
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(14),
    gap: scale(10),
  },
  listTop: {flexDirection: 'row', gap: scale(10)},
  listIconBox: {
    width: scale(36), height: scale(36), borderRadius: scale(8),
    justifyContent: 'center', alignItems: 'center',
  },
  listInfo: {flex: 1, gap: scale(3)},
  listTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  listTitle: {fontSize: moderateScale(14), fontFamily: 'Geist-Medium', flex: 1, marginRight: scale(8)},
  listBadge: {paddingVertical: scale(3), paddingHorizontal: scale(7), borderRadius: scale(6)},
  listBadgeText: {fontSize: moderateScale(10), fontFamily: 'Geist-Medium'},
  listMeta: {fontSize: moderateScale(12)},
});

export default OrderCard;
