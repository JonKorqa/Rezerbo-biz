import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

interface FeatureCard {
  key: string;
  status: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    key: 'invite',
    status: 'Not invited',
    title: 'Import & Invite Clients',
    description: 'Invite your clients to book online 24/7',
    icon: 'mail-outline',
  },
  {
    key: 'social',
    status: 'Inactive',
    title: 'Social Media Marketing',
    description: 'Create and share custom posts and graphics',
    icon: 'share-social-outline',
  },
  {
    key: 'textEmail',
    status: 'Inactive',
    title: 'Text & Email Marketing',
    description: 'Automate campaigns or send one time messages.',
    icon: 'paper-plane-outline',
  },
  {
    key: 'promotions',
    status: 'Inactive',
    title: 'Promotions',
    description: 'Use promotional tools to engage your clients',
    icon: 'pricetag-outline',
  },
];

export default function MarketingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleComingSoon = (title: string) => {
    Alert.alert('Coming soon', `${title} is not built yet.`);
  };

  const handleCardPress = (card: FeatureCard) => {
    if (card.key === 'social') {
      navigation.navigate('SocialMediaMarketing');
    } else if (card.key === 'textEmail') {
      navigation.navigate('TextAndEmailMarketing');
    } else {
      handleComingSoon(card.title);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Marketing</Text>

        <View style={styles.banner}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="bannerGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Colors.tealLight} stopOpacity={1} />
                <Stop offset="1" stopColor={Colors.tealDark} stopOpacity={1} />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#bannerGradient)" />
          </Svg>

          <View style={styles.bannerContent}>
            <View style={styles.bannerText}>
              <Text style={styles.bannerHeadline}>More bookings from Google?</Text>
              <Text style={styles.bannerSubtext}>
                Turn on your free Business Profile and get discovered by new clients.
              </Text>
              <TouchableOpacity
                style={styles.bannerButton}
                activeOpacity={0.85}
                onPress={() => handleComingSoon('Google Business Profile')}
              >
                <Text style={styles.bannerButtonLabel}>Check now →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerIconWrap}>
              <Ionicons name="logo-google" size={26} color={Colors.white} />
            </View>
          </View>
        </View>

        <View style={styles.cardList}>
          {FEATURE_CARDS.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleCardPress(card)}
            >
              <View style={styles.cardBody}>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>{card.status}</Text>
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
              <View style={styles.cardIconWrap}>
                <Ionicons name={card.icon} size={22} color={Colors.teal} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing['3xl'] },
  headerTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.lg,
  },
  banner: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  bannerText: { flex: 1, paddingRight: Spacing.md },
  bannerHeadline: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: 4,
  },
  bannerSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginBottom: Spacing.md,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  bannerButtonLabel: {
    color: Colors.tealDark,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardList: { gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Light.background,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  cardBody: { flex: 1, paddingRight: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Light.textMuted,
  },
  statusLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  cardTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 2,
  },
  cardDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
