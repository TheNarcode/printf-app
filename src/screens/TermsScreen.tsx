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

export default function TermsScreen({ navigation }: Props) {
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

  const li = (text: string) => (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted, width: scale(24) }]}>—</Text>
      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );

  const p = (text: string) => (
    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{text}</Text>
  );

  return (
    <View style={commonStyles.screenContainer}>
      <Header title="Terms of Usage" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + scale(32) }]}
      >
        {section('01', 'The Service', <>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            printf is a campus print service operated by <Text style={{ color: colors.text, fontFamily: 'Geist-SemiBold' }}>The Narcode</Text> — an informal student group, not a registered entity. The service is available at{' '}
            <Text 
              style={{ color: colors.text, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('https://print-f.top')}
            >
              print-f.top
            </Text>{' '}
            and as an Android APK, restricted to campus use only.
          </Text>
        </>)}

        {section('02', 'Eligibility', <>
          {p('By using printf, you confirm that:')}
          <View style={{ marginTop: scale(8) }}>
            {li('You are a student or staff member of the associated college.')}
            {li('You are at least 13 years of age.')}
            {li('You will not share your account or permit others to access it.')}
          </View>
        </>)}

        {section('03', 'Payments & Refunds', <>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            All payments are processed by <Text style={{ color: colors.text, fontFamily: 'Geist-SemiBold' }}>Razorpay</Text> (RBI-regulated). Amounts are charged in INR via the payment methods available at checkout.
          </Text>
          <View style={{ borderLeftWidth: 2, borderLeftColor: colors.text, paddingLeft: scale(16), marginTop: scale(12) }}>
            <Text style={{ fontFamily: 'Geist-Bold', fontSize: moderateScale(12), letterSpacing: 0.5, textTransform: 'uppercase', color: colors.text, marginBottom: scale(4) }}>No Refunds</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              All transactions are final. Refunds are not provided except where a verified system fault on our end causes an incorrect or failed print. Disputes must be raised within 24 hours via the contact details below.
            </Text>
          </View>
        </>)}

        {section('04', 'Uploaded Files', <>
          {p('By uploading a file, you warrant that you hold the right to reproduce the content and that it does not infringe any law or third-party rights. You are solely responsible for the content you submit.')}
          <View style={{ marginTop: scale(10) }}>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.text, fontFamily: 'Geist-SemiBold' }}>Auto-deletion:</Text> All uploaded files are permanently deleted from Cloudflare R2 within 24 hours of upload, irrespective of order status.
            </Text>
          </View>
          <View style={{ marginTop: scale(10) }}>
            {p('We reserve the right to refuse printing of content that violates these terms.')}
          </View>
        </>)}

        {section('05', 'Prohibited Conduct', <>
          {p('You may not use printf to:')}
          <View style={{ marginTop: scale(8) }}>
            {li('Reproduce copyrighted content without authorisation from the rights holder.')}
            {li('Submit illegal, obscene, or defamatory material for printing.')}
            {li('Attempt to exploit, scrape, or disrupt the service or its infrastructure.')}
            {li('Use automated scripts, bots, or non-human agents to interact with the service.')}
            {li('Circumvent payment obligations or obtain print jobs without valid payment.')}
          </View>
          <View style={{ marginTop: scale(12) }}>
            {p('Violations may result in immediate account suspension.')}
          </View>
        </>)}

        {section('06', 'Android App', <>
          {p('The Android APK is distributed via direct sideload — it is not on the Play Store. By installing it, you agree not to decompile, reverse-engineer, modify, or redistribute the application.')}
        </>)}

        {section('07', 'Intellectual Property', <>
          {p('The printf app, its code, and branding belong to The Narcode. You retain ownership of your uploaded documents. By submitting a file, you grant us a temporary licence to process and print it — this expires upon automatic deletion of the file (within 24 hours).')}
        </>)}

        {section('08', 'Disclaimer', <>
          {p('printf is provided “as is” without warranties of any kind. The Narcode is not liable for service interruptions, print errors, or any indirect or consequential damages. Liability, if established, is capped at the amount paid for the specific transaction in dispute.')}
        </>)}

        {section('09', 'Governing Law', <>
          {p('These terms are governed by the laws of Maharashtra, India. Disputes shall be subject to the exclusive jurisdiction of courts in Mumbai. We encourage direct resolution — contact us before initiating formal proceedings.')}
        </>)}

        {section('10', 'Changes', <>
          {p('We may update these terms at any time. Material changes will be communicated via in-app notification or email. Continued use constitutes acceptance of the revised terms.')}
        </>)}

        {/* Contact */}
        <View style={[styles.section, { borderTopColor: colors.border, marginTop: scale(8) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionNum, { color: colors.textMuted }]}>—</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              For all enquiries regarding these terms, or to raise a dispute, write to{' '}
              <Text 
                style={{ color: colors.text, textDecorationLine: 'underline', fontFamily: 'Geist-SemiBold' }}
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
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(11),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: scale(10),
    opacity: 0.4,
  },
  mainTitle: {
    fontFamily: 'Geist-Bold',
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
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(11),
    letterSpacing: 1.5,
    opacity: 0.35,
    width: scale(24),
  },
  sectionTitle: {
    fontFamily: 'Geist-Bold',
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
    paddingVertical: scale(8),
    alignItems: 'flex-start',
  },
  rowLabel: {
    fontFamily: 'GeistMono-Regular',
    fontSize: moderateScale(11),
    letterSpacing: 0.5,
    opacity: 0.35,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Geist-Regular',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
  },
  paragraph: {
    fontFamily: 'Geist-Regular',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(22),
  },
});
