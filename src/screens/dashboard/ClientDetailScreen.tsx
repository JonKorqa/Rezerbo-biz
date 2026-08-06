import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useClients } from '../../hooks/useClients';
import { useAppointments } from '../../hooks/useAppointments';
import { getClientDisplayName } from '../../types/client';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';
import type { Appointment } from '../../types/appointment';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetail'>;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function formatDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function AppointmentRow({ appointment, upcoming }: { appointment: Appointment; upcoming: boolean }) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  return (
    <View style={[styles.apptRow, { borderLeftColor: appointment.color ?? Colors.teal }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.apptService}>{appointment.serviceName}</Text>
        <Text style={styles.apptMeta}>
          {formatDate(appointment.startTime, locale)} · {formatTime(appointment.startTime, locale)}
        </Text>
      </View>
      <View style={[styles.statusBadge, upcoming ? styles.statusBadgeUpcoming : styles.statusBadgePast]}>
        <Text style={[styles.statusBadgeLabel, upcoming ? styles.statusBadgeLabelUpcoming : styles.statusBadgeLabelPast]}>
          {upcoming ? t('clientDetail.upcoming') : t('clientDetail.past')}
        </Text>
      </View>
    </View>
  );
}

export default function ClientDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { clientId } = route.params;
  const { data: clients = [] } = useClients();
  const { data: appointments = [] } = useAppointments();

  const client = clients.find((c) => c.id === clientId);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const clientAppointments = appointments.filter((a) => a.clientId === clientId);
    const upcomingList = clientAppointments
      .filter((a) => a.startTime >= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const pastList = clientAppointments
      .filter((a) => a.startTime < now)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return { upcoming: upcomingList, past: pastList };
  }, [appointments, clientId]);

  if (!client) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('clients.defaultName')}</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptySubtitle}>{t('clientDetail.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = getClientDisplayName(client) || t('clients.defaultName');
  const hasHistory = upcoming.length > 0 || past.length > 0;

  const handleCall = () => {
    Linking.openURL(`tel:${client.phone}`);
  };

  const handleEdit = () => {
    navigation.navigate('AddClient', { client });
  };

  const handleNewAppointment = () => {
    navigation.navigate('NewAppointment', { selectedClient: { id: client.id, name } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name}
        </Text>
        <TouchableOpacity onPress={handleEdit} hitSlop={12}>
          <Ionicons name="create-outline" size={22} color={Colors.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{getInitials(name)}</Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('clientDetail.contactInfo')}</Text>
        {client.phone ? (
          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7} onPress={handleCall}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="call-outline" size={18} color={Colors.teal} />
            </View>
            <Text style={styles.contactValue}>{client.phone}</Text>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptySubtitle}>{t('clientDetail.noPhone')}</Text>
        )}

        <Text style={styles.sectionTitle}>{t('clientDetail.appointmentHistory')}</Text>
        {!hasHistory ? (
          <View style={styles.historyEmpty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={28} color={Colors.teal} />
            </View>
            <Text style={styles.emptyTitle}>{t('clientDetail.noAppointmentsYet')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('clientDetail.noAppointmentsSubtitle')}
            </Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>{t('clientDetail.upcoming')}</Text>
                {upcoming.map((appt) => (
                  <AppointmentRow key={appt.id} appointment={appt} upcoming />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>{t('clientDetail.past')}</Text>
                {past.map((appt) => (
                  <AppointmentRow key={appt.id} appointment={appt} upcoming={false} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.newApptButton} activeOpacity={0.85} onPress={handleNewAppointment}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.newApptButtonLabel}>{t('newAppointment.title')}</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.sm },
  profileBlock: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
  },
  profileName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  subsectionTitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBgFocused,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactValue: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  historyEmpty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
  },
  emptySubtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'] },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  apptService: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  apptMeta: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeUpcoming: { backgroundColor: Light.fieldBgFocused },
  statusBadgePast: { backgroundColor: Light.fieldBg },
  statusBadgeLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  statusBadgeLabelUpcoming: { color: Colors.teal },
  statusBadgeLabelPast: { color: Light.textMuted },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  newApptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.teal,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  newApptButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
  },
});
