import { useState, useCallback } from "react";
import { Category, SUBCATEGORIES } from "@/types/trip";

const STORAGE_KEY = "tripfund_custom_subcategories";

function load(): Record<string, string[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useCustomSubcategories() {
  const [custom, setCustom] = useState<Record<string, string[]>>(load);

  const getSubcategories = useCallback(
    (category: Category): string[] => {
      const userSubs = custom[category] || [];
      const defaults = SUBCATEGORIES[category];
      // Custom ones first, then defaults (no duplicates)
      return [...userSubs, ...defaults.filter((d) => !userSubs.includes(d))];
    },
    [custom]
  );

  const addSubcategory = useCallback((category: Category, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setCustom((prev) => {
      const existing = prev[category] || [];
      const defaults = SUBCATEGORIES[category];
      if (
        existing.some((s) => s.toLowerCase() === trimmed.toLowerCase()) ||
        defaults.some((s) => s.toLowerCase() === trimmed.toLowerCase())
      ) {
        return prev;
      }
      const updated = { ...prev, [category]: [trimmed, ...existing] };
      save(updated);
      return updated;
    });
    return true;
  }, []);

  return { getSubcategories, addSubcategory };
}
