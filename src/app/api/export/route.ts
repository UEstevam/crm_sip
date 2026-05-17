import { NextResponse } from "next/server";

const AUTH_COOKIE = "crm-auth";

function escapeCell(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Prevent CSV injection by prefixing dangerous leading characters
  if (/^[=+\-@\t\r\n]/.test(s)) return "'" + s;
  // Escape double quotes
  if (/[,"\n;\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie.includes(`${AUTH_COOKIE}=1`)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const rows: any[] = Array.isArray(body?.rows) ? body.rows : [];
  const filename = String(body?.filename ?? "export.csv");

  if (rows.length === 0) {
    return NextResponse.json({ ok: false, message: "No rows provided" }, { status: 400 });
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(",")];
  for (const r of rows) {
    csvLines.push(headers.map((h) => escapeCell(r[h])).join(","));
  }
  const csv = csvLines.join("\n");

  const res = new NextResponse(csv);
  res.headers.set("Content-Type", "text/csv; charset=utf-8");
  res.headers.set(
    "Content-Disposition",
    `attachment; filename="${filename.replace(/\"/g, "")}"`
  );
  return res;
}
