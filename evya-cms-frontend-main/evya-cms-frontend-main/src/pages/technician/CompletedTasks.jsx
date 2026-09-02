import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../../store/reducers/tasks/technicianTasksSlice";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InfoIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CompletedTasks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading, totalPages, currentPage } = useSelector(
    (state) => state.technicianTasks
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    dispatch(fetchTasks({ page, size: 10, status: "COMPLETED", search: searchTerm }));
  }, [dispatch, page, searchTerm]);

  const completedTasks = tasks.filter(task => task.status === "COMPLETED");

  return (
    <div className="container mx-auto p-4">
      
      <h1 className="text-2xl font-bold mb-4">Completed Tasks</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by Task Name,Description,Status..."
          className="border rounded px-2 py-1 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.id}</TableCell>
                  <TableCell>{task.taskName}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-4 py-1.5 border rounded-full text-xs font-medium bg-green-100 text-green-800 border-green-400">
                      COMPLETED
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
                  No completed tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

 
       {/* Pagination Controls (like ChargerInstallationTeam) */}
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

export default CompletedTasks;
//completed tasks component...