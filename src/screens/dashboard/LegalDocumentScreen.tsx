import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'LegalDocument'>;

// Draft placeholder copy only — NOT reviewed by a lawyer. Must be replaced with real
// Terms & Conditions / Privacy Policy text before this app is used in production.
// Intentionally left untranslated: this is throwaway placeholder legal text that will be
// discarded once real, jurisdiction-reviewed copy (in both languages) replaces it — translating
// draft text a lawyer hasn't approved isn't useful work.
const TERMS_BODY = `DRAFT — PLACEHOLDER TEXT. This has not been reviewed by a lawyer and must not be relied on for a real launch.

1. Acceptance of Terms
By creating a business account on Rezervo, you agree to these Terms & Conditions and to use the platform in compliance with applicable laws.

2. Your Account
You are responsible for the accuracy of the business information you provide and for maintaining the confidentiality of your account credentials.

3. Bookings
Rezervo facilitates scheduling between you and your clients. You are responsible for honoring appointments booked through the platform and for setting accurate availability, pricing, and policies.

4. Payments
Any payment processing features are provided subject to the terms of our payment partners. Rezervo is not a party to the underlying transaction between you and your client.

5. Termination
We may suspend or terminate accounts that violate these terms or applicable law.

6. Changes
We may update these terms from time to time. Continued use of Rezervo after changes take effect constitutes acceptance of the revised terms.

This is placeholder text only and must be replaced with reviewed, jurisdiction-appropriate legal language before launch.`;

const PRIVACY_BODY = `DRAFT — PLACEHOLDER TEXT. This has not been reviewed by a lawyer and must not be relied on for a real launch.

1. Information We Collect
We collect the business and client information you provide (e.g. business details, appointment and client records) and basic usage data needed to operate the app.

2. How We Use Information
We use this information to provide scheduling, client management, and related features, and to maintain and improve the service.

3. Sharing
We do not sell your data. Information may be shared with service providers (e.g. hosting, payments) strictly to operate the platform.

4. Data Retention
We retain business and client data for as long as your account is active, or as needed to comply with legal obligations.

5. Your Choices
You can review, edit, or delete your business account and its data from within the app, subject to the limits described here.

6. Security
We use reasonable technical measures to protect your data, but no method of storage or transmission is completely secure.

This is placeholder text only and must be replaced with reviewed, jurisdiction-appropriate legal language before launch.`;

export default function LegalDocumentScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const isTerms = route.params.type === 'terms';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isTerms ? t('appInfo.termsAndConditions') : t('appInfo.privacyPolicy')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.draftBanner}>
          <Ionicons name="warning-outline" size={16} color={Colors.error} />
          <Text style={styles.draftBannerText}>
            {t('appInfo.draftBanner')}
          </Text>
        </View>
        <Text style={styles.body}>{isTerms ? TERMS_BODY : PRIVACY_BODY}</Text>
      </ScrollView>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  draftBannerText: {
    flex: 1,
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  body: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
});
