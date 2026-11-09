import {NextResponse} from "next/server";
import {configured,db} from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){if(!configured())return NextResponse.json({items:[],setupRequired:true});try{const items=await db("news_articles?select=id,title,slug,excerpt,category,region,image_url,published_at,source_name,source_url,body&status=eq.published&order=published_at.desc");return NextResponse.json({items});}catch{return NextResponse.json({items:[],error:"Berita belum dapat dimuat."},{status:500});}}
