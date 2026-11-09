import { NextResponse } from "next/server";

export const revalidate = 3600;

type IAFile = { name?: string; source?: string; format?: string; size?: string };
type IAMetadata = {
  metadata?: { title?: string; description?: string; year?: string; creator?: string; licenseurl?: string; license?: string; subject?: string | string[] };
  files?: IAFile[];
};

function isClearlyOpenLicense(meta: IAMetadata): string | null {
  const raw = `${meta.metadata?.licenseurl || ""} ${meta.metadata?.license || ""}`.toLowerCase();
  const known = [
    ["creativecommons.org/publicdomain/zero", "CC0"],
    ["creativecommons.org/licenses/by/", "CC BY"],
    ["creativecommons.org/licenses/by-sa/", "CC BY-SA"],
    ["creativecommons.org/publicdomain/mark", "Public Domain Mark"]
  ] as const;
  for (const [needle, label] of known) if (raw.includes(needle)) return label;
  return null;
}

export async function GET() {
  try {
    const searchUrl = new URL("https://archive.org/advancedsearch.php");
    searchUrl.searchParams.set("q", 'mediatype:movies AND (licenseurl:*creativecommons.org* OR licenseurl:*publicdomain*)');
    searchUrl.searchParams.set("fl[]", "identifier,title,year,creator,description");
    searchUrl.searchParams.set("sort[]", "downloads desc");
    searchUrl.searchParams.set("rows", "24");
    searchUrl.searchParams.set("output", "json");

    const response = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": "ABEE-SHORTS/1.0 (catalog prototype)" },
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error("Internet Archive tidak merespons.");
    const result = await response.json();
    const docs = result?.response?.docs || [];

    const items = await Promise.all(docs.slice(0, 18).map(async (doc: any) => {
      const id = String(doc.identifier || "");
      if (!id) return null;
      try {
        const metaResponse = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
          next: { revalidate: 3600 }
        });
        if (!metaResponse.ok) return null;
        const meta: IAMetadata = await metaResponse.json();
        const license = isClearlyOpenLicense(meta);
        if (!license) return null;

        const files = meta.files || [];
        const mp4 = files.find((f) => /\.mp4$/i.test(f.name || "") && !/sample|trailer|preview/i.test(f.name || ""));
        const md = meta.metadata || {};
        const title = String(md.title || doc.title || id);
        const subject = Array.isArray(md.subject) ? md.subject : md.subject ? [md.subject] : [];
        return {
          id,
          title,
          description: String(md.description || "").replace(/<[^>]*>/g, "").slice(0, 280),
          year: String(md.year || doc.year || ""),
          creator: String(md.creator || doc.creator || ""),
          license,
          thumbnail: `https://archive.org/services/img/${encodeURIComponent(id)}`,
          sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
          videoUrl: mp4 ? `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(mp4.name || "")}` : undefined,
          subject
        };
      } catch {
        return null;
      }
    }));

    return NextResponse.json({ items: items.filter(Boolean), source: "Internet Archive", note: "Penyaringan lisensi otomatis hanya pemeriksaan awal. Verifikasi halaman item, ketentuan lisensi, atribusi, musik, dan hak pihak ketiga sebelum menayangkan ulang atau memonetisasi." });
  } catch {
    return NextResponse.json({ items: [], error: "Katalog sumber terbuka sementara tidak tersedia." }, { status: 200 });
  }
}
