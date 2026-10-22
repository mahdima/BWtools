"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { SelectCheckbox, TableSelectionContext } from "./table-selection";
import { useTranslations } from "next-intl";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  headerActions?: React.ReactNode;
  filterTabs?: {
    column: string;
    tabs: { label: string; value: any }[];
  }[];
  rowLinkPath?: string;
  title?: string;
  description?: string;
  pageCount?: number;
  isServerSide?: boolean;
  // Bulk-action buttons (P7-03). When given, rows get checkboxes and these show in a bar
  // above the table while rows are selected; they read the selection with
  // useTableSelection(). Rows are identified by their `id`.
  bulkActions?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  headerActions,
  filterTabs,
  rowLinkPath,
  title,
  description,
  pageCount,
  isServerSide = false,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("table");

  const page = searchParams.get("page");
  const initialPageIndex = page ? parseInt(page) - 1 : 0;

  // Server-side tables keep their filter tabs in the URL (the single source of truth),
  // so a reload or the Back button keeps the selected filter.
  const [localColumnFilters, setLocalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const columnFilters: ColumnFiltersState =
    isServerSide && filterTabs
      ? filterTabs.flatMap((group) => {
          const value = searchParams.get(group.column);
          return value ? [{ id: group.column, value }] : [];
        })
      : localColumnFilters;

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next =
      typeof updater === "function" ? updater(columnFilters) : updater;
    if (!isServerSide || !filterTabs) {
      setLocalColumnFilters(next);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    filterTabs.forEach((group) => {
      const active = next.find((f) => f.id === group.column);
      if (active?.value) {
        params.set(group.column, String(active.value));
      } else {
        params.delete(group.column);
      }
    });
    params.delete("page"); // Back to the first page on filter change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: initialPageIndex,
    pageSize: 50,
  });

  // Sync state with URL when pageIndex changes
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentPageParam = params.get("page");
    const targetPage =
      pagination.pageIndex === 0 ? null : (pagination.pageIndex + 1).toString();

    // Prevent redundant updates that cause infinite loops
    if (currentPageParam === targetPage) return;

    if (pagination.pageIndex === 0) {
      params.delete("page");
    } else {
      params.set("page", (pagination.pageIndex + 1).toString());
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pagination.pageIndex, pathname, router, searchParams]);

  // Sync pageIndex if URL changes (e.g. back button)
  React.useEffect(() => {
    const p = searchParams.get("page");
    const newPageIndex = p ? parseInt(p) - 1 : 0;
    if (newPageIndex !== pagination.pageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: newPageIndex }));
    }
  }, [searchParams]);

  // Selection is per list: new data (another page, a filter, or a refresh after a bulk
  // action) starts with nothing selected
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [selectionData, setSelectionData] = React.useState(data);
  if (selectionData !== data) {
    setSelectionData(data);
    setRowSelection({});
  }

  const selectColumn: ColumnDef<TData, TValue> = {
    id: "select",
    header: ({ table }) => (
      <SelectCheckbox
        label={t("selectAll")}
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <SelectCheckbox
        label={t("selectRow", { id: row.id })}
        checked={row.getIsSelected()}
        onChange={(checked) => row.toggleSelected(checked)}
      />
    ),
    enableSorting: false,
  };
  const allColumns = bulkActions !== undefined ? [selectColumn, ...columns] : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId: (row, index) => {
      const id = (row as { id?: unknown }).id;
      return id === undefined || id === null ? String(index) : String(id);
    },
    enableRowSelection: bulkActions !== undefined,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    manualPagination: isServerSide,
    manualFiltering: isServerSide,
    pageCount: isServerSide ? pageCount : undefined,
    state: {
      columnFilters,
      sorting,
      pagination,
      rowSelection,
    },
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  // Debounce search update
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get("search")?.toString() || ""
  );

  React.useEffect(() => {
    if (!isServerSide) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearchParam = searchParams.get("search") || "";

      if (searchValue !== currentSearchParam) {
        if (searchValue) {
          params.set("search", searchValue);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on search change
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue, isServerSide, pathname, router, searchParams]);

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 bg-accent/95 backdrop-blur-sm mb-2">
        {/* Title & Filter Tabs (Left Side) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {(title || description) && (
            <div className="lg:me-8">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 leading-none">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            {filterTabs?.map((filterGroup) => (
              <div key={filterGroup.column} className="flex gap-2">
                {filterGroup.tabs.map((tab) => {
                  const column = table.getColumn(filterGroup.column);
                  const isSelected =
                    tab.value === "All"
                      ? column?.getFilterValue() === undefined
                      : column?.getFilterValue() === tab.value;

                  return (
                    <Button
                      key={tab.value}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-8 border-dashed ${
                        isSelected
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => {
                        if (tab.value === "All") {
                          column?.setFilterValue(undefined); // Clear filter
                        } else {
                          if (isSelected) {
                            column?.setFilterValue(undefined); // Toggle off
                          } else {
                            column?.setFilterValue(tab.value); // Toggle on
                          }
                        }
                      }}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Search & Actions (Right Side) */}
        <div className="flex items-center gap-2">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder ?? t("filterPlaceholder")}
              value={
                isServerSide
                  ? searchValue
                  : (table.getColumn(searchKey)?.getFilterValue() as string) ??
                    ""
              }
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (isServerSide) {
                  setSearchValue(event.target.value);
                } else {
                  table
                    .getColumn(searchKey)
                    ?.setFilterValue(event.target.value);
                }
              }}
              className="w-full lg:max-w-sm"
            />
          )}
          {headerActions}
        </div>
      </div>

      {/* Bulk actions for the selected rows */}
      {bulkActions !== undefined && selectedIds.length > 0 && (
        <TableSelectionContext.Provider value={{ selectedIds, clear: () => setRowSelection({}) }}>
          <div
            role="region"
            aria-label={t("bulkActions")}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm"
          >
            <span className="font-medium text-gray-900">{t("selected", { count: selectedIds.length })}</span>
            {bulkActions}
            <Button variant="ghost" size="sm" className="ms-auto h-8" onClick={() => setRowSelection({})}>
              {t("clearSelection")}
            </Button>
          </div>
        </TableSelectionContext.Provider>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border relative glass-card">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-30 shadow-sm bg-muted/80 backdrop-blur-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="sticky top-0 bg-transparent z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`h-[45px] ${
                    rowLinkPath ? "cursor-pointer hover:bg-accent/50" : ""
                  }`}
                  onClick={() => {
                    if (rowLinkPath) {
                      const id = (row.original as any).id;
                      router.push(`${rowLinkPath}/${id}`);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-18 text-center"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="py-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">{t("firstPage")}</span>
                <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">{t("previousPage")}</span>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <div className="flex items-center justify-center text-sm font-medium w-[100px]">
                {t("pageOf", {
                  page: table.getState().pagination.pageIndex + 1,
                  count: table.getPageCount(),
                })}
              </div>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">{t("nextPage")}</span>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">{t("lastPage")}</span>
                <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
