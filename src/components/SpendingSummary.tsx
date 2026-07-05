import React, {memo, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {FileText, Layers, Palette, Circle} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import type {Order} from '../types';
import {calculateSpending, formatCurrency} from '../utils/formatters';
import {Text} from '../components/Text';
import {scale, moderateScale, verticalScale} from '../utils/responsive';

interface SpendingSummaryProps {
  orders: Order[];
}

type Period = 'day' | 'week' | 'month';

const SpendingSummary = memo(({orders}: SpendingSummaryProps) => {
  const {colors} = useTheme();
  const [period, setPeriod] = useState<Period>('month');

  const summary = calculateSpending(orders, period);
  const periodLabels: Record<Period, string> = {day: 'Today', week: 'This Week', month: 'This Month'};
  const periods: Period[] = ['day', 'week', 'month'];

  return (
    <View style={[styles.container, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={[styles.periodRow, {backgroundColor: colors.surface}]}>
        {periods.map(p => {
          const active = period === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodBtn,
                active ? [styles.periodBtnActive, {backgroundColor: colors.card}] : {backgroundColor: 'transparent'}
              ]}>
              <Text style={[
                styles.periodText,
                {color: active ? colors.text : colors.textMuted},
                active && {fontFamily: 'Geist-SemiBold'}
              ]}>
                {periodLabels[p]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.totalSection}>
        <Text style={[styles.totalLabel, {color: colors.textMuted}]}>TOTAL SPENT</Text>
        <Text style={[styles.amount, {color: colors.text}]}>{formatCurrency(summary.totalSpent)}</Text>
      </View>

      <View style={styles.grid}>
        <View style={[styles.gridItem, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={styles.gridHeader}>
            <FileText size={moderateScale(12)} color={colors.textMuted} strokeWidth={2} />
            <Text style={[styles.gridLabel, {color: colors.textMuted}]}>ORDERS</Text>
          </View>
          <Text style={[styles.gridValue, {color: colors.text}]}>{summary.orderCount}</Text>
        </View>

        <View style={[styles.gridItem, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={styles.gridHeader}>
            <Layers size={moderateScale(12)} color={colors.textMuted} strokeWidth={2} />
            <Text style={[styles.gridLabel, {color: colors.textMuted}]}>PAGES</Text>
          </View>
          <Text style={[styles.gridValue, {color: colors.text}]}>{summary.pageCount}</Text>
        </View>

        <View style={[styles.gridItem, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={styles.gridHeader}>
            <Circle size={moderateScale(12)} color={colors.textMuted} strokeWidth={2} />
            <Text style={[styles.gridLabel, {color: colors.textMuted}]}>B&W</Text>
          </View>
          <Text style={[styles.gridValue, {color: colors.text}]}>{summary.bwPages}</Text>
        </View>

        <View style={[styles.gridItem, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={styles.gridHeader}>
            <Palette size={moderateScale(12)} color={colors.textMuted} strokeWidth={2} />
            <Text style={[styles.gridLabel, {color: colors.textMuted}]}>COLOR</Text>
          </View>
          <Text style={[styles.gridValue, {color: colors.text}]}>{summary.colorPages}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {borderRadius: scale(14), borderWidth: 1, padding: scale(16)},
  periodRow: {flexDirection: 'row', borderRadius: scale(100), padding: scale(3), marginBottom: scale(20)},
  periodBtn: {flex: 1, paddingVertical: scale(7), alignItems: 'center', borderRadius: scale(100)},
  periodBtnActive: {
    elevation: 2, shadowColor: '#000',
    shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3,
  },
  periodText: {fontSize: moderateScale(11), fontFamily: 'Geist-Medium'},
  
  totalSection: {alignItems: 'center', marginBottom: scale(24)},
  totalLabel: {fontSize: moderateScale(9), fontFamily: 'Geist-Bold', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: scale(4)},
  amount: {fontSize: moderateScale(34), fontFamily: 'Geist-Bold', letterSpacing: -0.5},
  
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: scale(10), justifyContent: 'space-between'},
  gridItem: {
    width: '48%',
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(12),
    alignItems: 'center',
  },
  gridHeader: {flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: scale(4)},
  gridLabel: {fontSize: moderateScale(9), fontFamily: 'Geist-Bold', letterSpacing: 1, textTransform: 'uppercase'},
  gridValue: {fontSize: moderateScale(20), fontFamily: 'Geist-Bold'},
});

export default SpendingSummary;
