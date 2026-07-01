import type { StateCreator } from "zustand";
import type { State } from ".";

export interface SettingsState {
  hivePartitioning: boolean;
  setHivePartitioning: (hivePartitioning: boolean) => void;
}

export const createSettingsSlice: StateCreator<State, [], [], SettingsState> = (
  set
) => ({
  hivePartitioning: true,
  setHivePartitioning: (hivePartitioning) => set({ hivePartitioning }),
});
