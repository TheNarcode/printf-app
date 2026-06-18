import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Lock, FileText} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {usePrintJob} from '../context/PrintJobContext';
import {useAuth} from '../context/AuthContext';
import Header from '../components/Header';
import {formatCurrency, formatFileSize} from '../utils/formatters';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';
import {uploadFile, createOrder, buildPrintConfig} from '../services/api';

const RAZORPAY_KEY = 'rzp_test_StI0D1pMPdbae3';

interface Props {
  navigation: any;
}

export default function PaymentScreen({navigation}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {getOrderSummary, createOrder: createLocalOrder, refreshOrders, resetFlow} = usePrintJob();
  const {getValidToken, user} = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [statusText, setStatusText] = useState('');

  const {items, fee, total} = useMemo(() => {
    const summary = getOrderSummary();
    return {...summary};
  }, [getOrderSummary]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handlePay = useCallback(async () => {
    setIsPaying(true);
    try {
      const token = await getValidToken();
      if (!token) throw new Error('Authentication required');

      // Step 1: Upload all files to the API
      setStatusText('Uploading files...');
      const fileIds: Record<string, string> = {};
      for (const item of items) {
        const {fileId} = await uploadFile(
          item.file.uri,
          item.file.name,
          item.file.type,
          token,
        );
        fileIds[item.file.id] = fileId;
      }

      // Step 2: Build PrintConfig payloads
      setStatusText('Creating order...');
      const printConfigs = items.map(item =>
        buildPrintConfig(
          fileIds[item.file.id],
          item.file.name,
          item.file.type,
          item.settings,
        ),
      );

      // Step 3: Create order on API (returns Razorpay order)
      const rpOrder = await createOrder(printConfigs, token);

      // Step 4: Open Razorpay checkout
      setStatusText('Opening payment...');
      const RazorpaySDK = require('react-native-razorpay').default;
      const options = {
        description: 'printf - Print Order',
        currency: rpOrder.currency || 'INR',
        key: RAZORPAY_KEY,
        amount: rpOrder.amount, // already in paise from API
        name: 'printf',
        order_id: rpOrder.id,
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
        },
        theme: {color: '#18181B'},
      };

      await RazorpaySDK.open(options);

      // Step 5: Payment successful — navigate FIRST, then clean up
      // Navigate immediately to prevent crash from state clearing
      navigation.reset({
        index: 0,
        routes: [{name: 'OrderResult', params: {success: true, orderId: rpOrder.localOrderId}}],
      });

      // Clean up and refresh in background (screen is already unmounted)
      resetFlow();
      refreshOrders().catch(() => {});
    } catch (err: any) {
      console.error('Payment flow error:', err);
      // Check if user cancelled Razorpay
      if (err?.code === 2 || err?.description?.includes('cancelled')) {
        setStatusText('');
        Alert.alert('Cancelled', 'Payment was cancelled.');
      } else {
        // Navigate to failure screen first, then clean up
        navigation.reset({
          index: 0,
          routes: [{name: 'OrderResult', params: {success: false}}],
        });
        resetFlow();
      }
    } finally {
      setIsPaying(false);
      setStatusText('');
    }
  }, [items, getValidToken, user, refreshOrders, resetFlow, navigation]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Order Summary" subtitle="Step 3 of 3" showBack onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + scale(120)}]}>

        {/* Files */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>FILES</Text>
          {items.map(item => (
            <View key={item.file.id} style={[styles.fileCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={styles.fileHeader}>
                <View style={[styles.fileIcon, {backgroundColor: colors.surface}]}>
                  <FileText size={moderateScale(14)} color={colors.textSecondary} strokeWidth={1.5} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, {color: colors.text}]} numberOfLines={1}>{item.file.name}</Text>
                  <Text style={[styles.fileMeta, {color: colors.textMuted}]}>
                    {item.file.pages} pages · {formatFileSize(item.file.size)}
                  </Text>
                </View>
                <Text style={[styles.filePrice, {color: colors.text}]}>{formatCurrency(item.price)}</Text>
              </View>
              <View style={styles.fileTags}>
                <View style={[styles.tag, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.tagText, {color: colors.textSecondary}]}>
                    {item.settings.colorMode === 'color' ? 'Color' : 'B&W'}
                  </Text>
                </View>
                <View style={[styles.tag, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.tagText, {color: colors.textSecondary}]}>
                    {item.settings.paperSize.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.tag, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.tagText, {color: colors.textSecondary}]}>
                    {item.settings.sides === 'single' ? 'Single' : 'Double'}
                  </Text>
                </View>
                <View style={[styles.tag, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.tagText, {color: colors.textSecondary}]}>
                    {item.settings.orientation === 'landscape' ? 'Land.' : 'Port.'}
                  </Text>
                </View>
                <View style={[styles.tag, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.tagText, {color: colors.textSecondary}]}>
                    x{item.settings.copies}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Price breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>PRICE BREAKDOWN</Text>
          <View style={[styles.priceCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {items.map(item => (
              <View key={item.file.id} style={styles.priceRow}>
                <Text style={[styles.priceLabel, {color: colors.textSecondary}]} numberOfLines={1}>
                  {item.file.name.replace(/\.[^/.]+$/, "")}
                </Text>
                <Text style={[styles.priceValue, {color: colors.text}]}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
            <View style={[styles.priceRow, {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: scale(12), marginTop: scale(4)}]}>
              <Text style={[styles.priceLabel, {color: colors.textMuted}]}>Convenience fee</Text>
              <Text style={[styles.priceValue, {color: colors.textMuted}]}>{formatCurrency(fee)}</Text>
            </View>
            <View style={[styles.totalRow, {borderTopColor: colors.border}]}>
              <Text style={[styles.totalLabel, {color: colors.text}]}>Total</Text>
              <Text style={[styles.totalValue, {color: colors.text}]}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.bottomBar, {backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, scale(16))}]}>
        <TouchableOpacity
          onPress={handlePay}
          disabled={isPaying}
          activeOpacity={0.8}
          style={[styles.payBtn, {backgroundColor: colors.primary}, isPaying && {opacity: 0.7}]}>
          {isPaying ? (
            <View style={styles.payingRow}>
              <ActivityIndicator size="small" color={colors.background} />
              {statusText ? <Text style={[styles.payBtnText, {color: colors.background, marginLeft: scale(8)}]}>{statusText}</Text> : null}
            </View>
          ) : (
            <Text style={[styles.payBtnText, {color: colors.background}]}>Pay {formatCurrency(total)}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.securedRow}>
          <Lock size={moderateScale(10)} color={colors.textMuted} strokeWidth={2} />
          <Text style={[styles.securedText, {color: colors.textMuted}]}>Secured by Razorpay</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingHorizontal: scale(20), paddingTop: scale(16)},
  section: {marginBottom: scale(24)},
  sectionLabel: {fontSize: moderateScale(10), fontFamily: 'Geist-SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: scale(10)},

  // File cards
  fileCard: {borderWidth: 1, borderRadius: scale(12), padding: scale(14), marginBottom: scale(8)},
  fileHeader: {flexDirection: 'row', alignItems: 'center', gap: scale(10)},
  fileIcon: {width: scale(32), height: scale(32), borderRadius: scale(8), justifyContent: 'center', alignItems: 'center'},
  fileInfo: {flex: 1},
  fileName: {fontSize: moderateScale(14), fontFamily: 'Geist-Medium'},
  fileMeta: {fontSize: moderateScale(10), marginTop: 2},
  filePrice: {fontSize: moderateScale(14), fontFamily: 'Geist-Bold'},
  fileTags: {flexDirection: 'row', flexWrap: 'wrap', gap: scale(4), marginTop: scale(10)},
  tag: {paddingVertical: scale(3), paddingHorizontal: scale(8), borderRadius: scale(4)},
  tagText: {fontSize: moderateScale(9), fontFamily: 'Geist-Medium'},

  // Price
  priceCard: {borderWidth: 1, borderRadius: scale(12), padding: scale(14)},
  priceRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: scale(4)},
  priceLabel: {fontSize: moderateScale(13), flex: 1, marginRight: scale(12)},
  priceValue: {fontSize: moderateScale(13), fontFamily: 'Geist-Medium'},
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, paddingTop: scale(14), marginTop: scale(10),
  },
  totalLabel: {fontSize: moderateScale(16), fontFamily: 'Geist-SemiBold'},
  totalValue: {fontSize: moderateScale(22), fontFamily: 'Geist-Bold'},

  // Bottom
  bottomBar: {
    paddingHorizontal: scale(20), paddingTop: scale(16),
    borderTopWidth: StyleSheet.hairlineWidth, gap: scale(10),
  },
  payBtn: {
    paddingVertical: scale(14), borderRadius: scale(8),
    alignItems: 'center', justifyContent: 'center', minHeight: scale(48),
  },
  payBtnText: {fontSize: moderateScale(16), fontFamily: 'Geist-Bold'},
  payingRow: {flexDirection: 'row', alignItems: 'center'},
  securedRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(4)},
  securedText: {fontSize: moderateScale(10), fontFamily: 'Geist-Regular'},
});
