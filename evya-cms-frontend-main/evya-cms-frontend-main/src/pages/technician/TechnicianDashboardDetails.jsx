import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotesSection from "../chargerInstallationTeam/NotesSection";
import { fetchAllEmployees } from "@/store/reducers/chargerInstallation/ChargerInstallationSlice";
import { ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { updateTaskStatus } from "../../store/reducers/tasks/technicianTasksSlice";

const TechnicianDashboardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { tasks } = useSelector((state) => state.technicianTasks);
  const { user } = useSelector((state) => state.authentication);
  const allEmployees = useSelector((state) => state.chargerInstallation?.allEmployees || []);
  const defaultCreatedBy = user?.id;

  const task = tasks.find((t) => String(t.id) === id);

  const [taskStatus, setTaskStatus] = useState(task?.status || "PENDING");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create a map of employeeId -> username for quick lookup
const employeeMap = allEmployees.reduce((acc, emp) => {
  acc[emp.id] = emp.username;
  return acc;
}, {});


  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  if (!task) {
    return <p className="p-6 text-red-500 font-semibold">Task not found.</p>;
  }

  const currentUserId = user?.id;
  const availableEmployees =
    currentUserId === 1
      ? allEmployees
      : allEmployees.filter((employee) => employee.id !== currentUserId);

  const formatStatusForDisplay = (status) => {
    if (status === "INPROGRESS") return "IN_PROGRESS";
    return status;
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      setTaskStatus(newStatus);
      await dispatch(updateTaskStatus({ taskId: task.id, status: newStatus })).unwrap();
      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setDropdownOpen(false);
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Details</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="details">Basic Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Task Details */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Task ID</p>
                  <p className="font-medium">{task.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{task.taskName || "N/A"}</p>
                </div>

                {/* Editable Status Dropdown (Dropdown UI like TechnicianDashboard) */}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {taskStatus === "COMPLETED" ? (
                    <span className="px-3 py-1 border rounded-md text-sm bg-green-100 text-green-800">
                      COMPLETED
                    </span>
                  ) : (
                    <div className="relative">
                      <button
                        className={`flex items-center px-3 py-1.5 border rounded-full transition w-40
                          ${taskStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-400"
                            : "bg-blue-100 text-blue-800 border-blue-400"
                          } ${isUpdating ? "opacity-70" : ""}`}
                        onClick={() => !isUpdating && setDropdownOpen(!dropdownOpen)}
                        disabled={isUpdating}
                      >
                        {formatStatusForDisplay(taskStatus)}
                        {isUpdating ? (
                          <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                      </button>

                      {dropdownOpen && !isUpdating && (
                        <div className="absolute mt-2 w-48 bg-white shadow-lg rounded-md z-10 p-3">
                          <p className="font-medium text-sm mb-2 text-gray-700">
                            Select Status
                          </p>
                          {["PENDING", "INPROGRESS", "COMPLETED"].map((option) => (
                            <button
                              key={option}
                              className={`w-full text-left px-4 py-1.5 mb-1 rounded-full border transition
                                ${option === "COMPLETED"
                                  ? "bg-green-100 text-green-800 border-green-400"
                                  : option === "INPROGRESS"
                                  ? "bg-blue-100 text-blue-800 border-blue-400"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-400"
                                } ${taskStatus === option ? "ring-2 ring-offset-1" : ""}`}
                              onClick={() => handleStatusChange(option)}
                            >
                              {formatStatusForDisplay(option)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {task.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{task.location}</p>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {task.priority && (
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge
                      className={`px-3 py-1 rounded-full text-xs font-medium
                        ${task.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                        }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                )}
              </div>

              {task.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Section */}
        <TabsContent value="notes">
          <NotesSection
            taskId={task.id}
            currentUser={user}
            createdBy={defaultCreatedBy}
            employeeId={task.employeeId}
            isTechnicianPortal={false}
            availableEmployees={availableEmployees}
            employeesLoading={false}
            autoTaskSelection={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechnicianDashboardDetails; 