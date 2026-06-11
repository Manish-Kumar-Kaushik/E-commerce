import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  country: 'IN',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCountry: (state, action) => {
      state.country = action.payload
    },
  },
})

export const { setCountry } = uiSlice.actions
export default uiSlice.reducer
