import { createSlice } from '@reduxjs/toolkit';

const loadHistoryFromStorage = () => {
  try {
    const saved = localStorage.getItem('research_history');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: loadHistoryFromStorage(),
  },
  reducers: {
    addReportToHistory: (state, action) => {
      const newReport = action.payload;
      const filtered = state.items.filter(item => item.ticker !== newReport.ticker);
      state.items = [newReport, ...filtered].slice(0, 10);
      localStorage.setItem('research_history', JSON.stringify(state.items));
    },
    removeReportFromHistory: (state, action) => {
      const ticker = action.payload;
      state.items = state.items.filter(item => item.ticker !== ticker);
      localStorage.setItem('research_history', JSON.stringify(state.items));
    },
    clearAllHistory: (state) => {
      state.items = [];
      localStorage.removeItem('research_history');
    }
  }
});

export const { addReportToHistory, removeReportFromHistory, clearAllHistory } = historySlice.actions;
export default historySlice.reducer;
