import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

export const fetchTeams = createAsyncThunk(
  'chargerInstallation/fetchTeams',
  async ({ page = 0, size = 10, search = '', designation = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getPaginatedEmployees({ page, size, search, designation });
      return response || { employees: [], currentPage: 0, totalItems: 0, totalPages: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch employees'
      );
    }
  }
);

export const fetchTechnicianTasks = createAsyncThunk(
  "technicianTasks/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { authentication } = getState();
      const employeeId = authentication?.user?.id;

      if (!employeeId) {
        return rejectWithValue("Employee ID not found in auth state");
      }

      const response = await AxiosServices.getTasksByEmployee(employeeId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message);
    }
  }
);

export const fetchAllEmployees = createAsyncThunk(
  'chargerInstallation/fetchAllEmployees',
  async (designation, { rejectWithValue }) => {   // accept designation here
    try {
      const response = await AxiosServices.getAllTeams(designation); // pass it
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'chargerInstallation/fetchEmployeeById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getEmployeeById(id);
      return response; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee');
    }
  }
);

export const addTeam = createAsyncThunk(
  'chargerInstallation/addTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      let formattedJoiningDate = null;

      if (teamData.joiningDate) {
        if (Array.isArray(teamData.joiningDate)) {
          const [year, month, day] = teamData.joiningDate;
          formattedJoiningDate = `${year}-${month.toString().padStart(2, "0")}-${day
            .toString()
            .padStart(2, "0")}`;
        } else {
          formattedJoiningDate = teamData.joiningDate;
        }
      }

      const payload = {
        username: teamData.username,
        mobileNumber: teamData.mobileNumber,
        email: teamData.email,
        location: teamData.location,
        designation: teamData.designation || "charger installer",
        active: teamData.active === "true" || teamData.active === true,
        joiningDate: formattedJoiningDate,
        password: "defaultPassword123",
        confirmPassword: "defaultPassword123",
      };

      const response = await AxiosServices.addEmployee(payload);
      return response;
    } catch (error) {
      console.error("Error in addTeam:", error);

      // EXACT MATCH to AddCustomerSupport
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to add team member";

      return rejectWithValue(backendMessage);
    }
  }
);


export const editTeam = createAsyncThunk(
  'chargerInstallation/editTeam',
  async ({ id, teamData }, { rejectWithValue, dispatch }) => {
    try {
      const payload = {
        username: teamData.username,
        mobileNumber: teamData.mobileNumber,
        email: teamData.email,
        location: teamData.location,
        designation: 'charger installer',
        active: teamData.active,
        joiningDate: teamData.joiningDate ? new Date(teamData.joiningDate.join('-')) : null,
      };     
      await AxiosServices.updateTeam(id, payload);
      const updatedEmployee = await AxiosServices.getEmployeeById(id);
      dispatch(fetchTeams({ page: 0, size: 10 }));
      return updatedEmployee;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update team member');
    }
  }
);

export const fetchAllTasks = createAsyncThunk(
  'chargerInstallation/fetchAllTasks',
  async ({ page = 0, size = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getAllTasks({ page, size, search });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch all tasks');
    }
  }
);

export const assignTeamTask = createAsyncThunk(
  'chargerInstallation/assignTeamTask',
  async ({ employeeId, taskData }, { rejectWithValue }) => {
    try {
      const backendTaskData = {
        taskName: taskData.taskName,           
        description: taskData.description,
        employeeId: employeeId,
        location: taskData.location || '',       
        priority: taskData.priority || 'Medium', 
        dueDate: taskData.dueDate || '',         
        status: "PENDING"                      
      };
      
      console.log('Sending task data to backend:', backendTaskData);
      
      const response = await AxiosServices.assignTask(backendTaskData);
      return { employeeId, task: response };
      
    } catch (error) {
      console.error('Error in assignTeamTask:', error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to assign task'
      );
    }
  }
);

export const updateTeamTaskProgress = createAsyncThunk(
  'chargerInstallation/updateTeamTaskProgress',
  async ({ id, taskName, progress }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.updateTaskProgress(id, taskName, progress);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task progress');
    }
  }
);

// Fetch notes by task ID
export const fetchTaskNotes = createAsyncThunk(
  'chargerInstallation/fetchTaskNotes',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getNotesByTaskId(taskId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch task notes');
    }
  }
);

// Add note to task
export const addTaskNote = createAsyncThunk(
  'chargerInstallation/addTaskNote',
  async (noteData, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.addNoteToTask(noteData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add note');
    }
  }
);

// Update task note
export const updateTaskNote = createAsyncThunk(
  'chargerInstallation/updateTaskNote',
  async ({ noteId, noteData }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.updateNote(noteId, noteData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update note');
    }
  }
);

// Delete task note
export const deleteTaskNote = createAsyncThunk(
  'chargerInstallation/deleteTaskNote',
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.deleteNote(noteId);
      return { noteId, response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete note');
    }
  }
);

