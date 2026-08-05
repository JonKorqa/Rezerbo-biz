import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useServices } from '../../hooks/useServices';
import { groupServicesByCategory } from '../../types/service';
import { ServiceRow } from './components/ServiceRow';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ServicesSetup'>;

export default function ServicesSetupScreen({ navigation }: Props) {
  const { data: services = [] } = useServices();

  const sections = useMemo(
    () =>
      groupServicesByCategory(services).map((group) => ({
        title: group.category,
        data: group.services,
      })),
    [services],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services Setup</Text>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddEditService')}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.title ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
        }
        renderItem={({ item }) => (
          <ServiceRow service={item} onPress={() => navigation.navigate('AddEditService', { service: item })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cut-outline" size={32} color={Colors.teal} />
            </View>
            <Text style={styles.emptyTitle}>No services yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first service so clients and staff can start booking it.
            </Text>
          </View>
        }
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  sectionHeader: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.lg,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: Spacing['4xl'] },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  emptySubtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
