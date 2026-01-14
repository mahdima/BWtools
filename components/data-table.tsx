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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  headerActions,
  filterTabs,
  rowLinkPath,
  title,
  description,
  pageCount,
  isServerSide = false,
}: DataTableProps<TData, TValue>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = searchParams.get("page");
  const initialPageIndex = page ? parseInt(page) - 1 : 0;

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
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
    },
  });

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

  // Sync column filters to URL (for server-side)
  React.useEffect(() => {
    if (!isServerSide || !filterTabs) return;

    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    filterTabs.forEach((group) => {
      const activeFilter = columnFilters.find((f) => f.id === group.column);
      const currentParam = params.get(group.column);

      if (activeFilter && activeFilter.value !== currentParam) {
        params.set(group.column, activeFilter.value as string);
        hasChanges = true;
      } else if (!activeFilter && currentParam) {
        params.delete(group.column);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      params.set("page", "1"); // Reset to page 1 on filter change
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [columnFilters, isServerSide, filterTabs, pathname, router, searchParams]);

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 bg-accent/95 backdrop-blur-sm mb-2">
        {/* Title & Filter Tabs (Left Side) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {(title || description) && (
            <div className="lg:mr-8">
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
              placeholder="Filter..."
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
                  colSpan={columns.length}
                  className="h-18 text-center"
                >
                  No results.
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
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <div className="flex items-center justify-center text-sm font-medium w-[100px]">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
