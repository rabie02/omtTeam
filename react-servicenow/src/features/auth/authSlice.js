import { createSlice } from '@reduxjs/toolkit';
import { userLogin, registerUser, userLogout, fetchUserInfo } from './authActions';

// Default user structure
const DEFAULT_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  roles: ['Guest'],
  last_login_time: new Date().toISOString()
};

const initialState = {
  loading: false,
  userInfo: null,  // No localStorage fallback
  userToken: null, // No localStorage fallback
  error: null,
  success: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.userToken = null;
      state.error = null;
    },
    setGuestData: (state) => {
      if (!state.userInfo) {
        state.userInfo = DEFAULT_USER;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(userLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(userLogin.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.userInfo = {
          ...DEFAULT_USER,
          ...payload,
          last_login_time: new Date().toISOString()
        };
        state.userToken = payload.access_token;
        state.success = true;
      })
      .addCase(userLogin.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // Fetch user info cases
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.userInfo = {
          ...DEFAULT_USER,
          ...payload.user,
          last_login_time: payload.user?.last_login_time || new Date().toISOString()
        };
        state.success = true;
      })
      .addCase(fetchUserInfo.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // Registration cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // Logout cases
      .addCase(userLogout.pending, (state) => {
        state.loading = true;
      })
      .addCase(userLogout.fulfilled, (state) => {
        state.loading = false;
        state.userInfo = DEFAULT_USER; // Revert to guest on logout
        state.userToken = null;
      })
      .addCase(userLogout.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export const { logout, setGuestData } = authSlice.actions;
export default authSlice.reducer;