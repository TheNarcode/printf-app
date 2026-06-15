import React, {memo, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {FileText, Layers} from 'lucide-react-native';
import {useTheme} from '../theme/ThemeContext';
import type {Order} from '../types';
import {calculateSpending, formatCurrency} from '../utils/formatters';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

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
      <Text style={[styles.cardLabel, {color: colors.textMuted}]}>SPENDING</Text>

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

      <Text style={[styles.amount, {color: colors.text}]}>{formatCurrency(summary.totalSpent)}</Text>
      <Text style={[styles.periodLabel, {color: colors.textMuted}]}>
        Total spent {periodLabels[period].toLowerCase()}
      </Text>

      <View style={[styles.statsRow, {borderTopColor: colors.border}]}>
        <View style={styles.stat}>
          <FileText size={moderateScale(12)} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.statValue, {color: colors.text}]}>{summary.orderCount}</Text>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>orders</Text>
        </View>
        <View style={[styles.statDivider, {backgroundColor: colors.border}]} />
        <View style={styles.stat}>
          <Layers size={moderateScale(12)} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={[styles.statValue, {color: colors.text}]}>{summary.pageCount}</Text>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>pages</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {borderRadius: scale(14), borderWidth: 1, padding: scale(16)},
  cardLabel: {fontSize: moderateScale(9), fontFamily: 'Geist-SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: scale(12)},
  periodRow: {flexDirection: 'row', borderRadius: scale(100), padding: scale(3), marginBottom: scale(16)},
  periodBtn: {flex: 1, paddingVertical: scale(7), alignItems: 'center', borderRadius: scale(100)},
  periodBtnActive: {
    elevation: 2, shadowColor: '#000',
    shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3,
  },
  periodText: {fontSize: moderateScale(11), fontFamily: 'Geist-Medium'},
  amount: {fontSize: moderateScale(32), fontFamily: 'Geist-Bold', marginBottom: scale(3)},
  periodLabel: {fontSize: moderateScale(12), marginBottom: scale(12)},
  statsRow: {
    flexDirection: 'row', alignItems: 'center', paddingTop: scale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(4)},
  statDivider: {width: 1, height: scale(18)},
  statValue: {fontSize: moderateScale(14), fontFamily: 'Geist-SemiBold'},
  statLabel: {fontSize: moderateScale(12)},
});

export default SpendingSummary;
