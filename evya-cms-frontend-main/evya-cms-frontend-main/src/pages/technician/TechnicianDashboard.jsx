import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../../store/reducers/tasks/technicianTasksSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { InfoIcon, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TechnicianDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading, error, currentPage, totalPages } = useSelector(
    (state) => state.technicianTasks
  );

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterRef = useRef(null);

  const pageSize = 10;

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

useEffect(() => {
  // Map dropdown value to backend status
  let apiStatus = statusFilter;
  if (statusFilter === "IN_PROGRESS") apiStatus = "INPROGRESS";
  if (statusFilter === "ALL") apiStatus = "";

  dispatch(
    fetchTasks({
      page,
      size: pageSize,
      search: searchTerm,
      status: apiStatus,
    })
  );
}, [dispatch, page, searchTerm, statusFilter]);


  const formatStatusForDisplay = (status) =>
    status === "INPROGRESS" ? "IN_PROGRESS" : status;

  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const filteredAndSortedTasks = tasks
    .filter(
      (task) =>
        task.status !== "COMPLETED" &&
        (statusFilter === "ALL"
          ? true
          : statusFilter === "IN_PROGRESS"
          ? task.status === "INPROGRESS"
          : task.status === statusFilter)
    )
    .sort((a, b) => {
      const pA = priorityOrder[a.priority?.toLowerCase()] || 4;
      const pB = priorityOrder[b.priority?.toLowerCase()] || 4;
      return pA - pB;
    });

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">My Tasks</h1>

        {/* Status Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
          >
            <Filter className="h-4 w-4" />
            {statusFilter === "ALL" ? "Filter by Status" : statusFilter}
          </Button>

          {filterDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 border">
              {["ALL", "PENDING", "IN_PROGRESS"].map((option) => (
                <button
                  key={option}
                  className={`w-full text-left px-4 py-2 mb-1 rounded-md transition ${
                    statusFilter === option
                      ? "bg-blue-100 text-blue-800"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setStatusFilter(option);
                    setFilterDropdownOpen(false);
                    setPage(0); // reset page on filter change
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2">
        <Input
          placeholder="Search by Task Name, Description, Priority..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0); // reset page on search
          }}
          className="w-full"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredAndSortedTasks.length > 0 ? (
              filteredAndSortedTasks.map((task) => (
                
                <TableRow key={task.id}>
                  <TableCell>{task.id}</TableCell>
                  <TableCell className="font-medium">{task.taskName}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                                                 <span
                                                   className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                     task.priority === "high" || task.priority === "High"
                                                       ? "bg-red-100 text-red-800"
                                                       : task.priority === "medium" || task.priority === "Medium"
                                                       ? "bg-yellow-100 text-yellow-800"
                                                       : task.priority === "low" || task.priority === "Low"
                                                       ? "bg-green-100 text-green-800"
                                                       : "bg-gray-100 text-gray-800"
                                                   }`}
                                                 >
                                                   {task.priority || "N/A"}
                                                 </span>
                                               </TableCell>
                  <TableCell>
                    <span
                      className={`px-4 py-1.5 border rounded-full text-xs font-medium ${
                        task.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-400"
                          : "bg-blue-100 text-blue-800 border-blue-400"
                      }`}
                    >
                      {formatStatusForDisplay(task.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/technician/tasks/${task.id}`)}
                    >
                      <InfoIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
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
    </div>
  );
};

export default TechnicianDashboard;