import {NextResponse} from "next/server";
import {db,isAdmin} from "@/lib/db";

export const maxDuration = 60;

const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash"];

type GeminiPayload = {
  error?: { message?: string };
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

async function generateWithFallback(apiKey: string, prompt: string) {
  let lastError = "Gemini API gagal memproses permintaan.";

  for (let index = 0; index < MODELS.length; index++) {
    const model = MODELS[index];
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        model,
        input: prompt,
        store: false
      }),
      signal: AbortSignal.timeout(25000)
    });

    const payload = await response.json().catch(() => ({})) as GeminiPayload;

    if (!response.ok) {
      const message = payload?.error?.message || `Gemini API gagal (HTTP ${response.status}).`;
      lastError = `${model}: ${message}`;

      const temporaryFailure =
        [429, 500, 502, 503, 504].includes(response.status) ||
        /high demand|overloaded|temporarily unavailable|try again later/i.test(message);

      if (index === 0 && temporaryFailure) continue;
      throw new Error(lastError);
    }

    const text = payload?.steps
      ?.filter(step => step.type === "model_output")
      .flatMap(step => step.content || [])
      .filter(part => part.type === "text")
      .map(part => part.text || "")
      .join("");

    if (!text) {
      throw new Error(`${model} tidak mengembalikan teks draf.`);
    }

    return {text, model};
  }

  throw new Error(lastError);
}

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

    const generated = await generateWithFallback(apiKey, prompt);
    const draft = JSON.parse(generated.text);

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

    return NextResponse.json({
      message:"Draf bantuan AI berhasil dibuat dan disimpan untuk review redaksi.",
      model:generated.model
    });
  }catch(error){
    const message=error instanceof Error?error.message:"Gagal membuat draf AI.";
    return NextResponse.json({error:message},{status:500});
  }
}
