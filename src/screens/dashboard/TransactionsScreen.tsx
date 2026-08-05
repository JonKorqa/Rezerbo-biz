import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTransactions } from '../../hooks/useTransactions';
import { useClients } from '../../hooks/useClients';
import { getClientDisplayName } from '../../types/client';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { Transaction } from '../../types/transaction';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diffFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffFromMonday);
  return d;
}

function startOfMonth(date: Date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatGroupLabel(date: Date, now: Date) {
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function formatMethod(method: string) {
  return method.charAt(0).toUpperCase() + method.slice(1);
}

interface PeriodStat {
  total: number;
  count: number;
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
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onToggle}>
      <View style={styles.rowMain}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowClient}>{clientName}</Text>
          <Text style={styles.rowMeta}>
            {formatMethod(transaction.method)} · {formatTime(transaction.createdAt)}
          </Text>
        </View>
        <Text style={styles.rowAmount}>${transaction.amount.toFixed(2)}</Text>
      </View>
      {expanded && (
        <View style={styles.itemsBlock}>
          {transaction.items.length === 0 ? (
            <Text style={styles.itemMeta}>No itemized details for this charge.</Text>
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: clients = [] } = useClients();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of clients) {
      map.set(client.id, getClientDisplayName(client) || 'Client');
    }
    return map;
  }, [clients]);

  const summary = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const today: PeriodStat = { total: 0, count: 0 };
    const week: PeriodStat = { total: 0, count: 0 };
    const month: PeriodStat = { total: 0, count: 0 };
    for (const t of transactions) {
      if (t.createdAt >= monthStart) {
        month.total += t.amount;
        month.count += 1;
      }
      if (t.createdAt >= weekStart) {
        week.total += t.amount;
        week.count += 1;
      }
      if (t.createdAt >= todayStart) {
        today.total += t.amount;
        today.count += 1;
      }
    }
    return { today, week, month };
  }, [transactions]);

  const sections = useMemo(() => {
    const now = new Date();
    const groups = new Map<number, { label: string; data: Transaction[] }>();
    for (const t of transactions) {
      const key = startOfDay(t.createdAt).getTime();
      if (!groups.has(key)) {
        groups.set(key, { label: formatGroupLabel(t.createdAt, now), data: [] });
      }
      groups.get(key)!.data.push(t);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, value]) => ({ title: value.label, data: value.data, key: String(key) }));
  }, [transactions]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={styles.summaryAmount}>${summary.today.total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{summary.today.count} checkouts</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summaryAmount}>${summary.week.total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{summary.week.count} checkouts</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>${summary.month.total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{summary.month.count} checkouts</Text>
        </View>
      </View>

      {!isLoading && sections.length === 0 ? (
        <EmptyState variant="cards" icon="receipt-outline" message="No transactions yet. Checkouts you complete will show up here." />
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
              clientName={item.clientId ? clientNameById.get(item.clientId) ?? 'Client' : 'Walk-in'}
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
