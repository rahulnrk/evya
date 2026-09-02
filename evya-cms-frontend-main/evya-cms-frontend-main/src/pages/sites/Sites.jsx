import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSites } from '@/store/reducers/sites/sitesSlice';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DeleteOtp from "@/users/DeleteOtp";
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";
import Loading from '@/users/Loading';
import { InfoIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Sites() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, status, error, totalElements } = useSelector((state) => state.sites);
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / pageSize));
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentsite, setCurrentsite] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { user } = useSelector(state => state.authentication);
  console.log("user",user.orgId);
  
  useEffect(() => {
      dispatch(fetchSites({ 
      page: currentPage, 
      size: pageSize, 
      sortBy: 'id', 
      orderBy: 'desc',
      orgId: user.orgId ,
      search: searchInput
    }));
  }
, [dispatch, currentPage, pageSize, searchInput, user.orgId]);
  const handleAddSite = () => {
    navigate('/add-site');
  };

  const handleInfoClick = (siteId) => {
    navigate(`/site/${siteId}`);
  };

  const checkStationStatus = async (siteId) => {
    try {
      setIsCheckingStatus(true);
      const response = await axios.get(`/api/sites/${siteId}/stations/status`);
      return response.data.activeStations;
    } catch (error) {
      console.error('Error checking station status:', error);
      throw error;
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleDelete = async (siteId) => {
    try {
      const activeStations = await checkStationStatus(siteId);
      if (activeStations) {
        throw new Error('Site has active stations');
      }

      await dispatch(deleteSite(siteId)).unwrap();
      toast({
        title: "Success",
        description: "Site deleted successfully!",
        variant: "default",
      });
      
      dispatch(fetchSites({ page: currentPage, size: pageSize, sortBy: 'id', orderBy: 'desc',orgId:user.orgId }));
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 
                   error.message || 
                   "Failed to delete site. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentsite(null);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setCurrentPage(0);

  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const columns = [
    {
      accessorKey: "sitename",
      header: "Site Name",
    },
    {
      accessorKey: "owner_orgName",
      header: "Owner Organization",
    },
    {
      accessorKey: "white_lable_orgName",
      header: "White Label Organization",
    },
    {
      accessorKey: "Actions",
      header: "Actions",
      cell: ({ row }) => (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleInfoClick(row.original.siteId)}
          >
            <InfoIcon className="h-4 w-4 me-3" />
          </Button>
        </>
      ),
    },
  ];

  const table = useReactTable({
    data: list || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters
    },
  });

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sites</h1>
        <Button onClick={handleAddSite}>Add Site</Button>
      </div>
     <Input
      placeholder="Search sites "
      value= {searchInput}
      onChange={handleSearchChange}
      className="mb-4"
    />      
      <div className="rounded-md border">
         {status === 'loading' && (
        <div className="absolute flex items-center justify-center inset-0 z-10">
        </div>
      )}
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
            {status === 'loading' ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Loading />
                </TableCell>
              </TableRow>
           ): table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
      <div className="flex items-center justify-center gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </Button>

        {[...Array(totalPages)].map((_, index) => (
          <Button
            key={index}
            variant={index === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(index)}
          >
            {index + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage + 1 === totalPages}
        >
          Next
        </Button>
      </div>
      {isDeleteDialogOpen && currentsite && (
        <DeleteOtp 
          userId={currentsite}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setCurrentsite(null);
          }}
          onDeleted={() => handleDelete(currentsite)}
          role="site"
        />
      )}
    </div>
  );
}