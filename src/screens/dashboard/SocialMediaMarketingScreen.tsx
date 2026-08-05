import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Platform, Alert, Modal, Pressable, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
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

const QUICK_SHARE_TEMPLATES = [
  'We have appointments available this week — grab your spot! {link}',
  'Treat yourself today. Book your next appointment here: {link}',
  "Spots are filling up fast — book now before they're gone! {link}",
];

const HOLIDAY_TEMPLATES = [
  "🎄 The holidays are almost here — book your appointment before we're fully booked! {link}",
  '🎉 New year, new look! Book your first appointment of the year: {link}',
  "❤️ Treat yourself or someone you love — book an appointment: {link}",
  '☀️ Summer is here! Book your appointment and get ready to shine: {link}',
];

const ENCOURAGE_BOOKING_TEMPLATES = [
  "It's been a while! Let's get you back in the chair — book your next visit: {link}",
  "Don't wait too long between visits — book your next appointment today: {link}",
  'Your next appointment is one tap away: {link}',
];

const REVIEW_TEMPLATES = [
  "Loved your last visit? We'd love to hear about it — and we'd love to see you again! {link}",
  'Thank you to all our amazing clients! Book your next appointment with us: {link}',
  '⭐️⭐️⭐️⭐️⭐️ We are grateful for every client. Book your next visit: {link}',
];

const QUOTE_TEMPLATES = [
  '"Take care of your body, it\'s the only place you have to live." Book your next appointment: {link}',
  '"Self-care isn\'t selfish." Treat yourself — book here: {link}',
  '"Beauty begins the moment you decide to be yourself." Book your appointment: {link}',
];

interface MarketingTile {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TILES: MarketingTile[] = [
  { key: 'booking-link', title: 'Share Your Booking Link', icon: 'link-outline' },
  { key: 'quick-shares', title: 'Quick Shares', icon: 'flash-outline' },
  { key: 'holidays', title: 'Holidays & Special Occasions', icon: 'gift-outline' },
  { key: 'encourage-bookings', title: 'Encourage Bookings', icon: 'calendar-outline' },
  { key: 'portfolio', title: 'Share Your Portfolio', icon: 'images-outline' },
  { key: 'reviews', title: 'Share Reviews', icon: 'star-outline' },
  { key: 'quotes', title: 'Quotes & Inspiration', icon: 'chatbubble-ellipses-outline' },
  { key: 'business-info', title: 'Business Info', icon: 'information-circle-outline' },
  { key: 'services', title: 'Promote Services', icon: 'pricetag-outline' },
];

async function shareText(message: string, url?: string) {
  try {
    await Share.share(Platform.OS === 'ios' && url ? { message, url } : { message: url ? `${message} ${url}` : message });
  } catch {
    // Share sheet dismissed or unavailable — nothing to recover from.
  }
}

export default function SocialMediaMarketingScreen() {
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
  const businessName = business?.businessName ?? 'Your Business';

  const shareTemplate = (templates: string[]) => {
    const message = pickRandom(templates).replace('{link}', profileUrl);
    shareText(message);
  };

  const handleShareBookingLink = () => {
    shareText(`Book your next appointment with ${businessName} today!`, profileUrl);
  };

  const handleSharePortfolio = () => {
    if (!business?.portfolio || business.portfolio.length === 0) {
      Alert.alert('No portfolio photos yet', 'Add some photos to your Portfolio from your Profile first.');
      return;
    }
    setPortfolioPickerVisible(true);
  };

  const handlePickPortfolioPhoto = (url: string) => {
    setPortfolioPickerVisible(false);
    shareText(`Check out our work at ${businessName}!`, url);
  };

  const handleShareBusinessInfo = () => {
    const categories = business?.categories?.length
      ? business.categories.join(', ')
      : business?.category ?? '';
    const address = business?.location?.address;
    const lines = [businessName, categories, address].filter(Boolean);
    shareText(`${lines.join(' — ')}\nBook now: ${profileUrl}`);
  };

  const handlePromoteServices = () => {
    if (services.length === 0) {
      Alert.alert('No services yet', 'Add services from Services Setup first.');
      return;
    }
    setServicePickerVisible(true);
  };

  const handlePickService = (service: Service) => {
    setServicePickerVisible(false);
    shareText(`Book your ${service.name} today!`, profileUrl);
  };

  const handleTilePress = (key: string) => {
    switch (key) {
      case 'booking-link':
        return handleShareBookingLink();
      case 'quick-shares':
        return shareTemplate(QUICK_SHARE_TEMPLATES);
      case 'holidays':
        return shareTemplate(HOLIDAY_TEMPLATES);
      case 'encourage-bookings':
        return shareTemplate(ENCOURAGE_BOOKING_TEMPLATES);
      case 'portfolio':
        return handleSharePortfolio();
      case 'reviews':
        return shareTemplate(REVIEW_TEMPLATES);
      case 'quotes':
        return shareTemplate(QUOTE_TEMPLATES);
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
        <Text style={styles.headerTitle}>Social Media Marketing</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Tap a category to generate a caption and share it to Instagram, Facebook, or anywhere else.
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
              <Text style={styles.tileLabel}>{tile.title}</Text>
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
              <Text style={styles.modalTitle}>Choose a photo</Text>
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
              <Text style={styles.modalTitle}>Choose a service</Text>
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
