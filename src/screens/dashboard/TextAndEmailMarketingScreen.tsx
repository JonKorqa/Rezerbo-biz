import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Linking,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { getBusiness } from '../../services/businesses';
import { useClients } from '../../hooks/useClients';
import { Button } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList, SelectedClientParam } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TextAndEmailMarketing'>;

interface MessageTemplate {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  body: string;
}

// {clientName}, {businessName}, {link} get substituted once a client is picked.
const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: 'welcome',
    title: 'Welcome a new client',
    description: 'Send a friendly welcome after their first visit',
    icon: 'hand-left-outline',
    body: "Hi {clientName}, thank you for choosing {businessName}! We're so glad you came in and can't wait to see you again.",
  },
  {
    key: 'rebook',
    title: 'Remind clients to rebook',
    description: "Nudge clients who haven't booked in a while",
    icon: 'refresh-outline',
    body: "Hi {clientName}, it's been a while since your last visit to {businessName}! We'd love to see you again — book your next appointment whenever you're ready: {link}",
  },
  {
    key: 'online-booking',
    title: "Let clients know you're now bookable online",
    description: 'Announce your new online booking link',
    icon: 'globe-outline',
    body: 'Hi {clientName}, exciting news — you can now book your appointments with {businessName} online anytime! {link}',
  },
  {
    key: 'ask-review',
    title: 'Ask for a review',
    description: 'Politely request feedback after a visit',
    icon: 'star-outline',
    body: 'Hi {clientName}, thank you for visiting {businessName}! If you enjoyed your visit, we would really appreciate a quick review.',
  },
];

function fillTemplate(body: string, vars: { clientName: string; businessName: string; link: string }): string {
  return body
    .replace(/\{clientName\}/g, vars.clientName)
    .replace(/\{businessName\}/g, vars.businessName)
    .replace(/\{link\}/g, vars.link);
}

export default function TextAndEmailMarketingScreen({ navigation, route }: Props) {
  const uid = auth.currentUser?.uid;
  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });
  const { data: clients = [] } = useClients();

  const businessName = business?.businessName ?? 'Your Business';
  const profileUrl = uid ? `rezervo://salon/${uid}` : '';

  const [pendingBody, setPendingBody] = useState<string | null>(null);
  const [customComposerVisible, setCustomComposerVisible] = useState(false);
  const [customText, setCustomText] = useState('');

  const [sendChooserVisible, setSendChooserVisible] = useState(false);
  const [sendChooserClient, setSendChooserClient] = useState<SelectedClientParam | null>(null);
  const [sendChooserMessage, setSendChooserMessage] = useState('');

  const selectedClientParam = route.params?.selectedClient;

  useEffect(() => {
    if (!selectedClientParam || !pendingBody) return;
    const message = fillTemplate(pendingBody, {
      clientName: selectedClientParam.name,
      businessName,
      link: profileUrl,
    });
    setSendChooserClient(selectedClientParam);
    setSendChooserMessage(message);
    setSendChooserVisible(true);
    setPendingBody(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientParam]);

  const startTemplateFlow = (template: MessageTemplate) => {
    setPendingBody(template.body);
    navigation.navigate('ClientPicker', { returnTo: 'TextAndEmailMarketing' });
  };

  const startCustomFlow = () => {
    if (!customText.trim()) return;
    setPendingBody(customText.trim());
    setCustomComposerVisible(false);
    navigation.navigate('ClientPicker', { returnTo: 'TextAndEmailMarketing' });
  };

  const closeSendChooser = () => {
    setSendChooserVisible(false);
    setSendChooserClient(null);
    setSendChooserMessage('');
  };

  const handleSendText = async () => {
    const client = clients.find((c) => c.id === sendChooserClient?.id);
    if (!client?.phone) {
      Alert.alert('No phone number', 'This client has no phone number on file.');
      return;
    }
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${client.phone}${separator}body=${encodeURIComponent(sendChooserMessage)}`;
    try {
      await Linking.openURL(url);
      closeSendChooser();
    } catch {
      Alert.alert('Could not open Messages', 'No messaging app is available to handle this on your device.');
    }
  };

  const handleSendEmail = async () => {
    // Clients don't have a stored email address yet, so this opens the mail composer
    // with the message pre-filled and lets the owner fill in (or paste) the recipient.
    const subject = `A message from ${businessName}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(sendChooserMessage)}`;
    try {
      await Linking.openURL(url);
      closeSendChooser();
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
        <Text style={styles.headerTitle}>Text & Email Marketing</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noteBanner}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.teal} />
          <Text style={styles.noteText}>
            Send messages directly from your phone — no automated campaigns yet.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Message Templates</Text>
        <View style={styles.list}>
          {MESSAGE_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.key}
              style={styles.templateRow}
              activeOpacity={0.7}
              onPress={() => startTemplateFlow(template)}
            >
              <View style={styles.rowIconWrap}>
                <Ionicons name={template.icon} size={18} color={Colors.teal} />
              </View>
              <View style={styles.templateBody}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.customRow}
          activeOpacity={0.7}
          onPress={() => {
            setCustomText('');
            setCustomComposerVisible(true);
          }}
        >
          <View style={styles.rowIconWrap}>
            <Ionicons name="create-outline" size={18} color={Colors.teal} />
          </View>
          <Text style={styles.customRowLabel}>Write your own message from scratch</Text>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Custom message composer */}
      <Modal
        visible={customComposerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomComposerVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCustomComposerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write your message</Text>
              <TouchableOpacity onPress={() => setCustomComposerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customTextArea}
              placeholder="Type your message…"
              placeholderTextColor={Light.textMuted}
              value={customText}
              onChangeText={setCustomText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <Button label="Choose client" onPress={startCustomFlow} disabled={!customText.trim()} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Send-method chooser, shown after a client is picked */}
      <Modal visible={sendChooserVisible} transparent animationType="fade" onRequestClose={closeSendChooser}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSendChooser} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {sendChooserClient ? `Send to ${sendChooserClient.name}` : 'Send message'}
              </Text>
              <TouchableOpacity onPress={closeSendChooser} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.messagePreview}>
              <Text style={styles.messagePreviewText}>{sendChooserMessage}</Text>
            </View>
            <Button label="Send via Text Message" onPress={handleSendText} style={styles.sendButton} />
            <Button label="Send via Email" onPress={handleSendEmail} variant="secondary" />
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
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBgFocused,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  noteText: {
    flex: 1,
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.md,
  },
  list: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateBody: { flex: 1, gap: 2 },
  templateTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  templateDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  customRowLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  customTextArea: {
    minHeight: 140,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  messagePreview: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  messagePreviewText: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  sendButton: { marginTop: Spacing.xs },
});
