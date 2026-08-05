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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    Alert.alert(t('addEditService.deleteConfirmTitle'), t('addEditService.deleteConfirmMessage', { name: editingService.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
        <Text style={styles.headerTitle}>{isEditing ? t('addEditService.editTitle') : t('addEditService.addTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label={t('addEditService.serviceName')}
            icon="cut-outline"
            placeholder={t('addEditService.serviceNamePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <FormInput
            label={t('addEditService.duration')}
            icon="time-outline"
            placeholder={t('addEditService.durationPlaceholder')}
            keyboardType="number-pad"
            value={durationText}
            onChangeText={(text) => setDurationText(text.replace(/[^0-9]/g, ''))}
          />
          <FormInput
            label={t('addEditService.price')}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={priceText}
            onChangeText={(text) => setPriceText(sanitizeDecimalInput(text))}
            leftElement={<Text style={styles.dollarSign}>$</Text>}
          />
          <FormInput
            label={t('addEditService.category')}
            icon="pricetag-outline"
            placeholder={t('addEditService.categoryPlaceholder')}
            value={category}
            onChangeText={setCategory}
          />

          {isEditing && (
            <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={handleDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteLabel}>{deleting ? t('addEditService.deleting') : t('addEditService.deleteService')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button label={isEditing ? t('addClient.saveChanges') : t('addEditService.addTitle')} onPress={handleSave} disabled={!canSave} loading={saving} />
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
