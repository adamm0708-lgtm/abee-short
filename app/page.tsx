"use client";
import { useEffect, useMemo, useState } from "react";

type Film = {
  id: number; title: string; description: string; genre: string; country: string;
  year?: number; poster_url: string; video_type: "youtube" | "mp4";
  video_url: string; source_url: string; rights_type: string; rights_note: string;
};

const genres = ["Semua", "Drama", "Romantis", "Komedi", "Horor", "Thriller", "Action", "Keluarga", "Animasi"];

export default function Home() {
  const [films, setFilms] = useState<Film[]>([]);
  const [genre, setGenre] = useState("Semua");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then(d => {
      setFilms(d.items || []);
      if (d.setupRequired) setMessage("Database belum disiapkan. Selesaikan konfigurasi Supabase terlebih dahulu.");
      else if (d.error) setMessage(d.error);
    }).catch(() => setMessage("Katalog belum bisa dimuat.")).finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => films.filter(f =>
    (genre === "Semua" || f.genre === genre) &&
    (f.title.toLowerCase().includes(query.toLowerCase()) || f.description.toLowerCase().includes(query.toLowerCase()))
  ), [films, genre, query]);

  return <main>
    <nav className="nav wrap"><a className="brand" href="/">ABEE<span>SHORTS</span></a><a className="admin-link" href="/admin">ADMIN ↗</a></nav>
    <section className="hero wrap">
      <div><p className="eyebrow">DRAMA • SHORT FILM • MINI SERIES</p><h1>Cerita seru,<br/><em>tanpa batas.</em></h1>
      <p className="hero-desc">Temukan drama, romantis, komedi, horor, thriller, action, dan kisah keluarga dari kreator serta sumber resmi.</p>
      <a className="primary-btn" href="#katalog">Jelajahi tontonan ↓</a></div>
      <div className="hero-art"><div className="hero-screen"><span>▶</span><small>YOUR NEXT STORY</small></div><b>ABEE<br/>SHORTS</b></div>
    </section>
    <section className="catalog wrap" id="katalog">
      <div className="section-head"><div><p className="eyebrow">PILIHAN CERITA</p><h2>Jelajahi katalog</h2></div><span className="count">{films.length} film</span></div>
      <input className="search" placeholder="Cari judul film..." value={query} onChange={e=>setQuery(e.target.value)}/>
      <div className="filters">{genres.map(g=><button key={g} className={genre===g?"filter active":"filter"} onClick={()=>setGenre(g)}>{g}</button>)}</div>
      {loading && <div className="notice">Memuat katalog…</div>}
      {!loading && message && <div className="notice">{message}</div>}
      {!loading && !message && shown.length===0 && <div className="empty"><h3>Belum ada film di katalog</h3><p>Film yang ditambahkan admin akan tampil setelah hak tayangnya diperiksa dan disetujui.</p></div>}
      <div className="film-grid">{shown.map(f=><article className="film-card" key={f.id}>
        <a className="poster" href={`/watch?id=${f.id}`}>{f.poster_url?<img src={f.poster_url} alt=""/>:<div className="poster-placeholder">ABEE<br/>SHORTS</div>}<span>▶</span></a>
        <div className="film-info"><small>{f.genre} • {f.country}{f.year?` • ${f.year}`:""}</small><h3>{f.title}</h3><p>{f.description}</p><a className="text-link" href={`/watch?id=${f.id}`}>Tonton detail →</a></div>
      </article>)}</div>
    </section>
    <footer className="footer"><div className="wrap footer-inner"><strong>ABEE SHORTS</strong><span>Film dari sumber resmi dan kreator berizin.</span></div></footer>
  </main>;
}
