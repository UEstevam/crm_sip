"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Database, SlidersHorizontal, Settings2 } from "lucide-react";

export type NavItem = {
  key: "form" | "dashboard" | "admin";
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function Sidebar({
  active,
  onNavigate,
}: {
  active: "form" | "dashboard" | "admin";
  onNavigate?: (key: "form" | "dashboard" | "admin") => void;
}) {
  const items: NavItem[] = [
    {
      key: "form",
      label: "CRUD / Contas",
      href: "#form",
      icon: <Database className="h-4 w-4" />,
    },
    {
      key: "dashboard",
      label: "CRM Dashboard",
      href: "#dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      key: "admin",
      label: "Admin de Campos",
      href: "#admin",
      icon: <SlidersHorizontal className="h-4 w-4" />,
    },
  ];

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "form") onNavigate?.("form");
      if (hash === "dashboard") onNavigate?.("dashboard");
      if (hash === "admin") onNavigate?.("admin");
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [onNavigate]);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-black/30 backdrop-blur lg:block">
      <div className="flex h-full flex-col gap-6 p-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
              <Settings2 className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">CRM</div>
              <div className="text-xs text-zinc-400">Gerenciamento de Contas</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <Link
                key={it.key}
                href={it.href}
                className={
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition " +
                  (isActive
                    ? "bg-indigo-500/15 ring-1 ring-indigo-400/25"
                    : "hover:bg-white/5")
                }
                onClick={() => onNavigate?.(it.key)}
              >
                <span
                  className={
                    "grid h-8 w-8 place-items-center rounded-xl ring-1 ring-white/10 " +
                    (isActive
                      ? "bg-indigo-500/10 text-indigo-200"
                      : "bg-white/0 text-zinc-300 group-hover:text-zinc-100")
                  }
                >
                  {it.icon}
                </span>
                <span className={"font-medium " + (isActive ? "text-zinc-50" : "text-zinc-300")}>
                  {it.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-zinc-200">Persistência</div>
          <div className="mt-1 text-xs leading-relaxed text-zinc-400">
            Dados e opções criadas ficam salvos no seu navegador via LocalStorage.
          </div>
        </div>
      </div>
    </aside>
  );
}

