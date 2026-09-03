import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SchoolSection {
  id: string;
  name: string;
}

interface SectionState {
  availableSections: SchoolSection[];
  activeSectionId: string;
  loaded: boolean;
  /**
   * @param sections the sections the user may view
   * @param allowAll when true, an empty activeSectionId ("All Sections") is a
   *   valid state (used for admins). When false, the active section is forced to
   *   one of the provided sections (used for section-locked accountants).
   */
  setSections: (sections: SchoolSection[], allowAll?: boolean) => void;
  setActiveSectionId: (id: string) => void;
  loadFromStorage: () => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY = 'active_section_id';

export const useSectionStore = create<SectionState>((set, get) => ({
  availableSections: [],
  activeSectionId: '',
  loaded: false,

  setSections: (sections, allowAll = false) => {
    set({ availableSections: sections });
    const current = get().activeSectionId;
    const isValid = sections.some((s) => s.id === current);
    if (allowAll) {
      // "" (All Sections) is valid. Only clear a stale non-empty selection.
      if (current && !isValid) {
        set({ activeSectionId: '' });
        AsyncStorage.setItem(STORAGE_KEY, '');
      }
      return;
    }
    // Section-locked users must always have one of their sections selected.
    if ((!current || !isValid) && sections.length > 0) {
      const next = sections[0].id;
      set({ activeSectionId: next });
      AsyncStorage.setItem(STORAGE_KEY, next);
    }
  },

  setActiveSectionId: (id) => {
    set({ activeSectionId: id });
    AsyncStorage.setItem(STORAGE_KEY, id);
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      set({ activeSectionId: stored || '', loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  reset: () => set({ availableSections: [], activeSectionId: '' }),
}));
