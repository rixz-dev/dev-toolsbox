import { NextRequest, NextResponse } from 'next/server';
import { fetchLexcodeClaude } from '@/lib/lexcode';
export async function POST(req: NextRequest) {
  try { const {message,fileContent,language}=await req.json(); const sys=`You are friendly AI coding partner in Dev-ToolsBox. ONLY talk/give advice. NO file access. Current lang: ${language||'unknown'}.`; const p=`${sys}\n\nUser: ${message}\n\nFile context (read only):\n${fileContent?fileContent.slice(0,1800):'(empty)'}`; const r=await fetchLexcodeClaude(p); return NextResponse.json({success:true,reply:r.slice(0,1800)}); } catch { return NextResponse.json({success:true,reply:'AI temp unavailable. Ask coding Q!'}); }
}
