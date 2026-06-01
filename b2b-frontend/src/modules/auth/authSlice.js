import { createSlice } from '@reduxjs/toolkit';

const getStoredToken = () => {
  const token = localStorage.getItem('token');
  if (token === "undefined" || token === "null") {
    localStorage.removeItem('token');
    return null;
  }
  return token;
};

const getStoredUser = () => {
  const user = localStorage.getItem('user');
  if (user === "undefined" || user === "null") {
    localStorage.removeItem('user');
    return null;
  }
  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const getStoredCsrfToken = () => {
  return localStorage.getItem('csrfToken');
};

const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  csrfToken: getStoredCsrfToken(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token, csrfToken } = action.payload;
      state.loading = false;
      state.isAuthenticated = !!token;
      state.user = user;
      state.token = token;
      state.csrfToken = csrfToken;
      
      if (user) localStorage.setItem('user', JSON.stringify(user));
      if (token) localStorage.setItem('token', token);
      if (csrfToken) localStorage.setItem('csrfToken', csrfToken);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    updateToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      localStorage.setItem('token', action.payload);
    },
    updateCsrfToken: (state, action) => {
      state.csrfToken = action.payload;
      localStorage.setItem('csrfToken', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.csrfToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('csrfToken');
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, 
  updateUser,
  updateToken,
  updateCsrfToken,
  logout 
} = authSlice.actions;
export default authSlice.reducer;
