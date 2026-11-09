import { NextRequest, NextResponse } from "next/server";

function authorized(request: NextRequest) {
  const expected = process.env.ABEE_ADMIN_PASSWORD;
  const supplied = request.headers.get("x-admin-password");
  return Boolean(expected && supplied && supplied === expected);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  const res = await fetch(`${url}/rest/v1/films?select=*&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store"
  });
  if (!res.ok) return NextResponse.json({ error: "Gagal membaca daftar film." }, { status: 500 });
  return NextResponse.json({ items: await res.json() });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const body = await request.json();
  const required = ["title", "genre", "video_type", "video_url", "source_url", "rights_type", "rights_note"];
  if (required.some((field) => !String(body[field] || "").trim())) {
    return NextResponse.json({ error: "Lengkapi semua kolom wajib, termasuk keterangan hak tayang." }, { status: 400 });
  }
  if (!["youtube", "mp4"].includes(body.video_type) || !["youtube_embed", "licensed"].includes(body.rights_type)) {
    return NextResponse.json({ error: "Jenis video atau hak tayang tidak valid." }, { status: 400 });
  }
  const payload = {
    title: String(body.title).trim(),
    description: String(body.description || "").trim(),
    genre: String(body.genre),
    country: String(body.country || "Internasional"),
    year: body.year ? Number(body.year) : null,
    poster_url: String(body.poster_url || "").trim(),
    video_type: body.video_type,
    video_url: String(body.video_url).trim(),
    source_url: String(body.source_url).trim(),
    rights_type: body.rights_type,
    rights_note: String(body.rights_note).trim(),
    status: "pending"
  };
  const res = await fetch(`${url}/rest/v1/films`, {
    method: "POST",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) return NextResponse.json({ error: "Film gagal disimpan ke database." }, { status: 500 });
  return NextResponse.json({ item: (await res.json())[0], message: "Film disimpan sebagai menunggu persetujuan." });
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  const body = await request.json();
  if (!body.id || !["approved", "rejected", "pending"].includes(body.status)) {
    return NextResponse.json({ error: "Permintaan status tidak valid." }, { status: 400 });
  }
  const res = await fetch(`${url}/rest/v1/films?id=eq.${encodeURIComponent(body.id)}`, {
    method: "PATCH",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation"
    },
    body: JSON.stringify({ status: body.status })
  });
  if (!res.ok) return NextResponse.json({ error: "Status film gagal diperbarui." }, { status: 500 });
  return NextResponse.json({ item: (await res.json())[0] });
}
