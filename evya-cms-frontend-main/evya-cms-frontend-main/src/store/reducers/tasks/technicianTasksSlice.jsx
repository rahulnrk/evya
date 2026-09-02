import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AxiosServices from "@/services/AxiosServices";

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

export const assignNewTask = createAsyncThunk(
  "technicianTasks/assign",
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.assignTask(taskData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTasksByEmployeeId = createAsyncThunk(
  'technicianTasks/fetchTasksByEmployeeId',
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.get(`/tasks/employee/${employeeId}/tasks`);
       console.log("API Response for tasks:", response.data); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee tasks');
    }
  }
);

export const fetchTaskCount = createAsyncThunk(
  "technicianTasks/fetchTaskCount",
  async (_, { rejectWithValue }) => {
    try {
      return await AxiosServices.getTaskCount();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "technicianTasks/updateStatus",
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      const backendStatus = status === "IN_PROGRESS" ? "INPROGRESS" : status;
      await AxiosServices.updateTaskStatusAPI(taskId, backendStatus);      
      return { id: taskId, status: backendStatus };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTaskCountByEmployee = createAsyncThunk(
  "technicianTasks/fetchCountByEmployee",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getTaskCountByEmployee(employeeId);
      return { employeeId, count: response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTasksByEmployee = createAsyncThunk(
  "technicianTasks/fetchTasksByEmployee",
  async (employeeId, { rejectWithValue }) => {
    try {
      return await AxiosServices.getTasksByEmployee(employeeId);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchTasks = createAsyncThunk(
  "technicianTasks/fetchTasks",
  async ({ page = 0, size = 10, search = '', status = '' }, { getState, rejectWithValue }) => {
    try {
      const { authentication } = getState();
      const employeeId = authentication?.user?.id;

      const response = await AxiosServices.getPaginatedTasks({ page, size, search, status, employeeId });
      return response;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const technicianTasksSlice = createSlice({
  name: "technicianTasks",
  initialState: {
    total: 0,
    employeeCount: 0,
    tasksByEmployee: {
      items: [],
      totalPages: 1,
      currentPage: 1,
      totalItems: 0,
      status: 'idle',
      error: null,
      pending: [],
      inProgress: [],
      completed: [],
    },
    tasks: [],
    loading: false,
    error: null,
    taskCounts: {}
  },
  reducers: {},
  extraReducers: (builder) => {
   builder

   .addCase(fetchTasks.pending, (state) => {
    state.status = "loading";       
    state.error = null;             
  })
  .addCase(fetchTasks.fulfilled, (state, action) => {
    state.status = "succeeded";
    state.tasks = action.payload.tasks || [];         
    state.currentPage = action.payload.currentPage ?? 0;
    state.totalPages = action.payload.totalPages ?? 1;
    state.totalItems = action.payload.totalItems ?? 0;
  })
  .addCase(fetchTasks.rejected, (state, action) => {
    state.status = "failed";
    state.tasks = [];                     
    state.currentPage = 0;
    state.totalPages = 1;
    state.totalItems = 0;
    state.error = action.payload || "Failed to fetch tasks";
  });

  builder
  .addCase(assignNewTask.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(assignNewTask.fulfilled, (state, action) => {
    state.loading = false;
  })
  .addCase(assignNewTask.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });

    builder
      .addCase(fetchTaskCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaskCount.fulfilled, (state, action) => {
        state.loading = false;
        state.total = action.payload;
      })
      .addCase(fetchTaskCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchTaskCountByEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaskCountByEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const { employeeId, count } = action.payload;
        state.taskCounts = { ...state.taskCounts, [employeeId]: count };
      })
      .addCase(fetchTaskCountByEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

      builder
      .addCase(fetchTasksByEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasksByEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const tasks = action.payload;

        state.tasksByEmployee.pending = tasks.filter(t => t.status === "PENDING");
        state.tasksByEmployee.inProgress = tasks.filter(t => t.status === "INPROGRESS");
        state.tasksByEmployee.completed = tasks.filter(t => t.status === "COMPLETED");
      })
      .addCase(fetchTasksByEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
builder.addCase(updateTaskStatus.fulfilled, (state, action) => {
  state.loading = false;
  console.log("Fulfilled - Current tasks:", state.tasks);
  console.log("Action payload:", action.payload);
  console.log("Action meta:", action.meta);

  if (action.meta && action.meta.arg) {
    const { taskId, status } = action.meta.arg;
    console.log("Updating task with ID:", taskId, "to status:", status);
    state.tasks = state.tasks.map(task =>
      task.id === taskId ? { ...task, status } : task
    );
  } else if (action.payload && action.payload.id) {
    const { id, status } = action.payload;
    console.log("Updating task with ID:", id, "to status:", status);
    state.tasks = state.tasks.map(task =>
      task.id === id ? { ...task, status } : task
    );
  }
  console.log("Updated tasks:", state.tasks);
});

builder
.addCase(fetchTasksByEmployeeId.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchTasksByEmployeeId.fulfilled, (state, action) => {
  state.loading = false;
  state.tasks = action.payload;
})
.addCase(fetchTasksByEmployeeId.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});
  },
});
export default technicianTasksSlice.reducer;
