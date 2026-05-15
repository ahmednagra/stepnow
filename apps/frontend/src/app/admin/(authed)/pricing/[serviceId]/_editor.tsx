// apps/frontend/src/app/admin/(authed)/pricing/[serviceId]/_editor.tsx
// Pricing editor: drag-sortable categories + items with create/edit/delete modals.

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronRight, Plus, Pencil, Trash2, RotateCcw, GripVertical,
} from "lucide-react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConfirmDialog } from "@/components/admin";
import { CategoryModal } from "./_category_modal";
import { ItemModal } from "./_item_modal";
import {
  updateAdminPricingCategory, deleteAdminPricingCategory, restoreAdminPricingCategory,
  updateAdminPricingItem, deleteAdminPricingItem, restoreAdminPricingItem,
} from "@/services/pricing";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatPriceEur } from "@/utils/decimal";
import { cn } from "@/utils/cn";
import type { ServiceAdmin, PricingCategoryAdmin, PricingItemAdmin } from "@/types";

interface PricingEditorProps {
  service: ServiceAdmin;
  initialCategories: PricingCategoryAdmin[];
}

export function PricingEditor({ service, initialCategories }: PricingEditorProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [categories, setCategories] = useState<PricingCategoryAdmin[]>(initialCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialCategories.filter((c) => !c.is_deleted).map((c) => c.id)),
  );
  const [showDeleted, setShowDeleted] = useState(false);

  const [categoryModal, setCategoryModal] = useState<
    { mode: "create" } | { mode: "edit"; category: PricingCategoryAdmin } | null
  >(null);
  const [itemModal, setItemModal] = useState<
    | { mode: "create"; categoryId: string }
    | { mode: "edit"; item: PricingItemAdmin }
    | null
  >(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<PricingCategoryAdmin | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<PricingItemAdmin | null>(null);

  const visibleCategories = showDeleted ? categories : categories.filter((c) => !c.is_deleted);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Reorder categories ---
  async function onCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleCategories.findIndex((c) => c.id === active.id);
    const newIndex = visibleCategories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(visibleCategories, oldIndex, newIndex);
    const prev = categories;
    setCategories(reordered);

    try {
      await Promise.all(
        reordered.map((c, idx) =>
          c.sort_order === idx ? Promise.resolve(c) : updateAdminPricingCategory(c.id, { sort_order: idx }),
        ),
      );
      pushToast("success", "Categories reordered");
      router.refresh();
    } catch (err) {
      setCategories(prev);
      pushToast("error", "Reorder failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  // --- Reorder items ---
  async function onItemDragEnd(categoryId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const visible = showDeleted ? cat.items : cat.items.filter((i) => !i.is_deleted);
    const oldIndex = visible.findIndex((i) => i.id === active.id);
    const newIndex = visible.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(visible, oldIndex, newIndex);
    const prev = categories;
    setCategories((cats) => cats.map((c) => (c.id === categoryId ? { ...c, items: reordered } : c)));

    try {
      await Promise.all(
        reordered.map((i, idx) =>
          i.sort_order === idx ? Promise.resolve(i) : updateAdminPricingItem(i.id, { sort_order: idx }),
        ),
      );
      pushToast("success", "Items reordered");
      router.refresh();
    } catch (err) {
      setCategories(prev);
      pushToast("error", "Reorder failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  // --- Modal callbacks ---
  const onCategorySaved = useCallback(
    (saved: PricingCategoryAdmin) => {
      setCategories((cats) => {
        const idx = cats.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const merged = { ...saved, items: saved.items ?? cats[idx].items };
          return cats.map((c, i) => (i === idx ? merged : c));
        }
        return [...cats, { ...saved, items: saved.items ?? [] }];
      });
      setExpandedIds((prev) => new Set(prev).add(saved.id));
      setCategoryModal(null);
      pushToast("success", "Category saved");
      router.refresh();
    },
    [pushToast, router],
  );

  const onItemSaved = useCallback(
    (saved: PricingItemAdmin) => {
      setCategories((cats) =>
        cats.map((c) =>
          c.id === saved.category_id
            ? {
                ...c,
                items:
                  c.items.findIndex((i) => i.id === saved.id) >= 0
                    ? c.items.map((i) => (i.id === saved.id ? saved : i))
                    : [...c.items, saved],
              }
            : c,
        ),
      );
      setItemModal(null);
      pushToast("success", "Item saved");
      router.refresh();
    },
    [pushToast, router],
  );

  async function onDeleteCategory(c: PricingCategoryAdmin) {
    try {
      await deleteAdminPricingCategory(c.id);
      setCategories((cats) => cats.map((x) => (x.id === c.id ? { ...x, is_deleted: true } : x)));
      pushToast("success", "Category deleted", "Soft-deleted; restore to undo.");
      router.refresh();
    } catch (err) {
      pushToast("error", "Delete failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  async function onRestoreCategory(c: PricingCategoryAdmin) {
    try {
      const restored = await restoreAdminPricingCategory(c.id);
      setCategories((cats) => cats.map((x) => (x.id === c.id ? { ...x, ...restored } : x)));
      pushToast("success", "Category restored");
      router.refresh();
    } catch (err) {
      pushToast("error", "Restore failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  async function onDeleteItem(item: PricingItemAdmin) {
    try {
      await deleteAdminPricingItem(item.id);
      setCategories((cats) =>
        cats.map((c) =>
          c.id === item.category_id
            ? { ...c, items: c.items.map((i) => (i.id === item.id ? { ...i, is_deleted: true } : i)) }
            : c,
        ),
      );
      pushToast("success", "Item deleted");
      router.refresh();
    } catch (err) {
      pushToast("error", "Delete failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  async function onRestoreItem(item: PricingItemAdmin) {
    try {
      const restored = await restoreAdminPricingItem(item.id);
      setCategories((cats) =>
        cats.map((c) =>
          c.id === item.category_id
            ? { ...c, items: c.items.map((i) => (i.id === item.id ? restored : i)) }
            : c,
        ),
      );
      pushToast("success", "Item restored");
      router.refresh();
    } catch (err) {
      pushToast("error", "Restore failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/pricing"
          className="flex h-8 items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-3 w-3" />
          All services
        </Link>
        <div className="flex items-center gap-2">
          <label className="flex h-8 items-center gap-2 text-[12px] text-slate-600">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Show deleted
          </label>
          <button
            type="button"
            onClick={() => setCategoryModal({ mode: "create" })}
            className="flex h-8 items-center gap-1.5 bg-slate-900 px-3 text-[12px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3 w-3" />
            New category
          </button>
        </div>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-[13px] text-slate-500">No pricing categories yet.</p>
          <button
            type="button"
            onClick={() => setCategoryModal({ mode: "create" })}
            className="mt-3 inline-flex h-8 items-center gap-1.5 bg-slate-900 px-3 text-[12px] font-medium text-white"
          >
            <Plus className="h-3 w-3" />
            Create first category
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDragEnd}>
          <SortableContext items={visibleCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {visibleCategories.map((cat) => {
                const isExpanded = expandedIds.has(cat.id);
                return (
                  <SortableCategoryRow
                    key={cat.id}
                    category={cat}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpanded(cat.id)}
                    onEdit={() => setCategoryModal({ mode: "edit", category: cat })}
                    onDelete={() => setConfirmDeleteCategory(cat)}
                    onRestore={() => onRestoreCategory(cat)}
                    onAddItem={() => setItemModal({ mode: "create", categoryId: cat.id })}
                    onEditItem={(it) => setItemModal({ mode: "edit", item: it })}
                    onDeleteItem={(it) => setConfirmDeleteItem(it)}
                    onRestoreItem={(it) => void onRestoreItem(it)}
                    onItemDragEnd={(e) => onItemDragEnd(cat.id, e)}
                    sensors={sensors}
                    showDeleted={showDeleted}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Modals */}
      {categoryModal && (
        <CategoryModal
          serviceId={service.id}
          mode={categoryModal.mode}
          category={categoryModal.mode === "edit" ? categoryModal.category : undefined}
          nextSortOrder={categories.filter((c) => !c.is_deleted).length}
          onClose={() => setCategoryModal(null)}
          onSaved={onCategorySaved}
        />
      )}

      {itemModal && (
        <ItemModal
          mode={itemModal.mode}
          categoryId={itemModal.mode === "create" ? itemModal.categoryId : itemModal.item.category_id}
          item={itemModal.mode === "edit" ? itemModal.item : undefined}
          nextSortOrder={(() => {
            const catId = itemModal.mode === "create" ? itemModal.categoryId : itemModal.item.category_id;
            const c = categories.find((c) => c.id === catId);
            return c ? c.items.filter((i) => !i.is_deleted).length : 0;
          })()}
          onClose={() => setItemModal(null)}
          onSaved={onItemSaved}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteCategory !== null}
        title="Delete this category?"
        description={
          confirmDeleteCategory
            ? `"${confirmDeleteCategory.name_de}" and all its items will be soft-deleted. You can restore them any time.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (confirmDeleteCategory) {
            const t = confirmDeleteCategory;
            setConfirmDeleteCategory(null);
            void onDeleteCategory(t);
          }
        }}
        onCancel={() => setConfirmDeleteCategory(null)}
      />

      <ConfirmDialog
        open={confirmDeleteItem !== null}
        title="Delete this pricing item?"
        description="It will be soft-deleted. You can restore it any time."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (confirmDeleteItem) {
            const t = confirmDeleteItem;
            setConfirmDeleteItem(null);
            void onDeleteItem(t);
          }
        }}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
}

// =============================================================================
// SortableCategoryRow
// =============================================================================

interface SortableCategoryRowProps {
  category: PricingCategoryAdmin;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onAddItem: () => void;
  onEditItem: (item: PricingItemAdmin) => void;
  onDeleteItem: (item: PricingItemAdmin) => void;
  onRestoreItem: (item: PricingItemAdmin) => void;
  onItemDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  showDeleted: boolean;
}

function SortableCategoryRow({
  category, isExpanded, onToggle, onEdit, onDelete, onRestore,
  onAddItem, onEditItem, onDeleteItem, onRestoreItem, onItemDragEnd,
  sensors, showDeleted,
}: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const items = showDeleted ? category.items : category.items.filter((i) => !i.is_deleted);
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("border border-slate-200 bg-white", category.is_deleted && "opacity-60")}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab text-slate-400 hover:text-slate-700 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-slate-900">{category.name_de}</p>
            <p className="text-[11px] text-slate-500">{category.name_en}</p>
          </div>
          <span className="text-[11px] tabular-nums text-slate-500">
            {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {category.is_deleted ? (
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex h-7 items-center gap-1 border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                title="Edit category"
                className="inline-flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Delete category"
                className="inline-flex h-7 w-7 items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {category.description_de && (
        <div className="border-t border-slate-100 px-10 py-2 text-[11px] text-slate-500">
          {category.description_de}
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-3">
          {sortedItems.length === 0 ? (
            <p className="px-2 py-2 text-[12px] italic text-slate-400">No items in this category.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
              <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-1.5">
                  {sortedItems.map((item) => (
                    <SortableItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item)}
                      onRestore={() => onRestoreItem(item)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
          {!category.is_deleted && (
            <button
              type="button"
              onClick={onAddItem}
              className="mt-2 inline-flex h-7 items-center gap-1 border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              <Plus className="h-3 w-3" />
              Add item
            </button>
          )}
        </div>
      )}
    </li>
  );
}

// =============================================================================
// SortableItemRow
// =============================================================================

interface SortableItemRowProps {
  item: PricingItemAdmin;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

function SortableItemRow({ item, onEdit, onDelete, onRestore }: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const route =
    item.from_location_de && item.to_location_de
      ? `${item.from_location_de} → ${item.to_location_de}`
      : item.from_location_de ?? item.to_location_de ?? "—";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 border border-slate-200 bg-white px-2.5 py-1.5",
        item.is_deleted && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab text-slate-400 hover:text-slate-700 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-slate-900">{route}</p>
        {item.note_de && <p className="truncate text-[10px] italic text-slate-500">{item.note_de}</p>}
      </div>
      <span className="shrink-0 tabular-nums text-[12px] font-medium text-slate-900">
        {formatPriceEur(item.price_eur)}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {item.is_deleted ? (
          <button
            type="button"
            onClick={onRestore}
            className="inline-flex h-6 items-center gap-1 border border-slate-300 bg-white px-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Restore
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              title="Edit item"
              className="inline-flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete item"
              className="inline-flex h-6 w-6 items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
