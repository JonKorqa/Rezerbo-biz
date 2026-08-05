import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../services/firebase';
import { getBusiness, updateBusiness } from '../../services/businesses';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { Business } from '../../types/business';
import type { RootStackParamList } from '../../types/navigation';

const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sq', label: 'Shqip' },
  { code: 'sr', label: 'Srpski' },
  { code: 'de', label: 'Deutsch' },
];

export default function PersonalSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [language, setLanguage] = useState('en');
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);

  useEffect(() => {
    setLanguage(business?.language ?? 'en');
  }, [business?.language]);

  const handlePickLanguage = async (code: string) => {
    setLanguage(code);
    setLanguagePickerVisible(false);
    if (!uid) return;
    try {
      const data: Partial<Business> = { language: code };
      await updateBusiness(uid, data);
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
    } catch (err) {
      console.error('saveLanguage failed:', err);
    }
  };

  const languageLabel = LANGUAGE_OPTIONS.find((o) => o.code === language)?.label ?? 'English';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('NotificationPreferences')}
          >
            <View style={styles.rowIconWrap}>
              <Ionicons name="notifications-outline" size={18} color={Colors.teal} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Notification Preferences</Text>
              <Text style={styles.rowDescription}>Choose which in-app notifications you receive</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            activeOpacity={0.7}
            onPress={() => setLanguagePickerVisible(true)}
          >
            <View style={styles.rowIconWrap}>
              <Ionicons name="language-outline" size={18} color={Colors.teal} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Language</Text>
              <Text style={styles.rowDescription}>{languageLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={languagePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguagePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLanguagePickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language</Text>
              <TouchableOpacity onPress={() => setLanguagePickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGE_OPTIONS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => handlePickLanguage(item.code)}
                >
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.code === language && <Ionicons name="checkmark" size={20} color={Colors.teal} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  rowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    maxHeight: '70%',
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  optionLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
});
