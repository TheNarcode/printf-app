import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FileText, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '@env';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useNetwork } from '../context/NetworkContext';
import Header from '../components/Header';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { formatCurrency, formatFileSize } from '../utils/formatters';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';
import { createOrder, buildPrintConfig } from '../services/api';
import { getFileId } from '../services/fileUploadManager';
import { getPaymentErrorReason } from '../utils/razorpay';

interface Props {
  navigation: any;
}

export default function PaymentScreen({ navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { getOrderSummary, refreshOrders, resetFlow } = usePrintJob();
  const { getValidToken, user } = useAuth();
  const { assertOnline } = useNetwork();
  const [isPaying, setIsPaying] = useState(false);
  const [statusText, setStatusText] = useState('');

  const { items, fee, total } = useMemo(() => getOrderSummary(), [getOrderSummary]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handlePay = useCallback(async () => {
    if (!assertOnline()) return;
    setIsPaying(true);
    let didNavigate = false;

    const safeNavigateResult = (params: { success: boolean; reason?: string; orderId?: string }) => {
      resetFlow();
      didNavigate = true;
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderResult', params }],
      });
    };

    try {
      const token = await getValidToken();
      if (!token) throw new Error('Authentication required');

      setStatusText('Preparing files...');
      const fileIds: Record<string, string> = {};
      for (const item of items) {
        fileIds[item.file.id] = getFileId(item.file.id);
      }

      setStatusText('Creating order...');
      const printConfigs = items.map(item =>
        buildPrintConfig(fileIds[item.file.id], item.file.name, item.file.type, item.settings),
      );

      const rpOrder = await createOrder(printConfigs, token);

      setStatusText('Opening payment...');
      const options = {
        description: `Payment for Print Order ${rpOrder.receipt || rpOrder.localOrderId}`,
        currency: rpOrder.currency || 'INR',
        key: RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        name: 'printf',
        order_id: rpOrder.id,
        prefill: { email: user?.email || '', name: user?.name || '' },
        theme: { color: '#18181B' },
      };

      await RazorpayCheckout.open(options);

      refreshOrders().catch(() => {});
      safeNavigateResult({ success: true, orderId: rpOrder.localOrderId });
    } catch (err: unknown) {
      const reason = getPaymentErrorReason(err);
      if (reason === 'cancelled') {
        safeNavigateResult({ success: false, reason: 'cancelled' });
      } else if (reason === 'timeout') {
        safeNavigateResult({ success: false, reason: 'timeout' });
      } else if (reason === 'session') {
        safeNavigateResult({ success: false, reason: 'session' });
      } else {
        safeNavigateResult({ success: false, reason: 'payment_failed' });
      }
    } finally {
      if (!didNavigate) {
        setIsPaying(false);
        setStatusText('');
      }
    }
  }, [items, getValidToken, user, refreshOrders, resetFlow, navigation, assertOnline]);

  return (
    <View style={commonStyles.screenContainer}>
      <Header title="Payment" subtitle="Step 3 of 3" showBack onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + scale(120) }]}
      >
        <View style={styles.section}>
          <Text style={commonStyles.sectionLabel}>FILES</Text>
          {items.map(item => (
            <Card key={item.file.id} style={styles.fileCard}>
              <View style={commonStyles.row}>
                <View style={[styles.fileIcon, { backgroundColor: colors.surface }]}>
                  <FileText size={moderateScale(14)} color={colors.textSecondary} strokeWidth={1.5} />
                </View>
                <View style={styles.fileInfo}>
                  <Text weight="medium" style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                    {item.file.name}
                  </Text>
                  <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>
                    {item.file.pages} pages · {formatFileSize(item.file.size)}
                  </Text>
                </View>
                <Text weight="bold" style={[styles.filePrice, { color: colors.text }]}>{formatCurrency(item.price)}</Text>
              </View>
              <View style={styles.fileTags}>
                <Badge label={item.settings.colorMode === 'color' ? 'Color' : 'B&W'} />
                <Badge label={item.settings.paperSize.toUpperCase()} />
                <Badge label={item.settings.sides === 'single' ? 'Single' : 'Double'} />
                <Badge label={item.settings.orientation === 'landscape' ? 'Land.' : 'Port.'} />
                <Badge label={`x${item.settings.copies}`} />
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={commonStyles.sectionLabel}>PRICE BREAKDOWN</Text>
          <Card style={styles.priceCard}>
            {items.map(item => (
              <View key={item.file.id} style={commonStyles.rowBetween}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.file.name.replace(/\.[^/.]+$/, '')}
                </Text>
                <Text weight="medium" style={[styles.priceValue, { color: colors.text }]}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
            <View style={[commonStyles.rowBetween, styles.feeRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Convenience fee</Text>
              <Text weight="medium" style={[styles.priceValue, { color: colors.text }]}>{formatCurrency(fee)}</Text>
            </View>
            <View style={[commonStyles.rowBetween, styles.totalRow, { borderTopColor: colors.border }]}>
              <Text weight="semibold" style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text weight="bold" style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[commonStyles.bottomBar, { backgroundColor: colors.backgroundSecondary, paddingBottom: Math.max(insets.bottom, scale(16)) }]}>
        <Button
          label={isPaying ? (statusText || 'Processing...') : `Pay ${formatCurrency(total)}`}
          onPress={handlePay}
          isLoading={isPaying}
        />
        <View style={styles.securityNotice}>
          <Lock size={moderateScale(10)} color={colors.textMuted} />
          <Text style={[styles.securityText, { color: colors.textMuted }]}>
            Secured by Razorpay
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: scale(20), paddingTop: scale(24) },
  section: { marginBottom: scale(24) },
  fileCard: { padding: scale(14), marginBottom: scale(8) },
  fileIcon: { width: scale(32), height: scale(32), borderRadius: scale(8), justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: scale(10) },
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
  fileName: { fontSize: moderateScale(14) },
  fileMeta: { fontSize: moderateScale(10), marginTop: 2 },
  filePrice: { fontSize: moderateScale(14) },
  fileTags: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(4), marginTop: scale(10) },
  priceCard: { padding: scale(14) },
  priceLabel: { fontSize: moderateScale(13), flex: 1, marginRight: scale(12) },
  priceValue: { fontSize: moderateScale(13) },
  feeRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: scale(12), marginTop: scale(8) },
  totalRow: { borderTopWidth: 1, paddingTop: scale(14), marginTop: scale(10) },
  totalLabel: { fontSize: moderateScale(16) },
  totalValue: { fontSize: moderateScale(22) },
});