import React, { useCallback } from 'react';
import { Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LogOut, Moon, Sun, Monitor } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePrintJob } from '../context/PrintJobContext';
import Header from '../components/Header';
import SpendingSummary from '../components/SpendingSummary';
import { Text } from '../components/Text';
import { CustomAlertAPI } from '../components/CustomAlert';
import { scale, moderateScale } from '../utils/responsive';
import type { ThemeMode } from '../types';

interface Props {
  navigation: any;
}

const THEME_OPTIONS: { key: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'Auto', Icon: Monitor },
];

export default function SettingsScreen({ navigation }: Props) {
  const { colors, commonStyles, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { orders } = usePrintJob();

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSignOut = useCallback(() => {
    CustomAlertAPI.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={commonStyles.screenContainer}>
      <Header title="Settings" showBack onBack={handleBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + scale(32) }]}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatarImage} />
              ) : (
                <Text weight="bold" style={[styles.avatarText, { color: colors.text }]}>{initial}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text weight="bold" style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'user@example.com'}</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7} style={[styles.logoutBtn, { backgroundColor: colors.dangerBg }]}>
              <LogOut size={moderateScale(14)} color={colors.danger} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text weight="bold" style={[styles.sectionTitle, { color: colors.textMuted }]}>ACTIVITY</Text>
          <SpendingSummary orders={orders} />
        </View>

        <View style={styles.section}>
          <Text weight="bold" style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
          <View style={[styles.themePillBar, { backgroundColor: colors.surface }]}>
            {THEME_OPTIONS.map(({ key, label, Icon }) => {
              const active = mode === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setMode(key)}
                  activeOpacity={0.7}
                  style={[styles.themePill, active && styles.themePillActive, active && { backgroundColor: colors.card }]}
                >
                  <Icon size={moderateScale(14)} color={active ? colors.text : colors.textMuted} strokeWidth={2} />
                  <Text weight={active ? 'semibold' : 'medium'} style={[styles.themePillText, { color: active ? colors.text : colors.textMuted }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text mono style={[styles.versionText, { color: colors.textMuted }]}>printf v1.0.0</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/thenarcode')} activeOpacity={0.7}>
            <Text weight="bold" style={[styles.authorText, { color: colors.text }]}>The Narcode</Text>
          </TouchableOpacity>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
              <Text weight="bold" style={[styles.linkText, { color: colors.textMuted }]}>Terms</Text>
            </TouchableOpacity>
            <Text weight="bold" style={[styles.linkText, { color: colors.textMuted }]}>|</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
              <Text weight="bold" style={[styles.linkText, { color: colors.textMuted }]}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: scale(20), gap: scale(24), paddingTop: scale(24) },
  profileCard: { borderRadius: scale(14), borderWidth: 1, padding: scale(16) },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  avatar: { width: scale(48), height: scale(48), borderRadius: scale(24), justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { fontSize: moderateScale(20) },
  avatarImage: { width: '100%', height: '100%' },
  profileInfo: { flex: 1 },
  userName: { fontSize: moderateScale(17), marginBottom: 2 },
  userEmail: { fontSize: moderateScale(12) },
  logoutBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), justifyContent: 'center', alignItems: 'center' },
  section: { gap: scale(10) },
  sectionTitle: { fontSize: moderateScale(9), letterSpacing: 1.2, textTransform: 'uppercase' },
  themePillBar: { flexDirection: 'row', borderRadius: scale(8), padding: scale(2) },
  themePill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(5), paddingVertical: scale(8), borderRadius: scale(6) },
  themePillActive: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  themePillText: { fontSize: moderateScale(12) },
  footer: { alignItems: 'center', gap: scale(6), marginTop: scale(16) },
  versionText: { fontSize: moderateScale(10), letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.5 },
  authorText: { fontSize: moderateScale(11), letterSpacing: 0.5, textDecorationLine: 'underline' },
  linksRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12), marginTop: scale(4) },
  linkText: { fontSize: moderateScale(10), textTransform: 'uppercase' },
});