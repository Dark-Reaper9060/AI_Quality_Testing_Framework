import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language } from '@/lib/i18n';

interface LanguageState {
  current: Language;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as Language | null;
    return saved || 'en';
  }
  return 'en';
};

const initialState: LanguageState = {
  current: getInitialLanguage(),
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.current = action.payload;
      localStorage.setItem('language', action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
