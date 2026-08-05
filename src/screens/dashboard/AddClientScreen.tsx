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
import { createClient, deleteClient, updateClient } from '../../services/clients';
import { getClientDisplayName } from '../../types/client';
import { Button, FormInput } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddClient'>;

export default function AddClientScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const editingClient = route.params?.client;
  const isEditing = !!editingClient;

  const [phone, setPhone] = useState(editingClient?.phone ?? '');
  const [firstName, setFirstName] = useState(editingClient?.firstName ?? '');
  const [lastName, setLastName] = useState(editingClient?.lastName ?? '');
  const [moreDetailsExpanded, setMoreDetailsExpanded] = useState(false);
  const [savingAction, setSavingAction] = useState<'invite' | 'plain' | 'edit' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const canSave = phone.trim().length > 0 && savingAction === null && !deleting;

  const handleSave = async (invite: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!canSave || !uid) return;
    setSavingAction(isEditing ? 'edit' : invite ? 'invite' : 'plain');
    const input = { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() };
    try {
      if (isEditing) {
        await updateClient(uid, editingClient.id, input);
      } else {
        await createClient(uid, input);
        if (invite) {
          console.log(`Would send invite to ${phone.trim()} — not implemented yet.`);
        }
      }
    } catch (err) {
      console.error('client save failed, continuing anyway:', err);
    } finally {
      setSavingAction(null);
    }
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editingClient) return;
    Alert.alert(
      t('addClient.deleteConfirmTitle'),
      t('addClient.deleteConfirmMessage', { name: getClientDisplayName(editingClient) || t('addClient.thisClient') }),
      [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          setDeleting(true);
          try {
            await deleteClient(uid, editingClient.id);
          } catch (err) {
            console.error('deleteClient failed, continuing anyway:', err);
          } finally {
            setDeleting(false);
          }
          queryClient.invalidateQueries({ queryKey: ['clients'] });
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
        <Text style={styles.headerTitle}>{isEditing ? t('addClient.editTitle') : t('addClient.addTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label={t('addClient.phoneNumber')}
            icon="call-outline"
            placeholder={t('addClient.phonePlaceholder')}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <FormInput
            label={t('addClient.firstName')}
            icon="person-outline"
            placeholder={t('addClient.firstNamePlaceholder')}
            value={firstName}
            onChangeText={setFirstName}
          />
          <FormInput label={t('addClient.lastName')} placeholder={t('addClient.lastNamePlaceholder')} value={lastName} onChangeText={setLastName} />

          <TouchableOpacity
            style={styles.moreDetailsRow}
            activeOpacity={0.7}
            onPress={() => setMoreDetailsExpanded((v) => !v)}
          >
            <Text style={styles.moreDetailsLabel}>{t('addClient.moreDetails')}</Text>
            <Ionicons
              name={moreDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Light.textMuted}
            />
          </TouchableOpacity>
          {moreDetailsExpanded && (
            // TODO: email, birthday, notes, tags, etc. once the client data model grows.
            <Text style={styles.moreDetailsPlaceholder}>{t('addClient.moreFieldsComingSoon')}</Text>
          )}

          {isEditing && (
            <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={handleDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteLabel}>{deleting ? t('addClient.deleting') : t('addClient.deleteClient')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        {isEditing ? (
          <Button label={t('addClient.saveChanges')} onPress={() => handleSave(false)} disabled={!canSave} loading={savingAction === 'edit'} />
        ) : (
          <>
            <Button
              label={t('addClient.addAndInvite')}
              onPress={() => handleSave(true)}
              disabled={!canSave}
              loading={savingAction === 'invite'}
            />
            <Button
              label={t('addClient.add')}
              onPress={() => handleSave(false)}
              disabled={!canSave}
              loading={savingAction === 'plain'}
              variant="secondary"
              style={styles.secondButton}
            />
          </>
        )}
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
  moreDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  moreDetailsLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  moreDetailsPlaceholder: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
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
  secondButton: { marginTop: Spacing.sm },
});
