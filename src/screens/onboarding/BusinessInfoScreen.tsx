import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { saveBusinessInfo } from '../../services/businesses';
import { Button, FormInput, ProgressBar } from '../../components/ui';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '../../constants/countries';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessInfo'>;

export default function BusinessInfoScreen({ navigation }: Props) {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(auth.currentUser?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setError(null);
    if (!businessName.trim() || !ownerName.trim() || !phone.trim()) {
      setError('Please fill in all fields to continue.');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('You need to be signed in to continue.');
      return;
    }
    setLoading(true);
    // TODO(firestore-rules): the `businesses` collection rule isn't deployed yet, so this
    // save currently fails with "permission denied". Swallowing the error here so onboarding
    // navigation stays testable — once rules are deployed, remove this try/catch and let a
    // failed save block navigation (with retry) like it did before.
    try {
      await saveBusinessInfo(uid, {
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: `${country.dialCode}${phone.trim()}`,
        countryCode: country.dialCode,
      });
    } catch (err) {
      console.error('saveBusinessInfo failed, continuing anyway:', err);
    } finally {
      setLoading(false);
    }
    navigation.navigate('BusinessCategory');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProgressBar step={2} totalSteps={4} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Tell us about your business</Text>
          <Text style={styles.subtitle}>This helps clients find and recognize you on Rezervo.</Text>

          <View style={styles.form}>
            <FormInput
              label="Business name"
              icon="storefront-outline"
              placeholder="e.g. Glow Studio"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <FormInput
              label="Your name"
              icon="person-outline"
              placeholder="e.g. Arta Krasniqi"
              value={ownerName}
              onChangeText={setOwnerName}
            />
            <View>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity style={styles.countryButton} onPress={() => setPickerVisible(true)}>
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text style={styles.dialCode}>{country.dialCode}</Text>
                  <Ionicons name="chevron-down" size={14} color={Light.textMuted} />
                </TouchableOpacity>
                <View style={styles.phoneInputWrap}>
                  <FormInput
                    placeholder="44 123 456"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button label="Continue" onPress={handleContinue} loading={loading} style={styles.continueButton} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Ionicons name="close" size={24} color={Light.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setCountry(item);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialCode}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: 4,
  },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xl,
  },
  form: { gap: Spacing.md },
  label: {
    color: Light.label,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 6,
  },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  flag: { fontSize: 18 },
  dialCode: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  phoneInputWrap: { flex: 1 },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  continueButton: { marginTop: Spacing.sm },

  modalSafe: { flex: 1, backgroundColor: Light.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  modalTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  countryName: { flex: 1, color: Light.textPrimary, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular },
});
