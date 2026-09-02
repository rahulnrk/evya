import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InfoIcon, Plus } from 'lucide-react';
import AddTeamMember from './AddTeamMember';
import Loading from '@/users/Loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeams, fetchAllTasks } from '@/store/reducers/chargerInstallation/ChargerInstallationSlice';
export default function ChargerInstallationTeam() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { 
    teams, 
    loading, 
    error, 
    currentPage, 
    totalPages,
     allTasks, 
    allTasksLoading, 
    allTasksError,
    tasksCurrentPage,
    tasksTotalPages 
  } = useSelector((state) => state.chargerInstallation);
  const [globalFilter, setGlobalFilter] = useState('');
  const [page, setPage] = useState(0);
  const [tasksPage, setTasksPage] = useState(0);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const pageSize = 10;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const handleTeamMemberAdded = () => {
    dispatch(fetchTeams({ page, size: pageSize, search: globalFilter }));
  };

  // Handle page change for teams
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleTasksPageChange = (newPage) => {
    if (newPage >= 0 && newPage < tasksTotalPages) {
      setTasksPage(newPage);
    }
  };

  useEffect(() => {
    if (!showAllTasks) {
      dispatch(fetchTeams({ page, size: pageSize, search: globalFilter }));
    }
  }, [dispatch, page, globalFilter, showAllTasks]);

  useEffect(() => {
    if (showAllTasks) {
      dispatch(fetchAllTasks({ page: tasksPage, size: pageSize, search: globalFilter }));
    }
  }, [dispatch, showAllTasks, globalFilter, tasksPage]);

  //for copilot
  // Add this after the existing useEffects
useEffect(() => {
    const handleOpenAddDialog = () => setIsAddDialogOpen(true);
    window.addEventListener('openAddChargerInstallationTeamDialog', handleOpenAddDialog);
    return () => window.removeEventListener('openAddChargerInstallationTeamDialog', handleOpenAddDialog);
}, []);

  const handleAllTasksClick = () => {
    setShowAllTasks(true);
    setTasksPage(0);
    setGlobalFilter('');
  };

  const handleBackToTeams = () => {
    setShowAllTasks(false);
    setPage(0);
    setGlobalFilter('');
  };

  const handleSearchChange = (e) => {
    setGlobalFilter(e.target.value);
    // Reset to first page when searching
    if (showAllTasks) {
      setTasksPage(0);
    } else {
      setPage(0);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        {showAllTasks ? (
          <h1 className="text-2xl font-bold">All Installation Tasks</h1>
        ) : (
          <h1 className="text-2xl font-bold">Charger Installation Team</h1>
        )}
        
        <div className="flex gap-2">
          {showAllTasks ? (
            <Button variant="outline" onClick={handleBackToTeams}>
              Back to Teams
            </Button>
          ) : (
            <>
              <Button onClick={handleAllTasksClick}>
                All Tasks
              </Button>
               <Button onClick={() => setIsAddDialogOpen(true)}>
                Add Team
               </Button>
            </>
          )}
        </div>
      </div>
      <Input
        placeholder={
          showAllTasks 
            ? "Search tasks by Employee Name, Task Name, Location..." 
            : "Search by Name, Mobile, Email, Location..."
        }
        value={globalFilter}
        onChange={handleSearchChange}
        className="mb-4"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showAllTasks ? (
                // All Tasks Table Headers
                <>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assign Task</TableHead>
                  <TableHead>Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showAllTasks ? (
              <>
                {allTasksLoading ? (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center">Loading tasks...</TableCell>
                  </TableRow>
                ) : allTasksError ? (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center text-red-500">
                      Error: {allTasksError}
                    </TableCell>
                  </TableRow>
                ) : allTasks && allTasks.length > 0 ? (
                  allTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.employeeName || 'Unassigned'}
                      </TableCell>
                      <TableCell>{task.taskName}</TableCell>
                      <TableCell className="max-w-xs truncate" title={task.description}>
                        {task.description}
                        </TableCell>
                        <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === "High" ? "bg-red-100 text-red-800" :
                          task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                          task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {task.employeeId && (
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/charger-installation-team/${task.employeeId}`, { 
                              state: { activeTab: 'tasks' } 
                            })}
                            title="View Employee Details"
                          >             
                            <InfoIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="8" className="text-center">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              // Teams Table Body
              <>
                {loading ? (
                  <TableRow>
        <TableCell colSpan="7" className="text-center py-4">
          <Loading />
        </TableCell>
      </TableRow>
                ) : teams.length > 0 ? (
                  teams.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.username}</TableCell>
                      <TableCell>{member.mobileNumber}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      {/* <TableCell>{member.location}</TableCell> */}
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.active ? "bg-green-100 text-green-800 border-green-400" : "bg-red-100 text-red-800 border-red-400"
                        }`}>
                          {member.active ? "active" : "inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/charger-installation-team/${member.id}`, { 
                            state: { activeTab: 'tasks', assignNewTask: true } 
                          })}
                          title="Assign Task"
                        >             
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/charger-installation-team/${member.id}`)}
                          title="View Details"
                        >             
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center">
                      No team members found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

   {/* Pagination Controls */}
<div className="flex items-center justify-center gap-2 py-4">
  {showAllTasks ? (
    // All Tasks Pagination with numbers
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleTasksPageChange(tasksCurrentPage - 1)}
        disabled={tasksCurrentPage === 0}
      >
        Previous
      </Button>

      {[...Array(tasksTotalPages)].map((_, index) => (
        <Button
          key={index}
          variant={index === tasksCurrentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTasksPageChange(index)}
        >
          {index + 1}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleTasksPageChange(tasksCurrentPage + 1)}
        disabled={tasksCurrentPage + 1 === tasksTotalPages}
      >
        Next
      </Button>
    </>
  ) : (
    // Teams Pagination with numbers
    <>
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
    </>
  )}
</div>
<AddTeamMember 
    open={isAddDialogOpen} 
    onOpenChange={setIsAddDialogOpen}
    onTeamMemberAdded={handleTeamMemberAdded}
  />
    </div>
  );
}

