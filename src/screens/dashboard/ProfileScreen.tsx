import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Linking,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import {
  addPortfolioImage,
  getBusiness,
  removePortfolioImage,
  saveBusinessCoverPhoto,
  saveBusinessPhoto,
  saveInstagramHandle,
} from '../../services/businesses';
import { uploadBusinessImage } from '../../services/imageUpload';
import { Button, ProgressBar } from '../../components/ui';
import { ShareProfileSheet } from '../../components/ShareProfileSheet';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

const GRID_GAP = Spacing.md;
const GRID_COLUMNS = 3;
const TILE_SIZE =
  (Dimensions.get('window').width - Spacing.xl * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const uid = auth.currentUser?.uid;

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [instagramInput, setInstagramInput] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const profileUrl = uid ? `rezervo://salon/${uid}` : '';

  const invalidateBusiness = () => queryClient.invalidateQueries({ queryKey: ['business', uid] });

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

  const handleUploadAvatar = () => {
    if (!uid) return;
    return uploadBusinessImage({
      uid,
      aspect: [1, 1],
      storagePath: `businesses/${uid}/avatar.jpg`,
      save: saveBusinessPhoto,
      setUploading: setUploadingAvatar,
      errorLabel: 'uploadAvatar',
      errorMessage: 'Could not upload profile photo. Please try again.',
      onSuccess: invalidateBusiness,
    });
  };

  const handleAddPortfolioPhoto = () => {
    if (!uid) return;
    return uploadBusinessImage({
      uid,
      aspect: [1, 1],
      storagePath: `businesses/${uid}/portfolio/${Date.now()}.jpg`,
      save: addPortfolioImage,
      setUploading: setUploadingPortfolio,
      errorLabel: 'addPortfolioPhoto',
      errorMessage: 'Could not upload photo. Please try again.',
      onSuccess: invalidateBusiness,
    });
  };

  const handleRemovePortfolioPhoto = (url: string) => {
    Alert.alert('Remove photo', 'Remove this photo from your portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!uid) return;
          try {
            await removePortfolioImage(uid, url);
            invalidateBusiness();
          } catch {
            Alert.alert('Error', 'Could not remove photo. Please try again.');
          }
        },
      },
    ]);
  };

  const openInstagramModal = () => {
    setInstagramInput(business?.instagramHandle ?? '');
    setShowInstagramModal(true);
  };

  const closeInstagramModal = () => setShowInstagramModal(false);

  const handleSaveInstagram = async () => {
    if (!uid) return;
    const handle = instagramInput.trim().replace(/^@/, '');
    if (!handle) return;
    try {
      await saveInstagramHandle(uid, handle);
      invalidateBusiness();
      closeInstagramModal();
    } catch {
      Alert.alert('Error', 'Could not save Instagram handle. Please try again.');
    }
  };

  const openInstagramProfile = () => {
    if (business?.instagramHandle) {
      Linking.openURL(`https://instagram.com/${business.instagramHandle}`);
    }
  };

  const handleComingSoon = (label: string) => {
    Alert.alert('Coming soon', `${label} is not built yet.`);
  };

  const handleStubNav = (title: string, icon: keyof typeof Ionicons.glyphMap) => {
    navigation.navigate('SettingsPlaceholder', { title, icon });
  };

  const portfolio = business?.portfolio ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrap}>
          {business?.coverPhotoUrl ? (
            <Image source={{ uri: business.coverPhotoUrl }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]} />
          )}

          <TouchableOpacity
            style={styles.addCoverButton}
            activeOpacity={0.85}
            onPress={handleUploadCover}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={15} color={Colors.white} />
                <Text style={styles.addCoverLabel}>Add Cover</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.coverActions}>
            <TouchableOpacity
              style={styles.coverIconButton}
              activeOpacity={0.85}
              onPress={() => handleStubNav('Public Profile Preview', 'eye-outline')}
            >
              <Ionicons name="eye-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              activeOpacity={0.85}
              onPress={() => setShowShareModal(true)}
            >
              <Ionicons name="qr-code-outline" size={15} color={Colors.white} />
              <Text style={styles.shareButtonLabel}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerBody}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.85}
            onPress={handleUploadAvatar}
            disabled={uploadingAvatar}
          >
            {business?.photoUrl ? (
              <Image source={{ uri: business.photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Ionicons name="storefront" size={30} color={Colors.teal} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="camera" size={13} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.ratingLabel}>n/a</Text>
          </View>

          <Text style={styles.businessName} numberOfLines={1}>
            {business?.businessName ?? 'Your Business'}
          </Text>

          {business?.instagramHandle ? (
            <TouchableOpacity style={styles.instagramChip} activeOpacity={0.7} onPress={openInstagramProfile}>
              <Ionicons name="logo-instagram" size={16} color={Colors.teal} />
              <Text style={styles.instagramHandle}>@{business.instagramHandle}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addInstagramChip} activeOpacity={0.7} onPress={openInstagramModal}>
              <Ionicons name="add" size={16} color={Colors.teal} />
              <Text style={styles.addInstagramLabel}>Add Instagram</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.progressCard}
            activeOpacity={0.8}
            onPress={() => handleStubNav('Completion Checklist', 'checkmark-circle-outline')}
          >
            <View style={styles.progressCardTop}>
              <View>
                <Text style={styles.progressLevel}>Novice</Text>
                <Text style={styles.progressLabel}>0 of 5 completed</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </View>
            <ProgressBar step={0} totalSteps={5} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.rowCard}
          activeOpacity={0.7}
          onPress={() => handleStubNav('Stats & Reports', 'bar-chart-outline')}
        >
          <View style={styles.rowCardIconWrap}>
            <Ionicons name="bar-chart-outline" size={20} color={Colors.teal} />
          </View>
          <View style={styles.rowCardBody}>
            <Text style={styles.rowCardTitle}>Stats & Reports</Text>
            <Text style={styles.rowCardDescription}>
              Important insights about your business and staff members
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowCard}
          activeOpacity={0.7}
          onPress={() => handleComingSoon('Social Media Marketing')}
        >
          <View style={styles.rowCardIconWrap}>
            <Ionicons name="share-social-outline" size={20} color={Colors.teal} />
          </View>
          <View style={styles.rowCardBody}>
            <Text style={styles.rowCardTitle}>Create a Social Post</Text>
            <Text style={styles.rowCardDescription}>Design and share it to promote your business</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <View style={styles.banner}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="referralGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Colors.tealLight} stopOpacity={1} />
                <Stop offset="1" stopColor={Colors.tealDark} stopOpacity={1} />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#referralGradient)" />
          </Svg>

          <View style={styles.bannerContent}>
            <View style={styles.bannerText}>
              <Text style={styles.bannerHeadline}>Refer a business, earn rewards</Text>
              <Text style={styles.bannerSubtext}>
                Invite other business owners to Rezervo and get rewarded when they join.
              </Text>
              <TouchableOpacity
                style={styles.bannerButton}
                activeOpacity={0.85}
                onPress={() => handleComingSoon('Share your link')}
              >
                <Text style={styles.bannerButtonLabel}>Share your link →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerIconWrap}>
              <Ionicons name="gift" size={24} color={Colors.white} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsPill}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('BusinessSettings')}
        >
          <Ionicons name="settings-outline" size={18} color={Colors.teal} />
          <Text style={styles.settingsPillLabel}>Settings</Text>
        </TouchableOpacity>

        <View style={styles.portfolioSection}>
          <Text style={styles.sectionTitle}>Portfolio</Text>

          <View style={styles.portfolioGrid}>
            <TouchableOpacity
              style={[styles.portfolioTile, styles.addTile]}
              activeOpacity={0.7}
              onPress={handleAddPortfolioPhoto}
              disabled={uploadingPortfolio}
            >
              {uploadingPortfolio ? (
                <ActivityIndicator color={Colors.teal} />
              ) : (
                <Ionicons name="add" size={28} color={Colors.teal} />
              )}
            </TouchableOpacity>

            {portfolio.map((url) => (
              <View key={url} style={styles.portfolioTile}>
                <Image source={{ uri: url }} style={styles.portfolioImage} />
                <TouchableOpacity
                  style={styles.portfolioDeleteBadge}
                  hitSlop={8}
                  onPress={() => handleRemovePortfolioPhoto(url)}
                >
                  <Ionicons name="close" size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {portfolio.length === 0 && (
            <Text style={styles.portfolioEmptyText}>
              Show off your best work — add photos of your space, your team, or finished results to
              attract new clients.
            </Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={showInstagramModal} transparent animationType="fade" onRequestClose={closeInstagramModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeInstagramModal} />
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Instagram</Text>
              <TouchableOpacity onPress={closeInstagramModal} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.instagramInputRow}>
              <Text style={styles.instagramAtPrefix}>@</Text>
              <TextInput
                style={styles.instagramInput}
                placeholder="yourbusiness"
                placeholderTextColor={Light.textMuted}
                value={instagramInput}
                onChangeText={setInstagramInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <Button label="Save" onPress={handleSaveInstagram} style={styles.instagramSaveButton} />
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ShareProfileSheet
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        businessName={business?.businessName ?? 'Your Business'}
        profileUrl={profileUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  scrollContent: { paddingBottom: Spacing['4xl'] },
  coverWrap: { width: '100%', height: 168 },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: Light.fieldBg },
  addCoverButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.overlay,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 34,
  },
  addCoverLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  coverActions: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  coverIconButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.overlay,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 34,
  },
  shareButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  headerBody: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: -40,
  },
  avatarWrap: { marginBottom: Spacing.sm },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Light.background,
  },
  avatarPlaceholder: {
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.teal,
    borderWidth: 2,
    borderColor: Light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  ratingLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  businessName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.sm,
  },
  instagramChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.lg,
  },
  instagramHandle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  addInstagramChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.lg,
  },
  addInstagramLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  progressCard: {
    width: '100%',
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  progressCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLevel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  progressLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Light.background,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  rowCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowCardBody: { flex: 1, paddingRight: Spacing.md, gap: 2 },
  rowCardTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  rowCardDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  banner: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  bannerText: { flex: 1, paddingRight: Spacing.md },
  bannerHeadline: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: 4,
  },
  bannerSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginBottom: Spacing.md,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  bannerButtonLabel: {
    color: Colors.tealDark,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    height: 40,
    marginBottom: Spacing['2xl'],
  },
  settingsPillLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  portfolioSection: { paddingHorizontal: Spacing.xl },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.md,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  portfolioTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  addTile: {
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioImage: { width: '100%', height: '100%' },
  portfolioDeleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioEmptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginTop: Spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  instagramInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.lg,
  },
  instagramAtPrefix: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  instagramInput: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  instagramSaveButton: { marginBottom: Spacing.sm },
});
