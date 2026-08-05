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
    Alert.alert('Remove staff member', `Remove ${editingStaff.name || 'this staff member'} from your team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
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
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Staff Member' : 'Add Staff Member'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput label="NAME" icon="person-outline" placeholder="e.g. Arta Krasniqi" value={name} onChangeText={setName} />
          <FormInput
            label="PHONE"
            icon="call-outline"
            placeholder="e.g. 44 123 456"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <FormInput
            label="EMAIL (OPTIONAL)"
            icon="mail-outline"
            placeholder="e.g. arta@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>ROLE</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleChipLabel, role === r && styles.roleChipLabelSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
              <Text style={styles.deleteLabel}>{deleting ? 'Removing…' : 'Remove Staff Member'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button label={isEditing ? 'Save Changes' : 'Add Staff Member'} onPress={handleSave} disabled={!canSave} loading={saving} />
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
