import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AxiosServices from '@/services/AxiosServices';
// Thunk
export const fetchEmployeeById = createAsyncThunk(
  "employee/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getEmployeeById(id);
      return response;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || "Something went wrong");
        }
    }
);

export const fetchEmployeesByDesignation = createAsyncThunk(
  "employee/fetchByDesignation",
  async (designation, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getEmployeesByDesignation(designation);
      return response;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || "Something went wrong");
    }
  }
);

export const fetchEmployees = createAsyncThunk(
  "employees/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllEmployees();
      return response;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || "Something went wrong");
    }
  }
);

export const fetchEmployeesPaginated = createAsyncThunk(
  "employees/fetchPaginated",
  async ({ page = 0, size = 10, designation = "", search = "" }, { rejectWithValue }) => {
    try {
      const data = await AxiosServices.getEmployeesPaginated(page, size, designation, search);
      return data; // keep full object for pagination info
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Something went wrong"
      );
    }
  }
);

export const fetchIssuesByEmployeeId = createAsyncThunk( "employee/fetchIssuesById",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getIssuesByEmployeeId(employeeId);
            console.log("API response for employee issues:", response);  // <-- add this

      return { employeeId, issues: response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Something went wrong"
      );
    }
  }
);

export const editEmployee = createAsyncThunk(
  "employee/editEmployee",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.updateEmployee(id, data);
      return { id, updatedEmployee: data }; // return updated data for redux
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update employee");
    }
  }
);

export const fetchResolvedIssuesByEmployeeId = createAsyncThunk(
  "employee/fetchResolvedIssuesById",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await AxiosServices.getResolvedIssuesByEmployeeId(employeeId);
      return { employeeId, resolvedIssues: response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch resolved issues"
      );
    }
  }
);

const employeeSlice = createSlice({
  name: "employee",
  initialState: {
    employee: null,
    employees:[],
    search: "",
    pagination: {
    page: 0,
    size: 10,
    totalPages: 0,
    totalItems: 0,
  },
    loading: {
        all: false,
        byId: false,
        byDesignation: false,
        issues: false,
        paginated: false,
    },
    employeeIssues: {},
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading.byId = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading.byId = false;
        state.employee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading.byId = false;
        state.error = action.payload;
      });

      builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading.all = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading.all = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading.all = false;
        state.error = action.payload;
      });
      builder
      .addCase(fetchEmployeesPaginated.pending, (state) => {
        state.loading.paginated = true;
        state.error = null;
      })
      .addCase(fetchEmployeesPaginated.fulfilled, (state, action) => {
        state.loading.paginated = false;
        const { employees, currentPage, totalItems, totalPages } = action.payload;
        state.employees = employees;
        state.pagination = {
          ...state.pagination,
          page: currentPage,
          totalItems,
          totalPages,
        };
      })
      .addCase(fetchEmployeesPaginated.rejected, (state, action) => {
        state.loading.paginated = false;
        state.error = action.payload;
      });
      builder
      .addCase(fetchEmployeesByDesignation.pending, (state) => {
        state.loading.byDesignation = true;
        state.error = null;
      })
      .addCase(fetchEmployeesByDesignation.fulfilled, (state, action) => {
        state.loading.byDesignation = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeesByDesignation.rejected, (state, action) => {
        state.loading.byDesignation = false;
        state.error = action.payload;
      });

      builder
      .addCase(fetchIssuesByEmployeeId.pending, (state) => {
        state.loading.issues = true;
        state.error = null;
      })
      .addCase(fetchIssuesByEmployeeId.fulfilled, (state, action) => {
      state.loading.issues = false;
      const { employeeId, issues } = action.payload;
      state.employeeIssues = {
        ...state.employeeIssues,
        [employeeId]: [...issues],
      };
    })      
        .addCase(fetchIssuesByEmployeeId.rejected, (state, action) => {
        state.loading.issues = false;
        state.error = action.payload;
      });
      builder
      .addCase(editEmployee.pending, (state) => {
        state.loading.byId = true;
        state.error = null;
      })
      .addCase(editEmployee.fulfilled, (state, action) => {
      state.loading.byId = false;
      const { id, updatedEmployee } = action.payload;      
      const index = state.employees.findIndex(emp => emp.id === id);
      if (index !== -1) {
        state.employees[index] = { ...state.employees[index], ...updatedEmployee };
      }
      if (state.employee?.id === id) {
        state.employee = { ...state.employee, ...updatedEmployee };
      }
     })
    .addCase(editEmployee.rejected, (state, action) => {
      state.loading.byId = false;
      state.error = action.payload;
    });

    builder
  .addCase(fetchResolvedIssuesByEmployeeId.pending, (state) => {
    state.loading.issues = true;
    state.error = null;
  })
  .addCase(fetchResolvedIssuesByEmployeeId.fulfilled, (state, action) => {
    state.loading.issues = false;
    const { employeeId, resolvedIssues } = action.payload;
    if (!state.employeeIssues) state.employeeIssues = {};
    state.employeeIssues[employeeId] = resolvedIssues;
  })
  .addCase(fetchResolvedIssuesByEmployeeId.rejected, (state, action) => {
    state.loading.issues = false;
    state.error = action.payload;
  });
  },
});
export default employeeSlice.reducer;
