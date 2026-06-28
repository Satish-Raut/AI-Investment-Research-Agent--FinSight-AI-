import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  loading: false,
  activeNode: 'IDLE', // START, RESOLVE, FETCH_DATA, FETCH_NEWS, ANALYZE, DECIDE, COMPLETED, ERROR
  logs: [],
  error: null,
  report: null,
};

const researchSlice = createSlice({
  name: 'research',
  initialState,
  reducers: {
    startResearch: (state, action) => {
      state.query = action.payload;
      state.loading = true;
      state.activeNode = 'START';
      state.logs = [];
      state.error = null;
      state.report = null;
    },
    updateNodeProgress: (state, action) => {
      const { node, logs, error } = action.payload;
      if (error) {
        state.error = error;
        state.activeNode = 'ERROR';
        state.loading = false;
      }
      if (node) {
        state.activeNode = node.toUpperCase();
      }
      if (logs) {
        const existingMessages = new Set(state.logs.map(l => l.message));
        const newLogs = logs.filter(log => !existingMessages.has(log.message));
        state.logs = [...state.logs, ...newLogs];
      }
    },
    setResearchResult: (state, action) => {
      state.report = action.payload;
      state.loading = false;
      state.activeNode = 'COMPLETED';
    },
    setResearchError: (state, action) => {
      state.error = action.payload;
      state.activeNode = 'ERROR';
      state.loading = false;
    },
    resetResearch: (state) => {
      return initialState;
    }
  }
});

export const { startResearch, updateNodeProgress, setResearchResult, setResearchError, resetResearch } = researchSlice.actions;
export default researchSlice.reducer;
