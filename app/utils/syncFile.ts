"use client";
import { downloadAs, readFromFile } from "../utils";
import {
  AppState,
  getLocalAppState,
  mergeAppState,
  setLocalAppState,
} from "../utils/sync";
import { showToast } from "../components/ui-lib";
import Locale from "../locales";

export function exportFile() {
  const state = getLocalAppState();
  const datePart = new Date().toLocaleString();

  const fileName = `Backup-${datePart}.json`;
  downloadAs(JSON.stringify(state), fileName);
}

export async function importFile() {
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
}
