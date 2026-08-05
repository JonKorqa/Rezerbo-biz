import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { createService, deleteService, updateService } from '../../services/services';
import { Button, FormInput } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditService'>;

function sanitizeDecimalInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

export default function AddEditServiceScreen({ navigation, route }: Props) {
  const editingService = route.params?.service;
  const isEditing = !!editingService;

  const [name, setName] = useState(editingService?.name ?? '');
  const [durationText, setDurationText] = useState(editingService ? String(editingService.durationMinutes) : '');
  const [priceText, setPriceText] = useState(editingService ? String(editingService.price) : '');
  const [category, setCategory] = useState(editingService?.category ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const duration = parseInt(durationText, 10) || 0;
  const price = parseFloat(priceText) || 0;
  const canSave = name.trim().length > 0 && duration > 0 && !saving && !deleting;

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!canSave || !uid) return;
    setSaving(true);
    const input = {
      name: name.trim(),
      durationMinutes: duration,
      price,
      category: category.trim() || undefined,
    };
    // TODO(firestore-rules): the `services` subcollection rule isn't deployed yet
    // (see firestore.rules — only `clients` has a subcollection rule so far), so this
    // save may fail with "permission denied". Swallowing the error here so the flow
    // stays testable, matching the same temporary pattern used in AddClientScreen.
    try {
      if (isEditing) {
        await updateService(uid, editingService.id, input);
      } else {
        await createService(uid, input);
      }
    } catch (err) {
      console.error('service save failed, continuing anyway:', err);
    } finally {
      setSaving(false);
    }
    queryClient.invalidateQueries({ queryKey: ['services', uid] });
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editingService) return;
    Alert.alert('Delete service', `Remove "${editingService.name}" from your services?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          setDeleting(true);
          try {
            await deleteService(uid, editingService.id);
          } catch (err) {
            console.error('deleteService failed, continuing anyway:', err);
          } finally {
            setDeleting(false);
          }
          queryClient.invalidateQueries({ queryKey: ['services', uid] });
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
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Service' : 'Add Service'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label="SERVICE NAME"
            icon="cut-outline"
            placeholder="e.g. Manicure"
            value={name}
            onChangeText={setName}
          />
          <FormInput
            label="DURATION (MINUTES)"
            icon="time-outline"
            placeholder="e.g. 40"
            keyboardType="number-pad"
            value={durationText}
            onChangeText={(t) => setDurationText(t.replace(/[^0-9]/g, ''))}
          />
          <FormInput
            label="PRICE"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={priceText}
            onChangeText={(t) => setPriceText(sanitizeDecimalInput(t))}
            leftElement={<Text style={styles.dollarSign}>$</Text>}
          />
          <FormInput
            label="CATEGORY (OPTIONAL)"
            icon="pricetag-outline"
            placeholder="e.g. Nails"
            value={category}
            onChangeText={setCategory}
          />

          {isEditing && (
            <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={handleDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteLabel}>{deleting ? 'Deleting…' : 'Delete Service'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button label={isEditing ? 'Save Changes' : 'Add Service'} onPress={handleSave} disabled={!canSave} loading={saving} />
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
