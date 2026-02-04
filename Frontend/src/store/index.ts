import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import themeReducer from './slices/themeSlice';
import languageReducer from './slices/languageSlice';
import authReducer from './slices/authSlice';
import workflowReducer from './slices/workflowSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    language: languageReducer,
    auth: authReducer,
    workflow: workflowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Initialize theme on load
const initializeTheme = () => {
  const theme = store.getState().theme.mode;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

initializeTheme();
