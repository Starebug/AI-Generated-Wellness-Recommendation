import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SavedTip {
  tipId: string;
  goalLabel: string;
  age: number;
  savedAt: number; // timestamp
}

interface SavedTipsContextType {
  savedTips: SavedTip[];
  saveTip: (tipId: string, goalLabel: string, age: number) => void;
  removeTip: (tipId: string) => void;
  isTipSaved: (tipId: string) => boolean;
}

const SavedTipsContext = createContext<SavedTipsContextType | undefined>(undefined);

const STORAGE_KEY = 'wellnessSavedTips';

export function SavedTipsProvider({ children }: { children: ReactNode }) {
  const [savedTips, setSavedTips] = useState<SavedTip[]>([]);

  // Load saved tips from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedTip[];
        if (Array.isArray(parsed)) {
          setSavedTips(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveTip = (tipId: string, goalLabel: string, age: number) => {
    setSavedTips((prev) => {
      // Check if already saved
      if (prev.some((t) => t.tipId === tipId)) {
        return prev;
      }
      const newTip: SavedTip = {
        tipId,
        goalLabel,
        age,
        savedAt: Date.now(),
      };
      const updated = [...prev, newTip];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const removeTip = (tipId: string) => {
    setSavedTips((prev) => {
      const updated = prev.filter((t) => t.tipId !== tipId);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const isTipSaved = (tipId: string) => {
    return savedTips.some((t) => t.tipId === tipId);
  };

  return (
    <SavedTipsContext.Provider value={{ savedTips, saveTip, removeTip, isTipSaved }}>
      {children}
    </SavedTipsContext.Provider>
  );
}

export function useSavedTips() {
  const context = useContext(SavedTipsContext);
  if (context === undefined) {
    throw new Error('useSavedTips must be used within a SavedTipsProvider');
  }
  return context;
}

