import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronRight, ClipboardClock, PrinterCheck, PrinterX, BanknoteArrowUp, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { useRefreshOrders } from '../hooks/useRefreshOrders';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import FAB from '../components/FAB';
import type { Order } from '../types';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';
import { useDoubleBackToExit } from '../hooks/useDoubleBackToExit';

interface Props {
  navigation: any;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders, resetFlow } = usePrintJob();
  const { user } = useAuth();
  const { assertOnline } = useNetwork();
  const { isRefreshing, handleRefresh } = useRefreshOrders();

  useDoubleBackToExit();

  const { recentOrders, stats } = useMemo(() => {
    let paymentPending = 0;
    let inProgress = 0;
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      if (o.status === 0) {
        if (!o.paid) paymentPending++;
        else inProgress++;
      } else if (o.status === 1) {
        completed++;
      } else if (o.status === 2) {
        failed++;
      }
    }

    return {
      recentOrders: orders.slice(0, 3),
      stats: [
        { key: 'payment_pending', icon: BanknoteArrowUp, count: paymentPending, label: 'Payment Pending', iconColor: colors.warning },
        { key: 'in_progress', icon: ClipboardClock, count: inProgress, label: 'In Progress', iconColor: colors.info },
        { key: 'completed', icon: PrinterCheck, count: completed, label: 'To Collect', iconColor: colors.success },
        { key: 'failed', icon: PrinterX, count: failed, label: 'Failed', iconColor: colors.danger },
      ],
    };
  }, [orders, colors]);

  const handleProfile = useCallback(() => navigation.navigate('Settings'), [navigation]);
  const handleViewAll = useCallback(() => navigation.navigate('AllOrders'), [navigation]);
  const handleStatPress = useCallback((filter: string) => navigation.navigate('AllOrders', { filter }), [navigation]);
  const handleOrderPress = useCallback((order: Order) => navigation.navigate('OrderDetail', { orderId: order.id }), [navigation]);

  const handleNewOrder = useCallback(() => {
    if (!assertOnline()) return;
    resetFlow();
    navigation.navigate('Upload');
  }, [navigation, resetFlow, assertOnline]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => (
      <View style={styles.orderCardWrap}>
        <OrderCard order={item} onPress={handleOrderPress} />
      </View>
    ),
    [handleOrderPress],
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={commonStyles.screenContainer}>
      <Header
        showBrand
        rightElement={
          <TouchableOpacity style={styles.settingsBtn} onPress={handleProfile} activeOpacity={0.7}>
            <Settings size={moderateScale(18)} color={colors.text} strokeWidth={1.8} />
          </TouchableOpacity>
        }/>

      <FlatList
        data={recentOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + scale(100) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textMuted} colors={[colors.primary]} progressBackgroundColor={colors.card} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text weight="bold" style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}, {firstName}.
            </Text>

            <View style={styles.statsGrid}>
              {[0, 1].map(row => (
                <View key={row} style={styles.statsRow}>
                  {stats.slice(row * 2, row * 2 + 2).map(s => (
                    <TouchableOpacity
                      key={s.key}
                      activeOpacity={0.7}
                      onPress={() => handleStatPress(s.key)}
                      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={styles.statTop}>
                        <s.icon size={moderateScale(16)} color={s.iconColor} strokeWidth={1.8} />
                        <Text weight="bold" style={[styles.statNumber, { color: colors.text }]}>{s.count}</Text>
                      </View>
                      <Text weight="medium" style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.recentHeader}>
              <Text weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
              <TouchableOpacity onPress={handleViewAll} style={styles.viewAllBtn} activeOpacity={0.7}>
                <Text weight="medium" style={[styles.viewAllText, { color: colors.textSecondary }]}>View All</Text>
                <ChevronRight size={moderateScale(12)} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text weight="semibold" style={[styles.emptyStateTitle, { color: colors.text }]}>No orders yet</Text>
            <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>Tap the + button to start printing.</Text>
          </View>
        }/>

      <FAB onPress={handleNewOrder} />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: scale(20) },
  headerSection: { paddingTop: scale(24) },
  orderCardWrap: { marginBottom: scale(8) },
  settingsBtn: { padding: scale(8), borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: moderateScale(24), letterSpacing: -0.5, marginBottom: scale(16) },
  statsGrid: { gap: scale(6), marginBottom: scale(28) },
  statsRow: { flexDirection: 'row', gap: scale(6) },
  statCard: { flex: 1, padding: scale(14), borderRadius: scale(12), borderWidth: 1 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(6) },
  statNumber: { fontSize: moderateScale(20) },
  statLabel: { fontSize: moderateScale(11) },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(12) },
  sectionTitle: { fontSize: moderateScale(15) },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(2) },
  viewAllText: { fontSize: moderateScale(12) },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: scale(48) },
  emptyStateTitle: { fontSize: moderateScale(16), marginBottom: scale(4) },
  emptyStateDesc: { fontSize: moderateScale(13) },
});