const chargerInstallationSlice = createSlice({
  name: 'chargerInstallation',
  initialState: {
    teams: [],
    taskNotes: [],
    taskNotesLoading: false,
    taskNotesError: null,
    currentTeam: null,
    loading: false,
    error: null,
    notes: [],
    notesLoading: false,
    notesError: null,
    conversation: [],
    conversationLoading: false,
    success: false,
     allEmployees: [],
    allEmployeesLoading: false,
    allEmployeesError: null,
    currentPage: 0,
    totalItems: 0,
    totalPages: 0,
     // for all employee tasks
    allTasks: [],
    allTasksLoading: false,
    allTasksError: null,
    tasksCurrentPage: 0,
    tasksTotalPages: 0,
    tasksTotalItems: 0,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentTeam: (state, action) => {
      state.currentTeam = action.payload;
    },
    resetCurrentTeam: (state) => {
      state.currentTeam = null;
    },
     clearEmployeesError: (state) => {
      state.allEmployeesError = null;
    }
  },
  extraReducers: (builder) => {
    builder
     
.addCase(fetchTeams.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchTeams.fulfilled, (state, action) => {
  state.loading = false;
  state.teams = action.payload.employees || [];
  state.currentPage = action.payload.currentPage;
  state.totalItems = action.payload.totalItems;
  state.totalPages = action.payload.totalPages;
})
.addCase(fetchTeams.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
  state.teams = [];
});

builder
  .addCase(fetchEmployeeById.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(fetchEmployeeById.fulfilled, (state, action) => {
    state.loading = false;
    state.currentTeam = action.payload; 
  })
  .addCase(fetchEmployeeById.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });

builder       
      .addCase(fetchAllEmployees.pending, (state) => {
        state.allEmployeesLoading = true;
        state.allEmployeesError = null;
      })
      .addCase(fetchAllEmployees.fulfilled, (state, action) => {
        state.allEmployeesLoading = false;
        state.allEmployees = action.payload;
      })
      .addCase(fetchAllEmployees.rejected, (state, action) => {
        state.allEmployeesLoading = false;
        state.allEmployeesError = action.payload;
      })

      // Add team
      .addCase(addTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.teams.push(action.payload);
        state.error = null;
      })
      .addCase(addTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Edit team
      .addCase(editTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(editTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.teams.findIndex(team => team.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
        if (state.currentTeam && state.currentTeam.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
        state.error = null;
      })
      .addCase(editTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

// Assign task
.addCase(assignTeamTask.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(assignTeamTask.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;
  state.error = null;
})
.addCase(assignTeamTask.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

// Update task progress
.addCase(updateTeamTaskProgress.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(updateTeamTaskProgress.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;
  state.error = null;
})
.addCase(updateTeamTaskProgress.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

//for task notes
.addCase(fetchTaskNotes.pending, (state) => {
  state.taskNotesLoading = true;
  state.taskNotesError = null;
})
.addCase(fetchTaskNotes.fulfilled, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotes = action.payload;
})
.addCase(fetchTaskNotes.rejected, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotesError = action.payload;
})
.addCase(addTaskNote.pending, (state) => {
  state.taskNotesLoading = true;
  state.taskNotesError = null;
})
.addCase(addTaskNote.fulfilled, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotes.unshift(action.payload);
})
.addCase(addTaskNote.rejected, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotesError = action.payload;
})
.addCase(updateTaskNote.pending, (state) => {
  state.taskNotesLoading = true;
  state.taskNotesError = null;
})
.addCase(updateTaskNote.fulfilled, (state, action) => {
  state.taskNotesLoading = false;
  const index = state.taskNotes.findIndex(note => note.id === action.payload.id);
  if (index !== -1) {
    state.taskNotes[index] = action.payload;
  }
})
.addCase(updateTaskNote.rejected, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotesError = action.payload;
})
.addCase(deleteTaskNote.pending, (state) => {
  state.taskNotesLoading = true;
  state.taskNotesError = null;
})
.addCase(deleteTaskNote.fulfilled, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotes = state.taskNotes.filter(note => note.id !== action.payload.noteId);
})
.addCase(deleteTaskNote.rejected, (state, action) => {
  state.taskNotesLoading = false;
  state.taskNotesError = action.payload;
})

//for all employee tasks....
 .addCase(fetchAllTasks.pending, (state) => {
      state.allTasksLoading = true;
      state.allTasksError = null;
    })
    .addCase(fetchAllTasks.fulfilled, (state, action) => {
      state.allTasksLoading = false;
      state.allTasks = action.payload.content || [];
      state.tasksCurrentPage = action.payload.currentPage || 0;
      state.tasksTotalPages = action.payload.totalPages || 0;
      state.tasksTotalItems = action.payload.totalItems || 0;
    })
    .addCase(fetchAllTasks.rejected, (state, action) => {
      state.allTasksLoading = false;
      state.allTasksError = action.payload;
    });
}  
});

export const { clearError, clearSuccess, setCurrentTeam, resetCurrentTeam, clearEmployeesError } = chargerInstallationSlice.actions;
export default chargerInstallationSlice.reducer;