import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { createClient } from '../../services/clients';
import { useClients } from '../../hooks/useClients';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportContacts'>;

interface ImportableContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

type LoadState = 'loading' | 'denied' | 'ready';

export default function ImportContactsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [contacts, setContacts] = useState<ImportableContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const { data: existingClients = [] } = useClients();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setLoadState('denied');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.FirstName, Contacts.Fields.LastName, Contacts.Fields.PhoneNumbers],
      });
      if (cancelled) return;

      const importable: ImportableContact[] = data
        .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0 && c.phoneNumbers[0].number)
        .map((c) => {
          const { firstName, lastName } =
            c.firstName || c.lastName
              ? { firstName: c.firstName ?? '', lastName: c.lastName ?? '' }
              : splitName(c.name ?? '');
          return {
            id: c.id ?? `${firstName}-${lastName}-${c.phoneNumbers![0].number}`,
            firstName,
            lastName,
            phone: c.phoneNumbers![0].number!.trim(),
          };
        })
        .filter((c) => c.firstName || c.lastName)
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

      setContacts(importable);
      setLoadState('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const allSelected = filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id));

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        filteredContacts.forEach((c) => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      filteredContacts.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleImport = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || selectedIds.size === 0 || importing) return;
    setImporting(true);

    const knownPhones = new Set(existingClients.map((c) => normalizePhone(c.phone)).filter(Boolean));
    let imported = 0;
    let duplicates = 0;

    for (const contact of contacts) {
      if (!selectedIds.has(contact.id)) continue;
      const normalized = normalizePhone(contact.phone);
      if (normalized && knownPhones.has(normalized)) {
        duplicates += 1;
        continue;
      }
      try {
        await createClient(uid, { firstName: contact.firstName, lastName: contact.lastName, phone: contact.phone });
        imported += 1;
        if (normalized) knownPhones.add(normalized);
      } catch (err) {
        console.error('createClient (import) failed, continuing anyway:', err);
      }
    }

    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['clients'] });

    const importedMessage = t('importContacts.importedCount', { count: imported });
    const message =
      duplicates > 0
        ? `${importedMessage}, ${t('importContacts.duplicatesSkipped', { count: duplicates })}`
        : importedMessage;

    Alert.alert(
      t('importContacts.importCompleteTitle'),
      message,
      [{ text: t('importContacts.ok'), onPress: () => navigation.goBack() }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('importContacts.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loadState === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.teal} />
          <Text style={styles.centerStateText}>{t('importContacts.loading')}</Text>
        </View>
      )}

      {loadState === 'denied' && (
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={32} color={Light.textMuted} />
          <Text style={styles.centerStateTitle}>{t('importContacts.accessNeededTitle')}</Text>
          <Text style={styles.centerStateText}>
            {t('importContacts.accessNeededText')}
          </Text>
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.85} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonLabel}>{t('importContacts.openSettings')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loadState === 'ready' && (
        <>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={Light.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('importContacts.searchPlaceholder')}
              placeholderTextColor={Light.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.selectAllRow}>
            <Text style={styles.selectedCount}>{t('importContacts.selectedCount', { count: selectedIds.size })}</Text>
            <TouchableOpacity onPress={toggleSelectAll} hitSlop={8}>
              <Text style={styles.selectAllLabel}>{allSelected ? t('importContacts.deselectAll') : t('importContacts.selectAll')}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const checked = selectedIds.has(item.id);
              return (
                <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={() => toggleContact(item.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{`${item.firstName} ${item.lastName}`.trim()}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  </View>
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={checked ? Colors.teal : Light.textMuted}
                  />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centerState}>
                <Text style={styles.centerStateText}>{t('importContacts.noneFound')}</Text>
              </View>
            }
          />

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.importButton, (selectedIds.size === 0 || importing) && styles.importButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleImport}
              disabled={selectedIds.size === 0 || importing}
            >
              {importing ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.importButtonLabel}>{t('importContacts.importSelected', { count: selectedIds.size })}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
  },
  centerStateTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  centerStateText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  settingsButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  settingsButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  selectedCount: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  selectAllLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  contactName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  contactPhone: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  importButton: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonDisabled: { opacity: 0.55 },
  importButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
  },
});
