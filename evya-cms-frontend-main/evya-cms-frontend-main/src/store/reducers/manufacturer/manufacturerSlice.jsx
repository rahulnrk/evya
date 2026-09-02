import AxiosServices from '@/services/AxiosServices';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseURL,baseOCPPURL } from '@/config';
const API_URL = `${baseURL}/services/manufacturer`;
  console.log(API_URL);

  export const fetchManufacturers = createAsyncThunk(
  'manufacturer/fetchManufacturers',
  async ({ page = 0, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/manufacturerList?page=${page}&size=${pageSize}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchManufacturerById = createAsyncThunk(
  'manufacturer/fetchManufacturerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/getManufracturer/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addManufacturer = createAsyncThunk(
  'manufacturer/addManufacturer',
  async (manufacturerData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/add`, manufacturerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateManufacturer = createAsyncThunk(
  'manufacturer/updateManufacturer',
  async ({ formattedData, id }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/update${id}`, formattedData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteManufacturer = createAsyncThunk(
  'manufacturer/deleteManufacturer',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/delete/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchManufacturers = createAsyncThunk(
  'manufacturer/searchManufacturers',
  async ({ search = '', page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/getManufracturer`);
      let manufacturers = response.data || [];
      if (search) {
        manufacturers = manufacturers.filter((m) =>
          m.manufacturerName?.toLowerCase().includes(search.toLowerCase()) ||
          m.contactInfo?.toLowerCase().includes(search.toLowerCase()) ||
          m.country?.toLowerCase().includes(search.toLowerCase())
        );
      }
      const start = page * size;
      const paginated = manufacturers.slice(start, start + size);

      return {
        content: paginated,
        totalElements: manufacturers.length,
        totalPages: Math.ceil(manufacturers.length / size),
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  manufacturers: [],
  selectedManufacturer: null,
  totalItems: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
  success: false,
  searchTerm:''
};

// Slice
const manufacturerSlice = createSlice({
  name: 'manufacturer',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Manufacturers List
      .addCase(fetchManufacturers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        state.loading = false;
        state.manufacturers = action.payload.manufacturers;
        state.totalItems = action.payload.totalItems;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch manufacturers';
      })
      
      // Fetch Manufacturer By Id
      .addCase(fetchManufacturerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedManufacturer = action.payload;
      })
      .addCase(fetchManufacturerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch manufacturer details';
      })
      
      // Add Manufacturer
      .addCase(addManufacturer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addManufacturer.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addManufacturer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add manufacturer';
        state.success = false;
      })
      .addCase(deleteManufacturer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteManufacturer.fulfilled, (state, action) => {
        state.loading = false;
        state.manufacturers = state.manufacturers.filter(
          (manufacturer) => manufacturer.id !== action.payload.id
        );
        state.success = true;
      })
      .addCase(deleteManufacturer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete manufacturer';
      })
       .addCase(searchManufacturers.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(searchManufacturers.fulfilled, (state, action) => {
    state.loading = false;
    state.manufacturers = action.payload.content;
    state.totalItems = action.payload.totalElements;
    state.totalPages = action.payload.totalPages;
    state.currentPage = action.payload.currentPage;
  })
  .addCase(searchManufacturers.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload || 'Failed to search manufacturers';
  });
  }
});

export const { clearError, clearSuccess } = manufacturerSlice.actions;
export default manufacturerSlice.reducer;