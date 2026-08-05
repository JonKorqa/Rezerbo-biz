import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useServices } from '../../hooks/useServices';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { Service } from '../../types/service';

type Props = NativeStackScreenProps<RootStackParamList, 'ServicePicker'>;

export default function ServicePickerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { data: services = [], isLoading } = useServices();

  const currentClient = route.params?.currentClient;

  const selectService = (service: Service) => {
    const { routes } = navigation.getState();
    const parentRoute = [...routes].reverse().find((r) => r.name === 'NewAppointment');
    if (parentRoute) {
      navigation.dispatch({
        ...CommonActions.setParams({
          selectedClient: currentClient,
          selectedService: {
            id: service.id,
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.price,
            color: service.color,
          },
        }),
        source: parentRoute.key,
      });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('servicePicker.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderLeftColor: item.color ?? Colors.teal }]}
              activeOpacity={0.7}
              onPress={() => selectService(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <Text style={styles.rowSubLabel}>{item.durationMinutes}m</Text>
              </View>
              <Text style={styles.rowPrice}>${item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('checkout.noServices')}
              </Text>
            </View>
          }
        />
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['4xl'] },
  emptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  rowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  rowSubLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  rowPrice: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
});
