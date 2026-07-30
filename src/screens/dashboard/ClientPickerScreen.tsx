import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useClients } from '../../hooks/useClients';
import { filterClients, getClientDisplayName } from '../../types/client';
import { ClientRow } from './components/ClientRow';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientPicker'>;

export default function ClientPickerScreen({ navigation, route }: Props) {
  const [search, setSearch] = useState('');
  const { data: clients = [] } = useClients();

  const filteredClients = useMemo(() => filterClients(clients, search), [clients, search]);

  const currentService = route.params?.currentService;

  const returnToNewAppointment = (selectedClient: { id: string | null; name: string }) => {
    const { routes } = navigation.getState();
    const parentRoute = [...routes].reverse().find((r) => r.name === 'NewAppointment');
    if (parentRoute) {
      navigation.dispatch({
        ...CommonActions.setParams({ selectedClient, selectedService: currentService }),
        source: parentRoute.key,
      });
    }
    navigation.goBack();
  };

  const selectWalkIn = () => returnToNewAppointment({ id: null, name: 'Walk-in' });

  const selectClient = (id: string, name: string) => returnToNewAppointment({ id, name });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select client</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          placeholderTextColor={Light.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={selectWalkIn}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="walk-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.rowLabel}>Continue as walk-in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddClient')}
            >
              <View style={styles.rowIconWrap}>
                <Ionicons name="person-add-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.rowLabel}>Add new client</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <ClientRow client={item} onPress={() => selectClient(item.id, getClientDisplayName(item))} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved clients yet.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  empty: { paddingVertical: Spacing['2xl'], alignItems: 'center' },
  emptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
