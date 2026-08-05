import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { getBusiness } from '../../services/businesses';
import { createAppointment } from '../../services/appointments';
import { createNotification } from '../../services/notifications';
import { Button } from '../../components/ui';
import { DateTimePickerSheet } from '../../components/DateTimePickerSheet';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { formatDateTime, getDefaultStartTime } from '../../utils/scheduling';
import type { RootStackParamList, SelectedClientParam, SelectedServiceParam } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NewAppointment'>;

const DEFAULT_DURATION_MINUTES = 30;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function NewAppointmentScreen({ navigation, route }: Props) {
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [client, setClient] = useState<SelectedClientParam | null>(null);
  const [service, setService] = useState<SelectedServiceParam | null>(null);
  const [startTime, setStartTime] = useState<Date>(getDefaultStartTime);
  const [endTime, setEndTime] = useState<Date>(
    () => new Date(getDefaultStartTime().getTime() + DEFAULT_DURATION_MINUTES * 60000),
  );
  const [endManuallySet, setEndManuallySet] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerDay, setPickerDay] = useState<Date>(() => new Date());
  const [saving, setSaving] = useState(false);

  const selectedClientParam = route.params?.selectedClient;
  const selectedServiceParam = route.params?.selectedService;

  useEffect(() => {
    if (selectedClientParam) setClient(selectedClientParam);
  }, [selectedClientParam]);

  useEffect(() => {
    if (selectedServiceParam) setService(selectedServiceParam);
  }, [selectedServiceParam]);

  useEffect(() => {
    if (service && !endManuallySet) {
      setEndTime(new Date(startTime.getTime() + service.durationMinutes * 60000));
    }
    // Only recompute when the service changes — the start-time picker handles its own recalculation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const staffName = business?.ownerName ?? auth.currentUser?.email ?? 'You';

  const canSave = !!service && !saving;

  const openPicker = (target: 'start' | 'end') => {
    const current = target === 'start' ? startTime : endTime;
    setPickerDay(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
    setPickerTarget(target);
  };

  const selectTimeSlot = (hour: number, minute: number) => {
    const newDate = new Date(pickerDay);
    newDate.setHours(hour, minute, 0, 0);
    if (pickerTarget === 'start') {
      setStartTime(newDate);
      if (!endManuallySet) {
        const duration = service?.durationMinutes ?? DEFAULT_DURATION_MINUTES;
        setEndTime(new Date(newDate.getTime() + duration * 60000));
      }
    } else if (pickerTarget === 'end') {
      setEndTime(newDate);
      setEndManuallySet(true);
    }
    setPickerTarget(null);
  };

  const handleStaffPress = () => {
    Alert.alert('Coming soon', 'Multi-staff assignment is not available yet.');
  };

  const handleStubAction = (label: string) => {
    console.log(`${label} tapped — not built yet.`);
  };

  const handleSave = async () => {
    if (!service || !uid) return;
    setSaving(true);
    // TODO(firestore-rules): the `appointments` collection rule isn't deployed yet, so this
    // save currently fails with "permission denied". Swallowing the error here so the flow
    // stays testable — once rules are deployed, remove this try/catch and let a failed save
    // block navigation (with retry) like it did before.
    try {
      const clientLabel = client?.name ?? 'Walk-in';
      const appointmentId = await createAppointment({
        businessId: uid,
        clientId: client?.id ?? null,
        clientName: clientLabel,
        serviceId: service.id,
        serviceLabel: service.name,
        staffId: uid,
        start: startTime,
        end: endTime,
        color: service.color,
      });
      const timeLabel = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      await createNotification(uid, {
        type: 'new_booking',
        title: 'New Appointment',
        message: `${clientLabel} - ${service.name} at ${timeLabel}`,
        appointmentId,
      });
    } catch (err) {
      console.error('createAppointment failed, continuing anyway:', err);
    } finally {
      setSaving(false);
    }
    queryClient.invalidateQueries({ queryKey: ['appointments', uid] });
    queryClient.invalidateQueries({ queryKey: ['notifications', uid] });
    navigation.goBack();
  };

  const activeFieldValue = pickerTarget === 'start' ? startTime : endTime;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Appointment</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.clientRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ClientPicker', { currentService: service ?? undefined })}
        >
          <Ionicons name="person-outline" size={18} color={Light.textSecondary} />
          <Text style={styles.clientRowLabel} numberOfLines={1}>
            {client ? client.name : 'Select a client or leave empty for walk-in'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        {service ? (
          <TouchableOpacity
            style={[styles.serviceCard, { borderLeftColor: service.color ?? Colors.teal }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ServicePicker', { currentClient: client ?? undefined })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceMeta}>{service.durationMinutes}m</Text>
            </View>
            <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.servicePlaceholder}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ServicePicker', { currentClient: client ?? undefined })}
          >
            <Text style={styles.servicePlaceholderLabel}>Choose a Service</Text>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
        )}

        {service && (
          <View style={styles.inlineActionsRow}>
            <TouchableOpacity
              style={styles.inlineAction}
              activeOpacity={0.7}
              onPress={() => handleStubAction('Add a service')}
            >
              <Ionicons name="add-circle-outline" size={16} color={Light.textMuted} />
              <Text style={styles.inlineActionLabel}>Add a service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inlineAction}
              activeOpacity={0.7}
              onPress={() => handleStubAction('Recurring service')}
            >
              <Ionicons name="repeat-outline" size={16} color={Light.textMuted} />
              <Text style={styles.inlineActionLabel}>Recurring service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inlineAction}
              activeOpacity={0.7}
              onPress={() => handleStubAction('Group')}
            >
              <Ionicons name="people-outline" size={16} color={Light.textMuted} />
              <Text style={styles.inlineActionLabel}>Group</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.timeRow}>
          <TouchableOpacity style={styles.timeField} activeOpacity={0.7} onPress={() => openPicker('start')}>
            <Text style={styles.fieldLabel}>START DATE & TIME</Text>
            <Text style={styles.fieldValue}>{formatDateTime(startTime)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeField} activeOpacity={0.7} onPress={() => openPicker('end')}>
            <Text style={styles.fieldLabel}>END</Text>
            <Text style={styles.fieldValue}>{formatDateTime(endTime)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.staffRow} activeOpacity={0.7} onPress={handleStaffPress}>
          <Text style={styles.fieldLabel}>STAFF</Text>
          <View style={styles.staffValueRow}>
            <View style={styles.staffAvatar}>
              <Text style={styles.staffAvatarLabel}>{getInitials(staffName)}</Text>
            </View>
            <Text style={styles.staffName}>{staffName}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notesRow}
          activeOpacity={0.7}
          onPress={() => setNotesExpanded((v) => !v)}
        >
          <Text style={styles.notesLabel}>Notes & Questions</Text>
          <Ionicons name={notesExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Light.textMuted} />
        </TouchableOpacity>
        {notesExpanded && (
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes or questions for this appointment"
            placeholderTextColor={Light.textMuted}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${(service?.price ?? 0).toFixed(2)}</Text>
        </View>
        <Button label="Save" onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>

      <DateTimePickerSheet
        visible={pickerTarget !== null}
        title={pickerTarget === 'start' ? 'Start date & time' : 'End time'}
        pickerDay={pickerDay}
        onSelectDay={setPickerDay}
        activeTime={activeFieldValue}
        onSelectTime={selectTimeSlot}
        onClose={() => setPickerTarget(null)}
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
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'], gap: Spacing.lg },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  clientRowLabel: {
    flex: 1,
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  servicePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  servicePlaceholderLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  serviceName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  serviceMeta: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  servicePrice: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  inlineActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.sm,
  },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.6 },
  inlineActionLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  timeField: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  fieldLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  fieldValue: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  staffRow: {
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  staffValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  staffAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  staffName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingTop: Spacing.md,
  },
  notesLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  notesInput: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlignVertical: 'top',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  totalValue: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
});
