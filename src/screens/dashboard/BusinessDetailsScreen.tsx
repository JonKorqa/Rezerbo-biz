import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import {
  getBusiness,
  saveBusinessCoverPhoto,
  saveBusinessPhoto,
  updateBusiness,
} from '../../services/businesses';
import { uploadBusinessImage } from '../../services/imageUpload';
import { Button, FormInput } from '../../components/ui';
import { PRIMARY_CATEGORIES, OTHER_CATEGORIES, type BusinessCategory } from '../../constants/categories';
import { AMENITIES } from '../../constants/amenities';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { BusinessPolicies } from '../../types/business';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessDetails'>;

type SectionKey =
  | 'info'
  | 'social'
  | 'location'
  | 'amenities'
  | 'categories'
  | 'policies';

export default function BusinessDetailsScreen({ navigation }: Props) {
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const invalidateBusiness = () => queryClient.invalidateQueries({ queryKey: ['business', uid] });

  // Only sync local form state from the fetched business doc once — otherwise a refetch
  // triggered by saving one section would clobber unsaved edits in another section.
  const initialized = useRef(false);

  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);

  // Section 1 — Business Info
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [copyConfirmed, setCopyConfirmed] = useState(false);

  useEffect(() => {
    if (!business || initialized.current) return;
    initialized.current = true;
    setBusinessName(business.businessName ?? '');
    setPhone(business.phone ?? '');
    setBio(business.bio ?? '');
  }, [business]);

  const profileUrl = uid ? `rezervo://salon/${uid}` : '';

  const handleCopyLink = async () => {
    if (!profileUrl) return;
    await Clipboard.setStringAsync(profileUrl);
    setCopyConfirmed(true);
    setTimeout(() => setCopyConfirmed(false), 2000);
  };

  const handleSaveInfo = async () => {
    if (!uid) return;
    if (!businessName.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Business name and phone number are required.');
      return;
    }
    setSavingSection('info');
    try {
      await updateBusiness(uid, {
        businessName: businessName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });
      invalidateBusiness();
    } catch (err) {
      console.error('saveBusinessInfo (BusinessDetails) failed:', err);
      Alert.alert('Error', 'Could not save business info. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Section 1 — Business Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Info</Text>

            <FormInput
              label="Business name"
              icon="storefront-outline"
              placeholder="e.g. Glow Studio"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <FormInput
              label="Business phone number"
              icon="call-outline"
              placeholder="e.g. +383 44 123 456"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View>
              <Text style={styles.label}>Owner email</Text>
              <View style={styles.readOnlyField}>
                <Ionicons name="mail-outline" size={18} color={Light.textMuted} />
                <Text style={styles.readOnlyText}>{auth.currentUser?.email ?? '—'}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.label}>Link to your public profile</Text>
              <View style={styles.shareLinkRow}>
                <Text style={styles.shareLinkText} numberOfLines={1}>
                  {profileUrl}
                </Text>
                <TouchableOpacity style={styles.copyButton} activeOpacity={0.8} onPress={handleCopyLink}>
                  <Ionicons name={copyConfirmed ? 'checkmark' : 'copy-outline'} size={16} color={Colors.teal} />
                  <Text style={styles.copyButtonLabel}>{copyConfirmed ? 'Copied' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text style={styles.label}>Short description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell clients what makes your business special…"
                placeholderTextColor={Light.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
              />
            </View>

            <Button
              label="Save"
              onPress={handleSaveInfo}
              loading={savingSection === 'info'}
              style={styles.sectionSaveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  flex: { flex: 1 },
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
    marginHorizontal: Spacing.sm,
  },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['5xl'] },
  section: {
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.xs,
  },
  label: {
    color: Light.label,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 6,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  readOnlyText: {
    flex: 1,
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  shareLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  shareLinkText: {
    flex: 1,
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButtonLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  textArea: {
    minHeight: 90,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  sectionSaveButton: { marginTop: Spacing.xs },
});
