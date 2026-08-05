import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../../hooks/useTransactions';
import { useClients } from '../../hooks/useClients';
import { getClientDisplayName } from '../../types/client';
import { EmptyState } from '../../components/EmptyState';
import { computeRevenueSummary, startOfDay } from '../../utils/stats';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';
import type { Transaction } from '../../types/transaction';

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function formatGroupLabel(date: Date, now: Date, locale: string, todayLabel: string, yesterdayLabel: string) {
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  if (diffDays === 0) return todayLabel;
  if (diffDays === 1) return yesterdayLabel;
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

function TransactionRow({
  transaction,
  clientName,
  expanded,
  onToggle,
}: {
  transaction: Transaction;
  clientName: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const methodLabel = t('paymentsAndCheckout.cash');
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onToggle}>
      <View style={styles.rowMain}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowClient}>{clientName}</Text>
          <Text style={styles.rowMeta}>
            {methodLabel} · {formatTime(transaction.createdAt, locale)}
          </Text>
        </View>
        <Text style={styles.rowAmount}>${transaction.amount.toFixed(2)}</Text>
      </View>
      {expanded && (
        <View style={styles.itemsBlock}>
          {transaction.items.length === 0 ? (
            <Text style={styles.itemMeta}>{t('transactions.noItemizedDetails')}</Text>
          ) : (
            transaction.items.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: clients = [] } = useClients();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of clients) {
      map.set(client.id, getClientDisplayName(client) || t('clients.defaultName'));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);

  const summary = useMemo(() => computeRevenueSummary(transactions), [transactions]);

  const sections = useMemo(() => {
    const now = new Date();
    const todayLabel = t('common.today');
    const yesterdayLabel = t('transactions.yesterday');
    const groups = new Map<number, { label: string; data: Transaction[] }>();
    for (const tx of transactions) {
      const key = startOfDay(tx.createdAt).getTime();
      if (!groups.has(key)) {
        groups.set(key, { label: formatGroupLabel(tx.createdAt, now, locale, todayLabel, yesterdayLabel), data: [] });
      }
      groups.get(key)!.data.push(tx);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, value]) => ({ title: value.label, data: value.data, key: String(key) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, locale]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('transactions.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>{t('common.today')}</Text>
          <Text style={styles.summaryAmount}>${summary.today.total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{t('transactions.checkoutsCount', { count: summary.today.count })}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>{t('transactions.thisWeek')}</Text>
          <Text style={styles.summaryAmount}>${summary.week.total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{t('transactions.checkoutsCount', { count: summary.week.count })}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>{t('transactions.thisMonth')}</Text>
          <Text style={styles.summaryAmount}>${summary.month.total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{t('transactions.checkoutsCount', { count: summary.month.count })}</Text>
        </View>
      </View>

      {!isLoading && sections.length === 0 ? (
        <EmptyState variant="cards" icon="receipt-outline" message={t('transactions.emptyMessage')} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              clientName={item.clientId ? clientNameById.get(item.clientId) ?? t('clients.defaultName') : t('newAppointment.walkIn')}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
            />
          )}
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
    flex: 1,
    textAlign: 'center',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
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
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  sectionHeader: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  row: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  rowLeft: { flex: 1, gap: 2 },
  rowClient: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  rowMeta: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  rowAmount: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
    textAlign: 'right',
  },
  itemsBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Light.border,
    gap: Spacing.xs,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: {
    flex: 1,
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  itemPrice: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  itemMeta: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
