import React from 'react';
import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';

interface Props {
  navigation: any;
}

export default function PrivacyScreen({ navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const section = (num: string, title: string, children: React.ReactNode) => (
    <View style={[styles.section, { borderTopColor: colors.border }, num === '01' && { borderTopWidth: 0, paddingTop: 0 }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionNum, { color: colors.textMuted }]}>{num}</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const row = (label: string, value: string) => (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );

  const p = (text: string, italic = false) => (
    <Text style={[styles.paragraph, { color: colors.textSecondary }, italic && { fontStyle: 'italic', opacity: 0.7 }]}>{text}</Text>
  );

  return (
    <View style={commonStyles.screenContainer}>
      <Header title="Privacy Policy" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + scale(32) }]}
      >
        {section('01', 'Data We Collect', <>
          {p('We collect the minimum necessary to operate the service:')}
          <View style={{ marginTop: scale(12) }}>
            {row('Email address', 'Collected via Google Sign-In. Used solely to identify your account and associate orders.')}
            {row('Uploaded files', 'Stored in Cloudflare R2. Auto-deleted within 24 hours regardless of order status. No copies retained.')}
            {row('Order metadata', 'Page count, colour mode, copies, duplex preference — stored to process and track your print job.')}
          </View>
          <View style={{ marginTop: scale(14) }}>
            {p('We collect no name, phone number, device ID, location, or biometric data. No analytics. No ad tracking. No user profiling.', true)}
          </View>
        </>)}

        {section('02', 'Payments', <>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            All payments are handled by <Text weight="semibold" style={{ color: colors.text }}>Razorpay</Text> (RBI-regulated, PCI-DSS certified). printf never sees, stores, or touches your payment credentials — card numbers, UPI IDs, or banking tokens are entered directly into Razorpay's infrastructure.
          </Text>
          <View style={{ marginTop: scale(10) }}>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              We share your email with Razorpay only to generate a payment order. Their processing is governed by the{' '}
              <Text 
                style={{ color: colors.text, textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://razorpay.com/privacy-policy/')}
              >
                Razorpay Privacy Policy
              </Text>.
            </Text>
          </View>
        </>)}

        {section('03', 'Infrastructure', <>
          {p('printf runs entirely on Cloudflare\'s edge network:')}
          <View style={{ marginTop: scale(12) }}>
            {row('Pages', 'Hosts and serves the web app.')}
            {row('Workers', 'Runs server-side API logic.')}
            {row('D1', 'Stores order records and account data.')}
            {row('R2', 'Temporary file storage. 24-hour auto-deletion.')}
          </View>
          <View style={{ marginTop: scale(14) }}>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              Cloudflare may process network telemetry (IP addresses, request logs) for security and reliability under their own{' '}
              <Text 
                style={{ color: colors.text, textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://www.cloudflare.com/privacypolicy/')}
              >
                Privacy Policy
              </Text>.
            </Text>
          </View>
        </>)}

        {section('04', 'Data Retention', <>
          {row('Uploaded files', '≤ 24 hours. Automated Cloudflare R2 lifecycle policy.')}
          {row('Order records', 'Until you request account deletion.')}
          {row('Email (account)', 'Until you request account deletion.')}
        </>)}

        {section('05', 'Security', <>
          {p('All traffic is encrypted over HTTPS (TLS 1.3). Files are encrypted at rest (AES-256). No payment credentials are stored on our systems.')}
          <View style={{ marginTop: scale(10) }}>
            {p('printf is a student project. Reasonable security controls are in place, but we cannot guarantee absolute security of any internet-facing system.', true)}
          </View>
        </>)}

        {section('06', 'Notifications', <>
          {p('Push notifications (Android) and transactional emails are sent only for order status events — confirmation, ready for collection. No marketing or promotional communications.')}
        </>)}

        {section('07', 'Your Rights', <>
          {p('You may request, at any time:')}
          <View style={{ marginTop: scale(12) }}>
            {row('Access', 'A summary of personal data we hold about you.')}
            {row('Rectification', 'Correction of inaccurate data.')}
            {row('Erasure', 'Deletion of your account and all associated data.')}
            {row('Portability', 'An export of your order history.')}
          </View>
        </>)}

        {section('08', 'Changes', <>
          {p('Material changes will be communicated via in-app notification or email. The effective date above is updated with each revision. Continued use constitutes acceptance.')}
        </>)}

        <View style={[styles.section, { borderTopColor: colors.border, marginTop: scale(8) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionNum, { color: colors.textMuted }]}>—</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              For all privacy-related enquiries, data requests, or account deletion, write to{' '}
              <Text weight="semibold"
                style={{ color: colors.text, textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('mailto:thenarcode@gmail.com')}
              >
                thenarcode@gmail.com
              </Text>.
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: scale(24),
    paddingTop: scale(24),
  },
  headerArea: {
    marginBottom: scale(40),
  },
  effectiveDate: {
    fontSize: moderateScale(11),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: scale(10),
    opacity: 0.4,
  },
  mainTitle: {
    fontSize: moderateScale(36),
    letterSpacing: -1,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: scale(24),
    marginBottom: scale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(16),
    marginBottom: scale(12),
  },
  sectionNum: {
    fontSize: moderateScale(11),
    letterSpacing: 1.5,
    opacity: 0.35,
    width: scale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionContent: {
    paddingLeft: scale(40),
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: scale(10),
    alignItems: 'flex-start',
  },
  rowLabel: {
    fontSize: moderateScale(11),
    letterSpacing: 0.5,
    width: scale(112),
    opacity: 0.5,
  },
  rowValue: {
    flex: 1,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
  },
  paragraph: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(22),
  },
});
