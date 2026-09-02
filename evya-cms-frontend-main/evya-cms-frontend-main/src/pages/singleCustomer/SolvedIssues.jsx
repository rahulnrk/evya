import { useSelector, useDispatch } from "react-redux";
import React, { useEffect } from "react";
import { fetchIssuesByEmployeeId } from "@/store/reducers/employee/employeeSlice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const SolvedIssues = () => {
  const dispatch = useDispatch();
        const navigate = useNavigate();
  const employeeId = useSelector((state) => state.authentication?.user?.id);
  const { employeeIssues, loading, error } = useSelector((state) => state.employee);

  useEffect(() => {
    if (employeeId) {
      dispatch(fetchIssuesByEmployeeId(employeeId));
    }
  }, [employeeId, dispatch]);

const handleRowClick = (issue) => {
  navigate(`/customer-support/tasks/${issue.id}`, { 
    state: { issue, from: "/customer-support/solved" }
  });
};

  const issuesForEmployee = employeeIssues[employeeId] || [];
  const solvedIssues = issuesForEmployee.filter(issue => issue.status?.toLowerCase() === "resolved");

  if (!employeeId) return <p>Loading employee data...</p>;
  if (loading.issues) return <p>Loading issues...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

    const getPriorityBadge = (priority) => {
  switch ((priority || "").toLowerCase()) {
    case "high":
      return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800">Low</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status || "N/A"}</Badge>;
  }
};

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Solved Tickets</h1>

      {solvedIssues.length > 0 ? (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solvedIssues.map(issue => (
                  <TableRow key={issue.id}>
                    <TableCell>{issue.ticketId}</TableCell>
                    <TableCell>{issue.issue}</TableCell>
                    <TableCell>{issue.comment}</TableCell>
                    <TableCell>
                      <span className=" px-1 py-1 rounded-full text-center inline-block w-20 bg-green-200 text-green-800 ">{issue.status
    ? issue.status.charAt(0).toUpperCase() + issue.status.slice(1).toLowerCase()
    : ""}</span>
                    </TableCell>
                    <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-gray-500 text-center">No solved issues found.</p>
      )}
    </div>
  );
};
export default SolvedIssues;

//today completed task for customer support yb sukanya
