import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { createMembership, deleteMembership, updateMembership } from '../../services/memberships';
import { useServices } from '../../hooks/useServices';
import { Button, FormInput } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { BillingPeriod } from '../../types/membership';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditMembership'>;

const BILLING_PERIODS: BillingPeriod[] = ['weekly', 'monthly', 'yearly'];

function sanitizeDecimalInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function AddEditMembershipScreen({ navigation, route }: Props) {
  const editingMembership = route.params?.membership;
  const isEditing = !!editingMembership;
  const { data: services = [] } = useServices();

  const [name, setName] = useState(editingMembership?.name ?? '');
  const [description, setDescription] = useState(editingMembership?.description ?? '');
  const [priceText, setPriceText] = useState(editingMembership ? String(editingMembership.price) : '');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(editingMembership?.billingPeriod ?? 'monthly');
  const [includedServiceIds, setIncludedServiceIds] = useState<string[]>(editingMembership?.includedServiceIds ?? []);
  const [active, setActive] = useState(editingMembership?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const price = parseFloat(priceText) || 0;
  const canSave = name.trim().length > 0 && !saving && !deleting;

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!canSave || !uid) return;
    setSaving(true);
    const input = {
      name: name.trim(),
      description: description.trim() || undefined,
      price,
      billingPeriod,
      includedServiceIds,
      active,
    };
    try {
      if (isEditing) {
        await updateMembership(uid, editingMembership.id, input);
      } else {
        await createMembership(uid, input);
      }
    } catch (err) {
      console.error('membership save failed, continuing anyway:', err);
    } finally {
      setSaving(false);
    }
    queryClient.invalidateQueries({ queryKey: ['memberships', uid] });
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editingMembership) return;
    Alert.alert('Delete membership', `Remove "${editingMembership.name}" from your memberships?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          setDeleting(true);
          try {
            await deleteMembership(uid, editingMembership.id);
          } catch (err) {
            console.error('deleteMembership failed, continuing anyway:', err);
          } finally {
            setDeleting(false);
          }
          queryClient.invalidateQueries({ queryKey: ['memberships', uid] });
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Membership' : 'Add Membership'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label="MEMBERSHIP NAME"
            icon="ribbon-outline"
            placeholder="e.g. Monthly Unlimited Manicures"
            value={name}
            onChangeText={setName}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What does this membership include?"
              placeholderTextColor={Light.textMuted}
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
          <FormInput
            label="PRICE"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={priceText}
            onChangeText={(t) => setPriceText(sanitizeDecimalInput(t))}
            leftElement={<Text style={styles.dollarSign}>$</Text>}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>BILLING PERIOD</Text>
            <View style={styles.chipRow}>
              {BILLING_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.chip, billingPeriod === period && styles.chipSelected]}
                  activeOpacity={0.8}
                  onPress={() => setBillingPeriod(period)}
                >
                  <Text style={[styles.chipLabel, billingPeriod === period && styles.chipLabelSelected]}>
                    {period[0].toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>INCLUDED SERVICES</Text>
            {services.length === 0 ? (
              <Text style={styles.noServicesText}>Add services first, then include them here.</Text>
            ) : (
              services.map((service) => {
                const checked = includedServiceIds.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceRow}
                    activeOpacity={0.7}
                    onPress={() => setIncludedServiceIds((prev) => toggleInArray(prev, service.id))}
                  >
                    <Text style={styles.serviceRowLabel}>{service.name}</Text>
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={checked ? Colors.teal : Light.textMuted}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={styles.activeRow}>
            <Text style={styles.activeLabel}>Active</Text>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: Light.track, true: Colors.tealLight }}
              thumbColor={active ? Colors.teal : Colors.white}
            />
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={handleDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteLabel}>{deleting ? 'Deleting…' : 'Delete Membership'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button label={isEditing ? 'Save Changes' : 'Add Membership'} onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.md },
  dollarSign: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  fieldGroup: { gap: 6 },
  fieldGroupLabel: {
    color: Light.label,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  textArea: {
    minHeight: 80,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    backgroundColor: Light.fieldBg,
  },
  chipSelected: { borderColor: Colors.teal, backgroundColor: Light.fieldBgFocused },
  chipLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  chipLabelSelected: { color: Colors.teal, fontFamily: Typography.fontFamily.bold },
  noServicesText: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  serviceRowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  activeLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingTop: Spacing.lg,
    marginTop: Spacing.sm,
  },
  deleteLabel: {
    color: Colors.error,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
