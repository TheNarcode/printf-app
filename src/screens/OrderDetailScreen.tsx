import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Printer, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import Header from '../components/Header';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { parsePageRange } from '../utils/previewUtils';
import type { Order } from '../types';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';
import { TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { usePayOrder } from '../hooks/usePayOrder';

interface Props {
  navigation: any;
  route: { params: { orderId: string; _payNowTrigger?: boolean } };
}

// ─── Separator ───────────────────────────────────────────────────────────────
// overflow:'hidden' clips 300 repeated chars to the exact pixel width of its
// parent — no negative margins, no borderStyle hacks. Width = text width.
function Separator({ color }: { color: string }) {
  return (
    <View style={styles.separatorWrap}>
      <Text style={[styles.separatorText, { color }]} numberOfLines={1} ellipsizeMode="clip">
        {'='.repeat(300)}
      </Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderDetailScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const screenBg = colors.background;
  const slipBg = isDark ? '#27272A' : '#eeeeee';;

  const { orders, refreshOrders } = usePrintJob();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshOrders().catch(() => {});
    setRefreshing(false);
  }, [refreshOrders]);

  const lastRefreshRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 30_000) return;
      lastRefreshRef.current = now;
      refreshOrders().catch(() => {});
    }, [refreshOrders]),
  );

  const order = useMemo(
    () => orders.find((o: Order) => o.id === route.params.orderId),
    [orders, route.params.orderId],
  );

  const { payOrder, isPaying } = usePayOrder();

  React.useEffect(() => {
    if (order && route.params._payNowTrigger && !isPaying && !order.paid && order.paymentRequestId) {
       navigation.setParams({ _payNowTrigger: undefined });
       payOrder(order);
    }
  }, [order, route.params._payNowTrigger, isPaying, payOrder, navigation]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  // Derived (safe defaults when order is null)
  const isUnpaid = order?.status === 0 && !order?.paid;
  const isFailed = order?.status === 2;
  const isCollected = order?.status === 3;
  
  const statusLabel = isCollected ? 'Collected' : order?.status === 1 ? 'Completed' : isFailed ? 'Failed' : isUnpaid ? 'Unpaid' : 'In Progress';
  const statusColor = isCollected
    ? colors.collected
    : isFailed
    ? colors.danger
    : order?.status === 1
    ? colors.success
    : isUnpaid
    ? colors.warning
    : colors.info;
  const statusBg = isCollected
    ? colors.collectedBg
    : isFailed
    ? colors.dangerBg
    : order?.status === 1
    ? colors.successBg
    : isUnpaid
    ? colors.warningBg
    : colors.infoBg;

  // ── Early return after all hooks ──────────────────────────────────────────
  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <Header title="Order Details" showBack onBack={handleBack} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Order not found
          </Text>
        </View>
      </View>
    );
  }

  const sepColor = colors.textMuted + '70';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <Header
        title={order ? `Order#${order.orderRef}` : 'Order Details'}
        showBack
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + scale(100), flexGrow: 1, justifyContent: 'center' },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        {/* ── Receipt card ─────────────────────────────────────────── */}
        <View style={styles.receiptContainer}>
          {/* Top jagged edge */}
          <View style={[styles.jaggedEdge, { backgroundColor: screenBg }]}>
            {Array.from({ length: 60 }).map((_, i) => (
              <View
                key={i}
                style={[styles.triangleUp, { borderBottomColor: slipBg }]}
              />
            ))}
          </View>

          {/* ── Receipt body ─────────────────────────────────────── */}
          <View style={[styles.receiptBody, { backgroundColor: slipBg }]}>
            {/* Store header */}
            <View style={styles.receiptHeader}>
              <View
                style={[styles.logoBox, { backgroundColor: colors.primaryBg }]}
              >
                <Printer
                  size={moderateScale(24)}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={[styles.storeName, { color: colors.text }]}>
                PRINTF
              </Text>
              <Text
                style={[styles.addressText, { color: colors.textSecondary }]}
              >
                St. Francis Institute of Technology
              </Text>
              <Text
                style={[styles.addressText, { color: colors.textSecondary }]}
              >
                Mount Poinsur, Borivali West
              </Text>
              <Text
                style={[styles.addressText, { color: colors.textSecondary }]}
              >
                Mumbai - 400103
              </Text>
            </View>

            {/* Prominent Status Banner */}
            <View style={styles.statusPillWrapper}>
              <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusColor }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            <Separator color={sepColor} />

            {/* Order meta */}
            <View style={styles.metaRow}>
              <Text style={[styles.monoLabel, { color: colors.textSecondary }]}>
                Order ID:
              </Text>
              <Text style={[styles.monoValue, { color: colors.text }]}>
                {order.orderRef}
              </Text>
            </View>
              <View style={styles.metaRow}>
                <Text style={[styles.monoLabel, { color: colors.textSecondary }]}>Date:</Text>
                <Text style={[styles.monoValue, { color: colors.text }]}>{formatDateTime(order.createdAt)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.monoLabel, { color: colors.textSecondary }]}>Printer:</Text>
                <Text style={[styles.monoValue, { color: colors.text }]} numberOfLines={1}>{order.printerName}</Text>
              </View>

            <Separator color={sepColor} />

            {/* Column headers */}
            <View style={styles.columnHeader}>
              <Text style={[styles.colName, { color: colors.textSecondary }]}>
                Name
              </Text>
              <Text style={[styles.colQty, { color: colors.textSecondary }]}>
                Qty
              </Text>
              <Text style={[styles.colPrice, { color: colors.textSecondary }]}>
                Price
              </Text>
            </View>

            <View
              style={[
                styles.thinLine,
                { backgroundColor: colors.textMuted + '40' },
              ]}
            />

            {/* File items */}
            <View style={styles.itemsSection}>
              {order.files.map(f => {
                const printedPages = parsePageRange(f.settings.pageRange, f.file.pages).length;
                const sheets = Math.ceil(printedPages / f.settings.pagesPerSheet);
                const pricePerSheet = sheets > 0 && f.settings.copies > 0 ? f.price / (sheets * f.settings.copies) : 0;

                return (
                  <View key={f.file.id} style={styles.itemBlock}>
                    <View style={styles.columnHeader}>
                      <Text
                        style={[styles.itemName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {f.file.name}
                      </Text>
                      <Text style={[styles.itemQty, { color: colors.text }]}>
                        {f.settings.copies}
                      </Text>
                      <Text style={[styles.itemPriceCol, { color: colors.text }]}>
                        {formatCurrency(f.price)}
                      </Text>
                    </View>
                    <View style={styles.detailsBox}>
                      <Text
                        style={[styles.itemDetail, { color: colors.textMuted }]}
                      >
                        {printedPages}p ·{' '}
                        {f.settings.colorMode === 'color' ? 'Color' : 'B&W'} ·{' '}
                        {f.settings.paperSize.toUpperCase()} ·{' '}
                        {f.settings.sides === 'single' ? '1-sided' : '2-sided'} ·{' '}
                        {f.settings.pagesPerSheet}pp/s
                      </Text>
                      <Text style={[styles.itemDetail, { color: colors.textMuted, marginTop: scale(2) }]}>
                        Cost breakdown: {sheets} sheet{sheets !== 1 ? 's' : ''} × ₹{pricePerSheet.toFixed(2)} {f.settings.copies > 1 ? `× ${f.settings.copies} copies` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Separator color={sepColor} />

            {/* Sub-totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalLine}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Sub Total
                </Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {formatCurrency(order.totalPrice - order.convenienceFee)}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text
                  style={[styles.totalLabel, { color: colors.textSecondary }]}
                >
                  Convenience Fee (5%)
                </Text>
                <Text
                  style={[styles.totalValue, { color: colors.textSecondary }]}
                >
                  {formatCurrency(order.convenienceFee)}
                </Text>
              </View>
            </View>

            <Separator color={sepColor} />

            {/* Grand total */}
            <View style={styles.grandTotalRow}>
              <Text style={[styles.grandTotalLabel, { color: colors.text }]}>
                TOTAL
              </Text>
              <Text style={[styles.grandTotalValue, { color: colors.text }]}>
                {formatCurrency(order.totalPrice)}
              </Text>
            </View>
            <View style={styles.totalLine}>
              <Text
                style={[styles.totalLabel, { color: colors.textSecondary }]}
              >
                STATUS
              </Text>
              <Text
                style={[styles.totalValue, { color: colors.textSecondary }]}
              >
                {order.paid ? 'Payment Cleared' : 'Payment Pending'}
              </Text>
            </View>

            <Separator color={sepColor} />

            {/* Footer message */}
            <View style={styles.footerSection}>
              <Text style={[styles.footerBold, { color: colors.text }]}>
                THANK YOU!
              </Text>
              <Text
                style={[styles.footerSub, { color: colors.textSecondary }]}
              >
                Glad to see you again!
              </Text>
            </View>
          </View>
          {/* ── end receipt body ──────────────────────────────────── */}

          {/* Bottom jagged edge */}
          <View style={[styles.jaggedEdge, { backgroundColor: screenBg }]}>
            {Array.from({ length: 60 }).map((_, i) => (
              <View
                key={i}
                style={[styles.triangleDown, { borderTopColor: slipBg }]}
              />
            ))}
          </View>
        </View>
        {/* ── end receipt card ─────────────────────────────────────── */}
      </ScrollView>

      {(!order.paid && order.paymentRequestId) && (
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + scale(24) }]} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => payOrder(order)}
            disabled={isPaying}
            activeOpacity={0.7}
            style={[
              styles.payBtn,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}>
            {isPaying ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={[styles.payBtnText, { color: colors.background }]}>
                Pay {formatCurrency(order.totalPrice)}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.securedRow}>
            <Lock
              size={moderateScale(10)}
              color={colors.textMuted}
              strokeWidth={2}
            />
            <Text style={[styles.securedText, { color: colors.textMuted }]}>
              Secured by Razorpay
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: scale(16), paddingTop: scale(24) },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: moderateScale(14) },

  receiptContainer: {
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  receiptBody: {
    paddingHorizontal: scale(20),
    paddingTop: scale(32),
    paddingBottom: scale(12),
  },

  // ── Jagged edges ──────────────────────────────────────────────────────────
  jaggedEdge: { flexDirection: 'row', height: scale(12), overflow: 'hidden' },

  triangleUp: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: scale(6),
    borderRightWidth: scale(6),
    borderBottomWidth: scale(12),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // borderBottomColor set dynamically to screenBg
  },

  triangleDown: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: scale(6),
    borderRightWidth: scale(6),
    borderTopWidth: scale(12),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // borderTopColor set dynamically to slipBg
  },

  // ── Separator ─────────────────────────────────────────────────────────────
  // overflow:'hidden' clips the 300-char string exactly to the View's width.
  separatorWrap: { overflow: 'hidden', marginVertical: scale(6) },
  separatorText: {
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(10),
    lineHeight: moderateScale(14),
    letterSpacing: 0,
  },

  thinLine: { height: StyleSheet.hairlineWidth, marginBottom: scale(8) },

  // ── Store header ──────────────────────────────────────────────────────────
  receiptHeader: { alignItems: 'center', marginBottom: scale(12) },
  logoBox: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(12),
  },
  storeName: {
    fontFamily: 'GeistMono-Bold',
    fontSize: moderateScale(18),
    letterSpacing: 1.5,
    marginBottom: scale(2),
  },
  addressText: {
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(10),
    lineHeight: moderateScale(16),
    textAlign: 'center',
  },

  statusPillWrapper: {
    alignItems: 'center',
    marginBottom: scale(4),
  },
  statusPill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    borderWidth: 1,
    borderRadius: scale(12),
    alignItems: 'center',
  },
  statusPillText: {
    fontFamily: 'GeistMono-Bold',
    fontSize: moderateScale(11),
    letterSpacing: 1.5,
  },

  // ── Meta ──────────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(2),
  },
  monoLabel: { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10) },
  monoValue: { fontFamily: 'GeistMono-Medium', fontSize: moderateScale(10) },

  // ── Columns ───────────────────────────────────────────────────────────────
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  colName: {
    flex: 1,
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(10),
  },
  colQty: {
    width: scale(36),
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(10),
    textAlign: 'center',
  },
  colPrice: {
    width: scale(56),
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(10),
    textAlign: 'right',
  },

  // ── Items ─────────────────────────────────────────────────────────────────
  itemsSection: { marginBottom: 0 },
  itemBlock: { marginBottom: scale(6) },
  itemName: {
    flex: 1,
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(11),
  },
  itemQty: {
    width: scale(36),
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(11),
    textAlign: 'center',
  },
  itemPriceCol: {
    width: scale(56),
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(11),
    textAlign: 'right',
  },
  detailsBox: {
    paddingLeft: scale(4),
    marginTop: scale(2),
  },
  itemDetail: {
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(9),
    marginBottom: scale(1),
  },

  // ── Totals ────────────────────────────────────────────────────────────────
  totalsSection: { marginBottom: 0 },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(3),
  },
  totalLabel: { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },
  totalValue: { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },

  // ── Grand total ───────────────────────────────────────────────────────────
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  grandTotalLabel: {
    fontFamily: 'GeistMono-Bold',
    fontSize: moderateScale(16),
  },
  grandTotalValue: {
    fontFamily: 'GeistMono-Bold',
    fontSize: moderateScale(16),
  },

  // ── Status Banner ─────────────────────────────────────────────────────────
  statusBanner: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: scale(4),
  },
  statusBannerText: {
    fontFamily: 'GeistMono-Bold',
    fontSize: moderateScale(11),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerSection: {
    alignItems: 'center',
    marginTop: scale(2),
    marginBottom: scale(6),
  },
  footerBold: {
    fontFamily: 'GeistMono-Bold',
    fontSize: moderateScale(13),
    marginBottom: scale(3),
  },
  footerSub: { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(24),
    paddingTop: scale(16),
    alignItems: 'center',
  },
  payBtn: {
    paddingVertical: scale(13),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    alignItems: 'center',
    width: '100%',
  },
  payBtnText: {
    fontSize: moderateScale(15),
    fontFamily: 'Geist-SemiBold',
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(10),
    gap: scale(4),
  },
  securedText: { fontSize: moderateScale(10), fontFamily: 'Geist-Regular' },
});
