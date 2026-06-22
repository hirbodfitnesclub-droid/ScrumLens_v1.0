import { create } from "zustand";

interface SelectedFilters {
  projectId: string | null;
  assigneeId: string | null;
  teamId: string | null;
  stateGroup: string | null;
  moduleId: string | null;
  labelId: string | null;
  startDate: string | null; // ISO Date YYYY-MM-DD
  endDate: string | null; // ISO Date YYYY-MM-DD
}

interface UiStoreState {
  filters: SelectedFilters;
  setFilter: <K extends keyof SelectedFilters>(key: K, value: SelectedFilters[K]) => void;
  resetFilters: () => void;
}

const initialFilters: SelectedFilters = {
  projectId: null,
  assigneeId: null,
  teamId: null,
  stateGroup: null,
  moduleId: null,
  labelId: null,
  startDate: null,
  endDate: null,
};

export const useUiStore = create<UiStoreState>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  resetFilters: () => set({ filters: initialFilters }),
}));
