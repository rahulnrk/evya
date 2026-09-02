import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link} from 'react-router-dom';
import { fetchIssues, deleteIssue,updateIssueNote,deleteIssueNote } from '@/store/reducers/issues/issuesSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InfoIcon, Trash, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AddIssueDialog } from './dialog/AddIssue';
import Loading from '@/users/Loading';
import AxiosServices from '@/services/AxiosServices';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

export default function IssuesTracker() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, status, error, totalElements } = useSelector((state) => state.issues);
  const { user } = useSelector(state => state.authentication);

  // Tab states
  const [activeTab, setActiveTab] = useState("list");
  const [searchInput, setSearchInput] = useState('');
  const [searchedIssue, setSearchedIssue] = useState(null);

  // List view states
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / pageSize));
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [activeIssueTab, setActiveIssueTab] = useState("details");

useEffect(() => {
  if (activeTab !== "search") {
    setSearchInput("");
    setSearchedIssue(null);
  }
}, [activeTab]);

useEffect(() => {
  if (activeTab !== "search") return;

  const delay = setTimeout(() => {
    if (searchInput && searchInput.length >= 2) {
      handleSearchIssue();
    } else {
      setSearchedIssue(null);
    }
  }, 400);

  return () => clearTimeout(delay);
}, [searchInput, activeTab]);

  useEffect(() => {
    if (activeTab === 'list') {
      dispatch(fetchIssues({ 
        page: currentPage, 
        size: pageSize, 
        sortBy: 'createdDate', 
        orderBy: 'desc',
        orgId: user.orgId,
        filter: globalFilter || null
      }));
    }
  }, [dispatch, currentPage, user.orgId, globalFilter, activeTab]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

const handleSearchIssue = async () => {
  try {
    const response = await AxiosServices.fetchIssueByTicketId(searchInput);

    const issue = response?.data || response;

    if (issue && issue !== "No Issues Found") {
      setSearchedIssue(issue);
    } else {
      setSearchedIssue("No Issues Found");
    }

  } catch (error) {
    console.error('Error searching issue:', error);
    toast({
      title: "Error",
      description: "Failed to search for issue",
      variant: "destructive",
    });
  }
};

  const handleRowClick = (issue) => {
    navigate(`/issues/${issue.id}`, { state: { issue } });
  };

  const handleDeleteClick = (issueId) => {
    setCurrentIssue(issueId);
    setIsDeleteDialogOpen(true);
  };

  const handleEditNote = (note) => {
  setEditingNoteId(note.id);
  setEditedTitle(note.title);
  setEditedNotes(note.notes);
};

const handleCancelEdit = () => {
  setEditingNoteId(null);
  setEditedTitle("");
  setEditedNotes("");
};
  const handleDelete = async (issueId) => {
    try {
      await dispatch(deleteIssue(issueId)).unwrap();
      toast({
        title: "Success",
        description: "Issue deleted successfully!",
        variant: "default",
      });
      dispatch(fetchIssues({ 
        page: currentPage, 
        size: pageSize, 
        sortBy: 'createdDate', 
        orderBy: 'desc',
        orgId: user.orgId,
        filter: globalFilter || null
      }));
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 
                   error.message || 
                   "Failed to delete issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentIssue(null);
    }
  };

  const handleUpdateNote = async (issueId, noteId) => {
  try {
    await dispatch(
      updateIssueNote(issueId, noteId, {
        title: editedTitle,
        notes: editedNotes,
        lastModifiedBy: user?.id || "ADMIN"
      })
    ).unwrap();

    toast({
      title: "Success",
      description: "Note updated successfully",
    });

    setEditingNoteId(null);
    setEditedTitle("");
    setEditedNotes("");

    // Refresh searched issue
    handleSearchIssue();

  } catch (error) {
    console.error("Error updating note:", error);

    toast({
      title: "Error",
      description: "Failed to update note",
      variant: "destructive",
    });
  }
};

const handleDeleteNote = async (issueId, noteId) => {
  try {
    await dispatch(deleteIssueNote(issueId, noteId)).unwrap();

    toast({
      title: "Success",
      description: "Note deleted successfully",
    });

    // Refresh search result
    handleSearchIssue();

  } catch (error) {
    console.error("Error deleting note:", error);

    toast({
      title: "Error",
      description: "Failed to delete note",
      variant: "destructive",
    });
  }
};

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const statusColor = {
    resolved: 'bg-green-200 text-green-800',
    closed: 'bg-red-200 text-red-800',
    open: 'bg-blue-200 text-blue-800',
    'in progress': 'bg-yellow-200 text-yellow-800',
  };

 const columns = [
  {
    accessorKey: "ticketId",
    header: "Ticket ID",
    cell: ({ row }) => {
      const issue = row.original;
      const ticketId = row.original?.ticketId ?? "—";
      return (
        // <span
        //   className="text-blue-600 cursor-pointer hover:underline"
        //   onClick={() => handleRowClick(row.original)}
        // >
        //   {ticketId}
        // </span>
          <Link
        to={`/issues/${issue.id}`}
        state={{ issue }}
        className="text-blue-600 hover:underline"
      >
        {ticketId}
      </Link>
      );
    },
  },
  {
    accessorKey: "issue",
    header: "Issue",
    // no accessorFn needed when using accessorKey
    cell: ({ row }) => {
    console.log("Row data:", row.original); // log each row
    const typeValue = row.original?.issue?? "N/A";
    return <span>{typeValue}</span>;
  }},
  {
  accessorKey: "type",
  header: "Type",
  cell: ({ row }) => {
    console.log("Row data:", row.original); // log each row
    const typeValue = row.original?.type ?? "N/A";
    return <span>{typeValue}</span>;
  }},
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original?.category ?? "N/A",
  },
  {
    accessorKey: "createdDate",
    header: "Created Date",
    cell: ({ row }) => formatDate(row.original?.createdDate ?? ""),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original?.status || "N/A";
      const color =
        statusColor[(status || "").toLowerCase()] || "bg-gray-200 text-gray-800";
      return (
        <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
          {status}
        </span>
      );
    },
  },
  {
  accessorKey: "priority",
  header: "Priority",
  cell: ({ row }) => {
    const priority = row.original?.priority || "N/A";

    // Optional colored badges
    const priorityColors = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };

    const color =
      priorityColors[priority?.toLowerCase()] ||
      "bg-gray-200 text-gray-700";

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
        {priority}
      </span>
    );
  },
},
//for copilot
{
  accessorKey: "assignedTo",
  header: "Assigned To",
  cell: ({ row }) => {
    const employeeId = row.original?.employeeId;
    const assignedTo = row.original?.assignedTo || "Unassigned";
    if (employeeId) {
      return (
        <Link
          to={`/customer-support/${employeeId}`}
          className="text-blue-600 hover:underline"
        >
          {assignedTo}
        </Link>
      );
    }
    return <span>{assignedTo}</span>;
  },
},
  {
    id: "actions", 
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRowClick(row.original)}
          title="View Issue Details"
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
      </div>
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
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (status === 'loading' && !list.length) {
    return <div><Loading/></div>;
  }

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Support</h1>
        <div className="flex space-x-2">
          <AddIssueDialog />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">All Issues</TabsTrigger>
          <TabsTrigger value="search">Search Issue</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Input
            placeholder="Search issues by Ticket ID, Issue, or Type..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="mb-4"
          />          
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
            {status === "loading" ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Loading />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
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
        </TabsContent>

          <TabsContent value="search">
          <div className="space-y-4">
            <div className="flex gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <Input
                placeholder="Search by Ticket ID or Issue ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
                // onKeyPress={(e) => e.key === 'Enter' && handleSearchIssue()}
              />
              <Button 
                onClick={handleSearchIssue}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            {searchedIssue && searchedIssue !== "No Issues Found" ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">Issue Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Ticket ID</p>
                    <p className="font-medium text-gray-900">{searchedIssue.ticketId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Issue</p>
                    <p className="font-medium text-gray-900">{searchedIssue.issue}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium px-2 py-1 rounded-full text-xs inline-block ${
                      statusColor[searchedIssue.status?.toLowerCase()] || 'bg-gray-200 text-gray-800'
                    }`}>
                      {searchedIssue.status}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Created Date</p>
                    <p className="font-medium text-gray-900">{formatDate(searchedIssue.createdDate)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-medium text-gray-900">{searchedIssue.assignedTo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">{searchedIssue.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Site</p>
                    <p className="font-medium text-gray-900">{searchedIssue.siteName || searchedIssue.categoryId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-900">{searchedIssue.type}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium text-gray-900">{searchedIssue.comment}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-gray-500">Notes</p>
                  <div className="space-y-2">
                  {searchedIssue.notes?.map((note) => (
                    <div key={note.id} className="border-l-4 border-gray-200 pl-3 py-2">

                      {editingNoteId === note.id ? (
                        <>
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="mb-2"
                          />

                          <Input
                            value={editedNotes}
                            onChange={(e) => setEditedNotes(e.target.value)}
                            className="mb-2"
                          />

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateNote(searchedIssue.id, note.id)}
                            >
                              Save
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">{note.title}</p>
                          <p className="text-gray-700">{note.notes}</p>

                          <p className="text-xs text-gray-500">
                            {formatDate(note.modifiedDate)} by {note.createdBy}
                          </p>

                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditNote(note)}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteNote(searchedIssue.id, note.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </>
                      )}

                    </div>
                  ))}
                </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
                  <Button 
                    variant="default"
                    onClick={() => handleRowClick(searchedIssue)}
                  >
                    <InfoIcon className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </div>
            ) : (searchInput && searchedIssue == "No Issues Found")?(
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-red-500 font-medium">No issue found matching your search</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-500">
                  Enter Ticket ID or Issue ID to search
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}