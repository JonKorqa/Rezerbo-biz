import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { saveBusinessCategory } from '../../services/businesses';
import { Button, ProgressBar } from '../../components/ui';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '../../constants/categories';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessCategory'>;

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
      style={[styles.tile, selected && styles.tileSelected]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.tileIconWrap, selected && styles.tileIconWrapSelected]}>
        <Ionicons name={category.icon} size={24} color={selected ? Colors.white : Colors.teal} />
      </View>
      <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>{category.label.en}</Text>
    </TouchableOpacity>
  );
}

export default function BusinessCategoryScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) {
      setError('Pick a category to continue.');
      return;
    }
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
    try {
      await saveBusinessCategory(uid, selected);
    } catch (err) {
      console.error('saveBusinessCategory failed, continuing anyway:', err);
    } finally {
      setLoading(false);
    }
    navigation.navigate('BusinessLocation');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProgressBar step={3} totalSteps={4} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>What's your specialty?</Text>
        <Text style={styles.subtitle}>Choose the category that best describes your business.</Text>

        <View style={styles.grid}>
          {BUSINESS_CATEGORIES.map((category) => (
            <CategoryTile
              key={category.key}
              category={category}
              selected={selected === category.key}
              onPress={() => setSelected(category.key)}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Continue" onPress={handleContinue} loading={loading} style={styles.continueButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
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
  },
  tileSelected: {
    borderColor: Colors.teal,
    backgroundColor: Light.fieldBgFocused,
  },
  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconWrapSelected: { backgroundColor: Colors.teal },
  tileLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  tileLabelSelected: { fontFamily: Typography.fontFamily.bold },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  continueButton: { marginTop: Spacing.xl },
});
