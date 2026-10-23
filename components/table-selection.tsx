"use client";

import { createContext, useContext, useEffect, useRef } from "react";

// The rows selected in a DataTable (P7-03), for the bulk-action buttons a page passes
// in as `bulkActions`. Ids are the rows' `id` values as strings.
export const TableSelectionContext = createContext<{ selectedIds: string[]; clear: () => void }>({
  selectedIds: [],
  clear: () => {},
});

export function useTableSelection() {
  return useContext(TableSelectionContext);
}

// A row (or select-all) checkbox. Clicks don't reach the row, which may be a link.
export function SelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
    />
  );
}
