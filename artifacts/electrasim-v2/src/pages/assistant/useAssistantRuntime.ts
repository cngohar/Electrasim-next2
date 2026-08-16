import { useCallback, useState } from 'react';
import { useLocation } from 'wouter';
import type { CalculationLogEntry } from '@/components/CalculationHistoryLog';
import type { ElectricalStandard } from '@/lib/standards';
import { routeForLegacyToolId, type AssistantToolId } from './toolCatalog';

const HISTORY_KEY = 'electrasim_calculation_history';
const THEME_KEY = 'electrasim_theme';
const STANDARD_KEY = 'electrasim_standard';
const PENDING_HISTORY_KEY = 'electrasim_pending_history';

function readHistory(): CalculationLogEntry[] {
  try {
    const value = localStorage.getItem(HISTORY_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export function consumePendingHistory(toolId: AssistantToolId) {
  try {
    const value = sessionStorage.getItem(PENDING_HISTORY_KEY);
    if (!value) return null;
    const entry = JSON.parse(value) as CalculationLogEntry;
    const route = routeForLegacyToolId(entry.toolId);
    if (route !== `/assistant/${toolId}`) return null;
    sessionStorage.removeItem(PENDING_HISTORY_KEY);
    return entry;
  } catch {
    return null;
  }
}

export function useAssistantRuntime() {
  const [, navigate] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [standard, setStandardState] = useState<ElectricalStandard>(() => {
    try {
      return localStorage.getItem(STANDARD_KEY) === 'NEC' ? 'NEC' : 'IEC';
    } catch {
      return 'IEC';
    }
  });
  const [history, setHistory] = useState<CalculationLogEntry[]>(readHistory);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, next); } catch { /* storage is optional */ }
      return next;
    });
  }, []);

  const setStandard = useCallback((next: ElectricalStandard) => {
    setStandardState(next);
    try { localStorage.setItem(STANDARD_KEY, next); } catch { /* storage is optional */ }
  }, []);

  const saveToHistory = useCallback((entry: CalculationLogEntry) => {
    setHistory((current) => {
      const next = [entry, ...current.filter((item) => item.summary !== entry.summary)].slice(0, 50);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* storage is optional */ }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* storage is optional */ }
  }, []);

  const removeHistoryEntry = useCallback((id: string) => {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* storage is optional */ }
      return next;
    });
  }, []);

  const selectHistoryEntry = useCallback((entry: CalculationLogEntry) => {
    const route = routeForLegacyToolId(entry.toolId);
    if (!route) return;
    try { sessionStorage.setItem(PENDING_HISTORY_KEY, JSON.stringify(entry)); } catch { /* storage is optional */ }
    setIsHistoryOpen(false);
    navigate(route);
  }, [navigate]);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    standard,
    setStandard,
    history,
    isHistoryOpen,
    setIsHistoryOpen,
    saveToHistory,
    clearHistory,
    removeHistoryEntry,
    selectHistoryEntry,
  };
}

export type AssistantRuntime = ReturnType<typeof useAssistantRuntime>;
