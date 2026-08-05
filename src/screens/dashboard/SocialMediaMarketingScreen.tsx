import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Platform, Alert, Modal, Pressable, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { getBusiness } from '../../services/businesses';
import { useServices } from '../../hooks/useServices';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { Service } from '../../types/service';

// No backend posting — every tile here just builds a caption and hands off to the
// device's native Share sheet. Owner picks Instagram/Facebook/Messages/etc. themselves.

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

interface MarketingTile {
  key: string;
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TILES: MarketingTile[] = [
  { key: 'booking-link', titleKey: 'socialMediaMarketing.tiles.bookingLink', icon: 'link-outline' },
  { key: 'quick-shares', titleKey: 'socialMediaMarketing.tiles.quickShares', icon: 'flash-outline' },
  { key: 'holidays', titleKey: 'socialMediaMarketing.tiles.holidays', icon: 'gift-outline' },
  { key: 'encourage-bookings', titleKey: 'socialMediaMarketing.tiles.encourageBookings', icon: 'calendar-outline' },
  { key: 'portfolio', titleKey: 'socialMediaMarketing.tiles.portfolio', icon: 'images-outline' },
  { key: 'reviews', titleKey: 'socialMediaMarketing.tiles.reviews', icon: 'star-outline' },
  { key: 'quotes', titleKey: 'socialMediaMarketing.tiles.quotes', icon: 'chatbubble-ellipses-outline' },
  { key: 'business-info', titleKey: 'socialMediaMarketing.tiles.businessInfo', icon: 'information-circle-outline' },
  { key: 'services', titleKey: 'socialMediaMarketing.tiles.services', icon: 'pricetag-outline' },
];

async function shareText(message: string, url?: string) {
  try {
    await Share.share(Platform.OS === 'ios' && url ? { message, url } : { message: url ? `${message} ${url}` : message });
  } catch {
    // Share sheet dismissed or unavailable — nothing to recover from.
  }
}

export default function SocialMediaMarketingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });
  const { data: services = [] } = useServices();

  const [portfolioPickerVisible, setPortfolioPickerVisible] = useState(false);
  const [servicePickerVisible, setServicePickerVisible] = useState(false);

  const profileUrl = uid ? `rezervo://salon/${uid}` : '';
  const businessName = business?.businessName ?? t('importInvite.defaultBusinessName');

  const shareTemplate = (templatesKey: string) => {
    const templates = t(templatesKey, { returnObjects: true }) as string[];
    const message = pickRandom(templates).replace('{link}', profileUrl);
    shareText(message);
  };

  const handleShareBookingLink = () => {
    shareText(t('socialMediaMarketing.bookingLinkMessage', { businessName }), profileUrl);
  };

  const handleSharePortfolio = () => {
    if (!business?.portfolio || business.portfolio.length === 0) {
      Alert.alert(t('socialMediaMarketing.noPortfolioTitle'), t('socialMediaMarketing.noPortfolioMessage'));
      return;
    }
    setPortfolioPickerVisible(true);
  };

  const handlePickPortfolioPhoto = (url: string) => {
    setPortfolioPickerVisible(false);
    shareText(t('socialMediaMarketing.portfolioMessage', { businessName }), url);
  };

  const handleShareBusinessInfo = () => {
    const categories = business?.categories?.length
      ? business.categories.join(', ')
      : business?.category ?? '';
    const address = business?.location?.address;
    const lines = [businessName, categories, address].filter(Boolean);
    shareText(`${lines.join(' — ')}\n${t('socialMediaMarketing.bookNow')}: ${profileUrl}`);
  };

  const handlePromoteServices = () => {
    if (services.length === 0) {
      Alert.alert(t('socialMediaMarketing.noServicesTitle'), t('socialMediaMarketing.noServicesMessage'));
      return;
    }
    setServicePickerVisible(true);
  };

  const handlePickService = (service: Service) => {
    setServicePickerVisible(false);
    shareText(t('socialMediaMarketing.serviceMessage', { serviceName: service.name }), profileUrl);
  };

  const handleTilePress = (key: string) => {
    switch (key) {
      case 'booking-link':
        return handleShareBookingLink();
      case 'quick-shares':
        return shareTemplate('socialMediaMarketing.templates.quickShares');
      case 'holidays':
        return shareTemplate('socialMediaMarketing.templates.holidays');
      case 'encourage-bookings':
        return shareTemplate('socialMediaMarketing.templates.encourageBookings');
      case 'portfolio':
        return handleSharePortfolio();
      case 'reviews':
        return shareTemplate('socialMediaMarketing.templates.reviews');
      case 'quotes':
        return shareTemplate('socialMediaMarketing.templates.quotes');
      case 'business-info':
        return handleShareBusinessInfo();
      case 'services':
        return handlePromoteServices();
      default:
        return undefined;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('socialMediaMarketing.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {t('socialMediaMarketing.subtitle')}
        </Text>

        <View style={styles.grid}>
          {TILES.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={styles.tile}
              activeOpacity={0.85}
              onPress={() => handleTilePress(tile.key)}
            >
              <View style={styles.tileIconWrap}>
                <Ionicons name={tile.icon} size={22} color={Colors.teal} />
              </View>
              <Text style={styles.tileLabel}>{t(tile.titleKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={portfolioPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPortfolioPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPortfolioPickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('socialMediaMarketing.choosePhoto')}</Text>
              <TouchableOpacity onPress={() => setPortfolioPickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={business?.portfolio ?? []}
              keyExtractor={(url) => url}
              numColumns={3}
              columnWrapperStyle={styles.portfolioRow}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.8} onPress={() => handlePickPortfolioPhoto(item)}>
                  <Image source={{ uri: item }} style={styles.portfolioThumb} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={servicePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setServicePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setServicePickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('servicePicker.title')}</Text>
              <TouchableOpacity onPress={() => setServicePickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.serviceRow} activeOpacity={0.7} onPress={() => handlePickService(item)}>
                  <Text style={styles.serviceRowLabel}>{item.name}</Text>
                  <Text style={styles.serviceRowPrice}>${item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
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
    flex: 1,
    textAlign: 'center',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tile: {
    width: '47%',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    maxHeight: '70%',
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
  portfolioRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
  portfolioThumb: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  serviceRowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  serviceRowPrice: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
});
