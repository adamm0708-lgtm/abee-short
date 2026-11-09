import {NextResponse} from "next/server";
import {db,isAdmin} from "@/lib/db";

export async function POST(req:Request){
  if(!isAdmin(req)) return NextResponse.json({error:"Tidak diizinkan."},{status:401});
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey) return NextResponse.json({error:"GEMINI_API_KEY belum dipasang di Vercel Preview."},{status:400});
  try{
    const input=await req.json();
    const facts=String(input.facts||"").trim();
    const proposedTitle=String(input.title||"").trim();
    const category=String(input.category||"Daerah").trim();
    const region=String(input.region||"Bangil").trim();
    const sourceName=String(input.source_name||"Redaksi ABEE NEWS").trim();
    const sourceUrl=String(input.source_url||"").trim();
    if(facts.length<80) return NextResponse.json({error:"Masukkan fakta terverifikasi minimal 80 karakter sebelum meminta bantuan AI."},{status:400});
    const prompt=[
      "Anda asisten redaksi ABEE NEWS. Tulis draf berita Bahasa Indonesia yang orisinal berdasarkan FAKTA TERKONFIRMASI yang diberikan redaksi saja.",
      "Jangan menyalin artikel sumber, jangan membuka atau mengandalkan isi tautan, jangan menambahkan nama, angka, tanggal, lokasi, kutipan, sebab, atau klaim yang tidak ada dalam fakta.",
      "Jika fakta belum cukup untuk menyusun detail, tulis secara hati-hati dan jangan mengarang. Jangan membuat kutipan langsung.",
      "Kembalikan JSON valid dengan properti title, excerpt, body. Body berupa artikel dengan paragraf yang jelas. Ini DRAF UNTUK REVIEW, bukan berita siap terbit.",
      "Judul usulan: "+(proposedTitle||"Buat judul netral berdasarkan fakta."),
      "Kategori: "+category,
      "Wilayah: "+region,
      "Nama sumber/atribusi: "+sourceName,
      "Tautan sumber untuk atribusi saja, bukan untuk dibaca: "+sourceUrl,
      "FAKTA TERKONFIRMASI DARI REDAKSI:\n"+facts
    ].join("\n\n");
    const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+encodeURIComponent(apiKey),{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.2,responseMimeType:"application/json"}
      }),
      signal:AbortSignal.timeout(45000)
    });
    const payload=await response.json();
    if(!response.ok) throw new Error(payload?.error?.message||"Gemini API gagal memproses permintaan.");
    const text=payload?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("");
    if(!text) throw new Error("Gemini tidak mengembalikan draf. Periksa kuota atau konfigurasi model.");
    const draft=JSON.parse(text);
    if(!draft.title||!draft.body) throw new Error("Hasil AI tidak memiliki judul atau isi artikel.");
    const slug=String(draft.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Date.now().toString().slice(-6);
    await db("news_articles",{
      method:"POST",
      headers:{"Prefer":"return=minimal"},
      body:JSON.stringify({
        title:String(draft.title).slice(0,250),
        slug,
        excerpt:String(draft.excerpt||"").slice(0,500),
        body:String(draft.body),
        category,region,
        source_name:sourceName,
        source_url:sourceUrl||null,
        status:"review"
      })
    });
    return NextResponse.json({message:"Draf bantuan AI berhasil dibuat dan disimpan untuk review redaksi."});
  }catch(error){
    const message=error instanceof Error?error.message:"Gagal membuat draf AI.";
    return NextResponse.json({error:message},{status:500});
  }
}
