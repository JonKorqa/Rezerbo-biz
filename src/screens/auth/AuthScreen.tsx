import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getBusiness } from '../../services/businesses';
import { Button, FormInput, ProgressBar } from '../../components/ui';
import { RezervoLogo } from '../../components/RezervoLogo';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
type Tab = 'login' | 'signup';

const SOCIAL_PROVIDERS = [
  { key: 'apple', icon: 'logo-apple' as const, label: 'Apple' },
  { key: 'google', icon: 'logo-google' as const, label: 'Google' },
  { key: 'facebook', icon: 'logo-facebook' as const, label: 'Facebook' },
];

function stubSocialAuth(provider: string) {
  Alert.alert('Coming soon', `${provider} sign-in isn't wired up yet — use email for now.`);
}

function authErrorMessage(err: unknown, tab: Tab): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : undefined;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-credential':
      return tab === 'signup'
        ? 'An account with this email may already exist. Try logging in instead.'
        : 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default: {
      const base = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      return code ? `${base} (${code})` : base;
    }
  }
}

export default function AuthScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const slide = useRef(new Animated.Value(tab === 'login' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: tab === 'login' ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [tab, slide]);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setError(null);
    setTab(next);
  };

  const routeAfterAuth = async (uid: string) => {
    const business = await getBusiness(uid).catch(() => null);
    if (business?.onboardingComplete) {
      navigation.replace('Dashboard');
    } else {
      navigation.replace('BusinessInfo');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await routeAfterAuth(cred.user.uid);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        navigation.replace('BusinessInfo');
        void cred;
      }
    } catch (err) {
      setError(authErrorMessage(err, tab));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotStatus('sending');
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotStatus('sent');
    } catch {
      setForgotStatus('error');
    }
  };

  const indicatorLeft = slide.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ProgressBar step={1} totalSteps={4} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <RezervoLogo variant="light" size={26} />
            <Text style={styles.tagline}>for business owners</Text>
          </View>

          <View style={styles.tabBar}>
            <Animated.View
              style={[styles.tabIndicator, { left: indicatorLeft }]}
            />
            <TouchableOpacity style={styles.tabButton} onPress={() => switchTab('login')} activeOpacity={0.8}>
              <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabButton} onPress={() => switchTab('signup')} activeOpacity={0.8}>
              <Text style={[styles.tabLabel, tab === 'signup' && styles.tabLabelActive]}>Sign up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <FormInput
              label="Email"
              icon="mail-outline"
              placeholder="you@business.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View>
              <FormInput
                label="Password"
                icon="lock-closed-outline"
                placeholder={tab === 'login' ? 'Your password' : 'Minimum 6 characters'}
                secureToggle
                value={password}
                onChangeText={setPassword}
              />
              {tab === 'login' && (
                <TouchableOpacity style={styles.forgotLink} onPress={() => setForgotVisible(true)}>
                  <Text style={styles.forgotLinkText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              label={tab === 'login' ? 'Log in' : 'Continue with email'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            {SOCIAL_PROVIDERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={styles.socialButton}
                activeOpacity={0.8}
                onPress={() => stubSocialAuth(p.label)}
              >
                <Ionicons name={p.icon} size={20} color={Light.textPrimary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={() => setForgotVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset your password</Text>
            {forgotStatus === 'sent' ? (
              <Text style={styles.modalBody}>
                If an account exists for {forgotEmail}, a reset link is on its way.
              </Text>
            ) : (
              <>
                <Text style={styles.modalBody}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
                <FormInput
                  placeholder="you@business.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
                {forgotStatus === 'error' && (
                  <Text style={styles.errorText}>Couldn't send the email. Check the address and try again.</Text>
                )}
                <Button
                  label="Send reset link"
                  onPress={handleForgotPassword}
                  loading={forgotStatus === 'sending'}
                  style={styles.modalButton}
                />
              </>
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setForgotVisible(false);
                setForgotStatus('idle');
                setForgotEmail('');
              }}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  logoSection: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing['2xl'] },
  tagline: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Light.border,
    height: 48,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 3,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  tabLabelActive: { color: Light.textPrimary, fontFamily: Typography.fontFamily.bold },

  form: { gap: Spacing.md },
  forgotLink: { alignSelf: 'flex-end', marginTop: 6 },
  forgotLinkText: {
    color: Colors.teal,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  submitButton: { marginTop: Spacing.sm },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Light.border },
  dividerText: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },

  socialRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  socialButton: {
    width: 56,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  modalBody: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  modalButton: { marginTop: Spacing.xs },
  modalClose: { alignSelf: 'center', marginTop: Spacing.xs },
  modalCloseText: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
});
