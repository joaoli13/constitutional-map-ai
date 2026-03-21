"use client";

import {useEffect, useMemo, useRef, useState} from "react";

type SearchableComboBoxOption = {
  id: string;
  label: string;
  searchText: string;
};

type SearchableComboBoxProps = {
  label: string;
  placeholder: string;
  options: SearchableComboBoxOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  clearLabel: string;
  emptyText: string;
  noResultsText: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function SearchableComboBox({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  clearLabel,
  emptyText,
  noResultsText,
  disabled = false,
  loading = false,
  className = "",
}: SearchableComboBoxProps) {
  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) ?? null,
    [options, selectedId],
  );
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const inputValue = isOpen ? query : (selectedOption?.label ?? "");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.searchText.includes(normalizedQuery))
    : options;

  function handleBlur() {
    blurTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setQuery("");
    }, 120);
  }

  function handleFocus() {
    if (!disabled) {
      setIsOpen(true);
    }
  }

  function handleSelect(optionId: string) {
    onSelect(optionId);
    setQuery("");
    setIsOpen(false);
  }

  function handleClear() {
    onSelect(null);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className={`relative min-w-0 ${className}`}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              setQuery("");
            }
          }}
        />
        <button
          className="rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={handleClear}
          disabled={disabled || (!selectedId && !query)}
        >
          {clearLabel}
        </button>
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
          {loading ? (
            <p className="px-3 py-3 text-sm text-slate-500">{emptyText}</p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">
              {options.length === 0 ? emptyText : noResultsText}
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    option.id === selectedId ? "bg-slate-100 text-slate-950" : "text-slate-700"
                  }`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
