import React, {useCallback, useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Printer} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {usePrintJob} from '../context/PrintJobContext';
import Header from '../components/Header';
import {formatCurrency, formatDateTime} from '../utils/formatters';
import type {Order} from '../types';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface Props {
  navigation: any;
  route: {params: {orderId: string}};
}

export default function OrderDetailScreen({navigation, route}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {orders} = usePrintJob();

  const order = useMemo(
    () => orders.find((o: Order) => o.id === route.params.orderId),
    [orders, route.params.orderId],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  if (!order) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Order Details" showBack onBack={handleBack} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>Order not found</Text>
        </View>
      </View>
    );
  }

  const isFailed = order.status === 'failed';
  const isDone = order.status === 'completed';
  const statusLabel = isDone ? 'COMPLETED' : isFailed ? 'FAILED' : order.status === 'pending' ? 'PENDING' : 'PRINTING';

  // Mock barcode
  const barcodeBars = useMemo(() => {
    return Array.from({length: 40}).map((_, i) => (
      <View 
        key={i} 
        style={{
          width: Math.random() > 0.5 ? scale(1.5) : scale(3),
          height: scale(32),
          backgroundColor: colors.text,
          marginRight: Math.random() > 0.3 ? scale(1.5) : scale(3),
        }} 
      />
    ));
  }, [colors.text]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Order Details" showBack onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + scale(32)}]}>
        
        {/* The Receipt */}
        <View style={styles.receiptContainer}>
          {/* Top Jagged Edge */}
          <View style={styles.jaggedEdgeTop}>
            {Array.from({length: 80}).map((_, i) => (
              <View key={i} style={[styles.triangleUp, {borderBottomColor: colors.card}]} />
            ))}
          </View>
          
          <View style={[styles.receiptBody, {backgroundColor: colors.card}]}>
            {/* Header */}
            <View style={styles.receiptHeader}>
              <View style={[styles.logoBox, {backgroundColor: colors.primaryBg}]}>
                <Printer size={moderateScale(20)} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.storeName, {color: colors.primary}]}>printf</Text>
              <Text style={[styles.monoText, {color: colors.textSecondary}]}>123 Printing Ave, Suite 100</Text>
              <Text style={[styles.monoText, {color: colors.textSecondary}]}>San Francisco, CA 94103</Text>
              <Text style={[styles.monoText, {color: colors.textSecondary}]}>Store #{order.printerNumber.padStart(4, '0')}</Text>
            </View>

            <Text style={[styles.dashedLine, {color: colors.border}]}>--------------------------------------</Text>

            {/* Barcode & Meta */}
            <View style={styles.metaSection}>
              <View style={styles.barcodeContainer}>
                {barcodeBars}
              </View>
              <Text style={[styles.orderRef, {color: colors.text}]}>ORDER {order.orderRef}</Text>
              <Text style={[styles.monoText, {color: colors.textSecondary}]}>Placed: {formatDateTime(order.createdAt)}</Text>
              
              <View style={[
                styles.statusPill, 
                {backgroundColor: isFailed ? colors.danger + '20' : isDone ? colors.success + '20' : colors.primaryBg}
              ]}>
                <Text style={[
                  styles.statusText, 
                  {color: isFailed ? colors.danger : isDone ? colors.success : colors.primary}
                ]}>STATUS: {statusLabel}</Text>
              </View>
            </View>

            <Text style={[styles.asteriskLine, {color: colors.border}]}>**************************************</Text>

            {/* Items */}
            <View style={styles.itemsSection}>
              {order.files.map((f) => (
                <View key={f.file.id} style={styles.itemBlock}>
                  <Text style={[styles.fileName, {color: colors.text}]}>{f.file.name}</Text>
                  
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemDetail, {color: colors.textSecondary}]}>{f.settings.copies}x {f.settings.colorMode === 'color' ? 'Color' : 'B&W'} Copies</Text>
                    <Text style={[styles.dots, {color: colors.border}]} numberOfLines={1}> ....................................... </Text>
                    <Text style={[styles.itemPrice, {color: colors.textSecondary}]}>{formatCurrency(f.price)}</Text>
                  </View>
                  
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemDetail, {color: colors.textSecondary}]}>Paper: {f.settings.paperSize.toUpperCase()}</Text>
                    <Text style={[styles.dots, {color: colors.border}]} numberOfLines={1}> ....................................... </Text>
                    <Text style={[styles.itemPrice, {color: colors.textSecondary}]}>{formatCurrency(0)}</Text>
                  </View>

                  <View style={styles.itemRow}>
                    <Text style={[styles.itemDetail, {color: colors.textSecondary}]}>Sides: {f.settings.sides === 'single' ? 'Single' : f.settings.sides === 'double-long' ? 'Dbl (Long)' : 'Dbl (Short)'}</Text>
                    <Text style={[styles.dots, {color: colors.border}]} numberOfLines={1}> ....................................... </Text>
                    <Text style={[styles.itemPrice, {color: colors.textSecondary}]}>{formatCurrency(0)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={[styles.dashedLine, {color: colors.border}]}>--------------------------------------</Text>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.itemRow}>
                <Text style={[styles.monoText, {color: colors.textSecondary}]}>SUBTOTAL</Text>
                <Text style={[styles.dots, {color: colors.border}]} numberOfLines={1}> ....................................... </Text>
                <Text style={[styles.monoText, {color: colors.textSecondary}]}>{formatCurrency(order.totalPrice - order.convenienceFee)}</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={[styles.monoText, {color: colors.textSecondary}]}>TAX & FEE</Text>
                <Text style={[styles.dots, {color: colors.border}]} numberOfLines={1}> ....................................... </Text>
                <Text style={[styles.monoText, {color: colors.textSecondary}]}>{formatCurrency(order.convenienceFee)}</Text>
              </View>
              
              <View style={[styles.solidLine, {backgroundColor: colors.text}]} />
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalText, {color: colors.text}]}>TOTAL</Text>
                <Text style={[styles.totalPrice, {color: colors.text}]}>{formatCurrency(order.totalPrice)}</Text>
              </View>
            </View>

            <Text style={[styles.asteriskLine, {color: colors.border}]}>**************************************</Text>

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={[styles.footerBold, {color: colors.text}]}>THANK YOU FOR YOUR ORDER!</Text>
              <Text style={[styles.monoText, {color: colors.textSecondary}]}>Track live status at:</Text>
              <Text style={[styles.monoText, {color: colors.textSecondary}]}>printf.com/track</Text>
            </View>
          </View>
          
          {/* Bottom Jagged Edge */}
          <View style={styles.jaggedEdgeBottom}>
            {Array.from({length: 80}).map((_, i) => (
              <View key={i} style={[styles.triangleDown, {borderTopColor: colors.card}]} />
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingHorizontal: scale(16), paddingTop: scale(16)},
  emptyState: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: moderateScale(14)},
  
  receiptContainer: {
    marginHorizontal: scale(8),
    shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  receiptBody: {
    paddingHorizontal: scale(18),
    paddingVertical: scale(8),
  },
  
  // Jagged Edges
  jaggedEdgeTop: {flexDirection: 'row', height: scale(7), overflow: 'hidden'},
  jaggedEdgeBottom: {flexDirection: 'row', height: scale(7), overflow: 'hidden'},
  triangleUp: {
    width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftWidth: scale(4.5), borderRightWidth: scale(4.5), borderBottomWidth: scale(7),
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  triangleDown: {
    width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftWidth: scale(4.5), borderRightWidth: scale(4.5), borderTopWidth: scale(7),
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },

  // Typography (Mono)
  monoText: {fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), textAlign: 'center', lineHeight: moderateScale(16)},
  dashedLine: {fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), textAlign: 'center', marginVertical: scale(8), letterSpacing: -0.5},
  asteriskLine: {fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), textAlign: 'center', marginVertical: scale(6), letterSpacing: -0.5},
  
  // Header
  receiptHeader: {alignItems: 'center', marginBottom: scale(8)},
  logoBox: {padding: scale(7), borderRadius: scale(7), marginBottom: scale(6)},
  storeName: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(16), marginBottom: scale(3)},
  
  // Meta
  metaSection: {alignItems: 'center', marginBottom: scale(8)},
  barcodeContainer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: scale(10), height: scale(32), overflow: 'hidden'},
  orderRef: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(12), marginBottom: scale(3)},
  statusPill: {marginTop: scale(10), paddingVertical: scale(3), paddingHorizontal: scale(10), borderRadius: scale(4)},
  statusText: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(10)},

  // Items
  itemsSection: {marginBottom: scale(8)},
  itemBlock: {marginBottom: scale(10)},
  fileName: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(10), marginBottom: scale(5)},
  itemRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(3)},
  itemDetail: {fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10)},
  dots: {flex: 1, fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10), letterSpacing: 2, marginHorizontal: scale(4), overflow: 'hidden'},
  itemPrice: {fontFamily: 'GeistMono-Regular', fontSize: moderateScale(10)},

  // Totals
  totalsSection: {marginVertical: scale(8)},
  solidLine: {height: scale(1.5), marginVertical: scale(8)},
  totalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  totalText: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(14)},
  totalPrice: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(16)},

  // Footer
  footerSection: {alignItems: 'center', marginTop: scale(8), marginBottom: scale(16)},
  footerBold: {fontFamily: 'GeistMono-Bold', fontSize: moderateScale(11), marginBottom: scale(5)},
});
