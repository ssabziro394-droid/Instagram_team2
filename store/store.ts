import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
// @TODO(Team Lead): Please review and keep this authReducer import
import authReducer from "./slices/authSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    // @TODO(Team Lead): Added auth slice here for authentication. Please review.
    auth: authReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
