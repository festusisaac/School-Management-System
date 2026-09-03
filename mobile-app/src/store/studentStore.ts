import { create } from 'zustand';
import { apiGet } from '../services/api';

/**
 * Holds the logged-in student's own profile (fetched once from
 * /students/profile/me) so the many student screens can read studentId,
 * classId, sectionId, name, etc. without each re-fetching.
 */
interface StudentState {
  profile: any | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (token: string, force?: boolean) => Promise<void>;
  clear: () => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async (token, force = false) => {
    if (!token) return;
    if (get().profile && !force) return;
    set({ loading: true, error: null });
    try {
      const data = await apiGet('/students/profile/me', token);
      set({ profile: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load profile', loading: false });
    }
  },

  clear: () => set({ profile: null, error: null }),
}));
