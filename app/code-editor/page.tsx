'use client';

import { useState } from 'react';
import { Save, Download, FileText, Plus, Bot, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface FileTab {
  id: string;
  name: string;
  content: string;
  language: string;
}

const LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'java', 'c', 'cpp', 'rust', 'go', 'php', 'sql', 'yaml', 'xml'];

export default function CodeEditorPage() {
  const [files, setFiles] = useState<FileTab[]>([
    { id: '1', name: 'main.js', content: '// Start coding here\nconsole.log("Hello from AI Code Editor!");', language: 'javascript' },
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const [showSaveName, setShowSaveName] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const activeFile = files.find(f => f.id === activeFileId)!;

  const updateFileContent = (newContent: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  const createNewFile = () => {
    const id = Date.now().toString();
    const newFile: FileTab = { id, name: `untitled-${files.length + 1}.js`, content: '', language: 'javascript' };
    setFiles([...files, newFile]);
    setActiveFileId(id);
  };

  const renameFile = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const deleteFile = (id: string) => {
    if (files.length === 1) return;
    const remaining = files.filter(f => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) setActiveFileId(remaining[0].id);
  };

  const saveFile = () => {
    setShowSaveName(true);
  };

  const confirmSave = () => {
    if (!newFileName.trim()) return;
    renameFile(activeFileId, newFileName);
    setShowSaveName(false);
    setNewFileName('');
    downloadCurrentFile();
  };

  const downloadCurrentFile = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeFile.name; a.click(); URL.revokeObjectURL(url);
  };

  const downloadAsZip = async () => {
    const zip = new JSZip();
    files.forEach(f => zip.file(f.name, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'project.zip'; a.click(); URL.revokeObjectURL(url);
  };

  const tools = [
    { label: 'Format', action: () => updateFileContent(activeFile.content.trim()) },
    { label: 'Minify', action: () => updateFileContent(activeFile.content.replace(/\s+/g, ' ').trim()) },
    { label: 'Count Lines', action: () => alert(`Lines: ${activeFile.content.split('\n').length}`) },
    { label: 'Upper', action: () => updateFileContent(activeFile.content.toUpperCase()) },
    { label: 'Lower', action: () => updateFileContent(activeFile.content.toLowerCase()) },
    { label: 'Remove Comments', action: () => updateFileContent(activeFile.content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')) },
    { label: 'Sort Lines', action: () => updateFileContent(activeFile.content.split('\n').sort().join('\n')) },
    { label: 'Reverse Lines', action: () => updateFileContent(activeFile.content.split('\n').reverse().join('\n')) },
    { label: 'Duplicate', action: () => updateFileContent(activeFile.content + '\n' + activeFile.content) },
    { label: 'Add Line Numbers', action: () => updateFileContent(activeFile.content.split('\n').map((l,i)=>`${i+1}. ${l}`).join('\n')) },
    { label: 'Trim', action: () => updateFileContent(activeFile.content.trim()) },
    { label: 'To JSON', action: () => { try { updateFileContent(JSON.stringify(JSON.parse(activeFile.content), null, 2)); } catch { alert('Not valid JSON'); } } },
    { label: 'Escape HTML', action: () => updateFileContent(activeFile.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')) },
    { label: 'Word Count', action: () => alert(`Words: ${activeFile.content.split(/\s+/).length}`) },
    { label: 'Clear', action: () => updateFileContent('') },
  ];

  const sendToAI = async () => {
    if (!aiMessage.trim()) return;
    setAiLoading(true);
    const userMsg = aiMessage;
    setAiHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiMessage('');

    try {
      const res = await fetch('/api/ai-partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, fileContent: activeFile.content, language: activeFile.language }) });
      const data = await res.json();
      setAiHistory(prev => [...prev, { role: 'assistant', content: data.reply || 'AI had nothing to say.' }]);
    } catch {
      setAiHistory(prev => [...prev, { role: 'assistant', content: 'AI partner is temporarily unavailable.' }]);
    } finally { setAiLoading(false); }
  };

  return (
    <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full p-4 md:p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">Full Code Editor + AI Partner</h1>
          <p className="text-xs text-[var(--text-muted)]">All languages • Save • Download ZIP • 15+ tools • AI chat partner (talks only)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={createNewFile} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-[var(--border)]"><Plus size={14}/> New File</button>
          <button onClick={saveFile} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-[var(--accent-orange)] text-white"><Save size={14}/> Save</button>
          <button onClick={downloadAsZip} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-[var(--border)]"><Download size={14}/> ZIP</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-elevated)] p-1 gap-1">
            {files.map(f => (
              <div key={f.id} onClick={() => setActiveFileId(f.id)} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer whitespace-nowrap ${activeFileId === f.id ? 'bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]' : 'hover:bg-[var(--bg-primary)]'}`}>
                <FileText size={13} /> {f.name}
                {files.length > 1 && <button onClick={(e) => { e.stopPropagation(); deleteFile(f.id); }} className="ml-1 text-[var(--text-muted)] hover:text-red-500">×</button>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elevated)]/60 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <input value={activeFile.name} onChange={(e) => renameFile(activeFileId, e.target.value)} className="bg-transparent font-mono text-sm border-b border-dotted border-[var(--border)] focus:outline-none" />
              <select value={activeFile.language} onChange={(e) => setFiles(prev => prev.map(f => f.id === activeFileId ? {...f, language: e.target.value} : f))} className="text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="text-xs text-[var(--text-muted)]">{activeFile.content.length} chars</div>
          </div>

          <textarea value={activeFile.content} onChange={(e) => updateFileContent(e.target.value)} className="flex-1 p-4 font-mono text-sm bg-[var(--bg-primary)] resize-none outline-none" spellCheck={false} />

          <div className="border-t border-[var(--border)] p-3 bg-[var(--bg-elevated)]/50">
            <div className="text-xs font-bold mb-2 text-[var(--text-muted)]">QUICK TOOLS ({tools.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {tools.map((tool, i) => <button key={i} onClick={tool.action} className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--accent-orange)]/10 hover:border-[var(--accent-orange)]">{tool.label}</button>)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden h-[620px]">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--bg-elevated)]">
            <Bot className="text-[var(--accent-cyan)]" /> <span className="font-bold text-sm">AI Partner (Talks Only)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {aiHistory.length === 0 && <div className="text-[var(--text-muted)] text-xs">Ask anything: "explain this code", "suggest improvements"...</div>}
            {aiHistory.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl ${msg.role === 'user' ? 'bg-[var(--accent-orange)]/10 ml-8' : 'bg-[var(--bg-elevated)] mr-8'}`}>
                <div className="text-xs text-[var(--text-muted)] mb-1">{msg.role === 'user' ? 'You' : 'AI Partner'}</div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
            {aiLoading && <div className="flex items-center gap-2 text-xs text-[var(--accent-cyan)]"><Loader2 className="animate-spin" size={14} /> AI thinking...</div>}
          </div>

          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex gap-2">
              <input value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !aiLoading && sendToAI()} placeholder="Ask AI partner..." className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm" />
              <button onClick={sendToAI} disabled={aiLoading || !aiMessage.trim()} className="px-4 rounded-xl bg-[var(--accent-cyan)] text-black">{aiLoading ? <Loader2 className="animate-spin" size={16} /> : 'Send'}</button>
            </div>
            <div className="text-[10px] text-center mt-2 text-[var(--text-muted)]">AI only talks. It cannot read/save your files.</div>
          </div>
        </div>
      </div>

      {showSaveName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-xs">
            <div className="font-bold mb-3">Save File As</div>
            <input value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder={activeFile.name} className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveName(false)} className="flex-1 py-2 border border-[var(--border)] rounded-xl text-sm">Cancel</button>
              <button onClick={confirmSave} className="flex-1 py-2 bg-[var(--accent-orange)] text-white rounded-xl text-sm">Save &amp; Download</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
