import Link from "next/link";

type Film = { id:number; title:string; description:string; genre:string; country:string; year:number|null; video_type:"youtube"|"mp4"; video_url:string; source_url:string; rights_note:string; };

async function getFilm(id: string): Promise<Film | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/films?select=*&id=eq.${encodeURIComponent(id)}&status=eq.approved&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store"
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop() || "";
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
  } catch { return ""; }
}

export default async function WatchPage({ searchParams }: {searchParams:{id?:string}}) {
  const film = searchParams.id ? await getFilm(searchParams.id) : null;
  const embed = film?.video_type === "youtube" ? youtubeEmbed(film.video_url) : "";
  return <main className="watch-page"><div className="wrap">
    <Link href="/" className="back-link">← Kembali ke ABEE SHORTS</Link>
    {film ? <>
      <p className="eyebrow">{film.genre} • {film.country}</p><h1 className="watch-title">{film.title}</h1>
      <div className="video-shell">
        {film.video_type==="youtube" && embed ?
          <iframe src={embed} title={film.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/> :
          film.video_type==="mp4" ? <video controls playsInline src={film.video_url}/> : <p>URL video tidak valid.</p>}
      </div>
      <p className="watch-description">{film.description}</p>
      <p className="legal-note">Informasi hak tayang: {film.rights_note}</p>
      <p><a className="text-link" href={film.source_url} target="_blank" rel="noreferrer">Kunjungi sumber asli ↗</a></p>
    </> : <div className="empty"><h2>Film belum tersedia</h2><p>Film mungkin belum disetujui untuk tampil atau tautannya tidak ditemukan.</p><Link href="/" className="primary-btn">Kembali ke katalog</Link></div>}
  </div></main>;
}
