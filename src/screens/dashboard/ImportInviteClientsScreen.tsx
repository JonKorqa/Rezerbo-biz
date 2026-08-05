import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { getBusiness } from '../../services/businesses';
import { useClients } from '../../hooks/useClients';
import { getClientDisplayName } from '../../types/client';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { Client } from '../../types/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportInviteClients'>;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function ImportInviteClientsScreen({ navigation }: Props) {
  const uid = auth.currentUser?.uid;
  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });
  const { data: clients = [] } = useClients();

  const businessName = business?.businessName ?? 'Your Business';
  const profileUrl = uid ? `rezervo://salon/${uid}` : '';

  const handleInvite = async (client: Client) => {
    if (!client.phone) {
      Alert.alert('No phone number', 'This client has no phone number on file.');
      return;
    }
    const name = getClientDisplayName(client) || 'there';
    const message = `Hi ${name}, book your next appointment with ${businessName} online: ${profileUrl}`;
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${client.phone}${separator}body=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open Messages', 'No messaging app is available to handle this on your device.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import & Invite Clients</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.importCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ImportContacts')}
            >
              <View style={styles.importIconWrap}>
                <Ionicons name="people-outline" size={22} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.importTitle}>Import from Contacts</Text>
                <Text style={styles.importSubtitle}>Bulk-add clients from your phone's contact list</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Your Clients</Text>
          </>
        }
        renderItem={({ item }) => {
          const name = getClientDisplayName(item) || 'Client';
          return (
            <View style={styles.clientRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLabel}>{getInitials(name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{name}</Text>
                {!!item.phone && <Text style={styles.clientPhone}>{item.phone}</Text>}
              </View>
              <TouchableOpacity style={styles.inviteButton} activeOpacity={0.8} onPress={() => handleInvite(item)}>
                <Ionicons name="paper-plane-outline" size={14} color={Colors.teal} />
                <Text style={styles.inviteButtonLabel}>Invite</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No clients yet — import from contacts or add one manually.</Text>
          </View>
        }
      />
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
    marginHorizontal: Spacing.sm,
  },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  importCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.teal,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  importIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importTitle: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  importSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
    marginBottom: Spacing.sm,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  clientName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  clientPhone: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 32,
  },
  inviteButtonLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  empty: { paddingVertical: Spacing['2xl'], alignItems: 'center' },
  emptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
});
