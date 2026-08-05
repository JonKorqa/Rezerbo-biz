import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppointmentsScreen from '../screens/dashboard/AppointmentsScreen';
import ClientsScreen from '../screens/dashboard/ClientsScreen';
import CheckoutScreen from '../screens/dashboard/CheckoutScreen';
import MarketingScreen from '../screens/dashboard/MarketingScreen';
import ProfileScreen from '../screens/dashboard/ProfileScreen';
import { Colors } from '../theme';
import { Light } from '../theme/light';
import type { DashboardTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<DashboardTabParamList>();

const TAB_ICONS: Record<keyof DashboardTabParamList, { filled: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Appointments: { filled: 'calendar', outline: 'calendar-outline' },
  Clients: { filled: 'people', outline: 'people-outline' },
  Checkout: { filled: 'receipt', outline: 'receipt-outline' },
  Marketing: { filled: 'megaphone', outline: 'megaphone-outline' },
  Profile: { filled: 'storefront', outline: 'storefront-outline' },
};

const TAB_LABEL_KEYS: Record<keyof DashboardTabParamList, string> = {
  Appointments: 'dashboardTabs.appointments',
  Clients: 'clients.title',
  Checkout: 'checkout.title',
  Marketing: 'marketing.title',
  Profile: 'dashboardTabs.profile',
};

export default function DashboardTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      initialRouteName="Appointments"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Light.textMuted,
        tabBarStyle: { borderTopColor: Light.border },
        tabBarLabel: t(TAB_LABEL_KEYS[route.name as keyof DashboardTabParamList]),
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name as keyof DashboardTabParamList];
          return <Ionicons name={focused ? icons.filled : icons.outline} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Checkout" component={CheckoutScreen} />
      <Tab.Screen name="Marketing" component={MarketingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
