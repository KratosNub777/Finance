import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppData } from "@/lib/finance";

const STORAGE_KEY = "pocketwise.personal-budget.v1";
let pendingWrite: Promise<void> = Promise.resolve();

export async function loadLocalData(): Promise<AppData | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? typeof window === "undefined"
          ? null
          : window.localStorage.getItem(STORAGE_KEY)
        : await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as AppData;
    if (!Array.isArray(value.transactions) || !Array.isArray(value.budgets))
      return null;
    return { ...value, isDemo: Boolean(value.isDemo) };
  } catch {
    return null;
  }
}

export async function saveLocalData(data: AppData) {
  const serialized = JSON.stringify(data);
  if (Platform.OS === "web") {
    if (typeof window !== "undefined")
      window.localStorage.setItem(STORAGE_KEY, serialized);
    return;
  }
  const operation = pendingWrite
    .catch(() => {})
    .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized));
  pendingWrite = operation;
  await operation;
}
