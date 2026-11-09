"use client";
import { useEffect, useMemo, useState } from "react";

type Film = { id:number; title:string; description:string; genre:string; country:string; year?:number|null; poster_url?:string|null; video_type:"youtube"|"mp4"; video_url:string; source_url:string; rights_type:string; rights_note:string };
const genres = ["Semua","Drama","Romantis","Komedi","Horor","Thriller","Action","Keluarga","Animasi"];
const FAV = "abee-shorts-favorites";
const HISTORY = "abee-shorts-history";

function remember(id:number) {
  try { const old:number[] = JSON.parse(localStorage.getItem(HISTORY)||"[]"); localStorage.setItem(HISTORY,JSON.stringify([id,...old.filter(x=>x!==id)].slice(0,20))); } catch {}
}
function Card({film,favorite,onFavorite}:{film:Film;favorite:boolean;onFavorite:(id:number)=>void}) {
  return <article className="movie-card">
    <a className="movie-poster" href={`/watch?id=${film.id}`} onClick={()=>remember(film.id)}>
      {film.poster_url?<img src={film.poster_url} alt={film.title} loading="lazy"/>:<div className="poster-fallback"><b>ABEE</b><span>SHORTS</span></div>}
      <span className="poster-play">▶</span><span className="poster-genre">{film.genre}</span>
    </a>
    <button className={favorite?"favorite-button is-favorite":"favorite-button"} onClick={()=>onFavorite(film.id)} aria-label="Favorit">{favorite?"♥":"♡"}</button>
    <small className="movie-meta">{film.country}{film.year?` · ${film.year}`:""}</small>
    <a className="movie-title" href={`/watch?id=${film.id}`} onClick={()=>remember(film.id)}>{film.title}</a>
  </article>;
}
export default function Home() {
  const [films,setFilms]=useState<Film[]>([]);
  const [genre,setGenre]=useState("Semua");
  const [query,setQuery]=useState("");
  const [favorites,setFavorites]=useState<number[]>([]);
  const [history,setHistory]=useState<number[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    try { setFavorites(JSON.parse(localStorage.getItem(FAV)||"[]")); setHistory(JSON.parse(localStorage.getItem(HISTORY)||"[]")); } catch {}
    fetch("/api/catalog").then(r=>r.json()).then(d=>{setFilms(d.items||[]);if(d.error)setMessage(d.error);}).catch(()=>setMessage("Katalog belum bisa dimuat.")).finally(()=>setLoading(false));
  },[]);
  const toggleFavorite=(id:number)=>setFavorites(old=>{const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];localStorage.setItem(FAV,JSON.stringify(next));return next;});
  const featured=films[0];
  const filtered=useMemo(()=>films.filter(f=>(genre==="Semua"||f.genre===genre)&&(`${f.title} ${f.description||""} ${f.country}`.toLowerCase().includes(query.toLowerCase()))),[films,genre,query]);
  const favoriteFilms=films.filter(f=>favorites.includes(f.id));
  const recentFilms=history.map(id=>films.find(f=>f.id===id)).filter((f):f is Film=>Boolean(f));
  return <main className="home-page">
    <nav className="top-nav wrap"><a className="brand" href="/">ABEE<span>SHORTS</span></a><div className="nav-right"><a href="#katalog">Jelajahi</a><a href="#favorit">Favorit ({favorites.length})</a><a href="/akun">Akun</a><a className="admin-link" href="/admin">ADMIN ↗</a></div></nav>
    {featured?<section className="feature-hero">
      {featured.poster_url&&<div className="feature-backdrop" style={{backgroundImage:`url("${featured.poster_url}")`}}/>}<div className="feature-shade"/>
      <div className="feature-content wrap"><div className="feature-copy"><p className="eyebrow">ABEE SHORTS · PILIHAN CERITA</p><span className="feature-kicker">FEATURED FILM</span><h1>{featured.title}</h1><p className="feature-description">{featured.description||"Temukan cerita pilihan di ABEE SHORTS."}</p><div className="feature-tags"><span>{featured.genre}</span><span>{featured.country}</span>{featured.year&&<span>{featured.year}</span>}</div><a className="watch-cta" href={`/watch?id=${featured.id}`} onClick={()=>remember(featured.id)}>▶ &nbsp; Tonton sekarang</a></div>
      {featured.poster_url&&<div className="feature-poster"><img src={featured.poster_url} alt={featured.title}/></div>}</div><div className="hero-bottom wrap"><span>STORIES WORTH YOUR TIME</span><span>{films.length} JUDUL</span></div>
    </section>:<section className="welcome-hero wrap"><div><p className="eyebrow">DRAMA · SHORT FILM · MINI SERIES</p><h1>Cerita seru,<br/><em>tanpa batas.</em></h1><p>Temukan drama, romantis, komedi, horor, thriller, action, dan kisah keluarga dari kreator serta sumber resmi.</p><a className="watch-cta" href="#katalog">Jelajahi tontonan ↓</a></div><div className="welcome-art"><span>▶</span><b>ABEE<br/>SHORTS</b></div></section>}
    <section className="catalog wrap" id="katalog"><div className="catalog-heading"><div><p className="eyebrow">TEMUKAN CERITAMU</p><h2>Jelajahi katalog</h2></div><span className="catalog-total">{films.length} JUDUL</span></div>
      <div className="catalog-tools"><div className="search-box"><span>⌕</span><input placeholder="Cari judul, genre, atau negara..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="genre-list">{genres.map(g=><button key={g} className={genre===g?"genre-chip selected":"genre-chip"} onClick={()=>setGenre(g)}>{g}</button>)}</div></div>
      {loading&&<div className="state-panel">Menyiapkan pilihan tontonan…</div>}{!loading&&message&&<div className="state-panel">{message}</div>}{!loading&&!message&&filtered.length===0&&<div className="state-panel"><h3>{films.length?"Film tidak ditemukan":"Panggung cerita sedang disiapkan"}</h3><p>{films.length?"Coba kata kunci atau genre lain.":"Film yang disetujui pengelola akan muncul di sini."}</p></div>}
      {!query&&genre==="Semua"&&recentFilms.length>0&&<section className="shelf"><div className="shelf-heading"><div><p className="eyebrow">LANJUTKAN PETUALANGAN</p><h2>Baru ditonton</h2></div></div><div className="movie-row">{recentFilms.map(f=><Card key={f.id} film={f} favorite={favorites.includes(f.id)} onFavorite={toggleFavorite}/>)}</div></section>}
      {!query&&genre==="Semua"&&<section className="shelf" id="favorit"><div className="shelf-heading"><div><p className="eyebrow">KOLEKSI PRIBADIMU</p><h2>Daftar favorit</h2></div></div>{favoriteFilms.length?<div className="movie-row">{favoriteFilms.map(f=><Card key={f.id} film={f} favorite onFavorite={toggleFavorite}/>)}</div>:<p className="subtle-note">Tekan ikon ♡ pada poster untuk menyimpan film favorit.</p>}</section>}
      <section className="shelf"><div className="shelf-heading"><div><p className="eyebrow">PILIHAN CERITA</p><h2>{genre==="Semua"?"Semua tontonan":genre}</h2></div><span className="catalog-total">{filtered.length} FILM</span></div><div className="movie-grid">{filtered.map(f=><Card key={f.id} film={f} favorite={favorites.includes(f.id)} onFavorite={toggleFavorite}/>)}</div></section>
    </section>
    <footer className="site-footer"><div className="wrap footer-inner"><a className="brand" href="/">ABEE<span>SHORTS</span></a><span>Film dari sumber resmi dan kreator berizin.</span><a href="/admin">Ruang pengelola ↗</a></div><div className="wrap footer-note">© {new Date().getFullYear()} ABEE SHORTS. Nikmati cerita, hargai karya.</div></footer>
  </main>;
}