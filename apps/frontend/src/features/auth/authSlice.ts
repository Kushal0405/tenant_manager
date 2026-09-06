import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserPublic } from "@rent-manager/shared";

const STORAGE_KEY = "rent-manager-token";

interface AuthState {
  token: string | null;
  user: UserPublic | null;
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  token: readStoredToken(),
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: UserPublic }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload.token);
      } catch {
        // ignore storage failures (e.g. private browsing)
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
