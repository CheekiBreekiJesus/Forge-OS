"use client";

import { useEffect, useRef, useState } from "react";

export type RowAction = {
  key: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type RowActionMenuProps = {
  actions: RowAction[];
  triggerLabel: string;
};

export function RowActionMenu({ actions, triggerLabel }: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg"
          role="menu"
        >
          {actions.map((action) => (
            <button
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 disabled:opacity-40 ${
                action.destructive ? "text-red-300" : "text-slate-200"
              }`}
              disabled={action.disabled}
              key={action.key}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              role="menuitem"
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
