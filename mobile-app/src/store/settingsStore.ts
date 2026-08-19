import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  schoolName: string;
  staffIdPrefix: string;
  admissionNumberPrefix: string;
  currentSessionId: string | null;
  currentTermId: string | null;
  currentSessionName?: string;
  currentTermName?: string;
  currencySymbol: string;
  dateFormat: string;
  // Branding / report-card fields (mirrors the website's system settings)
  schoolAddress?: string;
  schoolMotto?: string;
  primaryLogo?: string;
  printLogo?: string;
  principalSignature?: string;
  bursarSignature?: string;
  reportCardConfig?: Record<string, any>;
}

const DEFAULT_SETTINGS: AppSettings = {
  schoolName: '',
  staffIdPrefix: 'STF/',
  admissionNumberPrefix: 'SCH/',
  currentSessionId: null,
  currentTermId: null,
  currentSessionName: '',
  currentTermName: '',
  currencySymbol: '₦',
  dateFormat: 'DD/MM/YYYY',
  schoolAddress: '',
  schoolMotto: '',
  primaryLogo: '',
  printLogo: '',
  principalSignature: '',
  bursarSignature: '',
  reportCardConfig: undefined,
};

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  setSettings: (settings: Partial<AppSettings>) => void;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  setSettings: (incoming) => {
    const merged = { ...get().settings, ...incoming };
    set({ settings: merged });
    AsyncStorage.setItem('app_settings', JSON.stringify(merged));
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        set({ settings: { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));
