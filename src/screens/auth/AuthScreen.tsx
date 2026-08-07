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
import { useTranslation } from 'react-i18next';
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

export default function AuthScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const slide = useRef(new Animated.Value(tab === 'login' ? 0 : 1)).current;

  function stubSocialAuth(providerLabel: string) {
    Alert.alert(t('common.comingSoon'), t('auth.social.comingSoonMessage', { provider: providerLabel }));
  }

  function authErrorMessage(err: unknown, activeTab: Tab): string {
    const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : undefined;
    switch (code) {
      case 'auth/email-already-in-use':
        return t('auth.errors.emailInUse');
      case 'auth/invalid-credential':
        return activeTab === 'signup' ? t('auth.errors.invalidCredentialSignup') : t('auth.errors.invalidCredentialLogin');
      case 'auth/invalid-email':
        return t('auth.errors.invalidEmail');
      case 'auth/weak-password':
        return t('auth.errors.weakPassword');
      case 'auth/user-not-found':
        return t('auth.errors.userNotFound');
      case 'auth/wrong-password':
        return t('auth.errors.wrongPassword');
      case 'auth/too-many-requests':
        return t('auth.errors.tooManyRequests');
      default: {
        const base = err instanceof Error ? err.message : t('auth.errors.generic');
        return code ? `${base} (${code})` : base;
      }
    }
  }

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
      setError(t('auth.errors.fillBothFields'));
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
      <ProgressBar step={1} totalSteps={5} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <RezervoLogo variant="light" size={26} />
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          <View style={styles.tabBar}>
            <Animated.View
              style={[styles.tabIndicator, { left: indicatorLeft }]}
            />
            <TouchableOpacity style={styles.tabButton} onPress={() => switchTab('login')} activeOpacity={0.8}>
              <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>{t('auth.tabs.login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabButton} onPress={() => switchTab('signup')} activeOpacity={0.8}>
              <Text style={[styles.tabLabel, tab === 'signup' && styles.tabLabelActive]}>{t('auth.tabs.signup')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <FormInput
              label={t('auth.email.label')}
              icon="mail-outline"
              placeholder={t('auth.email.placeholder')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View>
              <FormInput
                label={t('auth.password.label')}
                icon="lock-closed-outline"
                placeholder={tab === 'login' ? t('auth.password.placeholderLogin') : t('auth.password.placeholderSignup')}
                secureToggle
                value={password}
                onChangeText={setPassword}
              />
              {tab === 'login' && (
                <TouchableOpacity style={styles.forgotLink} onPress={() => setForgotVisible(true)}>
                  <Text style={styles.forgotLinkText}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              label={tab === 'login' ? t('auth.submit.login') : t('auth.submit.signup')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.divider')}</Text>
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
            <Text style={styles.modalTitle}>{t('auth.forgotModal.title')}</Text>
            {forgotStatus === 'sent' ? (
              <Text style={styles.modalBody}>
                {t('auth.forgotModal.sentMessage', { email: forgotEmail })}
              </Text>
            ) : (
              <>
                <Text style={styles.modalBody}>
                  {t('auth.forgotModal.body')}
                </Text>
                <FormInput
                  placeholder={t('auth.email.placeholder')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
                {forgotStatus === 'error' && (
                  <Text style={styles.errorText}>{t('auth.forgotModal.error')}</Text>
                )}
                <Button
                  label={t('auth.forgotModal.sendButton')}
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
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
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
