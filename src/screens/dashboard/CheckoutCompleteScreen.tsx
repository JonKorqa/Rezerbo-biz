import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckoutComplete'>;

export default function CheckoutCompleteScreen({ navigation, route }: Props) {
  const { amount, clientName } = route.params;

  const handleSendReceipt = () => {
    // TODO: wire up real receipt delivery (email/SMS) once available.
    Alert.alert('Receipt sent', `A receipt for $${amount.toFixed(2)} would be sent${clientName ? ` to ${clientName}` : ''}.`);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={64} color={Colors.success} />
        </View>
        <Text style={styles.title}>Checkout Complete</Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.receiptButton} activeOpacity={0.85} onPress={handleSendReceipt}>
          <Ionicons name="mail-outline" size={18} color={Colors.white} />
          <Text style={styles.receiptButtonLabel}>SEND RECEIPT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={handleBack}>
          <Text style={styles.backButtonLabel}>BACK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.heading,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  receiptButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
    letterSpacing: 0.5,
  },
  backButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
});
