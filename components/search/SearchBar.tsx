"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  delay?: number;
  placeholder?: string;
  onDebouncedChange: (value: string) => void;
};

export default function SearchBar({
  delay = 350,
  placeholder = "Search users",
  onDebouncedChange,
}: SearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDebouncedChange(value.trim());
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, onDebouncedChange, value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ig-secondary" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-ig-border bg-ig-bg px-10 text-sm text-ig-fg outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 rounded-full p-1 text-ig-secondary transition -translate-y-1/2 hover:bg-zinc-800 hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
