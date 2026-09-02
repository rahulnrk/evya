import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';

const API_BASE_URL = 'http://localhost:8800/api';

export const fetchTechnician = createAsyncThunk(
  'technician/fetchTechnician',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/employee/getEmployees/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Technician data:', data); 
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch technician');
    }
  }
);

export const updateTechnicianProfile = createAsyncThunk(
  'technician/updateTechnician',
  async ({ id, technicianData }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.fetch(`${API_BASE_URL}/services/employee/updateEmployee/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(technicianData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update technician');
    }
  }
);

export const fetchTechnicianJobs = createAsyncThunk(
  'technician/fetchJobs',
  async (technicianId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.fetch(`${API_BASE_URL}/services/jobs/technician/${technicianId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Jobs data:', data); 
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchTechnicianStats = createAsyncThunk(
  'technician/fetchStats',
  async (technicianId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.AxiosServices.fetch(`${API_BASE_URL}/services/dashboard/technician-stats/${technicianId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Stats data:', data); // Debug log
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch stats');
    }
  }
);

export const fetchTaskNotes = createAsyncThunk(
  'technicianTasks/fetchTaskNotes',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getNotesByTaskId(taskId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notes');
    }
  }
);

export const addTaskNote = createAsyncThunk(
  'technicianTasks/addTaskNote',
  async ({ taskId, noteData, employeeId }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.addNote({
        ...noteData,
        taskId: parseInt(taskId),
        employeeId: parseInt(employeeId),
        createdDate: new Date().toISOString()
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add note');
    }
  }
);

export const updateTaskNote = createAsyncThunk(
  'technicianTasks/updateTaskNote',
  async ({ noteId, noteData, currentUserId }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.updateNote(noteId, noteData, currentUserId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update note');
    }
  }
);

export const deleteTaskNote = createAsyncThunk(
  'technicianTasks/deleteTaskNote',
  async ({ noteId, currentUserId }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.deleteNote(noteId, currentUserId);
      return { noteId, response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete note');
    }
  }
);

const initialState = {
  technician: null,
  jobs: {
    assigned: [],
    completed: [],
    pending: []
  },
  stats: {
    assignedJobs: 0,
    completedJobs: 0,
    pendingJobs: 0
  },
  loading: false,
  error: null,
  success: false
};

const technicianSlice = createSlice({
  name: 'technician',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetTechnician: (state) => {
      state.technician = null;
      state.jobs = { assigned: [], completed: [], pending: [] };
      state.stats = { assignedJobs: 0, completedJobs: 0, pendingJobs: 0 };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTechnician.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTechnician.fulfilled, (state, action) => {
        state.loading = false;
        const employeeData = action.payload;
        state.technician = {
          id: employeeData.id,
          name: employeeData.username || techData.name,
          username: employeeData.username,
          email: employeeData.email,
          mobileNumber: employeeData.mobileNumber,
          designation: employeeData.designation,
          location: employeeData.location,
          isActive: employeeData.isActive !== undefined ? techData.isActive : techData.active,
          joiningDate: employeeData.joiningDate,
          experience: employeeData.experience,
          address: employeeData.address || [{ 
            address: employeeData.location || '', 
            city: '', 
            state: '', 
            country: '', 
            zipCode: '' 
          }]
        };
      })
      .addCase(fetchTechnician.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTechnicianProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTechnicianProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (state.technician) {
          state.technician = { ...state.technician, ...action.payload };
        }
      })
      .addCase(updateTechnicianProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(fetchTechnicianJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTechnicianJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchTechnicianJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTechnicianStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTechnicianStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTechnicianStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
      builder
       .addCase(fetchTaskNotes.pending, (state) => {
      state.notesLoading = true;
      state.notesError = null;
    })
    .addCase(fetchTaskNotes.fulfilled, (state, action) => {
      state.notesLoading = false;
      if (action.meta.arg) {
        state.taskNotes[action.meta.arg] = action.payload;
      }
    })
    .addCase(fetchTaskNotes.rejected, (state, action) => {
      state.notesLoading = false;
      state.notesError = action.payload;
    })
    .addCase(addTaskNote.fulfilled, (state, action) => {
      const taskId = action.meta.arg.taskId;
      if (!state.taskNotes[taskId]) {
        state.taskNotes[taskId] = [];
      }
      state.taskNotes[taskId].push(action.payload);
    })
    .addCase(updateTaskNote.fulfilled, (state, action) => {
      for (const taskId in state.taskNotes) {
        const index = state.taskNotes[taskId].findIndex(note => note.id === action.payload.id);
        if (index !== -1) {
          state.taskNotes[taskId][index] = action.payload;
          break;
        }
      }
    })
    .addCase(deleteTaskNote.fulfilled, (state, action) => {
      const { noteId } = action.payload;
      for (const taskId in state.taskNotes) {
        state.taskNotes[taskId] = state.taskNotes[taskId].filter(note => note.id !== noteId);
      }
    });
    
  }
});

export const { clearError, clearSuccess, resetTechnician } = technicianSlice.actions;
export default technicianSlice.reducer;