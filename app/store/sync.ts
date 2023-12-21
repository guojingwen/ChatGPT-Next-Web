import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  AppState,
  getLocalAppState,
  GetStoreState,
  mergeAppState,
  setLocalAppState,
} from "../utils/sync";
import { downloadAs, readFromFile } from "../utils";
import { showToast } from "../components/ui-lib";
import Locale from "../locales";

export interface WebDavConfig {
  server: string;
  username: string;
  password: string;
}

export type SyncStore = GetStoreState<typeof useSyncStore>;

export const useSyncStore = createPersistStore(
  {},
  (set, get) => ({
    export() {
      const state = getLocalAppState();
      const datePart = new Date().toLocaleString();

      const fileName = `Backup-${datePart}.json`;
      downloadAs(JSON.stringify(state), fileName);
    },

    async import() {
      const rawContent = await readFromFile();

      try {
        const remoteState = JSON.parse(rawContent) as AppState;
        const localState = getLocalAppState();
        mergeAppState(localState, remoteState);
        setLocalAppState(localState);
        location.reload();
      } catch (e) {
        console.error("[Import]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },
  }),
  {
    name: StoreKey.Sync,
    version: 1.1,

    migrate(persistedState, version) {
      return persistedState as any;
    },
  },
);
