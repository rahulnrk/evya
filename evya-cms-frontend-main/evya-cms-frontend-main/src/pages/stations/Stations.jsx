import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchStations, fetchStationByFilters, searchStations } from '@/store/reducers/stations/stationsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InfoIcon, ChevronDown, ChevronRight } from 'lucide-react';
import DeleteOtp from '@/users/DeleteOtp';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { flexRender, getCoreRowModel, useReactTable, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table';
import Loading from '@/users/Loading';
import { toast } from '@/components/ui/use-toast';
import AxiosServices from '@/services/AxiosServices';
import {FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter } from 'lucide-react'; 

const useClickOutside = (ref, dropdownRef, callback) => {
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (
        ref.current &&
        !ref.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, dropdownRef, callback]);
};

export default function Stations() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const dropdownRef = useRef(null); 
  const { list, status, error, totalElements } = useSelector((state) => state.stations);
  console.log(totalElements);
  const [sites, setSites] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeSubFilter, setActiveSubFilter] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({ site: null, status: null, currentType: null });
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / pageSize));
  const { user } = useSelector(state => state.authentication);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [selectedStationForLogs, setSelectedStationForLogs] = useState(null);
  const [logFiles, setLogFiles] = useState([]);
  const [selectedLogFile, setSelectedLogFile] = useState(null);
  const [logsContent, setLogsContent] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
    console.log("user",user.orgId);
