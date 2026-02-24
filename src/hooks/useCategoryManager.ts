import { useState, useCallback } from "react";
import { CATEGORIES as DEFAULT_CATEGORIES, SUBCATEGORIES as DEFAULT_SUBCATEGORIES } from "@/types/trip";

const CAT_KEY = "tripfund_custom_categories";
const SUB_KEY = "tripfund_custom_subcategories";

export interface CategoryData {
  name: string;
  subcategories: string[];
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch {
    return fallback;
  }
}

function buildDefaults(): CategoryData[] {
  return DEFAULT_CATEGORIES.map((c) => ({
    name: c,
    subcategories: [...DEFAULT_SUBCATEGORIES[c]],
  }));
}

function loadCategories(): CategoryData[] {
  const saved = loadJson<CategoryData[] | null>(CAT_KEY, null);
  if (saved && saved.length > 0) return saved;

  // Migrate from old custom subcategory storage
  const oldCustomSubs = loadJson<Record<string, string[]>>(SUB_KEY, {});
  const defaults = buildDefaults();
  if (Object.keys(oldCustomSubs).length > 0) {
    defaults.forEach((cat) => {
      const custom = oldCustomSubs[cat.name] || [];
      if (custom.length > 0) {
        const existing = new Set(cat.subcategories.map((s) => s.toLowerCase()));
        const newOnes = custom.filter((c) => !existing.has(c.toLowerCase()));
        cat.subcategories = [...newOnes, ...cat.subcategories];
      }
    });
  }
  return defaults;
}

function saveCategories(data: CategoryData[]) {
  localStorage.setItem(CAT_KEY, JSON.stringify(data));
}

export function useCategoryManager() {
  const [categories, setCategories] = useState<CategoryData[]>(loadCategories);

  const update = useCallback((updater: (prev: CategoryData[]) => CategoryData[]) => {
    setCategories((prev) => {
      const next = updater(prev);
      saveCategories(next);
      return next;
    });
  }, []);

  const getCategoryNames = useCallback(() => categories.map((c) => c.name), [categories]);

  const getSubcategories = useCallback(
    (categoryName: string): string[] => {
      const cat = categories.find((c) => c.name === categoryName);
      return cat ? cat.subcategories : [];
    },
    [categories]
  );

  // Category operations
  const addCategory = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return false;
      update((prev) => [{ name: trimmed, subcategories: ["General"] }, ...prev]);
      return true;
    },
    [categories, update]
  );

  const renameCategory = useCallback(
    (oldName: string, newName: string): boolean => {
      const trimmed = newName.trim();
      if (!trimmed) return false;
      if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName)) return false;
      update((prev) => prev.map((c) => (c.name === oldName ? { ...c, name: trimmed } : c)));
      return true;
    },
    [categories, update]
  );

  const deleteCategory = useCallback(
    (name: string) => {
      update((prev) => prev.filter((c) => c.name !== name));
    },
    [update]
  );

  const reorderCategories = useCallback(
    (fromIndex: number, toIndex: number) => {
      update((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [update]
  );

  // Subcategory operations
  const addSubcategory = useCallback(
    (categoryName: string, subName: string): boolean => {
      const trimmed = subName.trim();
      if (!trimmed) return false;
      const cat = categories.find((c) => c.name === categoryName);
      if (!cat) return false;
      if (cat.subcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return false;
      update((prev) =>
        prev.map((c) =>
          c.name === categoryName ? { ...c, subcategories: [trimmed, ...c.subcategories] } : c
        )
      );
      return true;
    },
    [categories, update]
  );

  const renameSubcategory = useCallback(
    (categoryName: string, oldName: string, newName: string): boolean => {
      const trimmed = newName.trim();
      if (!trimmed) return false;
      const cat = categories.find((c) => c.name === categoryName);
      if (!cat) return false;
      if (cat.subcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase() && s !== oldName)) return false;
      update((prev) =>
        prev.map((c) =>
          c.name === categoryName
            ? { ...c, subcategories: c.subcategories.map((s) => (s === oldName ? trimmed : s)) }
            : c
        )
      );
      return true;
    },
    [categories, update]
  );

  const deleteSubcategory = useCallback(
    (categoryName: string, subName: string) => {
      update((prev) =>
        prev.map((c) =>
          c.name === categoryName
            ? { ...c, subcategories: c.subcategories.filter((s) => s !== subName) }
            : c
        )
      );
    },
    [update]
  );

  const reorderSubcategories = useCallback(
    (categoryName: string, fromIndex: number, toIndex: number) => {
      update((prev) =>
        prev.map((c) => {
          if (c.name !== categoryName) return c;
          const subs = [...c.subcategories];
          const [moved] = subs.splice(fromIndex, 1);
          subs.splice(toIndex, 0, moved);
          return { ...c, subcategories: subs };
        })
      );
    },
    [update]
  );

  return {
    categories,
    getCategoryNames,
    getSubcategories,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    addSubcategory,
    renameSubcategory,
    deleteSubcategory,
    reorderSubcategories,
  };
}
