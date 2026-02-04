import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginUser } from '@/lib/api';

interface User {
  username: string;
  name?: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  isLoading: boolean;
  error: string | null;
}

const getInitialAuth = (): { 
  isAuthenticated: boolean; 
  user: User | null; 
  token: string | null; 
  refreshToken: string | null 
} => {
  if (typeof window !== 'undefined') {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    return {
      isAuthenticated,
      user: savedUser ? JSON.parse(savedUser) : null,
      token,
      refreshToken,
    };
  }
  return { isAuthenticated: false, user: null, token: null, refreshToken: null };
};

const initialAuth = getInitialAuth();

const initialState: AuthState = {
  isAuthenticated: initialAuth.isAuthenticated,
  user: initialAuth.user,
  token: initialAuth.token,
  refreshToken: initialAuth.refreshToken,
  isLoading: false,
  error: null,
};

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await loginUser({ username, password });
      if (!res.ok) return rejectWithValue(res.error || 'Login failed');
      // backend returns fields like: { message, username, role, access_token, refresh_token, ... }
      const payload = res.data as any;
      const token = payload.access_token ?? payload.token ?? null;
      const refreshToken = payload.refresh_token ?? payload.refreshToken ?? null;
      const user = {
        username: payload.username ?? payload.user?.username ?? payload.user?.email ?? payload.user ?? username,
        role: payload.role ?? payload.user?.role ?? undefined,
      } as User;

      if (token) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      return { user, token, refreshToken };
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Network error');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action: PayloadAction<{
        user: User; 
        token: string | null; 
        refreshToken?: string | null 
      }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken ?? null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
