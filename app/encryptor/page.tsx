'use client';

import { useState } from 'react';
import { Lock, Unlock, Download, Key, Loader2, Copy, Check } from 'lucide-react';
import CryptoJS from 'crypto-js';

type Lang = 'html' | 'js' | 'css' | 'python' | 'ts' | 'other';

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: 'html', label: 'HTML' }, { value: 'js', label: 'JavaScript' }, { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' }, { value: 'ts', label: 'TypeScript' }, { value: 'other', label: 'Other' },
];

export default function EncryptorPage() {
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<Lang>('html');
  const [key, setKey] = useState('');
  const [encrypted, setEncrypted] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [copied, setCopied] = useState(false);

  const generateStrongKey = () => {
    const k = CryptoJS.lib.WordArray.random(32).toString();
    setKey(k);
  };

  const encryptContent = async () => {
    if (!input.trim() || !key.trim()) return;
    setLoading(true);
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      const derivedKey = CryptoJS.PBKDF2(key, salt, { keySize: 256 / 32, iterations: 10000, hasher: CryptoJS.algo.SHA256 });
      const encryptedData = CryptoJS.AES.encrypt(input, derivedKey, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      const payload = { v: 2, s: salt.toString(), i: iv.toString(), c: encryptedData.ciphertext.toString(CryptoJS.enc.Base64) };
      setEncrypted(btoa(JSON.stringify(payload)));
      setDecrypted('');
    } catch { alert('Encryption failed'); } finally { setLoading(false); }
  };

  const decryptContent = async () => {
    if (!input.trim() || !key.trim()) return;
    setLoading(true);
    try {
      const payload = JSON.parse(atob(input.trim()));
      if (!payload.v || payload.v !== 2) throw new Error('Invalid format');
      const salt = CryptoJS.enc.Hex.parse(payload.s);
      const iv = CryptoJS.enc.Hex.parse(payload.i);
      const ciphertext = CryptoJS.enc.Base64.parse(payload.c);
      const derivedKey = CryptoJS.PBKDF2(key, salt, { keySize: 256 / 32, iterations: 10000, hasher: CryptoJS.algo.SHA256 });
      const decryptedData = CryptoJS.AES.decrypt({ ciphertext } as any, derivedKey, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      const result = decryptedData.toString(CryptoJS.enc.Utf8);
      if (!result) throw new Error('Wrong key');
      setDecrypted(result); setEncrypted('');
    } catch (e: any) { alert('Decryption failed: ' + (e.message || 'Invalid key')); } finally { setLoading(false); }
  };

  const handleAction = () => mode === 'encrypt' ? encryptContent() : decryptContent();
  const result = mode === 'encrypt' ? encrypted : decrypted;

  const downloadResult = () => {
    const content = result; if (!content) return;
    const ext = lang === 'html' ? 'html' : lang === 'js' || lang === 'ts' ? 'js' : lang === 'css' ? 'css' : lang === 'python' ? 'py' : 'txt';
    const filename = mode === 'encrypt' ? `encrypted.${ext}` : `decrypted.${ext}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const copyResult = async () => { if (!result) return; await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <main className="flex-1 max-w-[1050px] mx-auto w-full p-4 md:p-6 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-3"><Lock className="text-[var(--accent-orange)]" /> Encryption HTML Generator</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Modern AES-256-CBC + PBKDF2. Very hard to brute-force without the key.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setMode('encrypt')} className={`px-4 py-1.5 rounded-xl text-sm font-bold border ${mode === 'encrypt' ? 'bg-[var(--accent-orange)] text-white border-transparent' : 'border-[var(--border)]'}`}>Encrypt</button>
        <button onClick={() => setMode('decrypt')} className={`px-4 py-1.5 rounded-xl text-sm font-bold border ${mode === 'decrypt' ? 'bg-[var(--accent-cyan)] text-black border-transparent' : 'border-[var(--border)]'}`}>Decrypt</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">{mode === 'encrypt' ? 'Plain Code' : 'Encrypted Payload'}</span>
            <select value={lang} onChange={e => setLang(e.target.value as Lang)} className="text-xs bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-2 py-1">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'encrypt' ? 'Paste your code here...' : 'Paste encrypted base64...'} className="w-full h-72 font-mono text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 resize-y" />

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1.5"><Key size={15} className="text-[var(--accent-cyan)]" /><span className="text-xs font-bold">Secret Key</span></div>
            <div className="flex gap-2">
              <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="Enter strong secret key" className="flex-1 font-mono text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2" />
              <button onClick={generateStrongKey} className="px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent-cyan)]">Generate</button>
            </div>
          </div>

          <button onClick={handleAction} disabled={loading || !input.trim() || !key.trim()} className="mt-4 w-full flex justify-center items-center gap-2 py-3 bg-[var(--accent-orange)] text-white rounded-xl font-bold disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={16} /> : (mode === 'encrypt' ? <Lock size={16} /> : <Unlock size={16} />)}
            {mode === 'encrypt' ? 'Encrypt & Generate' : 'Decrypt'}
          </button>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">{mode === 'encrypt' ? 'Encrypted Output' : 'Decrypted Result'}</span>
            {result && <div className="flex gap-2">
              <button onClick={copyResult} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)]">{copied ? <Check size={13} /> : <Copy size={13} />} Copy</button>
              <button onClick={downloadResult} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)]"><Download size={13} /> Download</button>
            </div>}
          </div>

          {!result ? <div className="flex-1 flex items-center justify-center text-center text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">Result will appear here</div> : (
            <pre className="flex-1 bg-[var(--bg-elevated)] p-4 rounded-xl text-xs font-mono overflow-auto max-h-[360px] whitespace-pre-wrap border border-[var(--border)]">{result}</pre>
          )}
        </div>
      </div>

      <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] p-4 rounded-2xl">
        <strong>How it works:</strong> AES-256-CBC with PBKDF2 (10k rounds). Output is compact base64 payload. Extremely resistant. Do not lose your key.
      </div>
    </main>
  );
}
