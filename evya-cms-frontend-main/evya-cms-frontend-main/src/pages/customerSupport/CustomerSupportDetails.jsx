import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input} from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from 'lucide-react';
import { ArrowLeftIcon, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { addIssue } from "@/store/reducers/issues/issuesSlice";
import { fetchIssuesByEmployeeId, editEmployee} from "@/store/reducers/employee/employeeSlice";

export function CustomerSupportDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "info"
  );
  const [isReporting, setIsReporting] = useState(
    location.state?.openReportCard || false
  );

 const [newIssue, setNewIssue] = useState({
  issue: "",
  comment: "",
  status: "Open",
  priority: "medium",
  dueDate: "",
  category: "",
  subcategory: "",
});

  const customer = location.state?.customer;
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [viewingIssueNotes, setViewingIssueNotes] = useState(false);
  const { employeeIssues } = useSelector((state) => state.employee);
  const [localCustomer, setLocalCustomer] = useState(customer);
  const [supportStatus, setSupportStatus] = useState(
  customer?.active ? "Available" : "Unavailable");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
    const issues = (employeeIssues && customer) ? (employeeIssues[localCustomer.id] || []) : [];


  useEffect(() => {
  if (customer) {
    setSupportStatus(localCustomer.active ? "Available" : "Unavailable");
  }
}, [customer]);

const handleStatusChange = async (newStatus) => {
  try {
    setUpdatingStatus(true);
    const payload = {
      active: newStatus === "Available",
    };
    await dispatch(
      editEmployee({ id: localCustomer.id, data: payload })
    ).unwrap();    
    setLocalCustomer(prev => ({
      ...prev,
      active: newStatus === "Available",
    }));    
    setSupportStatus(newStatus);
    toast({
      title: "Success",
      description: `Status updated to ${newStatus}`,
    });
  } catch (err) {
    toast({
      title: "Error",
      description: "Failed to update status",
      variant: "destructive",
    });
  } finally {
    setUpdatingStatus(false);
  }
};

  const priorityOrder = { high: 1, medium: 2, low: 3 };

  const categoryOptions = {
  Software: ["Payment", "Billing", "Performance", "Bug", "Other"],
  Hardware: ["Replacement", "Maintenance", "Other"],
};

  useEffect(() => {
  if (customer?.id) {
    dispatch(fetchIssuesByEmployeeId(localCustomer.id));
  }
}, [customer?.id, dispatch]);


//for copilot
useEffect(() => {
    const handleOpenReportIssue = () => setIsReporting(true);
    window.addEventListener('openReportIssueDialog', handleOpenReportIssue);
    return () => window.removeEventListener('openReportIssueDialog', handleOpenReportIssue);
}, []);

//for copilot
useEffect(() => {
    const handleSwitchTab = (e) => {
        if (e.detail.tab === 'issues') {
            setActiveTab('issues');
        }
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
}, []);

//for copilot issue note
// ========== 1. Listen for custom event from Copilot ==========
useEffect(() => {
  const handleOpenIssueNote = () => {
    if (issues && issues.length > 0) {
      setSelectedIssueId(issues[0].id);
      setViewingIssueNotes(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('autoOpenAddNoteInIssueNotes'));
      }, 100);
    } else {
      toast({ title: "No Issues", description: "This member has no issues yet. Please report an issue first.", variant: "info" });
    }
  };
  window.addEventListener('openAddIssueNote', handleOpenIssueNote);
  return () => window.removeEventListener('openAddIssueNote', handleOpenIssueNote);
}, [issues]);

// ========== 2. Handle navigation from Copilot (when coming from list page) ==========
useEffect(() => {
  if (location.state?.openAddIssueNote && issues && issues.length > 0) {
    setSelectedIssueId(issues[0].id);
    setViewingIssueNotes(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('autoOpenAddNoteInIssueNotes'));
    }, 100);
  } else if (location.state?.openAddIssueNote && (!issues || issues.length === 0)) {
    toast({ title: "No Issues", description: "This member has no issues yet. Please report an issue first.", variant: "info" });
  }
}, [location.state?.openAddIssueNote, issues]);


