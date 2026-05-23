"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  value?: string;
  delay?: number;
  placeholder?: string;
  onDebouncedChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onFocus?: () => void;
};

export default function SearchBar({
  value = "",
  delay = 350,
  placeholder = "Поиск",
  onDebouncedChange,
  onSearchSubmit,
  onFocus,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInternalValue(value);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [value]);

  // Debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDebouncedChange(internalValue.trim());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, onDebouncedChange, internalValue]);

  const handleClear = () => {
    setInternalValue("");
    onDebouncedChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        ref={inputRef}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearchSubmit) {
            onSearchSubmit(internalValue.trim());
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 w-full rounded-full border-none bg-zinc-800 pl-9 pr-9 text-sm text-white outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-600 transition"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-500 text-black hover:bg-zinc-400 transition"
          aria-label="Очистить поиск"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
