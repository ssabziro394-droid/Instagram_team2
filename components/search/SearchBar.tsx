"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  value?: string;
  delay?: number;
  placeholder?: string;
  onDebouncedChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
};

export default function SearchBar({
  value = "",
  delay = 400,
  placeholder = "Search",
  onDebouncedChange,
  onSearchSubmit,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInternalValue(value);
    }, 0);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDebouncedChange(internalValue.trim());
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, onDebouncedChange, internalValue]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
      <input
        value={internalValue}
        onChange={(event) => setInternalValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSearchSubmit) {
            onSearchSubmit(internalValue.trim());
          }
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-10 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
      />
      {internalValue && (
        <button
          type="button"
          onClick={() => {
            setInternalValue("");
            onDebouncedChange("");
          }}
          className="absolute right-2 top-1/2 rounded-full p-1 text-zinc-500 transition -translate-y-1/2 hover:bg-zinc-800 hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
