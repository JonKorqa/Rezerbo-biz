import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useServices } from '../../hooks/useServices';
import { groupServicesByCategory } from '../../types/service';
import { ServiceRow } from '../dashboard/components/ServiceRow';
import { Button, ProgressBar } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddServicesOnboarding'>;

export default function AddServicesOnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data: services = [] } = useServices();

  const sections = useMemo(
    () =>
      groupServicesByCategory(services).map((group) => ({
        title: group.category,
        data: group.services,
      })),
    [services],
  );

  // Adding a service isn't required, so both buttons lead here with no validation
  // gate. Business Hours is the next (and last) onboarding step.
  const handleContinue = () => navigation.navigate('BusinessHours', { onboarding: true });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProgressBar step={5} totalSteps={6} />
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.addServices.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.addServices.subtitle')}</Text>
      </View>

      <TouchableOpacity
        style={styles.addRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AddEditService')}
      >
        <View style={styles.addIconWrap}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </View>
        <Text style={styles.addRowLabel}>{t('onboarding.addServices.addService')}</Text>
      </TouchableOpacity>

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
          <Text style={styles.emptyText}>{t('servicesSetup.emptySubtitle')}</Text>
        }
      />

      <View style={styles.bottomBar}>
        <Button label={t('common.continue')} onPress={handleContinue} />
        <Button
          label={t('onboarding.addServices.skipForNow')}
          variant="ghost"
          onPress={handleContinue}
          style={styles.skipButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.xs },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
  },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    borderStyle: 'dashed',
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  listContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  sectionHeader: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.lg,
  },
  emptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  skipButton: { height: 40 },
});
