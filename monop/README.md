# Monop v0.5 (beta)

by **reiz_riz** · [github.com/rixz-dev](https://github.com/rixz-dev)

> Taktik. Perdagangan. Dominasi. Permainan Monopoli berbasis browser dengan AI bot aktif, aturan resmi, dan desain pixel-dark minimalis.

## Stack
- Next.js 14 (App Router, React 18)
- TypeScript + Vanilla CSS (no Tailwind)
- Static Export (deploy ke Vercel/Netlify)

## Fitur
- **3 Tingkat Kesulitan Bot**: Easy, Medium, Hard
- **Aturan Resmi Monopoli**: Dadu kembar, penjara, lelang, monopoly, sewa, kartu Chance & Community Chest, bangkrut, dll.
- **Pengaturan Lengkap**: Bahasa (ID/EN), tema dark/light, kecepatan game, suara, animasi dadu, Free Parking jackpot, lelang on/off, uang awal.
- **Lobby**: New Game, Settings, Support Author (saweria.co/riznotdev)
- **Human Actions**: Beli, lelang, bangun rumah/hotel, gadai, tebus gadai, perdagangan antar pemain/bot.
- **Desain**: Pixel typography, dark mode default, animasi glitch & dice, 2 warna sync (amber + teal).

## Deploy ke Vercel (2026)
1. Push repo ini ke GitHub (gunakan akun `rixz-dev`)
2. Buka [vercel.com](https://vercel.com) → **Add New Project**
3. Import repo `monop`
4. Vercel akan **auto-detect Next.js** dari `package.json`
5. Biarkan semua default (Framework: Next.js, Build: `next build`, Output: `.next` atau `dist`)
6. Klik **Deploy**

**Note**: `next.config.js` sudah set `output: 'export'` + `distDir: 'dist'` untuk static export. Vercel tetap build sebagai Next.js lalu deploy static files.

## Dev
```bash
npm install
npm run dev
```

## Catatan
- Dioptimalkan untuk layar desktop (landscape).
- Tidak mendukung orientasi vertikal mobile.
- Semua state settings disimpan di `localStorage`.
