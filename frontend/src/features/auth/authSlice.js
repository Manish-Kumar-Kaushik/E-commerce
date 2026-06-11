import { createSlice } from '@reduxjs/toolkit'
import { readStoredJson, readStoredToken } from '../../utils/storage'

// Initialize from localStorage if available
const getInitialState = () => {
  const token = readStoredToken()
  const user = readStoredJson('user', null)

  const normalizedUser = user && typeof user === 'object' ? user : null
  
  return {
    token,
    user: normalizedUser,
    isLoaded: true,
    isSignedIn: !!normalizedUser,
  }
}

const initialState = getInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload?.token ?? null
      state.user = action.payload?.user ?? null
      state.isLoaded = true
      state.isSignedIn = !!action.payload?.user
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.isLoaded = true
      state.isSignedIn = !!action.payload
    },
    setSignedIn: (state, action) => {
      state.isSignedIn = action.payload
      state.isLoaded = true
    },
    setLoaded: (state) => {
      state.isLoaded = true
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isSignedIn = false
      // Also clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const { setCredentials, setUser, setSignedIn, setLoaded, logout } = authSlice.actions
export default authSlice.reducer