useClickOutside(filterRef, dropdownRef, () => {
  setIsFilterOpen(false);
});

  const confirmDelete = async () => {
    fetchData();
    setIsDeleteDialogOpen(false);
    setSelectedStationId(null);
  };

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await AxiosServices.getSites();
        if (response.content) {
          setSites(response.content);
        } else if (Array.isArray(response)) {
          setSites(response);
        } else if (response.sites) {
          setSites(response.sites);
        } else {
          setSites([]);
        }
      } catch (error) {
        console.error('Error fetching sites:', error);
        setSites([]);
      }
    };
    fetchSites();
  }, []);

 const fetchData = (page = currentPage) => {
  if (globalFilter && globalFilter.length >= 2) {
    dispatch(
      searchStations({ 
        search: globalFilter, 
        page, 
        size: pageSize,
        orgId: user.orgId // ✅ Pass orgId for search

      })
    );
  } else if (selectedFilters.site || selectedFilters.status || selectedFilters.currentType) {
    dispatch(
      fetchStationByFilters(
        selectedFilters.site,
        selectedFilters.status,
        selectedFilters.currentType,
        page,
        pageSize,
        user.orgId
      )
    );
  } else {
    dispatch(
      fetchStations({
        page,
        size: pageSize,
        sortBy: 'id',
        orderBy: 'desc',
        orgId: user.orgId,
      })
    );
  }
};
useEffect(() => {
  const delay = setTimeout(() => {
    if (globalFilter && globalFilter.length >= 2) {
      dispatch(searchStations({ search: globalFilter, page: currentPage, size: pageSize }));
    } else {
      fetchData();
    }
  }, 400);

  return () => clearTimeout(delay);
}, [globalFilter, currentPage]);
  useEffect(() => {
    fetchData();
  }, [currentPage, selectedFilters]);

  const columns = [
    {
      accessorKey: 'site.siteName',
      header: 'Site Name',
      cell: ({ row }) => {
        const siteName = row.original.site?.siteName || 'N/A';
        return <span>{siteName}</span>;
      },
    },
    // { accessorKey: 'id', header: 'Station ID' },
    // { accessorKey: 'manufacturerId', header: 'Manufacturer Id' },
    { accessorKey: 'ocppVersion', header: 'OcppVersion' },
    { accessorKey: 'max_output_power_kW', header: 'Power KW/h' },
    { accessorKey: 'number_of_ports', header: 'PortQuantity' },
    { accessorKey: 'model', header: 'Charger Type' },
    { accessorKey: 'current_type', header: 'Current Type' },
    { accessorKey: 'stationStatus',
      header: 'Station Status',
      cell: ({ row }) => {
        const data = row.original;
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const [status, setStatus] = useState(data.stationStatus || 'INACTIVE');

        const handleStatusChange = async (newStatus) => {
          try {
            setStatus(newStatus);
            const response = await AxiosServices.updateStationStatus(data.id, newStatus);
            toast({
              title: 'Success',
              description: 'Status updated successfully',
              variant: 'default',
            });
            fetchData();
          } catch (error) {
            console.log(error);
            toast({
              title: 'Error',
              description: 'Failed to update status',
              variant: 'destructive',
            });
          } finally {
            setDropdownOpen(false);
          }
        };
      
        return (
        <div className="relative">
            <button
              className={`flex items-center px-4 py-1.5 border rounded-full transition ${
             (status || '').toUpperCase() === 'ACTIVE'
              ? 'bg-green-100 text-green-800 border-green-400'
              : (status || '').toUpperCase() === 'MAINTENANCE'
              ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
              : 'bg-red-100 text-red-800 border-red-400'
              }`}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
            {(status || '').toUpperCase()}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-10 p-3">
                <p className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Select Status</p>
                {['ACTIVE', 'INACTIVE', 'MAINTENANCE'].map((option) => (
                  <button
                    key={option}
                    className={`w-full text-left px-4 py-1.5 mb-1 rounded-full border transition ${
                      option === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 border-green-400'
                        : option === 'MAINTENANCE'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
                        : 'bg-red-100 text-red-800 border-red-400'
                    }`}
                    onClick={() => handleStatusChange(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'Actions',
      header: 'Actions',
      cell: ({ row }) => {
        const data = row.original;
       return (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/stations/${data.id}`)}
            title="View Details"
          >
            <InfoIcon className="h-4 w-4" />
          </Button>
          
        </div>
        );
      },
    },
  ];

  const AddStations = () => {
    navigate('/add-stations');
  };

  const table = useReactTable({
    data: list || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };
  //lavanya added

const applyFilter = (type, value) => {
  setSelectedFilters((prev) => ({
    ...prev,
    [type]: value,
  }));

  setCurrentPage(0);
  setSiteSearchQuery('');
  // setActiveSubFilter(null);

  // ✅ Close filter dropdown after selecting
  // setIsFilterOpen(false);
};
  
  const clearFilter = (type) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: null,
    }));
    setActiveSubFilter(null);
    setSiteSearchQuery('');
  };

  const filteredSites = sites.filter((site) =>
    site.siteName.toLowerCase().includes(siteSearchQuery.toLowerCase())
  );

  if (status === 'failed') return <div>Error: {error}</div>;
// Add these functions before your return statement

const fetchLogFiles = async (stationId) => {
  try {
    const response = await AxiosServices.getOcppLogFiles(stationId);
    setLogFiles(response || []);
    if (response && response.length > 0) {
      setSelectedLogFile(response[0]);
      fetchLogContent(stationId, response[0].name);
    }
  } catch (error) {
    toast({ 
      title: 'Error', 
      description: 'Failed to load log files', 
      variant: 'destructive' 
    });
  }
};

const fetchLogContent = async (stationId, filename, filter = '') => {
  try {
    setLoadingLogs(true);
    const content = await AxiosServices.downloadOcppLog(stationId, filename, filter);
    setLogsContent(content);
  } catch (error) {
    toast({ 
      title: 'Error', 
      description: 'Failed to load log content', 
      variant: 'destructive' 
    });
  } finally {
    setLoadingLogs(false);
  }
};

const openLogsDialog = async (station) => {
  setSelectedStationForLogs(station);
  setIsLogsDialogOpen(true);
  await fetchLogFiles(station.id);
};



const handleFileSelect = async (file) => {
  setSelectedLogFile(file);
  if (selectedStationForLogs) {
    await fetchLogContent(selectedStationForLogs.id, file.name, searchFilter);
  }
};

const applyLogSearch = () => {
  if (selectedStationForLogs && selectedLogFile) {
    fetchLogContent(selectedStationForLogs.id, selectedLogFile.name, searchFilter);
  }
};
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Stations</h1>
        <div className="flex gap-4 items-center">
  
          <div className="relative" ref={filterRef}>  
          <button
            className="flex items-center px-4 py-2 bg-white border rounded-md shadow-sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
          >
            Filter By
            <ChevronDown className="ml-2 h-4 w-4" />
          </button>
            {isFilterOpen && (
              <div ref={dropdownRef} className= "absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
                <div className="p-1">
                  {Object.entries(selectedFilters).map(([key, value]) => (
                    value && (
                      <div
                        key={key}
                        className="flex items-center justify-between px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-sm mb-1"
                      >
                        <span className="text-xs">
                          {key === 'site' && 'Site: '}
                          {key === 'status' && 'Status: '}
                          {key === 'currentType' && 'Type: '}
                         {value.toString().charAt(0).toUpperCase() + value.toString().slice(1).toLowerCase()}
                        </span>
                        <button
                          onClick={() => clearFilter(key)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        > ×
                        </button>
                      </div>
                    )
                  ))}
                  <div className="relative">
                    <button
                      className="flex justify-between items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setActiveSubFilter(activeSubFilter === 'site' ? null : 'site')}
                    >
                      <span>Site Name</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${activeSubFilter === 'site' ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {activeSubFilter === 'site' && (
                      <div className="ml-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="p-1">
                              <Input
                                    placeholder="Search by Station Id, Name, Site..."
                                    value={globalFilter ?? ''}
                                    onChange={(e) => { setGlobalFilter(String(e.target.value)); setCurrentPage(0);}}
                                    className="mb-4"
                                  />  
                          <div className="max-h-60 overflow-y-auto">
                            {filteredSites && filteredSites.length > 0 ? (
                              filteredSites.map((site) => (
                                <button
                                  key={site.id}
                                  className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                                    selectedFilters.site === site.siteName
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  onClick={() => applyFilter('site', site.siteName)}
                                >
                                  {site.siteName}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                {siteSearchQuery
                                  ? 'No sites match your search'
                                  : sites === null
                                  ? 'Loading sites...'
                                  : 'No sites available'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      className="flex justify-between items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setActiveSubFilter(activeSubFilter === 'status' ? null : 'status')}
                    >
                      <span>Status</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${activeSubFilter === 'status' ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {activeSubFilter === 'status' && (
                      <div className="ml-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="p-1">
                          {['ACTIVE', 'INACTIVE', 'MAINTENANCE'].map((status) => (
                            <button
                              key={status}
                              className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                                selectedFilters.status === status
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => applyFilter('status', status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      className="flex justify-between items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      onClick={() => setActiveSubFilter(activeSubFilter === 'currentType' ? null : 'currentType')}
                    >
                      <span>Current Type</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${activeSubFilter === 'currentType' ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {activeSubFilter === 'currentType' && (
                      <div className="ml-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="p-1">
                          {['AC', 'DC'].map((type) => (
                            <button
                              key={type}
                              className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                                selectedFilters.currentType === type
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => applyFilter('currentType', type)}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {(selectedFilters.site || selectedFilters.status || selectedFilters.currentType) && (
                    <button
                      className="w-full mt-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                      onClick={() => {
                        setSelectedFilters({
                          site: null,
                          status: null,
                          currentType: null,
                        });
                        setSiteSearchQuery('');
                        setCurrentPage(0);
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button onClick={AddStations}>Add Station</Button>
        </div>
      </div>
      <Input
        placeholder="Search by Station Id, Name, Site..."
        value={globalFilter ?? ''}
        onChange={(e) => setGlobalFilter(String(e.target.value))}
        className="mb-4"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            { status === 'loading' ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Loading />
                </TableCell>
              </TableRow>
          ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4">
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
            variant={index === currentPage ? 'default' : 'outline'}
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
      {isDeleteDialogOpen && (
        <DeleteOtp
          userId={selectedStationId}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedStationId(null);
          }}
          onDeleted={confirmDelete}
          role="station"
        />
      )}
{isLogsDialogOpen && (
  <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
    <DialogContent className="max-w-6xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Logs for Station: {selectedStationForLogs?.manufacturerId || selectedStationForLogs?.id}
          {selectedStationForLogs?.site?.siteName && 
            ` (${selectedStationForLogs.site.siteName})`}
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left sidebar - File list */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Log Files</h3>
            <Badge variant="secondary">{logFiles.length}</Badge>
          </div>
          
          <ScrollArea className="h-[300px] border rounded">
            {logFiles.length > 0 ? (
              <div className="p-2 space-y-1">
                {logFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => handleFileSelect(file)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedLogFile?.name === file.name
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="truncate">{file.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">
                No log files available
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Right panel - Log content */}
        <div className="md:col-span-3 flex flex-col">
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Search in logs..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyLogSearch()}
              className="flex-1"
            />
            <Button onClick={applyLogSearch}>
              Search
            </Button>
          </div>
          
          <div className="border rounded flex-1 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {selectedLogFile?.name || 'Select a log file'}
                </span>
                {loadingLogs && (
                  <span className="text-sm text-blue-600">Loading...</span>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[400px] p-4">
              {logsContent ? (
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {logsContent}
                </pre>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  {selectedLogFile ? 'No content to display' : 'Select a log file from the left panel'}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Footer with stats */}
          {logsContent && !loadingLogs && (
            <div className="mt-2 text-xs text-gray-500">
              <div className="flex gap-4">
                <span>Lines: {logsContent.split('\n').length}</span>
                <span>Size: {(logsContent.length / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}      
    </div> 
  );
}