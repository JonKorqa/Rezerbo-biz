import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { saveBusinessLocation } from '../../services/businesses';
import { Button, FormInput, ProgressBar } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { BusinessLocationData } from '../../types/business';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessLocation'>;

// Prishtina, Kosovo — sensible default center for this market.
const DEFAULT_REGION: Region = {
  latitude: 42.6629,
  longitude: 21.1655,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function BusinessLocationScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const userEditedAddress = useRef(false);
  const [coords, setCoords] = useState({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [address, setAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(true);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [unit, setUnit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolveAddress = async (latitude: number, longitude: number) => {
    setResolvingAddress(true);
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setGeocodeFailed(false);
      if (!userEditedAddress.current) {
        if (result) {
          const parts = [result.streetNumber, result.street, result.city, result.country].filter(Boolean);
          setAddress(parts.join(', ') || t('common.unknownAddress'));
        } else {
          setAddress(t('common.unknownAddress'));
        }
      }
    } catch (err) {
      console.error('reverseGeocodeAsync failed, falling back to manual entry:', err);
      setGeocodeFailed(true);
      if (!userEditedAddress.current) {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } finally {
      setResolvingAddress(false);
    }
  };

  const handleAddressChange = (text: string) => {
    userEditedAddress.current = true;
    setAddress(text);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const current = await Location.getCurrentPositionAsync({});
          const next = { latitude: current.coords.latitude, longitude: current.coords.longitude };
          setCoords(next);
          mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
          await resolveAddress(next.latitude, next.longitude);
          return;
        } catch {
          // fall through to default region
        }
      }
      await resolveAddress(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError(t('onboarding.businessLocation.errors.notSignedIn'));
      return;
    }
    setError(null);
    setLoading(true);
    // TODO(firestore-rules): businesses collection rule isn't deployed yet, so this save
    // currently fails with "permission denied". Swallowing the error here so onboarding
    // navigation stays testable — once rules are deployed, remove this try/catch and let a
    // failed save block navigation (with retry) like it did before.
    const trimmedUnit = unit.trim();
    const locationData: BusinessLocationData = {
      lat: coords.latitude,
      lng: coords.longitude,
      address,
      ...(trimmedUnit ? { unit: trimmedUnit } : {}),
    };
    try {
      await saveBusinessLocation(uid, locationData);
    } catch (err) {
      console.error('saveBusinessLocation failed, continuing anyway:', err);
    } finally {
      setLoading(false);
    }
    // Reached from Business Details' "Edit" link (fromEdit param set explicitly there) →
    // pop back to it. Otherwise this is onboarding → push forward to the Add Services
    // step. canGoBack() used to gate this and was unreliable: onboarding screens are
    // pushed via navigate(), so there's always back history by the time this screen is
    // reached, even on a fresh signup.
    if (route.params?.fromEdit) {
      navigation.goBack();
    } else {
      navigation.navigate('AddServicesOnboarding');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProgressBar step={4} totalSteps={5} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.businessLocation.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.businessLocation.subtitle')}</Text>

        <FormInput
          placeholder={t('onboarding.businessLocation.addressPlaceholder')}
          value={address}
          onChangeText={handleAddressChange}
          leftElement={
            resolvingAddress ? (
              <ActivityIndicator size="small" color={Colors.teal} />
            ) : (
              <Ionicons name="location" size={18} color={Colors.teal} />
            )
          }
        />
        {geocodeFailed && !resolvingAddress && (
          <Text style={styles.geocodeFallbackText}>
            {t('onboarding.businessLocation.geocodeFallback')}
          </Text>
        )}

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={DEFAULT_REGION}
          >
            <Marker
              coordinate={coords}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setCoords({ latitude, longitude });
                resolveAddress(latitude, longitude);
              }}
            />
          </MapView>
        </View>

        <FormInput
          label={t('onboarding.businessLocation.unit.label')}
          placeholder={t('onboarding.businessLocation.unit.placeholder')}
          value={unit}
          onChangeText={setUnit}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label={t('common.continue')} onPress={handleContinue} loading={loading} style={styles.continueButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.md },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.heading,
  },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  geocodeFallbackText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  mapWrap: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Light.border,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  continueButton: { marginTop: Spacing.xs },
});
