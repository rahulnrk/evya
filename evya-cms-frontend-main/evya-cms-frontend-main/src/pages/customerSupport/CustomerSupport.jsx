import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssuesByEmployeeId, fetchEmployeesPaginated } from "@/store/reducers/employee/employeeSlice";
import { Button } from "@/components/ui/button";
import { InfoIcon, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import AddCustomerSupport from "./AddCustomerSupport";

function CustomerSupport() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const size = 10;
  const designation = "Customer Support";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { employees, loading, employeeIssues, pagination } = useSelector((state) => state.employee);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [issueStatusFilter, setIssueStatusFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

useEffect(() => {
    dispatch(fetchEmployeesPaginated({ page, size, designation, search }));
  }, [dispatch, page, designation, search]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPage(newPage);
    }
  };

  useEffect(() => {
    if (employees?.length > 0) {
      employees.forEach(emp => {
        dispatch(fetchIssuesByEmployeeId(emp.id));
      });
    }
  }, [employees, dispatch]);


  // Inside the CustomerSupport component, after the existing useState declarations
useEffect(() => {
  const handleOpenAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  window.addEventListener('openAddCustomerSupportDialog', handleOpenAddDialog);

  return () => {
    window.removeEventListener('openAddCustomerSupportDialog', handleOpenAddDialog);
  };
}, []);

  const getEmployeeIssueCounts = (employeeId) => {
    const issues = employeeIssues[employeeId] || [];
    return {
      open: issues.filter(issue => issue.status?.toLowerCase() === 'open').length,
      inprogress: issues.filter(issue => issue.status?.toLowerCase() === 'inprogress').length,
      resolved: issues.filter(issue => issue.status?.toLowerCase() === 'resolved').length,
      total: issues.length
    };
  };

  const filteredEmployees = employees?.filter((emp) => {
    if (selectedCategory !== "all") {
      const empIssues = employeeIssues[emp.id] || [];
      if (!empIssues.some(issue => issue.category === selectedCategory)) {
        return false;
      }
    }

    // Apply issue status filter
    if (issueStatusFilter === "all") {
      return true;
    }
    
    const issues = employeeIssues[emp.id] || [];
    switch (issueStatusFilter) {
      case "open":
        return issues.some(issue => issue.status?.toLowerCase() === 'open');
      case "inprogress":
        return issues.some(issue => issue.status?.toLowerCase() === 'inprogress');
      case "resolved":
        return issues.some(issue => issue.status?.toLowerCase() === 'resolved');
      case "has-issues":
        return issues.length > 0;
      case "no-issues":
        return issues.length === 0;
      default:
        return true;
    }
  });

  const getStatusBadge = (status, count) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "open":
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Open: {count}</span>;
      case "inprogress":
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>InProgress: {count}</span>;
      case "resolved":
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Resolved: {count}</span>;
      default:
        return null;
    }
  };

  const handleRowClick = (customer) => {
    navigate(`/customer-support/${customer.id}`, { state: { customer } });
  };
//   const filteredEmployees = employees?.filter((emp) => {
//   const empIssues = employeeIssues[emp.id] || [];

//   return (
//     selectedCategory === "all" ||
//     empIssues.some(issue => issue.category === selectedCategory)
//   );
// });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customer Support</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <button
              className="flex items-center px-4 py-2 bg-white border rounded-full shadow-sm text-sm hover:bg-gray-50"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              {issueStatusFilter === "all" ? "Filter by Issues" : 
               issueStatusFilter === "open" ? "Open" :
               issueStatusFilter === "inprogress" ? "InProgress" :
               issueStatusFilter === "resolved" ? "Resolved" :
               issueStatusFilter === "has-issues" ? "Has Issues" : "No Issues"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                <div className="p-2">
                  <div className="mb-2">
                    {["all", "open", "inprogress", "resolved", "has-issues", "no-issues"].map((filter) => (
                      <button
                        key={filter}
                        className={`w-full text-left px-3 py-1 text-sm rounded-md mb-1 ${
                          issueStatusFilter === filter
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setIssueStatusFilter(filter);
                          setIsFilterOpen(false);
                        }}
                      >
                        {filter === "all" && "All"}
                        {filter === "open" && "Open"}
                        {filter === "inprogress" && "InProgress"}
                        {filter === "resolved" && "Resolved"}
                        {filter === "has-issues" && "Any Issues"}
                        {filter === "no-issues" && "No Issues"}
                      </button>
                    ))}
                  </div>                  
                  {issueStatusFilter !== "all" && (
                    <button
                      className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border-t"
                      onClick={() => {
                        setIssueStatusFilter("all");
                        setIsFilterOpen(false);
                      }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-green-600 hover:bg-green-500 text-white flex items-center gap-2"
          >
            Add Support                                   
          </Button>
        </div>
      </div>
      <div className="flex gap-4 my-4">
      <Input
      placeholder="Search by name, email, mobile, location..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(0);
      }}
      className=""
     />
    </div>
      <Card className="rounded-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loading.byDesignation || loading.issues) ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees?.length > 0 ? (
                filteredEmployees.map((customer) => {
                  const issueCounts = getEmployeeIssueCounts(customer.id);
                  return (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(customer)}
                  >
                    <TableCell>{customer.username}</TableCell>
                    <TableCell>{customer.mobileNumber}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.location}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full ${
                          customer.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {customer.active ? "Available" : "Unavailable"}
                      </span>
                    </TableCell>
                      <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/customer-support/${customer.id}`, {
                          state: { customer, activeTab: "issues", openReportCard: true },
                        });
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                     </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRowClick(customer)}
                        title="View Customer Details"
                      >
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">
                      {search || issueStatusFilter !== "all" 
                        ? "No employees match your filters." 
                        : "No customer support found."}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
           </Table>
          </CardContent>
         </Card>
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>

            {[...Array(pagination.totalPages)].map((_, index) => (
              <Button
                key={index}
                variant={index === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(index)}
              >
                {index + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page + 1 === pagination.totalPages}
            >
              Next
            </Button>
          </div>
            <AddCustomerSupport
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onCustomerSupportAdded={() => {
                dispatch(fetchEmployeesPaginated({ page, size, designation, search }));
              }}
            />
    </div>
  );
}
export default CustomerSupport