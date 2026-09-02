import { createSlice } from '@reduxjs/toolkit';
import AxiosServices, { axiosInstance } from '@/services/AxiosServices';
import { fetchIssuesByEmployeeId } from '@/store/reducers/employee/employeeSlice';

const initialState = {
  list: [],
  status: 'idle',
  error: null,
  totalElements: 0,
  currentPage: 0,
  openIssuesCount: 0,
  openIssuesCountStatus: 'idle',
   issueNotes: [],
  notesStatus: 'idle',
  notesError: null,
};

const issuesSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    getIssuesStart: (state) => {
      state.status = 'loading';
    },
    getIssuesSuccess: (state, action) => {
      state.status = 'succeeded';
      state.list = action.payload.content; // Handle both paginated and non-paginated responses
      state.totalElements = action.payload.totalItems;
      state.currentPage = action.payload.number || 0;
    },
    getIssuesFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    getOpenIssuesCountStart: (state) => {
      state.openIssuesCountStatus = 'loading';
    },
    getOpenIssuesCountSuccess: (state, action) => {
      state.openIssuesCount = action.payload;
      state.openIssuesCountStatus = 'succeeded';
    },
    getOpenIssuesCountFailure: (state, action) => {
      state.openIssuesCountStatus = 'failed';
      state.error = action.payload;
    },
    resetIssuesState: () => initialState,
    addIssueSuccess: (state, action) => {
      state.list = [action.payload, ...state.list];
      state.totalElements += 1;
    },

      getIssueNotesStart: (state) => {
      state.notesStatus = 'loading';
    },
    getIssueNotesSuccess: (state, action) => {
      state.notesStatus = 'succeeded';
      state.issueNotes = action.payload;
    },
    getIssueNotesFailure: (state, action) => {
      state.notesStatus = 'failed';
      state.notesError = action.payload;
    },
  },
});

export const {
  getIssuesStart,
  getIssuesSuccess,
  getIssuesFailure,
  getOpenIssuesCountStart,
  getOpenIssuesCountSuccess,
  getOpenIssuesCountFailure,
  resetIssuesState,
  addIssueSuccess,
   getIssueNotesStart,
  getIssueNotesSuccess,
  getIssueNotesFailure,
} = issuesSlice.actions;

// Common pagination params
const defaultPagination = {
  page: 0,
  size: 10,
  sortBy: 'createdDate',
  orderBy: 'desc',
};

export const fetchIssues = (params = {}) => async (dispatch) => {
  try {
    dispatch(getIssuesStart());
     const response = await AxiosServices.getIssuesByStatus(params);
    console.log(response);
    dispatch(getIssuesSuccess(response.data));
  } catch (error) {
    dispatch(getIssuesFailure(error.message));
  }
};

export const addIssue = (issueData) => async (dispatch) => {
  try {
    const response = await AxiosServices.addIssue(issueData);
        console.log('Add issue response 👉', response.data);
    dispatch(addIssueSuccess(response.data));
    if(issueData.employee_id) {
      dispatch(fetchIssuesByEmployeeId(issueData.employee_id));
    }
  } catch (error) {
    console.error('Error adding issue:', error);
    throw error;
  }
};

export const updateIssue = (issueData,id) => async (dispatch) => {
  try {
    await AxiosServices.updateIssue(issueData,id);
    dispatch(fetchIssues());
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
};

export const deleteIssue = (id) => async (dispatch) => {
  try {
    await AxiosServices.deleteIssue(id);
    dispatch(fetchIssues());
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
};

export const fetchOpenIssuesCount = () => async (dispatch) => {
  try {
    dispatch(getOpenIssuesCountStart());
    const response = await AxiosServices.getIssues({
      page: 0,
      size: 1000, // Get enough to count all open issues
      sortBy: 'createdDate',
      orderBy: 'desc',
      status: 'open' // Add filter if your API supports it
    });

    // Calculate open issues (if API doesn't filter)
    const openIssues = response.content ? 
      response.content.filter(issue => issue.status === "open") : 
      response.filter(issue => issue.status === "open");
    
    dispatch(getOpenIssuesCountSuccess(openIssues));
  } catch (error) {
    console.error('Error fetching open issues count:', error);
    dispatch(getOpenIssuesCountFailure(error.message));
  }
};

export const updateIssueStatus = (issueId, newStatus) => async (dispatch) => {
  try {
    await AxiosServices.updateIssueStatus(issueId, newStatus);
    // Refresh the issues list after updating
    dispatch(fetchIssues());
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
};

export const updateIssuePriority = (issueId ,newPriority) => async (dispatch) => {
  try {
    await AxiosServices.updateIssuePriority(issueId, newPriority);
    dispatch(fetchIssues());
  } catch (error) {
    console.error('Error updating issue priority:', error);
    throw error;
  }
};

export const addIssueNote = (noteData) => async (dispatch) => {
  try {
    // call your Axios service
    const response = await AxiosServices.addIssueNote(noteData);

    return response; // contains the { message: "Note added successfully with ID: ..." }
  } catch (error) {
    console.error("Error adding issue note:", error);
    throw error; // allow components to handle UI errors
  }
};

export const fetchIssueNotes = (issueId) => async (dispatch) => {
  try {
    dispatch(getIssueNotesStart());
    const data = await AxiosServices.getNotesByIssueId(issueId);
    dispatch(getIssueNotesSuccess(data));
  } catch (error) {
    dispatch(getIssueNotesFailure(error));
  }
};

export const updateIssueNote = (issueId, noteId, noteData) => async (dispatch) => {
  try {
    await AxiosServices.updateIssueNote(issueId, noteId, noteData);
    dispatch(fetchIssueNotes(issueId)); // refresh notes
  } catch (error) {
    console.error("Error updating issue note:", error);
    throw error;
  }
};
export const deleteIssueNote = (issueId, noteId) => async (dispatch) => {
  try {
    await AxiosServices.deleteIssueNote(issueId, noteId);
    dispatch(fetchIssueNotes(issueId));
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};
export default issuesSlice.reducer;
