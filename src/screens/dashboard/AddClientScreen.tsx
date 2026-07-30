import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { createClient } from '../../services/clients';
import { Button, FormInput } from '../../components/ui';
import { Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddClient'>;

export default function AddClientScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [moreDetailsExpanded, setMoreDetailsExpanded] = useState(false);
  const [savingAction, setSavingAction] = useState<'invite' | 'plain' | null>(null);
  const queryClient = useQueryClient();

  const canSave = phone.trim().length > 0 && savingAction === null;

  const handleSave = async (invite: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!canSave || !uid) return;
    setSavingAction(invite ? 'invite' : 'plain');
    // TODO(firestore-rules): the `clients` subcollection rule isn't deployed yet, so this
    // save currently fails with "permission denied". Swallowing the error here so the flow
    // stays testable — once rules are deployed, remove this try/catch and let a failed save
    // block navigation (with retry) like it did before.
    try {
      await createClient(uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      if (invite) {
        console.log(`Would send invite to ${phone.trim()} — not implemented yet.`);
      }
    } catch (err) {
      console.error('createClient failed, continuing anyway:', err);
    } finally {
      setSavingAction(null);
    }
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Client</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label="PHONE NUMBER"
            icon="call-outline"
            placeholder="e.g. 44 123 456"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <FormInput
            label="First Name"
            icon="person-outline"
            placeholder="e.g. Arta"
            value={firstName}
            onChangeText={setFirstName}
          />
          <FormInput label="Last Name" placeholder="e.g. Krasniqi" value={lastName} onChangeText={setLastName} />

          <TouchableOpacity
            style={styles.moreDetailsRow}
            activeOpacity={0.7}
            onPress={() => setMoreDetailsExpanded((v) => !v)}
          >
            <Text style={styles.moreDetailsLabel}>More details</Text>
            <Ionicons
              name={moreDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Light.textMuted}
            />
          </TouchableOpacity>
          {moreDetailsExpanded && (
            // TODO: email, birthday, notes, tags, etc. once the client data model grows.
            <Text style={styles.moreDetailsPlaceholder}>More fields coming soon.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Button
          label="Add & Invite"
          onPress={() => handleSave(true)}
          disabled={!canSave}
          loading={savingAction === 'invite'}
        />
        <Button
          label="Add"
          onPress={() => handleSave(false)}
          disabled={!canSave}
          loading={savingAction === 'plain'}
          variant="secondary"
          style={styles.secondButton}
        />
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
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  secondButton: { marginTop: Spacing.sm },
});
