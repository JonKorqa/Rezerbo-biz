import type { Ionicons } from '@expo/vector-icons';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Service } from './service';
import type { Client } from './client';
import type { StaffMember } from './staff';
import type { Membership } from './membership';
import type { ServicePackage } from './package';

export type SelectedClientParam = { id: string | null; name: string };

export type SelectedServiceParam = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  color?: string;
};

export type RootStackParamList = {
  Splash: undefined;
  RoleSelector: undefined;
  Auth: { initialTab?: 'login' | 'signup' } | undefined;
  ConsumerRedirect: undefined;
  BusinessInfo: undefined;
  BusinessCategory: undefined;
  BusinessLocation: undefined;
  Dashboard: NavigatorScreenParams<DashboardTabParamList> | undefined;
  NewAppointment:
    | {
        selectedClient?: SelectedClientParam;
        selectedService?: SelectedServiceParam;
      }
    | undefined;
  AddReservation: undefined;
  AddTimeOff: undefined;
  ClientPicker:
    | {
        currentService?: SelectedServiceParam;
        // Which route in the stack to setParams({ selectedClient }) on when a client is
        // picked. Defaults to 'NewAppointment' — set this when reusing the picker from
        // another screen (e.g. Text & Email Marketing).
        returnTo?: keyof RootStackParamList;
      }
    | undefined;
  ServicePicker: { currentClient?: SelectedClientParam } | undefined;
  AddClient: { client?: Client } | undefined;
  ClientDetail: { clientId: string };
  CheckoutComplete: { amount: number; clientName?: string };
  ScheduleManagement: undefined;
  Notifications: undefined;
  CalendarColorSettings: undefined;
  CalendarImport: undefined;
  SettingsPlaceholder: { title: string; icon: keyof typeof Ionicons.glyphMap };
  BusinessSettings: undefined;
  BusinessDetails: undefined;
  Transactions: undefined;
  ServicesSetup: undefined;
  AddEditService: { service?: Service } | undefined;
  StatsAndReports: undefined;
  PaymentsAndCheckout: undefined;
  SocialMediaMarketing: undefined;
  TextAndEmailMarketing: { selectedClient?: SelectedClientParam } | undefined;
  StaffManagement: undefined;
  AddEditStaff: { staff?: StaffMember } | undefined;
  Memberships: undefined;
  AddEditMembership: { membership?: Membership } | undefined;
  Packages: undefined;
  AddEditPackage: { pkg?: ServicePackage } | undefined;
  ImportInviteClients: undefined;
  ImportContacts: undefined;
};

export type DashboardTabParamList = {
  Appointments: undefined;
  Clients: undefined;
  Checkout: undefined;
  Marketing: undefined;
  Profile: undefined;
};
