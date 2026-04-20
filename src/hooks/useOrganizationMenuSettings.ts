import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { isMainPlatformAdmin } from "../types/auth";

export type ModuleFlag =
  | "employeeManagementEnabled"
  | "selfServiceEnabled"
  | "attendanceEnabled"
  | "timesheetEnabled"
  | "leaveManagementEnabled"
  | "holidayManagementEnabled"
  | "payrollEnabled"
  | "travelEnabled"
  | "expenseEnabled";

export type OrganizationMenuSettings = Record<ModuleFlag, boolean>;

export const defaultOrganizationMenuSettings: OrganizationMenuSettings = {
  employeeManagementEnabled: true,
  selfServiceEnabled: true,
  attendanceEnabled: true,
  timesheetEnabled: true,
  leaveManagementEnabled: true,
  holidayManagementEnabled: true,
  payrollEnabled: true,
  travelEnabled: true,
  expenseEnabled: true,
};

const MENU_SETTINGS_CACHE_TTL_MS = 60 * 1000;

let cachedMenuSettings: OrganizationMenuSettings | null = null;
let cachedUserKey: string | null = null;
let cachedAtMs = 0;
let inFlightUserKey: string | null = null;
let inFlightRequest: Promise<OrganizationMenuSettings> | null = null;

const toMenuSettings = (data: any): OrganizationMenuSettings => ({
  employeeManagementEnabled: data?.employeeManagementEnabled !== false,
  selfServiceEnabled: data?.selfServiceEnabled !== false,
  attendanceEnabled: data?.attendanceEnabled !== false,
  timesheetEnabled: data?.timesheetEnabled !== false,
  leaveManagementEnabled: data?.leaveManagementEnabled !== false,
  holidayManagementEnabled: data?.holidayManagementEnabled !== false,
  payrollEnabled: data?.payrollEnabled !== false,
  travelEnabled: data?.travelEnabled !== false,
  expenseEnabled: data?.expenseEnabled !== false,
});

const getUserKey = (user: { id?: number | string; role?: string } | null | undefined) =>
  `${String(user?.id ?? "unknown")}:${String(user?.role ?? "unknown").toLowerCase()}`;

export function invalidateOrganizationMenuSettingsCache() {
  cachedMenuSettings = null;
  cachedUserKey = null;
  cachedAtMs = 0;
  inFlightUserKey = null;
  inFlightRequest = null;
}

export default function useOrganizationMenuSettings() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [menuSettings, setMenuSettings] = useState<OrganizationMenuSettings>(
    defaultOrganizationMenuSettings
  );

  useEffect(() => {
    const role = String(user?.role || "").toLowerCase();
    const userKey = getUserKey(user);

    if (!isAuthenticated) {
      invalidateOrganizationMenuSettingsCache();
      setLoading(false);
      return;
    }

    if (!user || isMainPlatformAdmin(user?.role)) {
      setMenuSettings(defaultOrganizationMenuSettings);
      setLoading(false);
      return;
    }

    const cacheIsFresh = cachedAtMs > 0 && Date.now() - cachedAtMs < MENU_SETTINGS_CACHE_TTL_MS;
    if (cachedMenuSettings && cachedUserKey === userKey && cacheIsFresh) {
      setMenuSettings(cachedMenuSettings);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadMenuSettings = async () => {
      try {
        if (!inFlightRequest || inFlightUserKey !== userKey) {
          inFlightUserKey = userKey;
          inFlightRequest = api
            .get("/api/organizations/current/menu-settings")
            .then((response) => toMenuSettings(response.data))
            .finally(() => {
              inFlightRequest = null;
              inFlightUserKey = null;
            });
        }
        const resolvedSettings = await inFlightRequest;
        if (cancelled) return;
        cachedMenuSettings = resolvedSettings;
        cachedUserKey = userKey;
        cachedAtMs = Date.now();
        setMenuSettings(resolvedSettings);
      } catch {
        if (!cancelled) {
          setMenuSettings(defaultOrganizationMenuSettings);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMenuSettings();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  return { menuSettings, loading };
}
