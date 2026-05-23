"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect, useState } from "react";
import { setTheme } from "@/store/themeSlice";

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state) => state.theme.theme);
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync theme from localStorage on load
    const stored = localStorage.getItem("ig-theme");
    if (stored === "light" || stored === "dark") {
      dispatch(setTheme(stored));
    }
    setMounted(true);
  }, [dispatch]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme, mounted]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div className="invisible">{children}</div>;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeApplier>{children}</ThemeApplier>
    </Provider>
  );
}