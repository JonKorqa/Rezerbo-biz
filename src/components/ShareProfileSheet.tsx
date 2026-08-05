import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Share,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Light } from '../theme/light';

const QR_SIZE = 200;

interface ShareProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  businessName: string;
  profileUrl: string;
}

export function ShareProfileSheet({ visible, onClose, businessName, profileUrl }: ShareProfileSheetProps) {
  const { t } = useTranslation();
  const qrRef = useRef<View>(null);
  const [copyConfirmed, setCopyConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(profileUrl);
    setCopyConfirmed(true);
    setTimeout(() => setCopyConfirmed(false), 2000);
  };

  const handleShareLink = async () => {
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: t('shareProfile.bookWithMessage', { businessName }), url: profileUrl }
          : { message: `${t('shareProfile.bookWithMessage', { businessName })}: ${profileUrl}` },
      );
    } catch {
      // Share sheet dismissed or unavailable — nothing to recover from.
    }
  };

  const handleSaveQr = async () => {
    if (!qrRef.current) return;
    setSaving(true);
    try {
      const permission = await requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(t('shareProfile.permissionNeededTitle'), t('shareProfile.permissionNeededMessage'));
        return;
      }
      const uri = await captureRef(qrRef, { format: 'png', quality: 1 });
      await Asset.create(uri);
      Alert.alert(t('shareProfile.savedTitle'), t('shareProfile.savedMessage'));
    } catch {
      Alert.alert(t('common.error'), t('shareProfile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.shareProfile')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Light.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.urlPreview} numberOfLines={1}>
            {profileUrl}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={handleCopyLink}>
              <Ionicons name={copyConfirmed ? 'checkmark' : 'copy-outline'} size={18} color={Colors.teal} />
              <Text style={styles.actionLabel}>{copyConfirmed ? t('shareProfile.linkCopied') : t('shareProfile.copyLink')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={handleShareLink}>
              <Ionicons name="share-social-outline" size={18} color={Colors.teal} />
              <Text style={styles.actionLabel}>{t('shareProfile.shareLink')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.qrWrap}>
            <View ref={qrRef} collapsable={false} style={styles.qrCard}>
              <QRCode value={profileUrl} size={QR_SIZE} backgroundColor={Colors.white} color={Light.textPrimary} />
              <Text style={styles.qrCaption}>{t('shareProfile.scanToBook')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSaveQr}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={Colors.white} />
                <Text style={styles.saveButtonLabel}>{t('shareProfile.saveQrCode')}</Text>
              </>
            )}
          </TouchableOpacity>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  businessName: {
    alignSelf: 'flex-start',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 4,
  },
  urlPreview: {
    alignSelf: 'flex-start',
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    borderRadius: Radius.lg,
    height: 44,
  },
  actionLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  qrWrap: {
    marginBottom: Spacing.xl,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    gap: Spacing.sm,
  },
  qrCaption: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    height: 52,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
  },
});
