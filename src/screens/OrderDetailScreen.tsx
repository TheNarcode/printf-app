import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { usePayOrder } from '../hooks/usePayOrder';
import { Button } from '../components/Button';

interface Props {
  navigation: any;
  route: { params: { orderId: string } };
}

function Separator({ color }: { color: string }) {
  return (
    <View style={styles.separatorWrap}>
      <Text style={[styles.separatorText, { color }]} numberOfLines={1} ellipsizeMode="clip">
        {'='.repeat(300)}
      </Text>
    </View>
  );
}

function JaggedEdge({ position, screenBg, slipBg }: { position: 'top' | 'bottom'; screenBg: string; slipBg: string }) {
  const { width } = useWindowDimensions();
  const toothWidth = scale(8);
  const numTeeth = Math.ceil(width / toothWidth) + 4;

  return (
    <View style={[styles.jaggedEdge, { backgroundColor: screenBg }, position === 'bottom' && { transform: [{ scaleY: -1 }] }]}>
      {Array.from({ length: numTeeth }).map((_, i) => (
        <View key={i} style={[styles.triangleUp, { borderBottomColor: slipBg }]} />
      ))}
    </View>
  );
}

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { colors, commonStyles, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const screenBg = colors.background;
  const slipBg = isDark ? '#27272A' : '#eeeeee';

  const { orders, refreshOrders } = usePrintJob();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
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
    () => orders.find((o: Order) => o.id === route.params?.orderId),
    [orders, route.params?.orderId],
  );

  const { payOrder, isPaying } = usePayOrder();
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const isUnpaid = order?.status === 0 && !order?.paid;
  const isFailed = order?.status === 2;
  const isCollected = order?.status === 3;

  const statusLabel = isCollected ? 'Collected' : order?.status === 1 ? 'Completed' : isFailed ? 'Failed' : isUnpaid ? 'Unpaid' : 'In Progress';
  const statusColor = isCollected ? colors.collected : isFailed ? colors.danger : order?.status === 1 ? colors.success : isUnpaid ? colors.warning : colors.info;
  const statusBg = isCollected ? colors.collectedBg : isFailed ? colors.dangerBg : order?.status === 1 ? colors.successBg : isUnpaid ? colors.warningBg : colors.infoBg;

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <Header title="Order Details" showBack onBack={handleBack} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const sepColor = colors.textMuted + '70';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <Header title={`Order#${order.orderRef}`} showBack onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + scale(100), flexGrow: 1, justifyContent: 'center' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} colors={[colors.primary]} progressBackgroundColor={colors.card} />}>
        <View style={styles.receiptContainer}>
          <JaggedEdge position="top" screenBg={screenBg} slipBg={slipBg} />

          <View style={[styles.receiptBody, { backgroundColor: slipBg }]}>
            <View style={styles.receiptHeader}>
              <View style={[styles.logoBox, { backgroundColor: colors.primaryBg }]}>
                <Printer size={moderateScale(24)} color={colors.primary} strokeWidth={2} />
              </View>
              <Text mono weight="bold" style={[styles.storeName, { color: colors.text }]}>printf</Text>
              <Text mono style={[styles.addressText, { color: colors.textSecondary }]}>St. Francis Institute of Technology</Text>
              <Text mono style={[styles.addressText, { color: colors.textSecondary }]}>Mount Poinsur, Borivali West</Text>
              <Text mono style={[styles.addressText, { color: colors.textSecondary }]}>Mumbai - 400103</Text>
            </View>

            <View style={styles.statusPillWrapper}>
              <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusColor }]}>
                <Text mono weight="bold" style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <Separator color={sepColor} />

            <View style={styles.metaRow}>
              <Text mono style={[styles.monoLabel, { color: colors.textSecondary }]}>Order ID:</Text>
              <Text mono weight="medium" style={[styles.monoValue, { color: colors.text }]}>{order.orderRef}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text mono style={[styles.monoLabel, { color: colors.textSecondary }]}>Date:</Text>
              <Text mono weight="medium" style={[styles.monoValue, { color: colors.text }]}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text mono style={[styles.monoLabel, { color: colors.textSecondary }]}>Printer:</Text>
              <Text mono weight="medium" style={[styles.monoValue, { color: colors.text }]} numberOfLines={1}>{order.printerName}</Text>
            </View>

            <Separator color={sepColor} />

            <View style={styles.columnHeader}>
              <Text mono style={[styles.colName, { color: colors.textSecondary }]}>Name</Text>
              <Text mono style={[styles.colQty, { color: colors.textSecondary }]}>Qty</Text>
              <Text mono style={[styles.colPrice, { color: colors.textSecondary }]}>Price</Text>
            </View>

            <View style={[styles.thinLine, { backgroundColor: colors.textMuted + '40' }]} />

            <View style={styles.itemsSection}>
              {order.files.map(f => {
                const printedPages = parsePageRange(f.settings.pageRange, f.file.pages).length;
                return (
                  <View key={f.file.id} style={styles.itemBlock}>
                    <View style={styles.columnHeader}>
                      <Text mono style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{f.file.name}</Text>
                      <Text mono style={[styles.itemQty, { color: colors.text }]}>{f.settings.copies}</Text>
                      <Text mono style={[styles.itemPriceCol, { color: colors.text }]}>{formatCurrency(f.price)}</Text>
                    </View>
                    <View style={styles.detailsBox}>
                      <Text mono style={[styles.itemDetail, { color: colors.textMuted }]}>
                        {printedPages}p · {f.settings.colorMode === 'color' ? 'Color' : 'B&W'} · {f.settings.paperSize.toUpperCase()} · {f.settings.sides === 'single' ? '1-sided' : '2-sided'} · {f.settings.pagesPerSheet}pp/s
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Separator color={sepColor} />

            <View style={styles.totalsSection}>
              <View style={styles.totalLine}>
                <Text mono style={[styles.totalLabel, { color: colors.text }]}>Sub Total</Text>
                <Text mono style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(order.totalPrice - order.convenienceFee)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text mono style={[styles.totalLabel, { color: colors.textSecondary }]}>Convenience Fee (5%)</Text>
                <Text mono style={[styles.totalValue, { color: colors.textSecondary }]}>{formatCurrency(order.convenienceFee)}</Text>
              </View>
            </View>

            <Separator color={sepColor} />

            <View style={styles.grandTotalRow}>
              <Text mono weight="bold" style={[styles.grandTotalLabel, { color: colors.text }]}>TOTAL</Text>
              <Text mono weight="bold" style={[styles.grandTotalValue, { color: colors.text }]}>{formatCurrency(order.totalPrice)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text mono style={[styles.totalLabel, { color: colors.textSecondary }]}>STATUS</Text>
              <Text mono style={[styles.totalValue, { color: colors.textSecondary }]}>{order.paid ? 'Payment Cleared' : 'Payment Pending'}</Text>
            </View>

            <Separator color={sepColor} />

            <View style={styles.footerSection}>
              <Text mono weight="bold" style={[styles.footerBold, { color: colors.text }]}>THANK YOU!</Text>
              <Text mono style={[styles.footerSub, { color: colors.textSecondary }]}>Glad to see you again!</Text>
            </View>
          </View>

          <JaggedEdge position="bottom" screenBg={screenBg} slipBg={slipBg} />
        </View>
      </ScrollView>

      {!order.paid && order.paymentRequestId && (
        <View style={[commonStyles.bottomBar, { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundSecondary, paddingBottom: Math.max(insets.bottom, scale(16)) }]}>
          <Button label={isPaying ? 'Processing...' : `Pay ${formatCurrency(order.totalPrice)}`} onPress={() => payOrder(order)} isLoading={isPaying} />
          <View style={styles.securityNotice}>
            <Lock size={moderateScale(10)} color={colors.textMuted} />
            <Text style={[styles.securityText, { color: colors.textMuted }]}>
              Secured by Zoho Payments
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: scale(16), paddingTop: scale(24) },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: moderateScale(14) },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(12),
    alignSelf: 'center',
  },
  securityText: {
    fontSize: moderateScale(11),
    marginLeft: scale(4),
  },
  receiptContainer: { width: '100%', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  receiptBody: { paddingHorizontal: scale(20), paddingTop: scale(32), paddingBottom: scale(12) },
  jaggedEdge: { flexDirection: 'row', height: scale(8), overflow: 'hidden' },
  triangleUp: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: scale(4), borderRightWidth: scale(4), borderBottomWidth: scale(8), borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  separatorWrap: { overflow: 'hidden', marginVertical: scale(6) },
  separatorText: { fontSize: moderateScale(10), lineHeight: moderateScale(14), letterSpacing: 0 },
  thinLine: { height: StyleSheet.hairlineWidth, marginBottom: scale(8) },
  receiptHeader: { alignItems: 'center', marginBottom: scale(12) },
  logoBox: { width: scale(48), height: scale(48), borderRadius: scale(12), alignItems: 'center', justifyContent: 'center', marginBottom: scale(12) },
  storeName: { fontSize: moderateScale(18), letterSpacing: 1.5, marginBottom: scale(2) },
  addressText: { fontSize: moderateScale(10), lineHeight: moderateScale(16), textAlign: 'center' },
  statusPillWrapper: { alignItems: 'center', marginBottom: scale(4) },
  statusPill: { paddingHorizontal: scale(12), paddingVertical: scale(4), borderWidth: 1, borderRadius: scale(12), alignItems: 'center' },
  statusPillText: { fontSize: moderateScale(11), letterSpacing: 1.5 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(2) },
  monoLabel: { fontSize: moderateScale(10) },
  monoValue: { fontSize: moderateScale(10) },
  columnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) },
  colName: { flex: 1, fontSize: moderateScale(10) },
  colQty: { width: scale(36), fontSize: moderateScale(10), textAlign: 'center' },
  colPrice: { width: scale(56), fontSize: moderateScale(10), textAlign: 'right' },
  itemsSection: { marginBottom: 0 },
  itemBlock: { marginBottom: scale(6) },
  itemName: { flex: 1, fontSize: moderateScale(11) },
  itemQty: { width: scale(36), fontSize: moderateScale(11), textAlign: 'center' },
  itemPriceCol: { width: scale(56), fontSize: moderateScale(11), textAlign: 'right' },
  detailsBox: { paddingLeft: scale(4), marginTop: scale(2) },
  itemDetail: { fontSize: moderateScale(9), marginBottom: scale(1) },
  totalsSection: { marginBottom: 0 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(3) },
  totalLabel: { fontSize: moderateScale(11) },
  totalValue: { fontSize: moderateScale(11) },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(6) },
  grandTotalLabel: { fontSize: moderateScale(16) },
  grandTotalValue: { fontSize: moderateScale(16) },
  footerSection: { alignItems: 'center', marginTop: scale(2), marginBottom: scale(6) },
  footerBold: { fontSize: moderateScale(13), marginBottom: scale(3) },
  footerSub: { fontSize: moderateScale(11) },
});