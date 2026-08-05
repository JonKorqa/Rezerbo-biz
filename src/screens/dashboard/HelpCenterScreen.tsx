import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

// Placeholder support contact — replace with the real support inbox before launch.
const SUPPORT_EMAIL = 'support@rezervo.app';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How do I add a service?',
    answer: 'Go to Settings → Services Setup, then tap the add button to create a new service with a name, price, and duration.',
  },
  {
    question: 'How do I change my business hours?',
    answer: 'Go to Settings → Schedule Management to edit your opening hours, add time off, and manage staff working hours.',
  },
  {
    question: 'How do I get paid?',
    answer: 'Payment methods and checkout settings live under Settings → Payments & Checkout. Cash is available today, with card and PayPal coming soon.',
  },
  {
    question: 'How do I add a staff member?',
    answer: 'Go to Settings → Staff Management and tap the add button to invite a new team member and set their permissions.',
  },
  {
    question: 'How do I turn on online booking for clients?',
    answer: "Go to Settings → Online Booking and enable \"Enable Online Booking\". You can also require approval before new bookings are confirmed.",
  },
  {
    question: 'How do I cancel or reschedule an appointment?',
    answer: 'Open the appointment from your calendar or the client\'s profile — you\'ll find options to reschedule or cancel from there.',
  },
];

export default function HelpCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

  const handleContactSupport = async () => {
    const subject = 'Support request from Rezervo Biz app';
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open Mail', 'No email app is available to handle this on your device.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQS.map((faq, index) => {
            const expanded = expandedIndex === index;
            return (
              <View key={faq.question} style={[styles.faqRow, index === FAQS.length - 1 && styles.rowLast]}>
                <TouchableOpacity style={styles.faqQuestionRow} activeOpacity={0.7} onPress={() => toggleFaq(index)}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Light.textMuted} />
                </TouchableOpacity>
                {expanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Still need help?</Text>
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handleContactSupport}>
          <View style={[styles.faqQuestionRow, styles.rowLast]}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.faqQuestion}>Contact Support</Text>
              <Text style={styles.contactSubtext}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </View>
        </TouchableOpacity>
      </ScrollView>
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
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  faqRow: {
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
    paddingVertical: Spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  faqAnswer: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginTop: Spacing.sm,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactSubtext: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
});
