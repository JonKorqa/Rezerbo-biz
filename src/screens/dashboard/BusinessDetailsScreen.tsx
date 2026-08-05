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
import { BUSINESS_CATEGORIES, type BusinessCategory } from '../../constants/categories';
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

function CategoryTile({
  category,
  selected,
  onPress,
}: {
  category: BusinessCategory;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.categoryTile, selected && styles.categoryTileSelected]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.categoryTileIconWrap, selected && styles.categoryTileIconWrapSelected]}>
        <Ionicons name={category.icon} size={20} color={selected ? Colors.white : Colors.teal} />
      </View>
      <Text style={[styles.categoryTileLabel, selected && styles.categoryTileLabelSelected]}>
        {category.label.en}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={16} color={Colors.teal} style={styles.categoryCheck} />}
    </TouchableOpacity>
  );
}

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

  // Section 2 — Social Media
  const [instagramHandle, setInstagramHandle] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [onlineShopUrl, setOnlineShopUrl] = useState('');
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Section 3 — Profile Images
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Section 4 — Location & Mobile Services
  const [offersMobileServices, setOffersMobileServices] = useState(false);
  const [mobileServiceArea, setMobileServiceArea] = useState('');

  // Section 5 — Amenities
  const [amenities, setAmenities] = useState<string[]>([]);

  // Section 6 — Business Category
  const [categories, setCategories] = useState<string[]>([]);

  // Section 7 — Policies & Safety
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [noWaitingArea, setNoWaitingArea] = useState(false);
  const [noWaitingAreaNote, setNoWaitingAreaNote] = useState('');
  const [noOutsideGuests, setNoOutsideGuests] = useState(false);
  const [noOutsideGuestsNote, setNoOutsideGuestsNote] = useState('');
  const [healthSafetyRules, setHealthSafetyRules] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  useEffect(() => {
    if (!business || initialized.current) return;
    initialized.current = true;
    setBusinessName(business.businessName ?? '');
    setPhone(business.phone ?? '');
    setBio(business.bio ?? '');
    setInstagramHandle(business.instagramHandle ?? '');
    setFacebookUrl(business.facebookUrl ?? '');
    setWebsiteUrl(business.websiteUrl ?? '');
    setOnlineShopUrl(business.onlineShopUrl ?? '');
    setOffersMobileServices(business.offersMobileServices ?? false);
    setMobileServiceArea(business.mobileServiceArea ?? '');
    setAmenities(business.amenities ?? []);
    setCategories(business.categories ?? (business.category ? [business.category] : []));
    const policies = business.policies;
    setCancellationPolicy(policies?.cancellationPolicy ?? '');
    setNoWaitingArea(policies?.noWaitingArea ?? false);
    setNoWaitingAreaNote(policies?.noWaitingAreaNote ?? '');
    setNoOutsideGuests(policies?.noOutsideGuests ?? false);
    setNoOutsideGuestsNote(policies?.noOutsideGuestsNote ?? '');
    setHealthSafetyRules(policies?.healthSafetyRules ?? '');
    setAdditionalDetails(policies?.additionalDetails ?? '');
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

  const normalizeUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const isValidUrl = (value: string): boolean => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(value);

  const handleSaveSocial = async () => {
    if (!uid) return;
    const normalizedWebsite = normalizeUrl(websiteUrl);
    if (normalizedWebsite && !isValidUrl(normalizedWebsite)) {
      setWebsiteError('Enter a valid website URL.');
      return;
    }
    setWebsiteError(null);
    setSavingSection('social');
    try {
      await updateBusiness(uid, {
        instagramHandle: instagramHandle.trim().replace(/^@/, ''),
        facebookUrl: facebookUrl.trim(),
        websiteUrl: normalizedWebsite,
        onlineShopUrl: onlineShopUrl.trim(),
      });
      setWebsiteUrl(normalizedWebsite);
      invalidateBusiness();
    } catch (err) {
      console.error('saveSocialLinks failed:', err);
      Alert.alert('Error', 'Could not save social media links. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleUploadAvatar = () => {
    if (!uid) return;
    return uploadBusinessImage({
      uid,
      aspect: [1, 1],
      storagePath: `businesses/${uid}/avatar.jpg`,
      save: saveBusinessPhoto,
      setUploading: setUploadingAvatar,
      errorLabel: 'uploadAvatar',
      errorMessage: 'Could not upload logo. Please try again.',
      onSuccess: invalidateBusiness,
    });
  };

  const handleUploadCover = () => {
    if (!uid) return;
    return uploadBusinessImage({
      uid,
      aspect: [16, 9],
      storagePath: `businesses/${uid}/cover.jpg`,
      save: saveBusinessCoverPhoto,
      setUploading: setUploadingCover,
      errorLabel: 'uploadCover',
      errorMessage: 'Could not upload cover photo. Please try again.',
      onSuccess: invalidateBusiness,
    });
  };

  const portfolioCount = business?.portfolio?.length ?? 0;

  const handleSaveMobileServices = async () => {
    if (!uid) return;
    setSavingSection('location');
    try {
      await updateBusiness(uid, {
        offersMobileServices,
        mobileServiceArea: offersMobileServices ? mobileServiceArea.trim() : '',
      });
      invalidateBusiness();
    } catch (err) {
      console.error('saveMobileServices failed:', err);
      Alert.alert('Error', 'Could not save mobile services settings. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const locationSummary = business?.location?.address
    ? [business.location.address, business.location.unit].filter(Boolean).join(', ')
    : 'No location set yet';

  const toggleInArray = (list: string[], key: string): string[] =>
    list.includes(key) ? list.filter((item) => item !== key) : [...list, key];

  const handleSaveAmenities = async () => {
    if (!uid) return;
    setSavingSection('amenities');
    try {
      await updateBusiness(uid, { amenities });
      invalidateBusiness();
    } catch (err) {
      console.error('saveAmenities failed:', err);
      Alert.alert('Error', 'Could not save amenities. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCategories = async () => {
    if (!uid) return;
    if (categories.length === 0) {
      Alert.alert('Pick at least one category', 'Choose the categories that best describe your business.');
      return;
    }
    setSavingSection('categories');
    try {
      await updateBusiness(uid, { categories });
      invalidateBusiness();
    } catch (err) {
      console.error('saveBusinessCategories failed:', err);
      Alert.alert('Error', 'Could not save categories. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePolicies = async () => {
    if (!uid) return;
    setSavingSection('policies');
    const policies: BusinessPolicies = {
      cancellationPolicy: cancellationPolicy.trim(),
      noWaitingArea,
      noWaitingAreaNote: noWaitingArea ? noWaitingAreaNote.trim() : '',
      noOutsideGuests,
      noOutsideGuestsNote: noOutsideGuests ? noOutsideGuestsNote.trim() : '',
      healthSafetyRules: healthSafetyRules.trim(),
      additionalDetails: additionalDetails.trim(),
    };
    try {
      await updateBusiness(uid, { policies });
      invalidateBusiness();
    } catch (err) {
      console.error('savePolicies failed:', err);
      Alert.alert('Error', 'Could not save policies. Please try again.');
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

          {/* Section 2 — Social Media */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media</Text>

            <FormInput
              label="Instagram handle"
              icon="logo-instagram"
              placeholder="yourbusiness"
              autoCapitalize="none"
              autoCorrect={false}
              value={instagramHandle}
              onChangeText={setInstagramHandle}
            />
            <FormInput
              label="Facebook page URL or handle"
              icon="logo-facebook"
              placeholder="e.g. facebook.com/yourbusiness"
              autoCapitalize="none"
              autoCorrect={false}
              value={facebookUrl}
              onChangeText={setFacebookUrl}
            />
            <FormInput
              label="Website URL"
              icon="globe-outline"
              placeholder="e.g. www.yourbusiness.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              value={websiteUrl}
              onChangeText={(text) => {
                setWebsiteUrl(text);
                if (websiteError) setWebsiteError(null);
              }}
              error={websiteError ?? undefined}
            />
            <FormInput
              label="Online shop URL"
              icon="bag-outline"
              placeholder="e.g. shop.yourbusiness.com"
              autoCapitalize="none"
              autoCorrect={false}
              value={onlineShopUrl}
              onChangeText={setOnlineShopUrl}
            />

            <Button
              label="Save"
              onPress={handleSaveSocial}
              loading={savingSection === 'social'}
              style={styles.sectionSaveButton}
            />
          </View>

          {/* Section 3 — Profile Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Images</Text>

            <View style={styles.imagesRow}>
              <TouchableOpacity
                style={styles.avatarPicker}
                activeOpacity={0.85}
                onPress={handleUploadAvatar}
                disabled={uploadingAvatar}
              >
                {business?.photoUrl ? (
                  <Image source={{ uri: business.photoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarImage, styles.imagePlaceholder]}>
                    <Ionicons name="storefront-outline" size={22} color={Colors.teal} />
                  </View>
                )}
                <View style={styles.imageEditBadge}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="camera" size={12} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.imagePickerLabel}>Logo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.coverPicker}
                activeOpacity={0.85}
                onPress={handleUploadCover}
                disabled={uploadingCover}
              >
                {business?.coverPhotoUrl ? (
                  <Image source={{ uri: business.coverPhotoUrl }} style={styles.coverImage} />
                ) : (
                  <View style={[styles.coverImage, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={22} color={Colors.teal} />
                  </View>
                )}
                <View style={styles.imageEditBadge}>
                  {uploadingCover ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="camera" size={12} color={Colors.white} />
                  )}
                </View>
                <Text style={styles.imagePickerLabel}>Cover Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Dashboard', { screen: 'Profile' })}
            >
              <View style={styles.linkRowIconWrap}>
                <Ionicons name="images-outline" size={20} color={Colors.teal} />
              </View>
              <View style={styles.linkRowBody}>
                <Text style={styles.linkRowTitle}>Workplace Photos</Text>
                <Text style={styles.linkRowDescription}>
                  {portfolioCount > 0
                    ? `${portfolioCount} photo${portfolioCount === 1 ? '' : 's'} in your portfolio`
                    : 'Add photos of your space, team, or results'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section 4 — Location & Mobile Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Mobile Services</Text>

            <View style={styles.linkRow}>
              <View style={styles.linkRowIconWrap}>
                <Ionicons name="location-outline" size={20} color={Colors.teal} />
              </View>
              <View style={styles.linkRowBody}>
                <Text style={styles.linkRowTitle}>Business Address</Text>
                <Text style={styles.linkRowDescription} numberOfLines={2}>
                  {locationSummary}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editChip}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BusinessLocation')}
              >
                <Text style={styles.editChipLabel}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleRowBody}>
                <Text style={styles.toggleRowTitle}>I also offer mobile services</Text>
                <Text style={styles.toggleRowDescription}>
                  Let clients know you can come to them
                </Text>
              </View>
              <Switch
                value={offersMobileServices}
                onValueChange={setOffersMobileServices}
                trackColor={{ false: Light.track, true: Colors.tealLight }}
                thumbColor={offersMobileServices ? Colors.teal : Colors.white}
              />
            </View>

            {offersMobileServices && (
              <View>
                <Text style={styles.label}>Service area</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. I travel within 15km of Prishtina"
                  placeholderTextColor={Light.textMuted}
                  value={mobileServiceArea}
                  onChangeText={setMobileServiceArea}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            <Button
              label="Save"
              onPress={handleSaveMobileServices}
              loading={savingSection === 'location'}
              style={styles.sectionSaveButton}
            />
          </View>

          {/* Section 5 — Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <Text style={styles.sectionSubtitle}>Let clients know what to expect at your business.</Text>

            {AMENITIES.map((amenity) => {
              const enabled = amenities.includes(amenity.key);
              return (
                <View key={amenity.key} style={styles.amenityRow}>
                  <View style={styles.amenityIconWrap}>
                    <Ionicons name={amenity.icon} size={18} color={Colors.teal} />
                  </View>
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                  <Switch
                    value={enabled}
                    onValueChange={() => setAmenities((prev) => toggleInArray(prev, amenity.key))}
                    trackColor={{ false: Light.track, true: Colors.tealLight }}
                    thumbColor={enabled ? Colors.teal : Colors.white}
                  />
                </View>
              );
            })}

            <Button
              label="Save"
              onPress={handleSaveAmenities}
              loading={savingSection === 'amenities'}
              style={styles.sectionSaveButton}
            />
          </View>

          {/* Section 6 — Business Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Category</Text>
            <Text style={styles.sectionSubtitle}>Select all categories that apply to your business.</Text>

            <View style={styles.categoryGrid}>
              {BUSINESS_CATEGORIES.map((category) => (
                <CategoryTile
                  key={category.key}
                  category={category}
                  selected={categories.includes(category.key)}
                  onPress={() => setCategories((prev) => toggleInArray(prev, category.key))}
                />
              ))}
            </View>

            <Button
              label="Save"
              onPress={handleSaveCategories}
              loading={savingSection === 'categories'}
              style={styles.sectionSaveButton}
            />
          </View>

          {/* Section 7 — Policies & Safety */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>Policies & Safety</Text>

            <View>
              <Text style={styles.label}>Cancellation policy</Text>
              <TextInput
                style={styles.textArea}
                placeholder="e.g. Cancel or reschedule at least 24 hours in advance"
                placeholderTextColor={Light.textMuted}
                value={cancellationPolicy}
                onChangeText={setCancellationPolicy}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleRowBody}>
                <Text style={styles.toggleRowTitle}>No waiting area</Text>
              </View>
              <Switch
                value={noWaitingArea}
                onValueChange={setNoWaitingArea}
                trackColor={{ false: Light.track, true: Colors.tealLight }}
                thumbColor={noWaitingArea ? Colors.teal : Colors.white}
              />
            </View>
            {noWaitingArea && (
              <FormInput
                placeholder="Optional note for clients"
                value={noWaitingAreaNote}
                onChangeText={setNoWaitingAreaNote}
              />
            )}

            <View style={styles.toggleRow}>
              <View style={styles.toggleRowBody}>
                <Text style={styles.toggleRowTitle}>No outside guests</Text>
              </View>
              <Switch
                value={noOutsideGuests}
                onValueChange={setNoOutsideGuests}
                trackColor={{ false: Light.track, true: Colors.tealLight }}
                thumbColor={noOutsideGuests ? Colors.teal : Colors.white}
              />
            </View>
            {noOutsideGuests && (
              <FormInput
                placeholder="Optional note for clients"
                value={noOutsideGuestsNote}
                onChangeText={setNoOutsideGuestsNote}
              />
            )}

            <View>
              <Text style={styles.label}>Health & safety rules</Text>
              <TextInput
                style={styles.textArea}
                placeholder="e.g. Masks optional, please arrive on time"
                placeholderTextColor={Light.textMuted}
                value={healthSafetyRules}
                onChangeText={setHealthSafetyRules}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View>
              <Text style={styles.label}>Additional details</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Anything else clients should know before booking"
                placeholderTextColor={Light.textMuted}
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
                multiline
                textAlignVertical="top"
              />
            </View>

            <Button
              label="Save"
              onPress={handleSavePolicies}
              loading={savingSection === 'policies'}
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
  lastSection: { borderBottomWidth: 0 },
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
  imagesRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  avatarPicker: { alignItems: 'center', gap: 6 },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  coverPicker: { flex: 1, alignItems: 'center', gap: 6 },
  coverImage: {
    width: '100%',
    height: 64,
    borderRadius: Radius.md,
  },
  imagePlaceholder: {
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: 20,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.teal,
    borderWidth: 2,
    borderColor: Light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    padding: Spacing.md,
  },
  linkRowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRowBody: { flex: 1, gap: 2 },
  linkRowTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  linkRowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  editChip: {
    borderWidth: 1.5,
    borderColor: Colors.teal,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  editChipLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  toggleRowBody: { flex: 1, gap: 2 },
  toggleRowTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  toggleRowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  sectionSubtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: -Spacing.sm,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  amenityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryTile: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  categoryTileSelected: {
    borderColor: Colors.teal,
    backgroundColor: Light.fieldBgFocused,
  },
  categoryTileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTileIconWrapSelected: { backgroundColor: Colors.teal },
  categoryTileLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  categoryTileLabelSelected: { fontFamily: Typography.fontFamily.bold },
  categoryCheck: { marginLeft: -Spacing.xs },
});
