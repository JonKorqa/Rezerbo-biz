import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import RoleSelectorScreen from '../screens/RoleSelectorScreen';
import AuthScreen from '../screens/auth/AuthScreen';
import ConsumerRedirectScreen from '../screens/misc/ConsumerRedirectScreen';
import BusinessInfoScreen from '../screens/onboarding/BusinessInfoScreen';
import BusinessCategoryScreen from '../screens/onboarding/BusinessCategoryScreen';
import BusinessLocationScreen from '../screens/onboarding/BusinessLocationScreen';
import DashboardTabs from './DashboardTabs';
import NewAppointmentScreen from '../screens/dashboard/NewAppointmentScreen';
import ClientPickerScreen from '../screens/dashboard/ClientPickerScreen';
import ServicePickerScreen from '../screens/dashboard/ServicePickerScreen';
import AddClientScreen from '../screens/dashboard/AddClientScreen';
import CheckoutCompleteScreen from '../screens/dashboard/CheckoutCompleteScreen';
import ScheduleManagementScreen from '../screens/dashboard/ScheduleManagementScreen';
import NotificationsScreen from '../screens/dashboard/NotificationsScreen';
import SettingsPlaceholderScreen from '../screens/dashboard/SettingsPlaceholderScreen';
import BusinessSettingsScreen from '../screens/dashboard/BusinessSettingsScreen';
import ServicesSetupScreen from '../screens/dashboard/ServicesSetupScreen';
import AddEditServiceScreen from '../screens/dashboard/AddEditServiceScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ConsumerRedirect" component={ConsumerRedirectScreen} />
        <Stack.Screen name="BusinessInfo" component={BusinessInfoScreen} />
        <Stack.Screen name="BusinessCategory" component={BusinessCategoryScreen} />
        <Stack.Screen name="BusinessLocation" component={BusinessLocationScreen} />
        <Stack.Screen name="Dashboard" component={DashboardTabs} />
        <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ClientPicker" component={ClientPickerScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ServicePicker" component={ServicePickerScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddClient" component={AddClientScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="CheckoutComplete"
          component={CheckoutCompleteScreen}
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="ScheduleManagement" component={ScheduleManagementScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="SettingsPlaceholder" component={SettingsPlaceholderScreen} />
        <Stack.Screen name="BusinessSettings" component={BusinessSettingsScreen} />
        <Stack.Screen name="ServicesSetup" component={ServicesSetupScreen} />
        <Stack.Screen name="AddEditService" component={AddEditServiceScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
