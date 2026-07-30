import type { Ionicons } from '@expo/vector-icons';

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
  ClientPicker: { currentService?: SelectedServiceParam } | undefined;
  ServicePicker: { currentClient?: SelectedClientParam } | undefined;
  AddClient: undefined;
  CheckoutComplete: { amount: number; clientName?: string };
  ScheduleManagement: undefined;
  Notifications: undefined;
  SettingsPlaceholder: { title: string; icon: keyof typeof Ionicons.glyphMap };
};

export type DashboardTabParamList = {
  Appointments: undefined;
  Clients: undefined;
  Checkout: undefined;
  Marketing: undefined;
  Profile: undefined;
};
