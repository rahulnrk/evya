import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoIcon } from 'lucide-react';
import { fetchIssuesByEmployeeId, fetchEmployeesPaginated } from "@/store/reducers/employee/employeeSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CustomerSupportTasks() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const size = 10;

  const employeeId = useSelector((state) => state.authentication?.user?.id);
  const { employeeIssues, loading, error, pagination } = useSelector((state) => state.employee);

  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (employeeId) {
      dispatch(fetchIssuesByEmployeeId(employeeId));
    }
  }, [dispatch, employeeId]);

  useEffect(() => {
  console.log("Logged-in employee ID:", employeeId);
}, [employeeId]);

  useEffect(() => {
      dispatch(fetchEmployeesPaginated({ page, size, search }));
    }, [dispatch, page, search]);


  // ✅ Access issues for this employee
  const issuesForEmployee = employeeIssues[employeeId] || [];

  const filteredIssues = issuesForEmployee.filter((issue) => {
    const matchesSearch =
      issue.issue?.toLowerCase().includes(searchInput.toLowerCase()) ||
      issue.ticketId?.toLowerCase().includes(searchInput.toLowerCase());
const matchesStatus =
  selectedStatus === "all" ||
  issue.status?.toLowerCase() === selectedStatus.toLowerCase();
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
  const baseClasses = "px-1 py-1.5 rounded-full text-center inline-block w-20"; // fixed width

  switch ((status || "").toLowerCase()) {
    case "open":
      return <span className={`${baseClasses} bg-red-200 text-red-800`}>Open</span>;
    case "inprogress":
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>InProgress</span>;
    case "resolved":
      return <span className={`${baseClasses} bg-green-200 text-green-900`}>Resolved</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>N/A</span>;
  }
};


const handleRowClick = (issue) => {
  navigate(`/customer-support/tasks/${issue.id}`, { 
    state: { issue, from: "/customer-support/tasks" } // <-- pass origin page
  });
};

  const getPriorityBadge = (priority) => {
  switch ((priority || "").toLowerCase()) {
    case "high":
      return <Badge className="bg-orange-100 text-orange-800 pointer-events-none">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 pointer-events-none">Medium</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800 pointer-events-none">Low</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status || "N/A"}</Badge>;
  }
};

  if (loading.issues) return <div className="p-4">Loading issues...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="inprogress">InProgress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* <div className="flex gap-4 my-4">
          <Input
            placeholder="Search by name, email, mobile,..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0); // reset to first page on new search
            }}
            className=""
          />
      </div> */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue ID</TableHead>
                <TableHead>Issue Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>                
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <TableRow key={issue.id} onClick={() => handleRowClick(issue)} className="cursor-pointer">
                    <TableCell>{issue.ticketId}</TableCell>
                    <TableCell>{issue.issue}</TableCell>
                    <TableCell>{issue.comment}</TableCell>
                    <TableCell>{getPriorityBadge(issue.priority)}</TableCell>                                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>{issue.category}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRowClick(issue)}
                        title="View Task Details"
                      >
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No tasks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
