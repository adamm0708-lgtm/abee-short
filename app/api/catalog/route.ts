import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ items: [], setupRequired: true, message: "Database belum dikonfigurasi." });
  }
  try {
    const response = await fetch(
      `${url}/rest/v1/films?select=id,title,description,genre,country,year,poster_url,video_type,video_url,source_url,rights_type,rights_note&status=eq.approved&order=created_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (!response.ok) throw new Error("Gagal membaca database.");
    return NextResponse.json({ items: await response.json() });
  } catch {
    return NextResponse.json({ items: [], error: "Katalog gagal dimuat." }, { status: 500 });
  }
}
