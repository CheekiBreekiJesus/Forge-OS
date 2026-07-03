"use client";

import { DataTableActionMenu } from "./data-table-action-menu";
import type { DataTableActionMenuItem } from "./data-table-action-menu";

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
  const items: DataTableActionMenuItem[] = actions.map((action) => ({
    key: action.key,
    label: action.label,
    onClick: action.onClick,
    destructive: action.destructive,
    disabled: action.disabled
  }));

  return <DataTableActionMenu items={items} triggerLabel={triggerLabel} />;
}

export { DataTableActionMenu } from "./data-table-action-menu";
export type { DataTableActionMenuItem } from "./data-table-action-menu";
