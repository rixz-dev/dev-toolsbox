import { NextRequest, NextResponse } from 'next/server';
import { fetchLexcodeClaude } from '@/lib/lexcode';

export async function POST(req: NextRequest) {
  try {
    const { message, fileContent, language } = await req.json();
    const system = `You are a friendly AI coding partner inside Dev-ToolsBox code editor. You can ONLY talk and give advice. You have NO access to files. Be concise and helpful. Current file language: ${language || 'unknown'}.`;
    const prompt = `${system}\n\nUser says: ${message}\n\nCurrent file content (for context only):\n${fileContent ? fileContent.slice(0, 1800) : '(empty)'}`;
    const reply = await fetchLexcodeClaude(prompt);
    return NextResponse.json({ success: true, reply: reply.slice(0, 1800) });
  } catch {
    return NextResponse.json({ success: true, reply: "AI partner is temporarily unavailable. Ask me anything about coding!" });
  }
}
