import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Printer } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import Header from '../components/Header';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { Order } from '../types';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';

interface Props {
  navigation: any;
  route: { params: { orderId: string } };
}

// ─── Separator ───────────────────────────────────────────────────────────────
// overflow:'hidden' clips 300 repeated chars to the exact pixel width of its
// parent — no negative margins, no borderStyle hacks. Width = text width.
function Separator({ color }: { color: string }) {
  return (
    <View style={styles.separatorWrap}>
      <Text style={[styles.separatorText, { color }]} numberOfLines={1}>
        {'='.repeat(300)}
      </Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderDetailScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const screenBg = isDark ? colors.background : '#E5E7EB';
  const slipBg   = isDark ? '#27272A' : '#FFFFFF';

  const { orders, refreshOrders } = usePrintJob();

  useFocusEffect(
    useCallback(() => {
      refreshOrders().catch(e => console.log('Failed to refresh on order details', e));
    }, [refreshOrders]),
  );

  const order = useMemo(
    () => orders.find((o: Order) => o.id === route.params.orderId),
    [orders, route.params.orderId],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

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

  const isFailed  = order.status === 1;
  const isDone    = order.status === 2;
  const statusLabel = isDone ? 'COMPLETED' : isFailed ? 'FAILED' : 'PENDING';
  const statusColor = isFailed ? colors.danger : isDone ? colors.success : colors.warning;
  const statusBg    = isFailed
    ? colors.danger  + '18'
    : isDone
    ? colors.success + '18'
    : colors.warning + '18';

  // Decorative barcode bars — memoised so they don't re-randomise on every render
  const barcodeBars = useMemo(() =>
    Array.from({ length: 50 }).map((_, i) => (
      <View
        key={i}
        style={{
          width:       Math.random() > 0.5 ? scale(1.5) : scale(2.5),
          height:      scale(36),
          backgroundColor: colors.text,
          marginRight: Math.random() > 0.3 ? scale(1)   : scale(2.5),
        }}
      />
    )),
  [colors.text]);

  const sepColor = colors.textMuted + '70';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <Header title="Order Details" showBack onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + scale(32) }]}
      >
        {/* ── Receipt card ─────────────────────────────────────────── */}
        <View style={styles.receiptContainer}>

          {/* Top jagged edge: row bg = screenBg, triangles = slipBg pointing up */}
          <View style={[styles.jaggedEdge, { backgroundColor: screenBg }]}>
            {Array.from({ length: 80 }).map((_, i) => (
              <View key={i} style={[styles.triangleUp, { borderBottomColor: slipBg }]} />
            ))}
          </View>

          {/* ── Receipt body ─────────────────────────────────────── */}
          <View style={[styles.receiptBody, { backgroundColor: slipBg }]}>

            {/* Store header */}
            <View style={styles.receiptHeader}>
              <View style={[styles.logoBox, { backgroundColor: colors.primaryBg }]}>
                <Printer size={moderateScale(22)} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.storeName, { color: colors.text }]}>PRINTF</Text>
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>St. Francis Institute of Technology</Text>
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>Mount Poinsur, Borivali West</Text>
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>Mumbai - 400103</Text>
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>Tel.: +91 9876543210</Text>
            </View>

            <Separator color={sepColor} />

            {/* Order meta */}
            <View style={styles.metaRow}>
              <Text style={[styles.monoLabel, { color: colors.textSecondary }]}>Order ID:</Text>
              <Text style={[styles.monoValue,  { color: colors.text }]}>{order.orderRef}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.monoLabel, { color: colors.textSecondary }]}>Date:</Text>
              <Text style={[styles.monoValue,  { color: colors.text }]}>{formatDateTime(order.createdAt)}</Text>
            </View>

            <Separator color={sepColor} />

            {/* Column headers */}
            <View style={styles.columnHeader}>
              <Text style={[styles.colName,  { color: colors.textSecondary }]}>Name</Text>
              <Text style={[styles.colQty,   { color: colors.textSecondary }]}>Qty</Text>
              <Text style={[styles.colPrice, { color: colors.textSecondary }]}>Price</Text>
            </View>

            <View style={[styles.thinLine, { backgroundColor: colors.textMuted + '40' }]} />

            {/* File items */}
            <View style={styles.itemsSection}>
              {order.files.map((f) => (
                <View key={f.file.id} style={styles.itemBlock}>
                  <View style={styles.columnHeader}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                      {f.file.name}
                    </Text>
                    <Text style={[styles.itemQty,      { color: colors.text }]}>{f.settings.copies}</Text>
                    <Text style={[styles.itemPriceCol, { color: colors.text }]}>{formatCurrency(f.price)}</Text>
                  </View>
                  <View style={styles.detailsBox}>
                    <Text style={[styles.itemDetail, { color: colors.textMuted }]}>
                      {f.file.pages}p · {f.settings.colorMode === 'color' ? 'Color' : 'B&W'} · {f.settings.paperSize.toUpperCase()} · {f.settings.sides === 'single' ? '1-sided' : '2-sided'} · {f.settings.pagesPerSheet}pp/s
                    </Text>
                    {f.settings.pageRange !== 'all' && (
                      <Text style={[styles.itemDetail, { color: colors.textMuted }]}>
                        Range: {f.settings.pageRange}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <Separator color={sepColor} />

            {/* Sub-totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalLine}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Sub Total</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(order.totalPrice - order.convenienceFee)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Convenience Fee (5%)</Text>
                <Text style={[styles.totalValue, { color: colors.textSecondary }]}>{formatCurrency(order.convenienceFee)}</Text>
              </View>
            </View>

            <Separator color={sepColor} />

            {/* Grand total */}
            <View style={styles.grandTotalRow}>
              <Text style={[styles.grandTotalLabel, { color: colors.text }]}>TOTAL</Text>
              <Text style={[styles.grandTotalValue, { color: colors.text }]}>{formatCurrency(order.totalPrice)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>PAID</Text>
              <Text style={[styles.totalValue, { color: colors.textSecondary }]}>Online</Text>
            </View>

            <Separator color={sepColor} />

            {/* Status pill */}
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <Separator color={sepColor} />

            {/* Barcode */}
            <View style={styles.barcodeSection}>
              <View style={styles.barcodeContainer}>
                {barcodeBars}
              </View>
            </View>

            {/* Transaction info */}
            <View style={styles.txnSection}>
              {order.paymentRequestId && (
                <Text style={[styles.txnText, { color: colors.textMuted }]}>Txn ID: {order.paymentRequestId}</Text>
              )}
              <Text style={[styles.txnText, { color: colors.textMuted }]}>{formatDateTime(order.createdAt)}</Text>
            </View>

            <Separator color={sepColor} />

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={[styles.footerBold, { color: colors.text }]}>THANK YOU!</Text>
              <Text style={[styles.footerSub,  { color: colors.textSecondary }]}>Glad to see you again!</Text>
            </View>

          </View>
          {/* ── end receipt body ──────────────────────────────────── */}

          {/* Bottom jagged edge: mirrors top exactly — row bg = screenBg,
              triangles = slipBg but pointing DOWN. */}
          <View style={[styles.jaggedEdge, { backgroundColor: screenBg }]}>
            {Array.from({ length: 80 }).map((_, i) => (
              <View key={i} style={[styles.triangleDown, { borderTopColor: slipBg }]} />
            ))}
          </View>

        </View>
        {/* ── end receipt card ─────────────────────────────────────── */}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1 },
  content:    { paddingHorizontal: scale(16), paddingTop: scale(16) },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:  { fontSize: moderateScale(14) },

  receiptContainer: {},

  receiptBody: {
    paddingHorizontal: scale(24),
    paddingVertical:   scale(20),
  },

  // ── Jagged edges ──────────────────────────────────────────────────────────
  jaggedEdge: { flexDirection: 'row', height: scale(8), overflow: 'hidden' },

  // triangleUp: transparent triangle whose FILL colour is the receipt body (slipBg).
  // The gap between triangles shows through to screenBg — that's intentional.
  triangleUp: {
    width: 0, height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth:   scale(4.5),
    borderRightWidth:  scale(4.5),
    borderBottomWidth: scale(8),
    borderLeftColor:   'transparent',
    borderRightColor:  'transparent',
    // borderBottomColor set dynamically to slipBg
  },

  // triangleDown: the "base" background is slipBg (receipt), the triangle
  // punches screenBg through it, creating the torn-edge silhouette.
  triangleDown: {
    width: 0, height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth:   scale(4.5),
    borderRightWidth:  scale(4.5),
    borderTopWidth:    scale(8),
    borderLeftColor:   'transparent',
    borderRightColor:  'transparent',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    // borderTopColor set dynamically to screenBg
  },

  // ── Separator ─────────────────────────────────────────────────────────────
  // overflow:'hidden' clips the 300-char string exactly to the View's width.
  separatorWrap: { overflow: 'hidden', marginVertical: scale(10) },
  separatorText: {
    fontFamily: 'GeistMono-Bold',
    fontSize:   moderateScale(10),
    lineHeight: moderateScale(14),
    letterSpacing: 0,
  },

  thinLine: { height: StyleSheet.hairlineWidth, marginBottom: scale(8) },

  // ── Store header ──────────────────────────────────────────────────────────
  receiptHeader: { alignItems: 'center', marginBottom: scale(4) },
  logoBox:       { padding: scale(10), borderRadius: scale(12), marginBottom: scale(10) },
  storeName:     { fontFamily: 'GeistMono-Bold', fontSize: moderateScale(20), letterSpacing: 3, marginBottom: scale(6) },
  addressText:   { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), lineHeight: moderateScale(16), textAlign: 'center' },

  // ── Meta ──────────────────────────────────────────────────────────────────
  metaRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(2) },
  monoLabel: { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10) },
  monoValue: { fontFamily: 'GeistMono-Medium',  fontSize: moderateScale(10) },

  // ── Columns ───────────────────────────────────────────────────────────────
  columnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(4) },
  colName:      { flex: 1, fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10) },
  colQty:       { width: scale(36), fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), textAlign: 'center' },
  colPrice:     { width: scale(60), fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), textAlign: 'right' },

  // ── Items ─────────────────────────────────────────────────────────────────
  itemsSection:  { marginBottom: 0 },
  itemBlock:     { marginBottom: scale(6) },
  itemName:      { flex: 1, fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },
  itemQty:       { width: scale(36), fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11), textAlign: 'center' },
  itemPriceCol:  { width: scale(60), fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11), textAlign: 'right' },
  detailsBox:    { marginTop: scale(1), paddingLeft: scale(4) },
  itemDetail:    { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(9), marginBottom: scale(1) },

  // ── Totals ────────────────────────────────────────────────────────────────
  totalsSection: { marginBottom: 0 },
  totalLine:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(3) },
  totalLabel:    { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },
  totalValue:    { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },

  // ── Grand total ───────────────────────────────────────────────────────────
  grandTotalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(6) },
  grandTotalLabel: { fontFamily: 'GeistMono-Bold', fontSize: moderateScale(16) },
  grandTotalValue: { fontFamily: 'GeistMono-Bold', fontSize: moderateScale(16) },

  // ── Status ────────────────────────────────────────────────────────────────
  statusRow:  { alignItems: 'center', marginVertical: scale(2) },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(5), paddingHorizontal: scale(14), borderRadius: scale(20) },
  statusDot:  { width: scale(6), height: scale(6), borderRadius: scale(3), marginRight: scale(6) },
  statusText: { fontFamily: 'GeistMono-Bold', fontSize: moderateScale(11), letterSpacing: 1 },

  // ── Barcode ───────────────────────────────────────────────────────────────
  barcodeSection:   { alignItems: 'center', marginVertical: scale(4) },
  barcodeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: scale(36), overflow: 'hidden' },

  // ── Transaction info ──────────────────────────────────────────────────────
  txnSection: { alignItems: 'center', marginVertical: scale(2) },
  txnText:    { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(9), marginBottom: scale(1) },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerSection: { alignItems: 'center', marginTop: scale(4), marginBottom: scale(8) },
  footerBold:    { fontFamily: 'GeistMono-Bold',    fontSize: moderateScale(13), marginBottom: scale(3) },
  footerSub:     { fontFamily: 'GeistMono-Regular', fontSize: moderateScale(11) },
});
