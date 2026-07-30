import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RezervoLogo } from '../components/RezervoLogo';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Light } from '../theme/light';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelector'>;

export default function RoleSelectorScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <RezervoLogo variant="light" size={26} />
        <Text style={styles.badge}>BIZ</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>How would you like to use Rezervo?</Text>
        <Text style={styles.subtitle}>Choose the option that fits you best.</Text>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Auth', { initialTab: 'signup' })}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="briefcase-outline" size={26} color={Colors.teal} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>I'm a service provider</Text>
            <Text style={styles.cardSubtitle}>
              Set up your business, manage bookings and grow your client base.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ConsumerRedirect')}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="calendar-outline" size={26} color={Colors.teal} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>I want to book an appointment</Text>
            <Text style={styles.cardSubtitle}>
              Find professionals near you and book in seconds on the Rezervo app.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Light.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  badge: {
    color: Colors.teal,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: Colors.teal,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.base,
  },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.xl,
    padding: Spacing.base,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  cardSubtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 18,
  },
});
