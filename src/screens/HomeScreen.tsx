import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  ChevronRight,
  ClipboardClock,
  PrinterCheck,
  PrinterX,
  BanknoteArrowUp,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { CustomAlertAPI } from '../components/CustomAlert';
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders, refreshOrders, resetFlow } = usePrintJob();
  const { user } = useAuth();
  const { assertOnline } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);

  useDoubleBackToExit();

  const handleRefresh = useCallback(async () => {
    if (!assertOnline()) return;
    setRefreshing(true);
    try {
      await refreshOrders();
    } catch {
      CustomAlertAPI.alert(
        'Connection Error',
        'Unable to connect right now. Please try again later.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshOrders, assertOnline]);

  const { width } = useWindowDimensions();
  const maxOrders = width > 768 ? 5 : 3;
  const recentOrders = orders.slice(0, maxOrders);

  const counts = useMemo(
    () => ({
      paymentPending: orders.filter(o => o.status === 0 && !o.paid).length,
      inProgress: orders.filter(o => o.status === 0 && o.paid).length,
      completed: orders.filter(o => o.status === 1).length,
      failed: orders.filter(o => o.status === 2).length,
    }),
    [orders],
  );

  const handleProfile = useCallback(
    () => navigation.navigate('Settings'),
    [navigation],
  );
  const handleNewOrder = useCallback(() => {
    if (!assertOnline()) return;
    resetFlow();
    navigation.navigate('Upload');
  }, [navigation, resetFlow, assertOnline]);
  const handleOrderPress = useCallback(
    (order: Order & { _payNowTrigger?: boolean }) => navigation.navigate('OrderDetail', { orderId: order.id, _payNowTrigger: order._payNowTrigger }),
    [navigation],
  );
  const handleViewAll = useCallback(
    () => navigation.navigate('AllOrders'),
    [navigation],
  );
  const handleStatPress = useCallback(
    (filter: string) => navigation.navigate('AllOrders', { filter }),
    [navigation],
  );

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => (
      <View style={{ marginBottom: scale(10) }}>
        <OrderCard order={item} onPress={handleOrderPress} variant="list" />
      </View>
    ),
    [handleOrderPress],
  );

  const firstName = user?.name?.split(' ')[0] || 'there';

  const stats = [
    {
      key: 'payment_pending',
      icon: BanknoteArrowUp,
      count: counts.paymentPending,
      label: 'Payment Pending',
      iconColor: colors.warning,
    },
    {
      key: 'in_progress',
      icon: ClipboardClock,
      count: counts.inProgress,
      label: 'In Progress',
      iconColor: colors.info,
    },
    {
      key: 'completed',
      icon: PrinterCheck,
      count: counts.completed,
      label: 'To Collect',
      iconColor: colors.success,
    },
    {
      key: 'failed',
      icon: PrinterX,
      count: counts.failed,
      label: 'Failed',
      iconColor: colors.danger,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBrand
        rightElement={
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={handleProfile}
            activeOpacity={0.7}
          >
            <Settings size={moderateScale(20)} color={colors.text} strokeWidth={1.8} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={recentOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + scale(100) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textMuted}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}, {firstName}.
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {[0, 1].map(row => (
                <View key={row} style={styles.statsRow}>
                  {stats.slice(row * 2, row * 2 + 2).map(s => (
                    <TouchableOpacity
                      key={s.key}
                      activeOpacity={0.7}
                      onPress={() => handleStatPress(s.key)}
                      style={[
                        styles.statCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.statTop}>
                        <s.icon
                          size={moderateScale(16)}
                          color={s.iconColor}
                          strokeWidth={1.8}
                        />
                        <Text
                          style={[styles.statNumber, { color: colors.text }]}
                        >
                          {s.count}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Recent Orders */}
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Orders
              </Text>
              <TouchableOpacity
                onPress={handleViewAll}
                style={styles.viewAllBtn}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.viewAllText, { color: colors.textSecondary }]}
                >
                  View All
                </Text>
                <ChevronRight
                  size={moderateScale(12)}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No orders yet
            </Text>
            <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
              Tap the + button to start printing.
            </Text>
          </View>
        }
      />

      <FAB onPress={handleNewOrder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: scale(20) },
  headerSection: { paddingTop: scale(24) },
  settingsBtn: {
    padding: scale(8),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: moderateScale(24),
    fontFamily: 'Geist-Bold',
    letterSpacing: -0.5,
    marginBottom: scale(16),
  },

  statsGrid: { gap: scale(8), marginBottom: scale(20) },
  statsRow: { flexDirection: 'row', gap: scale(8) },
  statCard: {
    flex: 1,
    padding: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(6),
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statNumber: { fontSize: moderateScale(22), fontFamily: 'Geist-Bold' },
  statLabel: { fontSize: moderateScale(11), fontFamily: 'Geist-Medium' },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(8),
    marginBottom: scale(8),
  },
  sectionTitle: { fontSize: moderateScale(16), fontFamily: 'Geist-SemiBold' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: moderateScale(12), fontFamily: 'Geist-Medium' },

  emptyState: {
    paddingVertical: scale(32),
    alignItems: 'center',
    gap: scale(6),
  },
  emptyStateTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Geist-SemiBold',
  },
  emptyStateDesc: {
    fontSize: moderateScale(14),
    fontFamily: 'Geist-Regular',
  },
});
