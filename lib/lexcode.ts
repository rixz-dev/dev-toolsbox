export async function fetchLexcodeClaude(text:string,prompt?:string):Promise<string>{
  const base='https://api.lexcode.biz.id/api/ai/claude/4-5-haiku'; const ps=new URLSearchParams({text}); if(prompt)ps.append('prompt',prompt);
  const r=await fetch(`${base}?${ps.toString()}`,{method:'GET',headers:{'Content-Type':'application/json'}});
  if(!r.ok)throw new Error('LexCode error'); const j=await r.json(); if(!j.success||!j.result?.answer)throw new Error(j.message||'no ans'); return j.result.answer;
}
