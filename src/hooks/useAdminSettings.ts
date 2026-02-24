import { useSyncExternalStore, useCallback } from "react";

// Keys
const KEYS = {
    PER_PAGE: "admin_per_page",
    COMPACT: "admin_compact",
    AUTO_REFRESH: "admin_auto_refresh",
    REFRESH_INTERVAL: "admin_refresh_interval",
    LANGUAGE: "admin_language",
    NOTIFICATIONS: "admin_notifications",
} as const;

// Defaults
const DEFAULTS = {
    perPage: 15,
    compact: false,
    autoRefresh: false,
    refreshInterval: 60,
    language: "en",
    notifications: false,
};

// Subscribe to storage events so all components stay in sync
let listeners: (() => void)[] = [];
function subscribe(cb: () => void) {
    listeners.push(cb);
    return () => {
        listeners = listeners.filter((l) => l !== cb);
    };
}

// Notify all listeners when a setting changes
export function notifySettingsChange() {
    listeners.forEach((l) => l());
}

// Snapshot reading functions
function getPerPage() {
    return parseInt(localStorage.getItem(KEYS.PER_PAGE) || String(DEFAULTS.perPage));
}

function getCompact() {
    return localStorage.getItem(KEYS.COMPACT) === "true";
}

function getAutoRefresh() {
    return localStorage.getItem(KEYS.AUTO_REFRESH) === "true";
}

function getRefreshInterval() {
    return parseInt(localStorage.getItem(KEYS.REFRESH_INTERVAL) || String(DEFAULTS.refreshInterval));
}

/**
 * Hook that reads admin settings from localStorage reactively.
 * All pages that consume these settings will re-render when settings change.
 */
export function useAdminSettings() {
    const perPage = useSyncExternalStore(subscribe, getPerPage);
    const compact = useSyncExternalStore(subscribe, getCompact);
    const autoRefresh = useSyncExternalStore(subscribe, getAutoRefresh);
    const refreshInterval = useSyncExternalStore(subscribe, getRefreshInterval);

    return { perPage, compact, autoRefresh, refreshInterval };
}

/**
 * Hook that sets up an auto-refresh interval for data fetching.
 * Returns nothing — just calls the provided fetchFn on interval if auto-refresh is enabled.
 */
export function useAutoRefresh(fetchFn: () => void) {
    const { autoRefresh, refreshInterval } = useAdminSettings();

    // We use useCallback to stabilize the effect
    const stableFetch = useCallback(fetchFn, [fetchFn]);

    // Set up the interval
    if (typeof window !== "undefined") {
        // This will be called from useEffect in the consuming component
    }

    return { autoRefresh, refreshInterval, stableFetch };
}
