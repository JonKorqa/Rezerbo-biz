import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Pressable, FlatList } from 'react-native';
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

const BUFFER_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'No buffer' },
  { minutes: 5, label: '5 minutes' },
  { minutes: 10, label: '10 minutes' },
  { minutes: 15, label: '15 minutes' },
  { minutes: 20, label: '20 minutes' },
  { minutes: 30, label: '30 minutes' },
];

const DURATION_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15 minutes' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 45, label: '45 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1 hour 30 minutes' },
  { minutes: 120, label: '2 hours' },
];

export default function AdvancedOptionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [retailInfo, setRetailInfo] = useState('');
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState(0);
  const [defaultServiceDurationMinutes, setDefaultServiceDurationMinutes] = useState(30);
  const [bufferPickerVisible, setBufferPickerVisible] = useState(false);
  const [durationPickerVisible, setDurationPickerVisible] = useState(false);

  useEffect(() => {
    setRetailInfo(business?.retailInfo ?? '');
    setBufferTimeMinutes(business?.bufferTimeMinutes ?? 0);
    setDefaultServiceDurationMinutes(business?.defaultServiceDurationMinutes ?? 30);
  }, [business?.retailInfo, business?.bufferTimeMinutes, business?.defaultServiceDurationMinutes]);

  const save = async (data: Partial<Business>) => {
    if (!uid) return;
    try {
      await updateBusiness(uid, data);
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
    } catch (err) {
      console.error('saveAdvancedOptions failed:', err);
    }
  };

  const handleSaveRetailInfo = () => {
    if (retailInfo === (business?.retailInfo ?? '')) return;
    save({ retailInfo });
  };

  const handlePickBuffer = (minutes: number) => {
    setBufferTimeMinutes(minutes);
    setBufferPickerVisible(false);
    save({ bufferTimeMinutes: minutes });
  };

  const handlePickDuration = (minutes: number) => {
    setDefaultServiceDurationMinutes(minutes);
    setDurationPickerVisible(false);
    save({ defaultServiceDurationMinutes: minutes });
  };

  const bufferLabel = BUFFER_OPTIONS.find((o) => o.minutes === bufferTimeMinutes)?.label ?? 'No buffer';
  const durationLabel =
    DURATION_OPTIONS.find((o) => o.minutes === defaultServiceDurationMinutes)?.label ?? '30 minutes';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Options</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Booking Settings</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.pickerRow} activeOpacity={0.7} onPress={() => setBufferPickerVisible(true)}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>Booking Buffer Time</Text>
              <Text style={styles.rowDescription}>Gap left between back-to-back appointments</Text>
            </View>
            <Text style={styles.pickerValue}>{bufferLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerRow, styles.rowLast]}
            activeOpacity={0.7}
            onPress={() => setDurationPickerVisible(true)}
          >
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>Default Appointment Duration</Text>
              <Text style={styles.rowDescription}>Used when a service isn't selected on a booking</Text>
            </View>
            <Text style={styles.pickerValue}>{durationLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Retail/Product Information</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.retailInput}
            placeholder="Describe any products you sell in-store (e.g. shampoo, styling tools)"
            placeholderTextColor={Light.textMuted}
            value={retailInfo}
            onChangeText={setRetailInfo}
            onBlur={handleSaveRetailInfo}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <Modal
        visible={bufferPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBufferPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setBufferPickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Buffer Time</Text>
              <TouchableOpacity onPress={() => setBufferPickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BUFFER_OPTIONS}
              keyExtractor={(item) => String(item.minutes)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => handlePickBuffer(item.minutes)}
                >
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.minutes === bufferTimeMinutes && <Ionicons name="checkmark" size={20} color={Colors.teal} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={durationPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDurationPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDurationPickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Default Appointment Duration</Text>
              <TouchableOpacity onPress={() => setDurationPickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DURATION_OPTIONS}
              keyExtractor={(item) => String(item.minutes)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => handlePickDuration(item.minutes)}
                >
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.minutes === defaultServiceDurationMinutes && (
                    <Ionicons name="checkmark" size={20} color={Colors.teal} />
                  )}
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
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowLast: { borderBottomWidth: 0 },
  toggleRowBody: { flex: 1, gap: 2 },
  rowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  rowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  pickerValue: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  retailInput: {
    minHeight: 100,
    paddingVertical: Spacing.md,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
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
