import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../../../theme';
import { Light } from '../../../theme/light';
import type { ServicePackage } from '../../../types/package';

interface PackageRowProps {
  pkg: ServicePackage;
  onPress?: () => void;
}

export function PackageRow({ pkg, onPress }: PackageRowProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{pkg.name}</Text>
          {!pkg.active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeLabel}>{t('staff.inactive')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {t('packages.servicesIncluded', { count: pkg.includedServiceIds.length })}
        </Text>
      </View>
      <Text style={styles.price}>${pkg.price.toFixed(2)}</Text>
      <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.teal,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  name: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  meta: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  price: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  inactiveBadge: {
    backgroundColor: Light.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
  },
  inactiveBadgeLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
});
