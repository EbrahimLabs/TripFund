import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { useCategoryManager, CategoryData } from "@/hooks/useCategoryManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

export default function ManageCategories() {
  const navigate = useNavigate();
  const {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    addSubcategory,
    renameSubcategory,
    deleteSubcategory,
    reorderSubcategories,
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
    } else {
      toast.error("Already exists or empty");
    }
  };

  const handleSaveCatRename = (oldName: string) => {
    if (renameCategory(oldName, editCatValue)) {
      toast.success("Category renamed!");
      if (expandedCat === oldName) setExpandedCat(editCatValue.trim());
      setEditingCat(null);
    } else {
      toast.error("Already exists or empty");
    }
  };

  const handleSaveSubRename = (catName: string, oldSub: string) => {
    if (renameSubcategory(catName, oldSub, editSubValue)) {
      toast.success("Subcategory renamed!");
      setEditingSub(null);
    } else {
      toast.error("Already exists or empty");
    }
  };

  const handleAddSub = (catName: string) => {
    if (addSubcategory(catName, newSubName)) {
      toast.success("Subcategory added!");
      setNewSubName("");
      setAddingSubForCat(null);
    } else {
      toast.error("Already exists or empty");
    }
  };

  return (
    <>
      <PageShell title="Manage Categories">
        <div className="space-y-4">
          {/* Add category */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowAddCat((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Category
            </Button>
          </div>

          <AnimatePresence>
            {showAddCat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 overflow-hidden"
              >
                <Input
                  placeholder="Category name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                    if (e.key === "Escape") setShowAddCat(false);
                  }}
                />
                <Button size="sm" className="h-9" onClick={handleAddCategory}>
                  Add
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category list */}
          <div className="space-y-2">
            {categories.map((cat, catIdx) => (
              <motion.div
                key={cat.name}
                layout
                className="rounded-lg border bg-card overflow-hidden"
              >
                {/* Category header */}
                <div className="flex items-center gap-2 p-3">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      disabled={catIdx === 0}
                      onClick={() => reorderCategories(catIdx, catIdx - 1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      disabled={catIdx === categories.length - 1}
                      onClick={() => reorderCategories(catIdx, catIdx + 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Name / edit */}
                  {editingCat === cat.name ? (
                    <div className="flex gap-1.5 flex-1">
                      <Input
                        value={editCatValue}
                        onChange={(e) => setEditCatValue(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCatRename(cat.name);
                          if (e.key === "Escape") setEditingCat(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSaveCatRename(cat.name)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingCat(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex-1 text-left text-sm font-semibold flex items-center gap-2"
                      onClick={() =>
                        setExpandedCat((prev) => (prev === cat.name ? null : cat.name))
                      }
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          expandedCat === cat.name ? "rotate-90" : ""
                        }`}
                      />
                      {cat.name}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({cat.subcategories.length})
                      </span>
                    </button>
                  )}

                  {editingCat !== cat.name && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingCat(cat.name);
                          setEditCatValue(cat.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the category and all its subcategories. Existing transactions won't be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteCategory(cat.name);
                                toast.success("Category deleted");
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                {/* Subcategories */}
                <AnimatePresence>
                  {expandedCat === cat.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                        {/* Add subcategory */}
                        <div className="flex justify-end mb-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 gap-1"
                            onClick={() =>
                              setAddingSubForCat((prev) =>
                                prev === cat.name ? null : cat.name
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                            Add Sub
                          </Button>
                        </div>

                        <AnimatePresence>
                          {addingSubForCat === cat.name && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-2 overflow-hidden mb-2"
                            >
                              <Input
                                placeholder="Subcategory name..."
                                value={newSubName}
                                onChange={(e) => setNewSubName(e.target.value)}
                                className="h-8 text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddSub(cat.name);
                                  if (e.key === "Escape") setAddingSubForCat(null);
                                }}
                              />
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleAddSub(cat.name)}
                              >
                                Add
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {cat.subcategories.map((sub, subIdx) => (
                          <div
                            key={sub}
                            className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-2"
                          >
                            {/* Reorder */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                disabled={subIdx === 0}
                                onClick={() =>
                                  reorderSubcategories(cat.name, subIdx, subIdx - 1)
                                }
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                disabled={subIdx === cat.subcategories.length - 1}
                                onClick={() =>
                                  reorderSubcategories(cat.name, subIdx, subIdx + 1)
                                }
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>

                            {editingSub?.cat === cat.name && editingSub?.sub === sub ? (
                              <div className="flex gap-1.5 flex-1">
                                <Input
                                  value={editSubValue}
                                  onChange={(e) => setEditSubValue(e.target.value)}
                                  className="h-7 text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveSubRename(cat.name, sub);
                                    if (e.key === "Escape") setEditingSub(null);
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleSaveSubRename(cat.name, sub)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingSub(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 text-xs">{sub}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setEditingSub({ cat: cat.name, sub });
                                    setEditSubValue(sub);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete "{sub}"?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Remove this subcategory from {cat.name}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          deleteSubcategory(cat.name, sub);
                                          toast.success("Subcategory deleted");
                                        }}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        ))}

                        {cat.subcategories.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No subcategories yet
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No categories yet. Add one to get started.
            </p>
          )}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
