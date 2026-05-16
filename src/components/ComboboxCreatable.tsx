"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onCreateOption?: (value: string) => void;
};

export function ComboboxCreatable({
  label,
  value,
  options,
  placeholder,
  onChange,
  onCreateOption,
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const exactExists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return options.some((o) => o.toLowerCase() === q);
  }, [options, query]);

  const canCreate = useMemo(() => {
    return !!query.trim() && !exactExists;
  }, [query, exactExists]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-200">{label}</label>
      <div className="relative">
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 140);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canCreate) {
                onCreateOption?.(query.trim());
                onChange(query.trim());
              } else {
                onChange(query.trim());
              }
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-50 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-400/30 focus:ring-2 focus:ring-indigo-400/15"
        />

        {open ? (
          <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-xl">
            <div className="max-h-56 overflow-auto p-1">
              {canCreate ? (
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-indigo-200 hover:bg-white/5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const v = query.trim();
                    onCreateOption?.(v);
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  + Criar “{query.trim()}”
                </button>
              ) : null}

              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={
                    "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5 " +
                    (opt === value ? "bg-white/5" : "")
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt);
                    setQuery(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              ))}

              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-500">Nenhuma opção.</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

