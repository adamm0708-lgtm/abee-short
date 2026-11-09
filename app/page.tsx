"use client";

import { useEffect, useMemo, useState } from "react";

type Film = {
  id: string;
  title: string;
  description: string;
  year?: string;
  creator?: string;
  license: string;
  thumbnail: string;
  sourceUrl: string;
  videoUrl?: string;
  subject?: string[];
};

export default function Home() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");

  useEffect(() => {
    fetch("/api/catalog")
      .then(async (r) => {
        if (!r.ok) throw new Error("Katalog belum dapat dimuat.");
        return r.json();
      })
      .then((data) => setFilms(data.items || []))
      .catch((e) => setError(e.message || "Terjadi kesalahan."))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["Semua", "Drama", "Animasi", "Dokumenter"];
  const visible = useMemo(() => {
    return films.filter((film) => {
      const matchesText = film.title.toLowerCase().includes(query.toLowerCase());
      const subjects = (film.subject || []).join(" ").toLowerCase();
      const matchesCategory = category === "Semua" ||
        (category === "Animasi" && /animation|animated|cartoon/.test(subjects)) ||
        (category === "Dokumenter" && /documentary/.test(subjects)) ||
        (category === "Drama" && !/animation|animated|cartoon|documentary/.test(subjects));
      return matchesText && matchesCategory;
    });
  }, [films, query, category]);

  return (
    <main>
      <nav className="nav wrap">
        <a className="brand" href="/">ABEE<span>SHORTS</span></a>
        <span className="nav-note">SHORT DRAMA • FILM PENDEK</span>
      </nav>

      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">CERITA SINGKAT, KESAN PANJANG</p>
          <h1>Temukan cerita<br /><em>yang berkesan.</em></h1>
          <p className="hero-desc">Jelajahi film pendek dan karya independen dari sumber terbuka. Nikmati tontonan, kenali pembuatnya, dan hormati lisensinya.</p>
          <a className="primary-btn" href="#katalog">Jelajahi katalog <span>↘</span></a>
        </div>
        <div className="hero-art" aria-label="Ilustrasi layar film">
          <div className="film-frame"><div className="play-mark">▶</div><span>THE NEXT STORY</span></div>
          <div className="art-caption">YOUR NEXT<br />FAVORITE FILM</div>
        </div>
      </section>

      <section className="catalog wrap" id="katalog">
        <div className="section-head">
          <div><p className="eyebrow">PILIHAN TONTONAN</p><h2>Jelajahi katalog</h2></div>
          <span className="count">{films.length} judul ditemukan</span>
        </div>
        <div className="tools">
          <input aria-label="Cari judul" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul film..." />
          <div className="filters">
            {categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={category === c ? "filter active" : "filter"}>{c}</button>)}
          </div>
        </div>

        {loading && <div className="notice">Sedang mencari film dari sumber terbuka…</div>}
        {!loading && error && <div className="notice">{error} Coba muat ulang halaman beberapa saat lagi.</div>}
        {!loading && !error && visible.length === 0 && (
          <div className="empty">
            <div className="empty-icon">▧</div>
            <h3>Belum ada judul yang cocok</h3>
            <p>Katalog awal memakai penyaringan lisensi yang ketat. Hasil bisa sedikit atau kosong, dan setiap judul tetap perlu pemeriksaan hak tayang manual.</p>
          </div>
        )}
        <div className="film-grid">
          {visible.map((film) => (
            <article className="film-card" key={film.id}>
              <a className="poster" href={film.videoUrl ? `/watch?id=${encodeURIComponent(film.id)}` : film.sourceUrl} target={film.videoUrl ? undefined : "_blank"} rel="noreferrer">
                {film.thumbnail ? <img src={film.thumbnail} alt="" /> : <div className="poster-fallback">ABEE<br />SHORTS</div>}
                <span className="poster-play">▶</span>
              </a>
              <div className="film-info">
                <h3>{film.title}</h3>
                <p>{[film.year, film.creator].filter(Boolean).join(" • ") || "Karya independen"}</p>
                <span className="license-tag">{film.license}</span>
                <a className="text-link" href={film.videoUrl ? `/watch?id=${encodeURIComponent(film.id)}` : film.sourceUrl} target={film.videoUrl ? undefined : "_blank"} rel="noreferrer">
                  {film.videoUrl ? "Tonton detail →" : "Lihat sumber asli →"}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="footer"><div className="wrap footer-inner"><strong>ABEE SHORTS</strong><span>Katalog independen. Hormati kreator dan lisensi setiap karya.</span></div></footer>
    </main>
  );
}
