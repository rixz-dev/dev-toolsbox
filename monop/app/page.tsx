'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { t, I18nKey } from '@/lib/i18n';
import { Settings } from '@/lib/data';
import Link from 'next/link';

export default function Home() {
  const { cfg, update, mounted } = useSettings();
  const [showDiff, setShowDiff] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<Settings['diff']>(cfg.diff);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { setSelectedDiff(cfg.diff); }, [cfg.diff]);

  if (!mounted) return <div className="bg-grid" />;

  return (
    <main className="lobby-container">
      <div className="bg-grid" />
      <div className="scanlines" />
      <header className="lobby-header">
        <div className="logo">
          <span className="logo-pixel">MONOP</span>
          <span className="badge">v0.5 β</span>
        </div>
        <div className="meta">by reiz_riz / rixz-dev</div>
      </header>

      {!showDiff ? (
        <>
          <section className="hero">
            <h1 className="glitch" data-text="MONOP">MONOP</h1>
            <p className="tagline">{t(cfg.lang, 'tagline')}</p>
            <div className="pixel-board-preview">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="preview-cell" />
              ))}
            </div>
          </section>

          <section className="menu">
            <button className="btn btn-primary" onClick={() => setShowDiff(true)}>
              <span>▶</span> <span>{t(cfg.lang, 'newGame')}</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
              <span>⚙</span> <span>{t(cfg.lang, 'settings')}</span>
            </button>
            <a className="btn btn-support" href="https://saweria.co/riznotdev" target="_blank" rel="noopener noreferrer">
              <span>♥</span> <span>{t(cfg.lang, 'support')}</span>
            </a>
          </section>
        </>
      ) : (
        <section className="difficulty-panel">
          <h3>{t(cfg.lang, 'selectDifficulty')}</h3>
          <div className="diff-options">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button key={d} className={`diff-btn ${selectedDiff === d ? 'active' : ''}`} onClick={() => setSelectedDiff(d)}>
                <span className="diff-title">{t(cfg.lang, d)}</span>
                <span className="diff-desc">{t(cfg.lang, `${d}Desc` as I18nKey)}</span>
              </button>
            ))}
          </div>
          <div className="lobby-actions">
            <Link href={`/game?diff=${selectedDiff}`} className="btn btn-primary" onClick={() => update({ diff: selectedDiff })}>
              {t(cfg.lang, 'startGame')}
            </Link>
            <button className="btn btn-ghost" onClick={() => setShowDiff(false)}>
              {t(cfg.lang, 'back')}
            </button>
          </div>
        </section>
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="modal settings-modal">
            <h2>{t(cfg.lang, 'settings')}</h2>
            <div className="settings-grid">
              <div className="setting-row">
                <label>{t(cfg.lang, 'language')}</label>
                <select value={cfg.lang} onChange={(e) => update({ lang: e.target.value as Settings['lang'] })}>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'theme')}</label>
                <select value={cfg.theme} onChange={(e) => update({ theme: e.target.value as Settings['theme'] })}>
                  <option value="dark">Dark (Default)</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'difficultyDefault')}</label>
                <select value={cfg.diff} onChange={(e) => update({ diff: e.target.value as Settings['diff'] })}>
                  <option value="easy">{t(cfg.lang, 'easy')}</option>
                  <option value="medium">{t(cfg.lang, 'medium')}</option>
                  <option value="hard">{t(cfg.lang, 'hard')}</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'gameSpeed')}</label>
                <select value={cfg.speed} onChange={(e) => update({ speed: e.target.value as Settings['speed'] })}>
                  <option value="slow">{t(cfg.lang, 'slow')}</option>
                  <option value="normal">{t(cfg.lang, 'normal')}</option>
                  <option value="fast">{t(cfg.lang, 'fast')}</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'sound')}</label>
                <select value={cfg.sound} onChange={(e) => update({ sound: e.target.value as Settings['sound'] })}>
                  <option value="on">{t(cfg.lang, 'on')}</option>
                  <option value="off">{t(cfg.lang, 'off')}</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'animDice')}</label>
                <select value={cfg.animDice} onChange={(e) => update({ animDice: e.target.value as Settings['animDice'] })}>
                  <option value="on">{t(cfg.lang, 'on')}</option>
                  <option value="off">{t(cfg.lang, 'off')}</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'freeParking')}</label>
                <select value={cfg.freeParking} onChange={(e) => update({ freeParking: e.target.value as Settings['freeParking'] })}>
                  <option value="off">Off (Official)</option>
                  <option value="on">On (House Rule)</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'auction')}</label>
                <select value={cfg.auction} onChange={(e) => update({ auction: e.target.value as Settings['auction'] })}>
                  <option value="on">On (Official)</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <div className="setting-row">
                <label>{t(cfg.lang, 'startingMoney')}</label>
                <select value={cfg.startMoney} onChange={(e) => update({ startMoney: parseInt(e.target.value) })}>
                  <option value="1500">$1,500 (Standard)</option>
                  <option value="2000">$2,000</option>
                  <option value="1000">$1,000 (Cepat)</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>{t(cfg.lang, 'close')}</button>
            </div>
          </div>
        </div>
      )}

      <footer className="lobby-footer">
        <span>© reiz_riz</span>
        <a href="https://github.com/rixz-dev" target="_blank" rel="noopener noreferrer">github/rixz-dev</a>
      </footer>
    </main>
  );
}
