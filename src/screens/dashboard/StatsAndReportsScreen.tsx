import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTransactions } from '../../hooks/useTransactions';
import { useAppointments } from '../../hooks/useAppointments';
import { useClients } from '../../hooks/useClients';
import {
  computeRevenueSummary,
  computeLast7DaysRevenue,
  computeTopServices,
  computeClientStats,
  computeAppointmentStats,
} from '../../utils/stats';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

const CHART_HEIGHT = 100;

function avgTicket(total: number, count: number): string {
  return count > 0 ? `$${(total / count).toFixed(2)} avg` : '—';
}

export default function StatsAndReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: transactions = [] } = useTransactions();
  const { data: appointments = [] } = useAppointments();
  const { data: clients = [] } = useClients();

  const summary = useMemo(() => computeRevenueSummary(transactions), [transactions]);
  const last7Days = useMemo(() => computeLast7DaysRevenue(transactions), [transactions]);
  const topServices = useMemo(() => computeTopServices(appointments), [appointments]);
  const clientStats = useMemo(() => computeClientStats(clients), [clients]);
  const appointmentStats = useMemo(() => computeAppointmentStats(appointments), [appointments]);

  const maxDayTotal = Math.max(1, ...last7Days.map((d) => d.total));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stats & Reports</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Revenue summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Today</Text>
            <Text style={styles.summaryAmount}>${summary.today.total.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>{summary.today.count} checkouts</Text>
            <Text style={styles.summaryDetail}>{avgTicket(summary.today.total, summary.today.count)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={styles.summaryAmount}>${summary.week.total.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>{summary.week.count} checkouts</Text>
            <Text style={styles.summaryDetail}>{avgTicket(summary.week.total, summary.week.count)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryAmount}>${summary.month.total.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>{summary.month.count} checkouts</Text>
            <Text style={styles.summaryDetail}>{avgTicket(summary.month.total, summary.month.count)}</Text>
          </View>
        </View>

        {/* 7-day revenue chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue, last 7 days</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {last7Days.map((day) => {
                const barHeight = Math.max(4, (day.total / maxDayTotal) * CHART_HEIGHT);
                return (
                  <View key={day.date.getTime()} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{day.total > 0 ? `$${Math.round(day.total)}` : ''}</Text>
                    <View style={styles.chartBarTrack}>
                      <View style={[styles.chartBar, { height: barHeight }]} />
                    </View>
                    <Text style={styles.chartLabel}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Top services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Services</Text>
          {topServices.length === 0 ? (
            <EmptyState variant="cards" icon="cut-outline" message="No bookings yet — top services will show up here." compact />
          ) : (
            <View style={styles.listCard}>
              {topServices.map((service, index) => (
                <View key={service.label} style={[styles.listRow, index === topServices.length - 1 && styles.listRowLast]}>
                  <Text style={styles.listRank}>{index + 1}</Text>
                  <Text style={styles.listLabel} numberOfLines={1}>
                    {service.label}
                  </Text>
                  <Text style={styles.listValue}>
                    {service.count} booking{service.count === 1 ? '' : 's'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Client stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clients</Text>
          <View style={styles.statTilesRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileValue}>{clientStats.total}</Text>
              <Text style={styles.statTileLabel}>Total clients</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileValue}>{clientStats.newThisMonth}</Text>
              <Text style={styles.statTileLabel}>New this month</Text>
            </View>
          </View>
        </View>

        {/* Appointment stats */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Appointments This Month</Text>
          <View style={styles.statTilesRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileValue}>{appointmentStats.totalThisMonth}</Text>
              <Text style={styles.statTileLabel}>Total</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileValue}>{appointmentStats.completed}</Text>
              <Text style={styles.statTileLabel}>Completed</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileValue}>{appointmentStats.upcoming}</Text>
              <Text style={styles.statTileLabel}>Upcoming</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: 'center',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  summaryCard: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  summaryColumn: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { width: 1, backgroundColor: Light.border },
  summaryLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  summaryAmount: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
    marginTop: 2,
  },
  summaryCount: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  summaryDetail: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  section: { marginBottom: Spacing.xl },
  lastSection: { marginBottom: 0 },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.md,
  },
  chartCard: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartColumn: { flex: 1, alignItems: 'center', gap: 4 },
  chartValue: {
    color: Light.textMuted,
    fontSize: 9,
    fontFamily: Typography.fontFamily.medium,
    height: 12,
  },
  chartBarTrack: {
    width: 18,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    minHeight: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal,
  },
  chartLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  listCard: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  listRowLast: { borderBottomWidth: 0 },
  listRank: {
    width: 20,
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  listLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  listValue: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  statTilesRow: { flexDirection: 'row', gap: Spacing.md },
  statTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    gap: 2,
  },
  statTileValue: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
  },
  statTileLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
});