const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const baseClasses = "px-2 py-1.5 rounded-full text-center inline-block w-24";
  switch (s) {
    case "open":
      return <span className={`${baseClasses} bg-red-200 text-red-800`}>Open</span>;
    case "inprogress":
      return <span className={`${baseClasses} bg-yellow-200 text-yellow-800`}>InProgress</span>;
    case "resolved":
      return <span className={`${baseClasses} bg-green-200 text-green-900`}>Resolved</span>;
    case "pending":
      return <span className={`${baseClasses} bg-purple-200 text-purple-800`}>Pending</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>N/A</span>;
  }
};

const getPriorityBadge = (priority) => {
  if (!priority) 
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 pointer-events-none">N/A</Badge>;
  const p = priority.toLowerCase();
  switch (p) {
    case "high":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 pointer-events-none">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 pointer-events-none">Medium</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 pointer-events-none">Low</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 pointer-events-none">{priority}</Badge>;
  }
};

const filteredIssues = issues.filter((issue) => {
  if (statusFilter === "all") return true;
  if (statusFilter === "Inprogress") {
    return ["Inprogress"].includes(issue.status?.toLowerCase());
  }
  if (statusFilter === "open") {
    return ["open"].includes(issue.status?.toLowerCase());
  }
  return issue.status?.toLowerCase() === statusFilter.toLowerCase();
});
  if (!customer) {
    return <p>Loading customer data...</p>;
  }

  const sortedIssues = [...filteredIssues].sort((a, b) => {
  const aPriority = priorityOrder[a.priority?.toLowerCase()] || 4;
  const bPriority = priorityOrder[b.priority?.toLowerCase()] || 4;
  return aPriority - bPriority;
});

console.log("Issues to render:", sortedIssues);

  const handleIssueChange = (e) => {
  const { name, value } = e.target;
  setNewIssue(prev => ({ ...prev, [name]: value }));
};

const handleIssueSubmit = async (e) => {
  e.preventDefault();

 if (!newIssue.issue) {
    toast({
      title: "Validation Error",
      description: "Issue title is required",
      variant: "destructive", 
    });
    return;
  }

  const payload = {
    ...newIssue,
    status: newIssue.status || "Open",
    priority: newIssue.priority || "medium",
    location: newIssue.location || "",
    dueDate: newIssue.dueDate || null,
    userId: 1,
    employeeId: localCustomer.id,
    type: "Ticket",
    category: newIssue.subcategory,
  };

  try {
    setSubmitting(true);
    await dispatch(addIssue(payload));
    await dispatch(fetchIssuesByEmployeeId(localCustomer.id));
    setNewIssue({ issue: "", comment: "", priority: "medium", location: "", dueDate: "", category:"", subcategory:"",status:"open" });
    setIsReporting(false);
    toast({
      title: "Success",
      description: "Issue reported successfully",
    });
  } catch (err) {
    console.error(err);
    toast({
      title: "Error",
      description: "Failed to report issue",
      variant: "destructive",
    });
  } finally {
    setSubmitting(false);
  }
};

