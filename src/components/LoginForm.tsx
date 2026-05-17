"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  // Avoid useSearchParams() to prevent SSR prerender issues; read from window on client
  let from = "/";
  if (typeof window !== "undefined") {
    const sp = new URLSearchParams(window.location.search);
    from = sp.get("from") ?? "/";
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Senha incorreta. Tente novamente.");
      return;
    }

    router.push(from);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/90 p-8 shadow-lg shadow-black/20">
        <div className="mb-6">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">Acesso protegido</div>
          <h1 className="mt-3 text-3xl font-semibold text-white">Digite a senha para continuar</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            O painel contém informações sensíveis e foi protegido com autenticação básica de aplicativo.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-zinc-200">
            Senha de acesso
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-indigo-400/30"
              placeholder="Senha segura"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Validando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
