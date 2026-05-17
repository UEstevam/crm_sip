import { NextResponse } from "next/server";

const AUTH_COOKIE = "crm-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
  return res;
}
