"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CRMForm } from "@/components/CRMForm";
import { CRMDashboard } from "@/components/CRMDashboard";
import { CRMFieldAdmin } from "./CRMFieldAdmin";
import { useCRMStore } from "@/hooks/useCRMStore";

export default function AppShell() {
  const [active, setActive] = useState<"form" | "dashboard" | "admin">("form");
  // Store precisa persistir mesmo ao trocar de tela (sem recriar a árvore inteira).
  // O hook é chamado no nível do AppShell, que permanece montado.
  const store = useCRMStore();


  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "dashboard") {
      setActive("dashboard");
      return;
    }
    if (hash === "admin") {
      setActive("admin");
      return;
    }
    if (hash === "form" || hash === "") setActive("form");
  }, []);


  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar
          active={active}
          onNavigate={(k) => {
            setActive(k);
            window.location.hash = k === "dashboard" ? "dashboard" : k === "admin" ? "admin" : "form";
          }}
        />

        <main className="flex-1 px-4 py-6 lg:px-6">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] lg:p-6">
            {active === "form" ? (
              <CRMForm store={store} />
            ) : active === "dashboard" ? (
              <CRMDashboard accounts={store.accounts} />
            ) : (
              <CRMFieldAdmin store={store} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

