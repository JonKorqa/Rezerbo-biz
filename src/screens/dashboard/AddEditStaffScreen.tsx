import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { createStaffMember, deleteStaffMember, updateStaffMember } from '../../services/staff';
import { Button, FormInput } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { StaffRole } from '../../types/staff';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditStaff'>;

const ROLES: StaffRole[] = ['Staff', 'Owner'];

export default function AddEditStaffScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const editingStaff = route.params?.staff;
  const isEditing = !!editingStaff;

  const [name, setName] = useState(editingStaff?.name ?? '');
  const [phone, setPhone] = useState(editingStaff?.phone ?? '');
  const [email, setEmail] = useState(editingStaff?.email ?? '');
  const [role, setRole] = useState<StaffRole>(editingStaff?.role ?? 'Staff');
  const [active, setActive] = useState(editingStaff?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const canSave = name.trim().length > 0 && !saving && !deleting;

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!canSave || !uid) return;
    setSaving(true);
    const input = { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, role, active };
    try {
      if (isEditing) {
        await updateStaffMember(uid, editingStaff.id, input);
      } else {
        await createStaffMember(uid, input);
      }
    } catch (err) {
      console.error('staff save failed, continuing anyway:', err);
    } finally {
      setSaving(false);
    }
    queryClient.invalidateQueries({ queryKey: ['staff', uid] });
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editingStaff) return;
    Alert.alert(
      t('addEditStaff.removeConfirmTitle'),
      t('addEditStaff.removeConfirmMessage', { name: editingStaff.name || t('addEditStaff.thisStaffMember') }),
      [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addEditStaff.remove'),
        style: 'destructive',
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          setDeleting(true);
          try {
            await deleteStaffMember(uid, editingStaff.id);
          } catch (err) {
            console.error('deleteStaffMember failed, continuing anyway:', err);
          } finally {
            setDeleting(false);
          }
          queryClient.invalidateQueries({ queryKey: ['staff', uid] });
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
        <Text style={styles.headerTitle}>{isEditing ? t('addEditStaff.editTitle') : t('addEditStaff.addTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput label={t('addEditStaff.name')} icon="person-outline" placeholder={t('onboarding.businessInfo.ownerName.placeholder')} value={name} onChangeText={setName} />
          <FormInput
            label={t('addEditStaff.phone')}
            icon="call-outline"
            placeholder={t('addClient.phonePlaceholder')}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <FormInput
            label={t('addEditStaff.email')}
            icon="mail-outline"
            placeholder="e.g. arta@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>{t('addEditStaff.role')}</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleChipLabel, role === r && styles.roleChipLabelSelected]}>
                    {r === 'Owner' ? t('staff.roleOwner') : t('staff.roleStaff')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
              <Text style={styles.deleteLabel}>{deleting ? t('addEditStaff.removing') : t('addEditStaff.removeStaffMember')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button label={isEditing ? t('addClient.saveChanges') : t('addEditStaff.addTitle')} onPress={handleSave} disabled={!canSave} loading={saving} />
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
  roleSection: { gap: 6 },
  roleLabel: {
    color: Light.label,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    backgroundColor: Light.fieldBg,
  },
  roleChipSelected: { borderColor: Colors.teal, backgroundColor: Light.fieldBgFocused },
  roleChipLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  roleChipLabelSelected: { color: Colors.teal, fontFamily: Typography.fontFamily.bold },
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
