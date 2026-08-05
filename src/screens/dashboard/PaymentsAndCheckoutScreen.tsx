import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../services/firebase';
import { getBusiness, updateBusiness } from '../../services/businesses';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

const PAYMENT_METHODS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; enabled: boolean }[] = [
  { key: 'cash', label: 'Cash', icon: 'cash-outline', enabled: true },
  { key: 'card', label: 'Card', icon: 'card-outline', enabled: false },
  { key: 'paypal', label: 'PayPal', icon: 'logo-paypal', enabled: false },
];

export default function PaymentsAndCheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [alwaysAskReceipt, setAlwaysAskReceipt] = useState(false);
  const [savingReceiptSetting, setSavingReceiptSetting] = useState(false);

  useEffect(() => {
    setAlwaysAskReceipt(business?.alwaysAskReceipt ?? false);
  }, [business?.alwaysAskReceipt]);

  const handleToggleReceiptSetting = async (value: boolean) => {
    if (!uid) return;
    setAlwaysAskReceipt(value);
    setSavingReceiptSetting(true);
    try {
      await updateBusiness(uid, { alwaysAskReceipt: value });
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
    } catch (err) {
      console.error('saveAlwaysAskReceipt failed:', err);
      setAlwaysAskReceipt(!value);
    } finally {
      setSavingReceiptSetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments & Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
        <View style={styles.card}>
          {PAYMENT_METHODS.map((method, index) => (
            <View
              key={method.key}
              style={[styles.methodRow, index === PAYMENT_METHODS.length - 1 && styles.rowLast]}
            >
              <View style={styles.rowIconWrap}>
                <Ionicons name={method.icon} size={18} color={method.enabled ? Colors.teal : Light.textMuted} />
              </View>
              <Text style={styles.methodLabel}>{method.label}</Text>
              {method.enabled ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeLabel}>Active</Text>
                </View>
              ) : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeLabel}>Coming soon</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Receipt Settings</Text>
        <View style={styles.card}>
          <View style={[styles.toggleRow, styles.rowLast]}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.methodLabel}>Always ask to send receipt</Text>
              <Text style={styles.toggleRowDescription}>
                Prompt after every checkout, instead of only showing the option
              </Text>
            </View>
            <Switch
              value={alwaysAskReceipt}
              onValueChange={handleToggleReceiptSetting}
              disabled={savingReceiptSetting}
              trackColor={{ false: Light.track, true: Colors.tealLight }}
              thumbColor={alwaysAskReceipt ? Colors.teal : Colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Transactions')}
        >
          <View style={[styles.methodRow, styles.rowLast]}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="receipt-outline" size={18} color={Colors.teal} />
            </View>
            <View style={styles.toggleRowBody}>
              <Text style={styles.methodLabel}>Transaction History</Text>
              <Text style={styles.toggleRowDescription}>View past checkouts and revenue</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </View>
        </TouchableOpacity>
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
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  toggleRowBody: { flex: 1, gap: 2 },
  toggleRowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  activeBadge: {
    backgroundColor: Light.fieldBgFocused,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  activeBadgeLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  soonBadge: {
    backgroundColor: Light.background,
    borderWidth: 1,
    borderColor: Light.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  soonBadgeLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
});
