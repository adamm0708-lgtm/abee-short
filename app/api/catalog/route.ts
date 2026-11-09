import { NextResponse } from "next/server";

export const revalidate = 3600;

type IAFile = { name?: string };
type IAMetadata = {
  metadata?: {
    title?: string;
    description?: string;
    year?: string;
    creator?: string;
    licenseurl?: string;
    license?: string;
    subject?: string | string[];
    mediatype?: string;
  };
  files?: IAFile[];
};

function licenseLabel(meta: IAMetadata): string | null {
  const raw = `${meta.metadata?.licenseurl || ""} ${meta.metadata?.license || ""}`.toLowerCase();
  if (raw.includes("creativecommons.org/publicdomain/zero")) return "CC0";
  if (raw.includes("creativecommons.org/licenses/by-sa/")) return "CC BY-SA";
  if (raw.includes("creativecommons.org/licenses/by/")) return "CC BY";
  if (raw.includes("creativecommons.org/publicdomain/mark")) return "Public Domain Mark";
  return null;
}

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.join(" ");
  return typeof value === "string" ? value : "";
}

function isStoryFilm(meta: IAMetadata): boolean {
  const md = meta.metadata || {};
  const title = asText(md.title).toLowerCase();
  const description = asText(md.description).toLowerCase();
  const subjects = asText(md.subject).toLowerCase();
  const all = `${title} ${description} ${subjects}`;

  // Buang materi produksi/stock, template, trailer, dan unduhan non-film.
  const excluded = [
    "stock footage", "royalty free", "capcut", "template", "video template",
    "green screen", "background loop", "motion graphics", "after effects",
    "download pack", "overlay pack", "sound effect", "music loop",
    "sample footage", "b-roll", "raw footage"
  ];
  if (excluded.some((term) => all.includes(term))) return false;

  // Harus ada sinyal bahwa item merupakan karya cerita/film, bukan sekadar video.
  const included = [
    "short film", "short movie", "independent film", "fiction film",
    "animated short", "animation film", "animated film", "documentary",
    "narrative film", "drama film", "featurette", "big buck bunny"
  ];
  return included.some((term) => all.includes(term));
}

export async function GET() {
  try {
    const searchUrl = new URL("https://archive.org/advancedsearch.php");
    searchUrl.searchParams.set(
      "q",
      'mediatype:movies AND (title:"short film" OR title:"short movie" OR title:"animated short" OR subject:"short film" OR subject:"independent film" OR subject:"documentary") AND (licenseurl:*creativecommons.org* OR licenseurl:*publicdomain*)'
    );
    searchUrl.searchParams.set("fl[]", "identifier,title,year,creator,description");
    searchUrl.searchParams.set("sort[]", "downloads desc");
    searchUrl.searchParams.set("rows", "60");
    searchUrl.searchParams.set("output", "json");

    const response = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": "ABEE-SHORTS/1.1 (open-film-catalog-prototype)" },
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error("Internet Archive tidak merespons.");

    const result = await response.json();
    const docs = result?.response?.docs || [];
    const metadataResults = await Promise.all(
      docs.slice(0, 40).map(async (doc: any) => {
        const id = String(doc.identifier || "");
        if (!id) return null;
        try {
          const metaResponse = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
            next: { revalidate: 3600 }
          });
          if (!metaResponse.ok) return null;
          const meta: IAMetadata = await metaResponse.json();
          const license = licenseLabel(meta);
          if (!license || !isStoryFilm(meta)) return null;

          const files = meta.files || [];
          const mp4 = files.find((f) => /\.mp4$/i.test(f.name || "") && !/sample|trailer|preview/i.test(f.name || ""));
          const md = meta.metadata || {};
          const subject = Array.isArray(md.subject) ? md.subject : md.subject ? [md.subject] : [];

          return {
            id,
            title: String(md.title || doc.title || id),
            description: asText(md.description).replace(/<[^>]*>/g, "").slice(0, 280),
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
      })
    );

    const items = metadataResults.filter(Boolean);
    return NextResponse.json({
      items,
      source: "Internet Archive",
      note: "Filter kata kunci ini hanya kurasi awal, bukan verifikasi hak tayang. Periksa halaman item, lisensi, atribusi, musik, pemeran, dan hak pihak ketiga sebelum menayangkan ulang atau memonetisasi."
    });
  } catch {
    return NextResponse.json({
      items: [],
      error: "Katalog sumber terbuka sementara tidak tersedia. Silakan coba lagi."
    });
  }
}
