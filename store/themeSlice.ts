import { createSlice } from "@reduxjs/toolkit";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("ig-theme");
    if (stored === "light" || stored === "dark") return stored;
  }
  return "dark";
};

const initialState: ThemeState = {
  theme: "dark",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("ig-theme", state.theme);
      }
    },
    setTheme(state, action: { payload: Theme }) {
      state.theme = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("ig-theme", state.theme);
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
