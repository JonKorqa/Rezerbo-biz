import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getBusiness } from '../services/businesses';
import { RezervoLogo } from '../components/RezervoLogo';
import { Colors, Spacing } from '../theme';
import { Light } from '../theme/light';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const MIN_DISPLAY_MS = 900;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const start = Date.now();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let destination: keyof RootStackParamList = 'RoleSelector';

      if (user) {
        try {
          const business = await getBusiness(user.uid);
          if (business?.onboardingComplete) {
            destination = 'Dashboard';
          } else if (business?.category) {
            destination = 'BusinessLocation';
          } else if (business?.businessName) {
            destination = 'BusinessCategory';
          } else {
            destination = 'BusinessInfo';
          }
        } catch {
          destination = 'BusinessInfo';
        }
      }

      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => navigation.replace(destination), wait);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <RezervoLogo variant="light" size={32} />
      <ActivityIndicator color={Colors.teal} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Light.background,
    gap: Spacing.xl,
  },
  spinner: {
    marginTop: Spacing.sm,
  },
});
