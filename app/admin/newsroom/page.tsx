"use client";
import {useState} from "react";

type Item={id:number;source_id:number;title:string;source_name:string;source_url:string;excerpt:string};
type Article={id:number;title:string;slug:string;status:string;region:string;category:string};

export default function Newsroom(){
  const [pass,setPass]=useState("");
  const [ok,setOk]=useState(false);
  const [busy,setBusy]=useState("");
  const [sources,setSources]=useState<any[]>([]);
  const [items,setItems]=useState<Item[]>([]);
  const [articles,setArticles]=useState<Article[]>([]);
  const [msg,setMsg]=useState("");
  const [facts,setFacts]=useState("");
  const [source,setSource]=useState({name:"",feed_url:"",category:"Daerah",region:"Bangil",usage_permission:"link_only"});
  const [draft,setDraft]=useState({title:"",excerpt:"",body:"",category:"Daerah",region:"Bangil",image_url:"",image_credit:"",source_name:"Redaksi ABEE NEWS",source_url:""});
  const headers={"Content-Type":"application/json","x-admin-password":pass};

  async function load(){
    try{
      const [s,i,a]=await Promise.all([
        fetch("/api/admin/sources",{headers}),
        fetch("/api/admin/items",{headers}),
        fetch("/api/admin/news",{headers})
      ]);
      if(!s.ok){setMsg("Akses ditolak. Silakan periksa password admin.");return;}
      const [sd,id,ad]=await Promise.all([s.json(),i.json(),a.json()]);
      setSources(sd.items||[]);setItems(id.items||[]);setArticles(ad.items||[]);
      setOk(true);setMsg("Terhubung ke ruang redaksi.");
    }catch(e){
      setMsg("Tidak dapat menghubungi server. Muat ulang halaman dan coba lagi.");
    }
  }

  async function post(url:string,body:any,task:string){
    setBusy(task);setMsg("Sedang memproses...");
    try{
      const r=await fetch(url,{method:"POST",headers,body:JSON.stringify(body)});
      const raw=await r.text();
      let d:any={};
      try{d=raw?JSON.parse(raw):{};}catch{d={error:raw||"Respons server tidak valid."};}
      if(!r.ok){setMsg(d.error||d.message||("Gagal. Server merespons " + r.status + "."));return;}
      setMsg(d.message||"Berhasil.");
      await load();
    }catch(e){
      setMsg("Permintaan gagal tersambung ke server. Periksa koneksi atau coba lagi.");
    }finally{setBusy("");}
  }

  async function status(id:number,status:string){
    setBusy("status");setMsg("Memperbarui status...");
    try{
      const r=await fetch("/api/admin/news",{method:"PATCH",headers,body:JSON.stringify({id,status})});
      const d=await r.json();
      setMsg(d.message||d.error||"Status diperbarui.");await load();
    }catch{setMsg("Gagal menghubungi server saat memperbarui status.");}
    finally{setBusy("");}
  }

  return <main className="min-h-screen bg-slate-100 p-5 text-slate-900"><div className="mx-auto max-w-5xl">
    <a href="/news" className="font-bold text-orange-600">← ABEE NEWS</a>
    <h1 className="mt-4 text-3xl font-black">Ruang Redaksi</h1>
    <p className="mt-1 text-slate-500">RSS masuk, draf, pemeriksaan, lalu persetujuan terbit.</p>
    {!ok?<section className="mt-6 max-w-md rounded-2xl bg-white p-6 shadow">
      <label className="text-sm font-semibold">Password admin</label>
      <input className="mt-2 w-full rounded-lg border p-3" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
      <button type="button" disabled={!!busy} className="mt-3 rounded-lg bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-50" onClick={load}>Masuk</button>
    </section>:<>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Tambah sumber RSS</h2>
          <input className="mt-3 w-full rounded-lg border p-3" placeholder="Nama sumber" value={source.name} onChange={e=>setSource({...source,name:e.target.value})}/>
          <input className="mt-2 w-full rounded-lg border p-3" placeholder="URL RSS" value={source.feed_url} onChange={e=>setSource({...source,feed_url:e.target.value})}/>
          <select className="mt-2 w-full rounded-lg border p-3" value={source.usage_permission} onChange={e=>setSource({...source,usage_permission:e.target.value})}>
            <option value="link_only">Hanya tautan referensi</option><option value="licensed">Memiliki lisensi pengolahan</option><option value="press_release">Siaran pers dengan izin penggunaan</option>
          </select>
          <button type="button" disabled={!!busy||!source.name.trim()||!source.feed_url.trim()} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={()=>post("/api/admin/sources",source,"save")}>{busy==="save"?"Menyimpan...":"Simpan sumber"}</button>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Ambil RSS</h2>
          <p className="mt-2 text-sm text-slate-500">Mengambil judul, ringkasan, tanggal, dan tautan. Tidak menyalin artikel penuh.</p>
          <button type="button" disabled={!!busy||sources.length===0} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={()=>post("/api/admin/ingest",{},"ingest")}>{busy==="ingest"?"Memeriksa feed...":"Periksa feed sekarang"}</button>
          <p className="mt-3 text-sm">{sources.length} sumber terdaftar</p>
        </section>
      </div>
      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Inbox RSS ({items.length})</h2>
        {items.map(i=>{
          const permission=sources.find(s=>String(s.id)===String(i.source_id))?.usage_permission||"link_only";
          const allowed=["licensed","press_release"].includes(permission);
          return <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div><b>{i.title}</b><p className="text-sm text-slate-500">{i.source_name} · <a className="underline" href={i.source_url} target="_blank" rel="noreferrer">Buka sumber</a></p></div>{allowed?<button type="button" disabled={!!busy} className="rounded-lg border px-3 py-2 disabled:opacity-50" onClick={()=>post("/api/admin/generate",{id:i.id},"generate")}>Buat draf AI</button>:<span className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">Referensi saja · AI nonaktif</span>}</div>;
        })}
      </section>
      <section className="mt-5 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Bantuan penulisan AI · Gemini</h2>
        <p className="mt-2 text-sm text-slate-600">Masukkan fakta yang sudah diverifikasi redaksi. AI hanya menyusun fakta ini menjadi draf baru, bukan menyalin artikel dari tautan RSS.</p>
        <textarea className="mt-3 w-full rounded-lg border p-3" rows={7} placeholder="Tulis fakta terverifikasi: siapa, apa, kapan, di mana, bagaimana, angka, dan keterangan resmi..." value={facts} onChange={e=>setFacts(e.target.value)}/>
        <button type="button" disabled={!!busy||facts.trim().length<80} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={()=>post("/api/admin/assist",{facts,title:draft.title,category:draft.category,region:draft.region,source_name:draft.source_name,source_url:draft.source_url},"assist")}>{busy==="assist"?"Menyusun draf...":"Buat draf dengan AI"}</button>
        <p className="mt-2 text-xs text-slate-500">Draf otomatis masuk antrean review. Tetap wajib diperiksa dan disetujui redaksi sebelum terbit.</p>
      </section>
      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Tulis artikel manual</h2>
        {(["title","excerpt","body","image_url","image_credit","source_name","source_url"] as const).map(k=><textarea key={k} className="mt-2 w-full rounded-lg border p-3" rows={k==="body"?7:2} placeholder={k} value={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>)}
        <button type="button" disabled={!!busy} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={()=>post("/api/admin/news",draft,"manual")}>Simpan untuk review</button>
      </section>
      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Artikel dan persetujuan</h2>
        {articles.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div><b>{a.title}</b><p className="text-sm text-slate-500">{a.category} · {a.region} · {a.status}</p></div><div className="flex gap-2"><button type="button" disabled={!!busy} className="rounded border px-3 py-2" onClick={()=>status(a.id,"review")}>Review</button><button type="button" disabled={!!busy} className="rounded bg-green-700 px-3 py-2 text-white" onClick={()=>status(a.id,"published")}>Terbitkan</button><button type="button" disabled={!!busy} className="rounded border px-3 py-2" onClick={()=>status(a.id,"rejected")}>Tolak</button></div></div>)}
      </section>
    </>}
    {msg&&<p role="status" aria-live="polite" className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm">{msg}</p>}
    <p className="mt-6 text-xs text-slate-500">Gunakan hanya sumber dan gambar yang memiliki izin. Semua draf wajib diperiksa redaksi sebelum diterbitkan.</p>
  </div></main>;
}
