import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { getBusiness, saveCalendarColor } from '../../services/businesses';
import { Button } from '../../components/ui';
import { CalendarPalette, Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CalendarColorSettings'>;

export default function CalendarColorScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [selectedColor, setSelectedColor] = useState<string>(Colors.teal);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business?.calendarColor) setSelectedColor(business.calendarColor);
  }, [business?.calendarColor]);

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await saveCalendarColor(uid, selectedColor);
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
      navigation.goBack();
    } catch (err) {
      console.error('saveCalendarColor failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('calendarColor.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('calendarColor.description')}
        </Text>

        <View style={styles.swatchGrid}>
          {CalendarPalette.map((color) => {
            const isSelected = color === selectedColor;
            return (
              <TouchableOpacity
                key={color}
                style={[styles.swatch, { backgroundColor: color }, isSelected && styles.swatchSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedColor(color)}
              >
                {isSelected && <Ionicons name="checkmark" size={22} color={Colors.white} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Button label={t('common.save')} onPress={handleSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
}

const SWATCH_SIZE = 56;

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
    marginHorizontal: Spacing.sm,
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.xl },
  description: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: Light.textPrimary,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
