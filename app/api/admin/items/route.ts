import {NextResponse} from "next/server";
import {db,isAdmin} from "@/lib/db";
export async function GET(req:Request){if(!isAdmin(req))return NextResponse.json({error:"Tidak diizinkan."},{status:401});try{return NextResponse.json({items:await db("news_items?select=*&status=eq.new&order=created_at.desc&limit=100")});}catch{return NextResponse.json({items:[]},{status:500});}}
