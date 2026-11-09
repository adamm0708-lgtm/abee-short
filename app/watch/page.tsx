import Link from "next/link";

type Props = { searchParams: { id?: string } };

async function getFilm(id: string) {
  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const md = data.metadata || {};
  const rawLicense = String(md.licenseurl || md.license || "");
  const files = data.files || [];
  const video = files.find((f: { name?: string }) => /\.mp4$/i.test(f.name || "") && !/sample|trailer|preview/i.test(f.name || ""));
  if (!video || !/creativecommons\.org|publicdomain/i.test(rawLicense)) return null;
  return {
    title: String(md.title || id),
    creator: String(md.creator || "Tidak diketahui"),
    license: rawLicense,
    source: `https://archive.org/details/${encodeURIComponent(id)}`,
    video: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(video.name)}`
  };
}

export default async function WatchPage({ searchParams }: Props) {
  const id = searchParams.id || "";
  const film = id ? await getFilm(id).catch(() => null) : null;
  return (
    <main className="watch-page">
      <div className="wrap">
        <Link href="/" className="back-link">← Kembali ke ABEE SHORTS</Link>
        {film ? <>
          <p className="eyebrow">PEMUTAR FILM</p>
          <h1 className="watch-title">{film.title}</h1>
          <div className="video-shell"><video controls playsInline preload="metadata" src={film.video}>Browser Anda tidak mendukung pemutar video.</video></div>
          <div className="watch-meta"><p>Kreator: {film.creator}</p><p>Lisensi tercatat: {film.license}</p><p><a href={film.source} target="_blank" rel="noreferrer">Buka halaman sumber asli →</a></p></div>
          <p className="legal-note">Catatan: keberadaan label lisensi pada metadata bukan jaminan bahwa seluruh unsur film bebas dari hak pihak ketiga. Periksa halaman sumber dan ketentuan lisensi sebelum distribusi ulang atau monetisasi.</p>
        </> : <div className="empty"><h2>Film tidak dapat diputar</h2><p>ID tidak ditemukan, tidak ada berkas MP4 yang sesuai, atau metadata lisensinya belum lolos pemeriksaan awal.</p><Link href="/" className="primary-btn">Kembali ke katalog</Link></div>}
      </div>
    </main>
  );
}
