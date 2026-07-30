import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '../theme';
import { Light } from '../theme/light';

interface EmptyStateProps {
  variant: 'cards' | 'closed';
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  compact?: boolean;
}

function StackedCardsIllustration({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.stackWrap}>
      <View style={[styles.card, styles.cardBack]} />
      <View style={[styles.card, styles.cardMid]} />
      <View style={[styles.card, styles.cardFront]}>
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={18} color={Light.textMuted} />
        </View>
        <View style={styles.cardLines}>
          <View style={[styles.cardLine, { width: '70%' }]} />
          <View style={[styles.cardLine, { width: '45%' }]} />
        </View>
      </View>
    </View>
  );
}

function ClosedSignIllustration() {
  return (
    <View style={styles.signWrap}>
      <Ionicons name="moon-outline" size={26} color={Light.textMuted} />
      <Text style={styles.signText}>CLOSED</Text>
    </View>
  );
}

export function EmptyState({ variant, icon = 'notifications-outline', message, compact }: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {variant === 'cards' ? <StackedCardsIllustration icon={icon} /> : <ClosedSignIllustration />}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing['2xl'] },
  containerCompact: { paddingVertical: Spacing.lg },
  message: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  stackWrap: { width: 120, height: 76, opacity: 0.5 },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Light.border,
    backgroundColor: Light.fieldBg,
  },
  cardBack: { top: 0, height: 56, marginHorizontal: 16 },
  cardMid: { top: 10, height: 56, marginHorizontal: 8 },
  cardFront: {
    top: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Light.background,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLines: { flex: 1, gap: 6 },
  cardLine: { height: 6, borderRadius: Radius.sm, backgroundColor: Light.border },
  signWrap: {
    width: 120,
    height: 76,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Light.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    opacity: 0.5,
  },
  signText: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 1,
  },
});
