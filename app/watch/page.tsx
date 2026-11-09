import Link from "next/link";

type Film = { id:number; title:string; description:string; genre:string; country:string; year:number|null; poster_url?:string|null; video_type:"youtube"|"mp4"; video_url:string; source_url:string; rights_note:string; };

async function getFilms(): Promise<Film[]> {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return [];
  const res=await fetch(`${url}/rest/v1/films?select=id,title,description,genre,country,year,poster_url,video_type,video_url,source_url,rights_note&status=eq.approved&order=created_at.desc`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
  if(!res.ok) return [];
  return await res.json();
}
function youtubeEmbed(url:string){
  try{const u=new URL(url);let id="";if(u.hostname.includes("youtu.be"))id=u.pathname.slice(1);else if(u.hostname.includes("youtube.com"))id=u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop()||"";return id?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`:"";}catch{return "";}
}
export default async function WatchPage({searchParams}:{searchParams:{id?:string}}){
  const films=await getFilms();
  const film=films.find(f=>String(f.id)===String(searchParams.id));
  const embed=film?.video_type==="youtube"?youtubeEmbed(film.video_url):"";
  const related=film?films.filter(f=>f.id!==film.id&&(f.genre===film.genre||f.country===film.country)).slice(0,5):[];
  return <main className="watch-v2"><header className="watch-top wrap"><Link className="watch-brand" href="/">ABEE<span>SHORTS</span></Link><Link className="watch-back" href="/">← Kembali ke katalog</Link></header>
  <div className="watch-container wrap">{film?<><div className="watch-heading"><div><p className="eyebrow">SEDANG DIPUTAR · {film.genre.toUpperCase()}</p><h1>{film.title}</h1><p className="watch-subline">{film.country}{film.year?` · ${film.year}`:""} · Film pendek pilihan ABEE SHORTS</p></div></div>
  <div className="watch-layout"><section className="watch-main"><div className="watch-player">
  {film.video_type==="youtube"&&embed?<iframe src={embed} title={film.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:film.video_type==="mp4"?<video controls playsInline src={film.video_url}/>:<div className="watch-error">Tautan video tidak valid atau tidak didukung.</div>}
  </div><div className="watch-description-panel"><h2>Tentang cerita ini</h2><p>{film.description||"Belum ada sinopsis untuk film ini."}</p><div className="watch-tags"><span>{film.genre}</span><span>{film.country}</span>{film.year&&<span>{film.year}</span>}</div></div>
  <div className="watch-rights"><b>Informasi sumber & hak tayang</b><p>{film.rights_note||"Informasi hak tayang mengikuti keterangan dari pengelola."}</p><a href={film.source_url} target="_blank" rel="noreferrer">Kunjungi sumber asli ↗</a></div></section>
  <aside className="watch-aside">{film.poster_url?<img className="watch-poster" src={film.poster_url} alt={film.title}/>:<div className="watch-poster-placeholder">ABEE<br/>SHORTS</div>}<div className="watch-aside-copy"><span>ABEE SHORTS ORIGINAL CATALOG</span><h3>{film.title}</h3><p>{film.genre} · {film.country}</p></div></aside></div>
  {related.length>0&&<section className="related-section"><div className="related-head"><div><p className="eyebrow">LANJUTKAN MENJELAJAH</p><h2>Cerita lainnya</h2></div><Link href="/">Lihat semua →</Link></div><div className="related-grid">{related.map(item=><Link href={`/watch?id=${item.id}`} className="related-card" key={item.id}>{item.poster_url?<img src={item.poster_url} alt={item.title}/>:<div className="related-placeholder">ABEE</div>}<span>{item.genre}</span><b>{item.title}</b></Link>)}</div></section>}
  </>:<div className="watch-not-found"><span>404 · CERITA BELUM TERSEDIA</span><h1>Film ini belum bisa diputar.</h1><p>Film mungkin belum disetujui pengelola atau tautannya tidak ditemukan.</p><Link href="/">Kembali ke katalog</Link></div>}</div>
  <footer className="watch-footer"><div className="wrap">© {new Date().getFullYear()} ABEE SHORTS · Nikmati cerita, hargai karya.</div></footer></main>;
}
