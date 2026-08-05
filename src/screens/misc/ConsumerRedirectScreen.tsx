import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsumerRedirect'>;

// Stub: in the real flow this deep-links into the consumer Rezervo app.
// Follow-up: wire real Linking.openURL()/store redirect once the consumer
// app's scheme/listing is finalized.
export default function ConsumerRedirectScreen({ navigation }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={36} color={Colors.teal} />
        </View>
        <Text style={styles.title}>{t('consumerRedirect.title')}</Text>
        <Text style={styles.subtitle}>
          {t('consumerRedirect.subtitle')}
        </Text>
        <Button label={t('common.back')} variant="secondary" onPress={() => navigation.goBack()} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
    textAlign: 'center',
  },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: { marginTop: Spacing.lg, width: '100%' },
});
