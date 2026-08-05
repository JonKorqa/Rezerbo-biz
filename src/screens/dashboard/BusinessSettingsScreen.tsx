import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { signOut, deleteUser } from 'firebase/auth';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { deleteBusinessAccount } from '../../services/businesses';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

interface SettingsRowConfig {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descriptionKey: string;
  badge?: 'new' | 'dot';
}

const SETTINGS_ROWS: SettingsRowConfig[] = [
  {
    key: 'loyalty',
    icon: 'gift-outline',
    titleKey: 'businessSettings.rows.loyalty.title',
    descriptionKey: 'businessSettings.rows.loyalty.description',
    badge: 'new',
  },
  {
    key: 'payments',
    icon: 'card-outline',
    titleKey: 'businessSettings.rows.payments.title',
    descriptionKey: 'businessSettings.rows.payments.description',
  },
  {
    key: 'services',
    icon: 'cut-outline',
    titleKey: 'businessSettings.rows.services.title',
    descriptionKey: 'businessSettings.rows.services.description',
  },
  {
    key: 'schedule',
    icon: 'time-outline',
    titleKey: 'businessSettings.rows.schedule.title',
    descriptionKey: 'businessSettings.rows.schedule.description',
  },
  {
    key: 'staff',
    icon: 'people-outline',
    titleKey: 'businessSettings.rows.staff.title',
    descriptionKey: 'businessSettings.rows.staff.description',
  },
  {
    key: 'gift-cards',
    icon: 'pricetags-outline',
    titleKey: 'businessSettings.rows.giftCards.title',
    descriptionKey: 'businessSettings.rows.giftCards.description',
  },
  {
    key: 'memberships',
    icon: 'ribbon-outline',
    titleKey: 'businessSettings.rows.memberships.title',
    descriptionKey: 'businessSettings.rows.memberships.description',
  },
  {
    key: 'packages',
    icon: 'cube-outline',
    titleKey: 'businessSettings.rows.packages.title',
    descriptionKey: 'businessSettings.rows.packages.description',
  },
  {
    key: 'business-details',
    icon: 'storefront-outline',
    titleKey: 'businessSettings.rows.businessDetails.title',
    descriptionKey: 'businessSettings.rows.businessDetails.description',
  },
  {
    key: 'online-booking',
    icon: 'globe-outline',
    titleKey: 'businessSettings.rows.onlineBooking.title',
    descriptionKey: 'businessSettings.rows.onlineBooking.description',
  },
  {
    key: 'advanced',
    icon: 'options-outline',
    titleKey: 'businessSettings.rows.advanced.title',
    descriptionKey: 'businessSettings.rows.advanced.description',
  },
  {
    key: 'personal',
    icon: 'person-circle-outline',
    titleKey: 'businessSettings.rows.personal.title',
    descriptionKey: 'businessSettings.rows.personal.description',
  },
  {
    key: 'subscription',
    icon: 'wallet-outline',
    titleKey: 'businessSettings.rows.subscription.title',
    descriptionKey: 'businessSettings.rows.subscription.description',
  },
  {
    key: 'app',
    icon: 'apps-outline',
    titleKey: 'businessSettings.rows.app.title',
    descriptionKey: 'businessSettings.rows.app.description',
    badge: 'dot',
  },
];

export default function BusinessSettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleRowPress = (row: SettingsRowConfig) => {
    if (row.key === 'schedule') {
      navigation.navigate('ScheduleManagement');
    } else if (row.key === 'services') {
      navigation.navigate('ServicesSetup');
    } else if (row.key === 'payments') {
      navigation.navigate('PaymentsAndCheckout');
    } else if (row.key === 'business-details') {
      navigation.navigate('BusinessDetails');
    } else if (row.key === 'staff') {
      navigation.navigate('StaffManagement');
    } else if (row.key === 'memberships') {
      navigation.navigate('Memberships');
    } else if (row.key === 'packages') {
      navigation.navigate('Packages');
    } else if (row.key === 'online-booking') {
      navigation.navigate('OnlineBooking');
    } else if (row.key === 'advanced') {
      navigation.navigate('AdvancedOptions');
    } else if (row.key === 'personal') {
      navigation.navigate('PersonalSettings');
    } else if (row.key === 'app') {
      navigation.navigate('AppInfo');
    } else {
      navigation.navigate('SettingsPlaceholder', { title: t(row.titleKey), icon: row.icon });
    }
  };

  const goToAuth = () => {
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
  };

  const handleLogOut = () => {
    Alert.alert(t('businessSettings.logOutTitle'), t('businessSettings.logOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('businessSettings.logOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            queryClient.clear();
            goToAuth();
          } catch (err) {
            console.error('signOut failed:', err);
            Alert.alert(t('common.error'), t('businessSettings.logOutError'));
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('businessSettings.deleteAccountTitle'),
      t('businessSettings.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: confirmDeleteAccount },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDeleting(true);
    try {
      await deleteBusinessAccount(user.uid);
      await deleteUser(user);
      queryClient.clear();
      goToAuth();
    } catch (err: any) {
      setDeleting(false);
      if (err?.code === 'auth/requires-recent-login') {
        Alert.alert(
          t('businessSettings.reloginTitle'),
          t('businessSettings.reloginMessage'),
        );
      } else {
        console.error('deleteBusinessAccount failed:', err);
        Alert.alert(t('common.error'), t('businessSettings.deleteAccountError'));
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('businessSettings.title')}</Text>
        <TouchableOpacity style={styles.countrySelector} activeOpacity={0.7}>
          <Text style={styles.countryFlag}>🇽🇰</Text>
          <Ionicons name="chevron-down" size={16} color={Light.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('businessSettings.search')}
          placeholderTextColor={Light.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={SETTINGS_ROWS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => handleRowPress(item)}>
            <View style={styles.rowIconWrap}>
              <Ionicons name={item.icon} size={20} color={Colors.teal} />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowTitleLine}>
                <Text style={styles.rowTitle}>{t(item.titleKey)}</Text>
                {item.badge === 'new' && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeLabel}>{t('businessSettings.newBadge')}</Text>
                  </View>
                )}
                {item.badge === 'dot' && <View style={styles.dotBadge} />}
              </View>
              <Text style={styles.rowDescription}>{t(item.descriptionKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={styles.accountSection}>
            <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={handleLogOut}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="log-out-outline" size={20} color={Light.textPrimary} />
              </View>
              <Text style={styles.accountRowLabel}>{t('businessSettings.logOut')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountRow}
              activeOpacity={0.7}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <View style={[styles.rowIconWrap, styles.dangerIconWrap]}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </View>
              <Text style={[styles.accountRowLabel, styles.dangerLabel]}>{t('businessSettings.deleteAccount')}</Text>
              {deleting && <ActivityIndicator size="small" color={Colors.error} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>

            <Text style={styles.versionText}>
              {t('businessSettings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.helpButton}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('HelpCenter')}
      >
        <Ionicons name="help-circle-outline" size={18} color={Colors.white} />
        <Text style={styles.helpButtonLabel}>{t('businessSettings.helpCenter')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
  },
  countryFlag: { fontSize: Typography.fontSize.base },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['5xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  rowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  newBadge: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  newBadgeLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  dotBadge: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.error,
  },
  accountSection: { marginTop: Spacing.md },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  accountRowLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  dangerIconWrap: { backgroundColor: '#FEF2F2' },
  dangerLabel: { color: Colors.error },
  versionText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  helpButton: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.teal,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  helpButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
});