const handleCancelReport = () => {
  setNewIssue({ issue: "", comment: "" });
  setIsReporting(false);
};
const StatusDropdown = () => {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`flex items-center px-4 py-1.5 border rounded-full transition ${
          supportStatus === "Available"
            ? "bg-green-100 text-green-800 border-green-400"
            : "bg-red-200 text-red-800 border-red-400"
        } ${updatingStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !updatingStatus && setDropdownOpen(prev => !prev)}
        disabled={updatingStatus}
      >
        {supportStatus}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      
      {dropdownOpen && (
        <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50 p-3">
          <p className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">
            Select Status
          </p>
          {["Available", "Unavailable"].map((option) => (
            <button
              key={option}
              className={`w-full text-left px-4 py-1.5 mb-1 rounded-full border transition ${
                option === "Available"
                  ? "bg-green-100 text-green-800 border-green-400 hover:bg-green-200"
                  : "bg-red-200 text-red-800 border-red-400 hover:bg-red-300"
              }`}
              onClick={() => {
                handleStatusChange(option);
                setDropdownOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

  return (
  <div className="container mx-auto px-8 py-8 max-w-5xl">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-bold text-gray-900">
        {localCustomer.username} Details
      </h1>
      <StatusDropdown />
    </div>
    <Button
      variant="outline"
      onClick={() => navigate("/customer-support")}
    >
      <ArrowLeftIcon className="h-4 w-4 mr-2" />
      Back
    </Button>
  </div>
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            if (val !== "issues") {
              setIsReporting(false);
          }
          else {
            setStatusFilter("open");
          }}
        }
        >
        <TabsList className="grid w-full grid-cols-2 mb-5">
          <TabsTrigger value="info">Basic Details</TabsTrigger>
          <TabsTrigger value="issues">Issues Assigned</TabsTrigger>
        </TabsList>
        <div>
        </div>
        <TabsContent value="info">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold mb-8">Personal Information</h2>
           <Button className="bg-green-600 hover:bg-green-500 text-white"
            onClick={() => navigate(`/customer-support/edit/${localCustomer.id}`, { state: { customer } })}
          >
            Edit
          </Button>
          </div>
          <Card className="py-8">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User Name</h3>
                    <p className="text-md">{localCustomer.username || localCustomer.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Designation</h3>
                    <p className="text-md">{localCustomer.designation}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                    <p className="text-md">{localCustomer.email}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="text-sm">
                      <span
                        className={`px-4 py-2 rounded-full ${
                          localCustomer.active
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {localCustomer.active ? "Available" : "Unavailable"}
                      </span>
                    </p>
                </div>
                </div>
                <div className="space-y-4">
                   <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                    <p className="text-md">{localCustomer.mobileNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Join Date</h3>
                    <p className="font-medium">
                    {localCustomer.joiningDate ? 
                      (Array.isArray(localCustomer.joiningDate) ? 
                        localCustomer.joiningDate.join('-') : 
                        localCustomer.joiningDate
                      ) : 
                      'N/A'
                    }
                  </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="issues">
          {!isReporting && (
            <div className="flex justify-between mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="inprogress">Inprogress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button   className="bg-green-600 hover:bg-green-500 text-white" onClick={() => setIsReporting(true)}>
                Report Issue
              </Button>
            </div>
          )}
  {isReporting ? (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold my-4">Report New Issue</h3>
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
            <Label>Assigned To</Label>
            <Input
              value={localCustomer.username || localCustomer.name}
              readOnly
            />
          </div>
          <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={newIssue.category || ""}
            onValueChange={(value) =>
              setNewIssue((prev) => ({ ...prev, category: value, subcategory: "" }))
            }
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(categoryOptions).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Subcategory</Label>
          <Select
            value={newIssue.subcategory || ""}
            onValueChange={(value) => setNewIssue((prev) => ({ ...prev, subcategory: value }))}
            disabled={!newIssue.category}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {(categoryOptions[newIssue.category] || []).map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          <div className="space-y-2">
            <Label>Issue Title</Label>
            <Input
              name="issue"
              value={newIssue.issue}
              onChange={handleIssueChange}
              placeholder="Brief issue summary"
            />
          </div>
          <div className="space-y-2">
          <Label>Status</Label>
          <Select
            name="status"
            value={newIssue.status || "Open"}   // default Open
            onValueChange={(value) =>
              setNewIssue((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Inprogress">Inprogress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
          <div className="space-y-2">
            <Label>Description / Comment</Label>
            <Input
              name="comment"
              value={newIssue.comment}
              onChange={handleIssueChange}
              placeholder="Detailed description of the issue"
            />
            </div>
            <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              name="priority"
              value={newIssue.priority || "medium"}
              onValueChange={(value) =>
                setNewIssue((prev) => ({ ...prev, priority: value }))
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Location */}
<div className="space-y-2">
  <Label>Location</Label>
  <Input
    name="location"
    value={newIssue.location || ""}
    onChange={handleIssueChange}
    placeholder="Enter location"
    disabled={newIssue.category !== "Hardware"} // Enable only for Software
  />
</div>         
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={handleCancelReport}>
              Cancel
            </Button>
<Button type="submit" disabled={submitting}>
    {submitting ? "Submitting..." : "Submit"}
  </Button>          </div>
        </form>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {sortedIssues.length > 0 ? (
            sortedIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.ticketId}</TableCell>
                <TableCell>{issue.issue}</TableCell>
                <TableCell>{getPriorityBadge(issue.priority)}</TableCell>  
                <TableCell>{issue.comment}</TableCell>                           
                <TableCell>{getStatusBadge(issue.status)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      navigate(`/customer-support/issue-details/${issue.id}`, {
                        state: { issue, customer },
                      })
                    }
                  >
                    <InfoIcon className="w-4 h-4 " />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500">
                No issues found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </CardContent>
    </Card>
   )}
 </TabsContent>
 </Tabs>
</div>
   );
 } 