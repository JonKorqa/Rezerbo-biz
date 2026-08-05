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
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { createPackage, deletePackage, updatePackage } from '../../services/packages';
import { useServices } from '../../hooks/useServices';
import { Button, FormInput } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditPackage'>;

function sanitizeDecimalInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function AddEditPackageScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const editingPackage = route.params?.pkg;
  const isEditing = !!editingPackage;
  const { data: services = [] } = useServices();

  const [name, setName] = useState(editingPackage?.name ?? '');
  const [description, setDescription] = useState(editingPackage?.description ?? '');
  const [priceText, setPriceText] = useState(editingPackage ? String(editingPackage.price) : '');
  const [includedServiceIds, setIncludedServiceIds] = useState<string[]>(editingPackage?.includedServiceIds ?? []);
  const [active, setActive] = useState(editingPackage?.active ?? true);
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
      includedServiceIds,
      price,
      active,
    };
    try {
      if (isEditing) {
        await updatePackage(uid, editingPackage.id, input);
      } else {
        await createPackage(uid, input);
      }
    } catch (err) {
      console.error('package save failed, continuing anyway:', err);
    } finally {
      setSaving(false);
    }
    queryClient.invalidateQueries({ queryKey: ['packages', uid] });
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editingPackage) return;
    Alert.alert(t('addEditPackage.deleteConfirmTitle'), t('addEditPackage.deleteConfirmMessage', { name: editingPackage.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          setDeleting(true);
          try {
            await deletePackage(uid, editingPackage.id);
          } catch (err) {
            console.error('deletePackage failed, continuing anyway:', err);
          } finally {
            setDeleting(false);
          }
          queryClient.invalidateQueries({ queryKey: ['packages', uid] });
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
        <Text style={styles.headerTitle}>{isEditing ? t('addEditPackage.editTitle') : t('addEditPackage.addTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label={t('addEditPackage.name')}
            icon="cube-outline"
            placeholder={t('addEditPackage.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>{t('addEditMembership.description')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('addEditPackage.descriptionPlaceholder')}
              placeholderTextColor={Light.textMuted}
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldGroupLabel}>{t('addEditMembership.includedServices')}</Text>
            {services.length === 0 ? (
              <Text style={styles.noServicesText}>{t('addEditPackage.addServicesFirst')}</Text>
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

          <FormInput
            label={t('addEditPackage.combinedPrice')}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={priceText}
            onChangeText={(text) => setPriceText(sanitizeDecimalInput(text))}
            leftElement={<Text style={styles.dollarSign}>$</Text>}
          />

          <View style={styles.activeRow}>
            <Text style={styles.activeLabel}>{t('addEditStaff.active')}</Text>
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
              <Text style={styles.deleteLabel}>{deleting ? t('addEditPackage.deleting') : t('addEditPackage.deletePackage')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button label={isEditing ? t('addClient.saveChanges') : t('addEditPackage.addTitle')} onPress={handleSave} disabled={!canSave} loading={saving} />
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
