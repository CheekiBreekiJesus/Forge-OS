"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OVERLAY_Z_INDEX } from "@/components/ui/overlay-layers";
import { computeMenuPosition, type MenuPosition } from "@/components/ui/overlay-position";

export type DataTableActionMenuItem = {
  key: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separator?: boolean;
};

type DataTableActionMenuProps = {
  items: DataTableActionMenuItem[];
  triggerLabel: string;
};

export function DataTableActionMenu({ items, triggerLabel }: DataTableActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const enabledItems = items.filter((item) => !item.separator);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = menu?.offsetWidth ?? 160;
    const menuHeight = menu?.offsetHeight ?? enabledItems.length * 40 + 8;
    setPosition(computeMenuPosition(triggerRect, menuHeight, menuWidth));
  }, [enabledItems.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((current) => (current + 1) % enabledItems.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((current) =>
          current === 0 ? enabledItems.length - 1 : current - 1
        );
      }
      if (event.key === "Enter" || event.key === " ") {
        const item = enabledItems[focusedIndex];
        if (!item || item.disabled) return;
        event.preventDefault();
        setOpen(false);
        item.onClick();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabledItems, focusedIndex, open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => updatePosition());
    }
  }, [open, updatePosition]);

  const menu =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg"
            data-testid="data-table-action-menu"
            id={menuId}
            ref={menuRef}
            role="menu"
            style={{
              top: position.top,
              left: position.left,
              minWidth: position.minWidth,
              zIndex: OVERLAY_Z_INDEX.tableActionMenu
            }}
          >
            {items.map((item) =>
              item.separator ? (
                <div
                  className="my-1 border-t border-slate-700"
                  key={item.key}
                  role="separator"
                />
              ) : (
                <button
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 focus:bg-slate-800 focus:outline-none disabled:opacity-40 ${
                    item.destructive ? "text-red-300" : "text-slate-200"
                  }`}
                  disabled={item.disabled}
                  key={item.key}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                    triggerRef.current?.focus();
                  }}
                  role="menuitem"
                  tabIndex={-1}
                  type="button"
                >
                  {item.label}
                </button>
              )
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
        data-testid="data-table-action-menu-trigger"
        onClick={() => {
          if (!open) setFocusedIndex(0);
          setOpen((value) => !value);
        }}
        ref={triggerRef}
        type="button"
      >
        {triggerLabel}
      </button>
      {menu}
    </>
  );
}
