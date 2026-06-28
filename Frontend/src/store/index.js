import { configureStore } from '@reduxjs/toolkit';
import researchReducer from './researchSlice';
import historyReducer from './historySlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    research: researchReducer,
    history: historyReducer,
    auth: authReducer,
  },
});

