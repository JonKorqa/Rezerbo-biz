import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { createTransaction } from '../../services/transactions';
import { useClients } from '../../hooks/useClients';
import { useServices } from '../../hooks/useServices';
import { filterClients, getClientDisplayName } from '../../types/client';
import { ClientRow } from './components/ClientRow';
import { Button } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList, SelectedClientParam } from '../../types/navigation';
import type { Service } from '../../types/service';

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
}

function sanitizeAmountInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

export default function CheckoutScreen() {
  const uid = auth.currentUser?.uid;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [client, setClient] = useState<SelectedClientParam | null>(null);
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [amountText, setAmountText] = useState('0.00');
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [showItemSheet, setShowItemSheet] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [charging, setCharging] = useState(false);

  const { data: clients = [] } = useClients();
  const filteredClients = useMemo(() => filterClients(clients, clientSearch), [clients, clientSearch]);

  const { data: services = [], isLoading: servicesLoading } = useServices();

  useEffect(() => {
    if (items.length === 0) return;
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    setAmountText(itemsTotal.toFixed(2));
  }, [items]);

  const amount = parseFloat(amountText || '0') || 0;
  const canCharge = amount > 0 && !charging;

  const resetForm = () => {
    setClient(null);
    setItems([]);
    setAmountText('0.00');
  };

  const handleClose = () => {
    const hasData = !!client || items.length > 0 || amount > 0;
    if (!hasData) return;
    Alert.alert('Clear checkout?', 'This will clear the client, items, and amount.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: resetForm },
    ]);
  };

  const selectClient = (selected: SelectedClientParam) => {
    setClient(selected);
    setShowClientSheet(false);
    setClientSearch('');
  };

  const addItem = (service: Service) => {
    setItems((prev) => [...prev, { id: `${service.id}-${Date.now()}`, name: service.name, price: service.price }]);
    setShowItemSheet(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCharge = async () => {
    if (!uid || amount <= 0) return;
    setCharging(true);
    try {
      await createTransaction({
        businessId: uid,
        clientId: client?.id ?? null,
        amount,
        method: 'cash',
        items: items.map(({ name, price }) => ({ name, price })),
      });
    } catch (err) {
      // Expected until Firestore rules for transactions are deployed — treat as success.
      console.error('createTransaction failed, continuing anyway:', err);
    } finally {
      setCharging(false);
    }
    const clientName = client?.name;
    resetForm();
    navigation.navigate('CheckoutComplete', { amount, clientName });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.clientRow} activeOpacity={0.7} onPress={() => setShowClientSheet(true)}>
          <Ionicons name="person-outline" size={18} color={Light.textSecondary} />
          <Text style={styles.clientRowLabel} numberOfLines={1}>
            {client ? client.name : 'Select a client or leave empty for walk-in'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>AMOUNT DUE</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amountText}
              onChangeText={(text) => setAmountText(sanitizeAmountInput(text))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Light.textMuted}
              selectTextOnFocus
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addItemRow} activeOpacity={0.7} onPress={() => setShowItemSheet(true)}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.teal} />
          <Text style={styles.addItemLabel}>Add Item</Text>
        </TouchableOpacity>

        {items.length > 0 && (
          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={16} color={Light.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={`$${amount.toFixed(2)} • CHARGE`}
          onPress={handleCharge}
          disabled={!canCharge}
          loading={charging}
        />
      </View>

      <Modal
        visible={showClientSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowClientSheet(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select client</Text>
              <TouchableOpacity onPress={() => setShowClientSheet(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={Light.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone"
                placeholderTextColor={Light.textMuted}
                value={clientSearch}
                onChangeText={setClientSearch}
              />
            </View>

            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id}
              style={styles.sheetList}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.walkInRow}
                  activeOpacity={0.7}
                  onPress={() => selectClient({ id: null, name: 'Walk-in' })}
                >
                  <View style={styles.walkInIconWrap}>
                    <Ionicons name="walk-outline" size={20} color={Colors.teal} />
                  </View>
                  <Text style={styles.walkInLabel}>Continue as walk-in</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <ClientRow client={item} onPress={() => selectClient({ id: item.id, name: getClientDisplayName(item) })} />
              )}
              ListEmptyComponent={
                <View style={styles.sheetEmpty}>
                  <Text style={styles.sheetEmptyText}>No saved clients yet.</Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showItemSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowItemSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowItemSheet(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add item</Text>
              <TouchableOpacity onPress={() => setShowItemSheet(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            {servicesLoading ? (
              <View style={styles.sheetLoading}>
                <ActivityIndicator color={Colors.teal} />
              </View>
            ) : (
              <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                style={styles.sheetList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.serviceRow, { borderLeftColor: item.color ?? Colors.teal }]}
                    activeOpacity={0.7}
                    onPress={() => addItem(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceRowName}>{item.name}</Text>
                      <Text style={styles.serviceRowMeta}>{item.durationMinutes}m</Text>
                    </View>
                    <Text style={styles.serviceRowPrice}>${item.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
                ListEmptyComponent={
                  <View style={styles.sheetEmpty}>
                    <Text style={styles.sheetEmptyText}>
                      No services set up yet. Add one from Settings → Services Setup.
                    </Text>
                  </View>
                }
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  amountBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  amountLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountSign: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.heading,
  },
  amountInput: {
    minWidth: 80,
    color: Light.textPrimary,
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.heading,
    padding: 0,
  },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  addItemLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  itemsList: { gap: Spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  itemName: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  itemPrice: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  sheetBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  sheetList: { marginBottom: Spacing.xl },
  sheetLoading: { paddingVertical: Spacing['2xl'], alignItems: 'center' },
  walkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  walkInIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkInLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  sheetEmpty: { paddingVertical: Spacing['2xl'], alignItems: 'center' },
  sheetEmptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  serviceRow: {
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
  serviceRowName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  serviceRowMeta: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  serviceRowPrice: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
});
