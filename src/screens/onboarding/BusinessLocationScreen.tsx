import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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

export default function BusinessLocationScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [coords, setCoords] = useState({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [address, setAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(true);
  const [unit, setUnit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolveAddress = async (latitude: number, longitude: number) => {
    setResolvingAddress(true);
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        const parts = [result.streetNumber, result.street, result.city, result.country].filter(Boolean);
        setAddress(parts.join(', ') || 'Unknown address');
      } else {
        setAddress('Unknown address');
      }
    } catch {
      setAddress('Could not resolve address');
    } finally {
      setResolvingAddress(false);
    }
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
      setError('You need to be signed in to continue.');
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
    navigation.replace('Dashboard');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProgressBar step={4} totalSteps={4} />
      <View style={styles.content}>
        <Text style={styles.title}>Where's your business located?</Text>
        <Text style={styles.subtitle}>Drag the pin to set your exact location.</Text>

        <View style={styles.addressRow}>
          <Ionicons name="location" size={18} color={Colors.teal} />
          {resolvingAddress ? (
            <ActivityIndicator size="small" color={Colors.teal} />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>
              {address}
            </Text>
          )}
        </View>

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
          label="Apt / suite / unit (optional)"
          placeholder="e.g. Suite 2B"
          value={unit}
          onChangeText={setUnit}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Continue" onPress={handleContinue} loading={loading} style={styles.continueButton} />
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  addressText: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
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
