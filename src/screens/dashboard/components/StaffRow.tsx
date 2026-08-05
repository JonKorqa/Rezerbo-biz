import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../../../theme';
import { Light } from '../../../theme/light';
import type { StaffMember } from '../../../types/staff';

interface StaffRowProps {
  staff: StaffMember;
  onPress?: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function StaffRow({ staff, onPress }: StaffRowProps) {
  const { t } = useTranslation();
  const roleLabel = staff.role === 'Owner' ? t('staff.roleOwner') : t('staff.roleStaff');
  const content = (
    <>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{getInitials(staff.name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{staff.name || t('staff.unnamed')}</Text>
          {!staff.active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeLabel}>{t('staff.inactive')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {roleLabel}
          {staff.phone ? ` · ${staff.phone}` : ''}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  name: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  meta: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  inactiveBadge: {
    backgroundColor: Light.fieldBg,
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
