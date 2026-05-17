import { NextResponse } from "next/server";

const AUTH_COOKIE = "crm-auth";
const SECRET = process.env.SITE_PASSWORD ?? "crm-2026";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "").trim();

  if (!password || password !== SECRET) {
    return NextResponse.json(
      { ok: false, message: "Credenciais incorretas." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
  );
  return res;
}
