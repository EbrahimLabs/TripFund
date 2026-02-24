import { useState } from "react";
import { useCategoryManager } from "@/hooks/useCategoryManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ChevronRight, Check, X } from "lucide-react";

export function CategoryManager() {
  const {
    categories, addCategory, renameCategory, deleteCategory,
    reorderCategories, addSubcategory, renameSubcategory,
    deleteSubcategory, reorderSubcategories,
  } = useCategoryManager();

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState("");
  const [editingSub, setEditingSub] = useState<{ cat: string; sub: string } | null>(null);
  const [editSubValue, setEditSubValue] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [addingSubForCat, setAddingSubForCat] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (addCategory(newCatName)) {
      toast.success("Category added!");
      setNewCatName("");
      setShowAddCat(false);
    } else toast.error("Already exists or empty");
  };

  const handleSaveCatRename = (oldName: string) => {
    if (renameCategory(oldName, editCatValue)) {
      toast.success("Renamed!");
      if (expandedCat === oldName) setExpandedCat(editCatValue.trim());
      setEditingCat(null);
    } else toast.error("Already exists or empty");
  };

  const handleSaveSubRename = (catName: string, oldSub: string) => {
    if (renameSubcategory(catName, oldSub, editSubValue)) {
      toast.success("Renamed!");
      setEditingSub(null);
    } else toast.error("Already exists or empty");
  };

  const handleAddSub = (catName: string) => {
    if (addSubcategory(catName, newSubName)) {
      toast.success("Subcategory added!");
      setNewSubName("");
      setAddingSubForCat(null);
    } else toast.error("Already exists or empty");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Categories</Label>
        <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setShowAddCat((v) => !v)}>
          <Plus className="h-3 w-3" /> New
        </Button>
      </div>

      <AnimatePresence>
        {showAddCat && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-hidden">
            <Input placeholder="Category name..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="h-8 text-xs" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setShowAddCat(false); }} />
            <Button size="sm" className="h-8 text-xs" onClick={handleAddCategory}>Add</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
        {categories.map((cat, catIdx) => (
          <div key={cat.name} className="rounded-lg border bg-background overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-1.5 px-2 py-2">
              <div className="flex flex-col">
                <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={catIdx === 0}
                  onClick={() => reorderCategories(catIdx, catIdx - 1)}>
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={catIdx === categories.length - 1}
                  onClick={() => reorderCategories(catIdx, catIdx + 1)}>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {editingCat === cat.name ? (
                <div className="flex gap-1 flex-1">
                  <Input value={editCatValue} onChange={(e) => setEditCatValue(e.target.value)} className="h-7 text-xs" autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveCatRename(cat.name); if (e.key === "Escape") setEditingCat(null); }} />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleSaveCatRename(cat.name)}><Check className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingCat(null)}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <button type="button" className="flex-1 text-left text-xs font-semibold flex items-center gap-1.5"
                  onClick={() => setExpandedCat((prev) => (prev === cat.name ? null : cat.name))}>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedCat === cat.name ? "rotate-90" : ""}`} />
                  {cat.name}
                  <span className="text-muted-foreground font-normal">({cat.subcategories.length})</span>
                </button>
              )}

              {editingCat !== cat.name && (
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingCat(cat.name); setEditCatValue(cat.name); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This removes the category and all subcategories. Existing transactions are unaffected.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteCategory(cat.name); toast.success("Deleted"); }}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Subcategories */}
            <AnimatePresence>
              {expandedCat === cat.name && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t px-2 pb-2 pt-1.5 space-y-1">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" className="text-xs h-5 px-1.5 gap-0.5"
                        onClick={() => setAddingSubForCat((prev) => (prev === cat.name ? null : cat.name))}>
                        <Plus className="h-2.5 w-2.5" /> Add
                      </Button>
                    </div>

                    <AnimatePresence>
                      {addingSubForCat === cat.name && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-1.5 overflow-hidden">
                          <Input placeholder="Subcategory..." value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="h-7 text-xs" autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddSub(cat.name); if (e.key === "Escape") setAddingSubForCat(null); }} />
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleAddSub(cat.name)}>Add</Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {cat.subcategories.map((sub, subIdx) => (
                      <div key={sub} className="flex items-center gap-1.5 rounded border bg-card px-2 py-1.5">
                        <div className="flex flex-col">
                          <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={subIdx === 0}
                            onClick={() => reorderSubcategories(cat.name, subIdx, subIdx - 1)}>
                            <ChevronUp className="h-2.5 w-2.5" />
                          </button>
                          <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={subIdx === cat.subcategories.length - 1}
                            onClick={() => reorderSubcategories(cat.name, subIdx, subIdx + 1)}>
                            <ChevronDown className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        {editingSub?.cat === cat.name && editingSub?.sub === sub ? (
                          <div className="flex gap-1 flex-1">
                            <Input value={editSubValue} onChange={(e) => setEditSubValue(e.target.value)} className="h-6 text-xs" autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveSubRename(cat.name, sub); if (e.key === "Escape") setEditingSub(null); }} />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSaveSubRename(cat.name, sub)}><Check className="h-2.5 w-2.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingSub(null)}><X className="h-2.5 w-2.5" /></Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-xs">{sub}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setEditingSub({ cat: cat.name, sub }); setEditSubValue(sub); }}>
                              <Pencil className="h-2.5 w-2.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive hover:text-destructive"><Trash2 className="h-2.5 w-2.5" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{sub}"?</AlertDialogTitle>
                                  <AlertDialogDescription>Remove from {cat.name}.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => { deleteSubcategory(cat.name, sub); toast.success("Deleted"); }}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    ))}
                    {cat.subcategories.length === 0 && <p className="text-xs text-muted-foreground text-center py-1">No subcategories</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
