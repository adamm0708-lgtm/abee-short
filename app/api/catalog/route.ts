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

function isFictionStoryFilm(meta: IAMetadata): boolean {
  const md = meta.metadata || {};
  const title = asText(md.title).toLowerCase();
  const description = asText(md.description).toLowerCase();
  const subjects = asText(md.subject).toLowerCase();
  const all = `${title} ${description} ${subjects}`;

  // Tolak dokumenter, arsip sejarah, propaganda, materi pendidikan, dan kompilasi.
  const excluded = [
    "documentary", "documentaries", "documentary film", "documentary series",
    "historical footage", "newsreel", "news footage", "archive footage",
    "stock footage", "royalty free", "capcut", "template", "video template",
    "green screen", "background loop", "motion graphics", "after effects",
    "download pack", "overlay pack", "sound effect", "music loop",
    "sample footage", "b-roll", "raw footage", "compilation",
    "compilation of", "training film", "educational film", "instructional film",
    "propaganda", "war department", "army air forces", "military film",
    "government film", "public information film", "news"
  ];
  if (excluded.some((term) => all.includes(term))) return false;

  // Hanya terima sinyal cerita fiksi, drama, komedi, romantis, thriller,
  // atau animasi naratif. Ini tetap penyaringan kata kunci, bukan kurasi hukum.
  const included = [
    "short film", "short movie", "fiction film", "fictional film",
    "narrative film", "drama film", "romance film", "romantic comedy",
    "romantic drama", "comedy film", "thriller film", "horror film",
    "science fiction film", "sci-fi film", "fantasy film",
    "animated short", "animated film", "animation short film",
    "short fiction", "independent fiction", "fiction short",
    "big buck bunny", "star wreck"
  ];
  return included.some((term) => all.includes(term));
}

export async function GET() {
  try {
    const searchUrl = new URL("https://archive.org/advancedsearch.php");
    searchUrl.searchParams.set(
      "q",
      'mediatype:movies AND (title:"short film" OR title:"short movie" OR title:"fiction film" OR title:"drama film" OR title:"comedy film" OR title:"animated short" OR subject:"short film" OR subject:"fiction film" OR subject:"narrative film") AND (licenseurl:*creativecommons.org* OR licenseurl:*publicdomain*)'
    );
    searchUrl.searchParams.set("fl[]", "identifier,title,year,creator,description");
    searchUrl.searchParams.set("sort[]", "downloads desc");
    searchUrl.searchParams.set("rows", "80");
    searchUrl.searchParams.set("output", "json");

    const response = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": "ABEE-SHORTS/1.2 (fiction-short-film-catalog)" },
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error("Internet Archive tidak merespons.");

    const result = await response.json();
    const docs = result?.response?.docs || [];
    const checked = await Promise.all(
      docs.slice(0, 50).map(async (doc: any) => {
        const id = String(doc.identifier || "");
        if (!id) return null;
        try {
          const metaResponse = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
            next: { revalidate: 3600 }
          });
          if (!metaResponse.ok) return null;
          const meta: IAMetadata = await metaResponse.json();
          const license = licenseLabel(meta);
          if (!license || !isFictionStoryFilm(meta)) return null;

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

    return NextResponse.json({
      items: checked.filter(Boolean),
      source: "Internet Archive",
      note: "Katalog difokuskan pada film cerita fiksi. Filter kata kunci hanya kurasi awal, bukan verifikasi hak tayang. Periksa halaman item, lisensi, atribusi, musik, pemeran, dan hak pihak ketiga sebelum menayangkan ulang atau memonetisasi."
    });
  } catch {
    return NextResponse.json({
      items: [],
      error: "Katalog sumber terbuka sementara tidak tersedia. Silakan coba lagi."
    });
  }
}
