import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../../theme';
import { Light } from '../../../theme/light';
import type { Service } from '../../../types/service';

interface ServiceRowProps {
  service: Service;
  onPress?: () => void;
}

export function ServiceRow({ service, onPress }: ServiceRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: service.color ?? Colors.teal }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.meta}>{service.durationMinutes}m</Text>
      </View>
      <Text style={styles.price}>${service.price.toFixed(2)}</Text>
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
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
});
