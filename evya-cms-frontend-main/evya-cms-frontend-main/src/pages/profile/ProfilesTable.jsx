import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

export function ProfilesTable({ data, globalFilter, totalElements, onRowClick, type = 'driver' }) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Define columns based on the profile type
  const columns = useMemo(() => {
    // Common columns for all profile types
    const commonColumns = [
      {
        accessorKey: "firstName",
        header: "First Name",
        accessorFn: (row) => {
          // Handle different data structures based on API responses
          if (row.fullname) {
            const nameParts = row.fullname.split(' ');
            return nameParts[0] || '';
          }
          return row.firstName || '';
        }
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
        accessorFn: (row) => {
          // Handle different data structures based on API responses
          if (row.fullname) {
            const nameParts = row.fullname.split(' ');
            return nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          }
          return row.lastName || '';
        }
      },
      {
        accessorKey: "phone",
        header: "Phone",
        accessorFn: (row) => {
          return row.mobileNumber || row.phoneNumber || row.phone || '';
        }
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "status",
        header: "Status",
        accessorFn: (row) => row.enabled ? 'Active' : 'Inactive',
      },
    ];

    // For driver type, we don't show organization details
    if (type === 'driver') {
      return commonColumns;
    }
    
    // For whitelabel type, include organization details
    return [
      {
        accessorKey: "orgName",
        header: "Organization",
        accessorFn: (row) => {
          return row.orgName || (row.org && row.org[0] ? row.org[0].orgName : '');
        }
      },
      ...commonColumns,
      {
        accessorKey: "dealerOrg",
        header: "Enterprise Manager Org",
        accessorFn: (row) => {
          if (row.dealerOrg && typeof row.dealerOrg === 'object') {
            return row.dealerOrg.orgName || '';
          }
          return row.dealerOrg || '';
        }
      },
    ];
  }, [type]);

  // Process the data to handle different API response formats
  const processedData = useMemo(() => {
    if (!data) return [];
    
    // Handle driver list format (sites array)
    if (type === 'driver' && data.sites) {
      return data.sites;
    }
    
    // Handle content array format (for whitelabel)
    if (data.content) {
      return data.content;
    }
    
    // Default case, when data is already an array
    return Array.isArray(data) ? data : [];
  }, [data, type]);

  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    manualPagination: true,
    pageCount: Math.ceil(totalElements / pagination.pageSize),
  });

  const handleRowClick = React.useCallback((row) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  }, [onRowClick]);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row)}
                  className="cursor-pointer hover:bg-secondary/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </>
  );
}