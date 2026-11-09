"use client";
import { useState } from "react";

type Film = { id:number; title:string; genre:string; country:string; status:string; };
const initial = {title:"",description:"",genre:"Drama",country:"Indonesia",year:"",poster_url:"",video_type:"youtube",video_url:"",source_url:"",rights_type:"youtube_embed",rights_note:"Video disematkan dari kanal resmi. Pastikan izin embed dan ketentuan pemilik konten mengizinkan."};

export default function Admin() {
  const [password,setPassword]=useState("");
  const [logged,setLogged]=useState(false);
  const [form,setForm]=useState(initial);
  const [films,setFilms]=useState<Film[]>([]);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);

  async function loadFilms(p=password) {
    const r=await fetch("/api/admin/films",{headers:{"x-admin-password":p}});
    const d=await r.json();
    if(!r.ok){setNotice(d.error||"Gagal masuk.");return false;}
    setFilms(d.items||[]);setLogged(true);setNotice("");return true;
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setNotice("");
    const r=await fetch("/api/admin/films",{method:"POST",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify({...form,year:form.year||null})});
    const d=await r.json();setNotice(d.message||d.error||"Selesai.");
    if(r.ok){setForm(initial);await loadFilms();}
    setBusy(false);
  }
  async function changeStatus(id:number,status:string) {
    const r=await fetch("/api/admin/films",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify({id,status})});
    const d=await r.json();if(!r.ok){setNotice(d.error||"Gagal.");return;} await loadFilms();
  }

  return <main className="admin-page"><div className="wrap">
    <a href="/" className="back-link">← ABEE SHORTS</a><p className="eyebrow">RUANG PENGELOLA</p><h1 className="admin-title">Admin katalog</h1>
    {!logged ? <form className="admin-login" onSubmit={e=>{e.preventDefault();loadFilms();}}><label>Password admin</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="primary-btn">Masuk</button></form> :
    <div className="admin-layout">
      <form className="admin-form" onSubmit={submit}>
        <h2>Tambah film baru</h2>
        <label>Judul film *</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
        <label>Deskripsi</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div className="two"><div><label>Genre *</label><select value={form.genre} onChange={e=>setForm({...form,genre:e.target.value})}>{["Drama","Romantis","Komedi","Horor","Thriller","Action","Keluarga","Animasi"].map(x=><option>{x}</option>)}</select></div><div><label>Negara</label><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></div></div>
        <label>Tahun</label><input type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})}/>
        <label>URL poster (opsional)</label><input value={form.poster_url} onChange={e=>setForm({...form,poster_url:e.target.value})}/>
        <label>Jenis pemutar</label><select value={form.video_type} onChange={e=>setForm({...form,video_type:e.target.value})}><option value="youtube">YouTube embed</option><option value="mp4">MP4 berlisensi</option></select>
        <label>URL video / URL YouTube *</label><input value={form.video_url} onChange={e=>setForm({...form,video_url:e.target.value})} required/>
        <label>URL sumber asli *</label><input value={form.source_url} onChange={e=>setForm({...form,source_url:e.target.value})} required/>
        <label>Dasar hak tayang</label><select value={form.rights_type} onChange={e=>setForm({...form,rights_type:e.target.value})}><option value="youtube_embed">Embed dari kanal resmi</option><option value="licensed">Lisensi / izin langsung</option></select>
        <label>Keterangan izin / bukti hak tayang *</label><textarea value={form.rights_note} onChange={e=>setForm({...form,rights_note:e.target.value})} required/>
        <button className="primary-btn" disabled={busy}>{busy?"Menyimpan…":"Simpan sebagai menunggu persetujuan"}</button>
      </form>
      <section className="admin-list"><h2>Daftar film</h2><p className="muted">Film baru masuk status menunggu. Setujui hanya setelah izin tayang diperiksa.</p>
        {films.map(f=><div className="admin-film" key={f.id}><div><b>{f.title}</b><small>{f.genre} • {f.country} • {f.status}</small></div><div className="admin-actions"><button onClick={()=>changeStatus(f.id,"approved")}>Setujui</button><button onClick={()=>changeStatus(f.id,"rejected")}>Tolak</button></div></div>)}
      </section>
    </div>}
    {notice&&<p className="notice">{notice}</p>}
  </div></main>;
}
