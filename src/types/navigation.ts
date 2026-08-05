import type { Ionicons } from '@expo/vector-icons';
import type { Service } from './service';
import type { Client } from './client';

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
  Dashboard: undefined;
  NewAppointment:
    | {
        selectedClient?: SelectedClientParam;
        selectedService?: SelectedServiceParam;
      }
    | undefined;
  AddReservation: undefined;
  AddTimeOff: undefined;
  ClientPicker: { currentService?: SelectedServiceParam } | undefined;
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
};

export type DashboardTabParamList = {
  Appointments: undefined;
  Clients: undefined;
  Checkout: undefined;
  Marketing: undefined;
  Profile: undefined;
};
