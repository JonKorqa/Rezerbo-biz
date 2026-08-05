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
import AddReservationScreen from '../screens/dashboard/AddReservationScreen';
import AddTimeOffScreen from '../screens/dashboard/AddTimeOffScreen';
import ClientPickerScreen from '../screens/dashboard/ClientPickerScreen';
import ServicePickerScreen from '../screens/dashboard/ServicePickerScreen';
import AddClientScreen from '../screens/dashboard/AddClientScreen';
import ClientDetailScreen from '../screens/dashboard/ClientDetailScreen';
import CheckoutCompleteScreen from '../screens/dashboard/CheckoutCompleteScreen';
import ScheduleManagementScreen from '../screens/dashboard/ScheduleManagementScreen';
import NotificationsScreen from '../screens/dashboard/NotificationsScreen';
import CalendarColorScreen from '../screens/dashboard/CalendarColorScreen';
import CalendarImportScreen from '../screens/dashboard/CalendarImportScreen';
import SettingsPlaceholderScreen from '../screens/dashboard/SettingsPlaceholderScreen';
import BusinessSettingsScreen from '../screens/dashboard/BusinessSettingsScreen';
import BusinessDetailsScreen from '../screens/dashboard/BusinessDetailsScreen';
import TransactionsScreen from '../screens/dashboard/TransactionsScreen';
import ServicesSetupScreen from '../screens/dashboard/ServicesSetupScreen';
import AddEditServiceScreen from '../screens/dashboard/AddEditServiceScreen';
import StatsAndReportsScreen from '../screens/dashboard/StatsAndReportsScreen';
import PaymentsAndCheckoutScreen from '../screens/dashboard/PaymentsAndCheckoutScreen';
import SocialMediaMarketingScreen from '../screens/dashboard/SocialMediaMarketingScreen';
import TextAndEmailMarketingScreen from '../screens/dashboard/TextAndEmailMarketingScreen';
import StaffManagementScreen from '../screens/dashboard/StaffManagementScreen';
import AddEditStaffScreen from '../screens/dashboard/AddEditStaffScreen';
import MembershipsScreen from '../screens/dashboard/MembershipsScreen';
import AddEditMembershipScreen from '../screens/dashboard/AddEditMembershipScreen';
import PackagesScreen from '../screens/dashboard/PackagesScreen';
import AddEditPackageScreen from '../screens/dashboard/AddEditPackageScreen';
import ImportInviteClientsScreen from '../screens/dashboard/ImportInviteClientsScreen';
import ImportContactsScreen from '../screens/dashboard/ImportContactsScreen';
import OnlineBookingScreen from '../screens/dashboard/OnlineBookingScreen';
import AdvancedOptionsScreen from '../screens/dashboard/AdvancedOptionsScreen';
import PersonalSettingsScreen from '../screens/dashboard/PersonalSettingsScreen';
import NotificationPreferencesScreen from '../screens/dashboard/NotificationPreferencesScreen';
import AppInfoScreen from '../screens/dashboard/AppInfoScreen';
import LegalDocumentScreen from '../screens/dashboard/LegalDocumentScreen';
import HelpCenterScreen from '../screens/dashboard/HelpCenterScreen';
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
        <Stack.Screen name="AddReservation" component={AddReservationScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddTimeOff" component={AddTimeOffScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ClientPicker" component={ClientPickerScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ServicePicker" component={ServicePickerScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddClient" component={AddClientScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
        <Stack.Screen
          name="CheckoutComplete"
          component={CheckoutCompleteScreen}
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="ScheduleManagement" component={ScheduleManagementScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="CalendarColorSettings" component={CalendarColorScreen} />
        <Stack.Screen name="CalendarImport" component={CalendarImportScreen} />
        <Stack.Screen name="SettingsPlaceholder" component={SettingsPlaceholderScreen} />
        <Stack.Screen name="BusinessSettings" component={BusinessSettingsScreen} />
        <Stack.Screen name="BusinessDetails" component={BusinessDetailsScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="ServicesSetup" component={ServicesSetupScreen} />
        <Stack.Screen name="AddEditService" component={AddEditServiceScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="StatsAndReports" component={StatsAndReportsScreen} />
        <Stack.Screen name="PaymentsAndCheckout" component={PaymentsAndCheckoutScreen} />
        <Stack.Screen name="SocialMediaMarketing" component={SocialMediaMarketingScreen} />
        <Stack.Screen name="TextAndEmailMarketing" component={TextAndEmailMarketingScreen} />
        <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
        <Stack.Screen name="AddEditStaff" component={AddEditStaffScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Memberships" component={MembershipsScreen} />
        <Stack.Screen name="AddEditMembership" component={AddEditMembershipScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Packages" component={PackagesScreen} />
        <Stack.Screen name="AddEditPackage" component={AddEditPackageScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ImportInviteClients" component={ImportInviteClientsScreen} />
        <Stack.Screen name="ImportContacts" component={ImportContactsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="OnlineBooking" component={OnlineBookingScreen} />
        <Stack.Screen name="AdvancedOptions" component={AdvancedOptionsScreen} />
        <Stack.Screen name="PersonalSettings" component={PersonalSettingsScreen} />
        <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
        <Stack.Screen name="AppInfo" component={AppInfoScreen} />
        <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
