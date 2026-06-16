'use client';
import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useGame } from '@/hooks/useGame';
import { GameBoard } from '@/components/GameBoard';
import { ActionBar } from '@/components/ActionBar';
import { Sidebar } from '@/components/Sidebar';
import { RightPanel } from '@/components/RightPanel';
import { Modal } from '@/components/Modal';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { PLAYER_COLORS, Settings } from '@/lib/data';

export default function GamePage() {
  const router = useRouter();
  const { cfg, mounted } = useSettings();
  const { state, setState, doRollDice, doPayJail, doUseJailCard, doEndTurn, doBuy, doBuild, doMortgage, doUnmortgage, doTrade, closeModal, openModal, resetGame, togglePause, addLog } = useGame(cfg);
  const [tradeModal, setTradeModal] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', cfg.theme);
  }, [cfg.theme, mounted]);

  if (!mounted) return <div className="bg-grid" />;

  const p = state.players[state.turn];
  if (!p) return null;

  const isHumanTurn = !p.isBot && !p.bankrupt && !state.gameOver && !state.paused && !state.waiting && !state.animating;
  const tile = state.tiles[p.pos];

  const humanActions = () => {
    if (!isHumanTurn) return [];
    if (p.jailed > 0) {
      const acts: { label: string; fn: () => void; style: 'primary' | 'secondary' | 'danger' }[] = [
        { label: t(cfg.lang, 'pay50'), fn: doPayJail, style: 'primary' },
      ];
      if (p.getOutCards > 0) acts.push({ label: t(cfg.lang, 'useCard'), fn: doUseJailCard, style: 'secondary' });
      acts.push({ label: t(cfg.lang, 'tryDouble'), fn: doRollDice, style: 'secondary' });
      return acts;
    }
    if (tile && tile.owner == null && (tile.type === 'street' || tile.type === 'railroad' || tile.type === 'utility') && p.money >= (tile.price || 0)) {
      return [
        { label: `${t(cfg.lang, 'buy')} ($${tile.price})`, fn: doBuy, style: 'primary' },
        { label: t(cfg.lang, 'pass'), fn: doEndTurn, style: 'secondary' },
      ];
    }
    return [{ label: t(cfg.lang, 'roll'), fn: doRollDice, style: 'primary' }];
  };

  const postActions = () => {
    if (!isHumanTurn) return [];
    const acts: { label: string; fn: () => void; style: 'primary' | 'secondary' | 'danger' }[] = [];
    const canBuild = p.properties.some(id => {
      const t = state.tiles[id];
      return t.group && t.owner === p.id && !t.mortgaged && (t.houses || 0) < 5 && t.houseCost && p.money >= t.houseCost;
    });
    const canMort = p.properties.some(id => {
      const t = state.tiles[id];
      return t.owner === p.id && !t.mortgaged && (t.houses || 0) === 0 && t.mortgage;
    });
    const canUnmort = p.properties.some(id => {
      const t = state.tiles[id];
      return t.owner === p.id && t.mortgaged && t.mortgage;
    });
    if (canBuild) acts.push({ label: t(cfg.lang, 'build'), fn: () => openBuildModal(), style: 'secondary' });
    if (canMort) acts.push({ label: t(cfg.lang, 'mortgage'), fn: () => openMortModal(), style: 'secondary' });
    if (canUnmort) acts.push({ label: t(cfg.lang, 'unmortgage'), fn: () => openUnmortModal(), style: 'secondary' });
    acts.push({ label: t(cfg.lang, 'trade'), fn: () => setTradeModal(true), style: 'secondary' });
    acts.push({ label: t(cfg.lang, 'endTurn'), fn: doEndTurn, style: 'primary' });
    return acts;
  };

  const openBuildModal = () => {
    const candidates = p.properties.filter(id => {
      const t = state.tiles[id];
      return t.group && t.owner === p.id && !t.mortgaged && (t.houses || 0) < 5 && t.houseCost && p.money >= t.houseCost;
    }).sort((a, b) => (state.tiles[a].group || 0) - (state.tiles[b].group || 0));
    const body = (
      <div>
        {candidates.map(id => {
          const t = state.tiles[id];
          return (
            <div key={id} className="trade-item" onClick={() => { doBuild(id); closeModal(); }}>
              <div className="card-bar" style={{ background: t.color, width: 10, height: 24, borderRadius: 3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.houses || 0} houses · ${t.houseCost} to build</div>
              </div>
            </div>
          );
        })}
      </div>
    );
    openModal(t(cfg.lang, 'build'), body, [{ label: t(cfg.lang, 'cancel'), style: 'secondary', fn: closeModal }]);
  };

  const openMortModal = () => {
    const candidates = p.properties.filter(id => {
      const t = state.tiles[id];
      return t.owner === p.id && !t.mortgaged && (t.houses || 0) === 0 && t.mortgage;
    }).sort((a, b) => (state.tiles[b].mortgage || 0) - (state.tiles[a].mortgage || 0));
    const body = (
      <div>
        {candidates.map(id => {
          const t = state.tiles[id];
          return (
            <div key={id} className="trade-item" onClick={() => { doMortgage(id); closeModal(); }}>
              <div className="card-bar" style={{ background: t.color || 'var(--muted)', width: 10, height: 24, borderRadius: 3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Mortgage value: ${t.mortgage}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
    openModal(t(cfg.lang, 'mortgage'), body, [{ label: t(cfg.lang, 'cancel'), style: 'secondary', fn: closeModal }]);
  };

  const openUnmortModal = () => {
    const candidates = p.properties.filter(id => state.tiles[id].mortgaged && state.tiles[id].mortgage).sort((a, b) => (state.tiles[a].mortgage || 0) - (state.tiles[b].mortgage || 0));
    const body = (
      <div>
        {candidates.map(id => {
          const t = state.tiles[id];
          const cost = Math.ceil((t.mortgage || 0) * 1.1);
          return (
            <div key={id} className="trade-item" onClick={() => { doUnmortgage(id); closeModal(); }}>
              <div className="card-bar" style={{ background: t.color || 'var(--muted)', width: 10, height: 24, borderRadius: 3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Cost: ${cost}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
    openModal(t(cfg.lang, 'unmortgage'), body, [{ label: t(cfg.lang, 'cancel'), style: 'secondary', fn: closeModal }]);
  };

  useEffect(() => {
    if (state.gameOver) {
      const alive = state.players.filter(pl => !pl.bankrupt);
      const winner = alive[0];
      openModal(
        t(cfg.lang, 'gameOver'),
        <div style={{ textAlign: 'center', fontFamily: 'var(--pixel)', fontSize: 18, color: 'var(--accent1)' }}>
          {winner ? winner.name : '???'} {t(cfg.lang, 'winner')}
        </div>,
        [
          { label: t(cfg.lang, 'playAgain'), fn: () => { resetGame(); closeModal(); }, style: 'primary' },
          { label: t(cfg.lang, 'quit'), fn: () => router.push('/'), style: 'danger' },
        ]
      );
    }
  }, [state.gameOver]);

  const currentActions = isHumanTurn ? (humanActions().length > 0 ? humanActions() : postActions()) : [];

  return (
    <div className="game-wrap">
      <div className="bg-grid" />
      <div className="scanlines" />

      <Sidebar state={state} cfg={cfg} />

      <section className="board-area">
        <div className="top-hud">
          <div className="turn-badge">
            <span className="dot" style={{ background: PLAYER_COLORS[p.id] || '#888' }} />
            <span>{p.isBot ? `${t(cfg.lang, 'botTurn')} — ${p.name}` : t(cfg.lang, 'yourTurn')}</span>
          </div>
          <div className="hud-center">
            <button className="hud-btn" onClick={togglePause}>❚❚</button>
          </div>
        </div>

        <GameBoard state={state} />

        <ActionBar dice={state.dice} animating={state.animating} actions={currentActions} />
      </section>

      <RightPanel state={state} cfg={cfg} />

      {state.paused && (
        <Modal
          title={t(cfg.lang, 'paused')}
          body={<div>Permainan dijeda.</div>}
          actions={[
            { label: t(cfg.lang, 'resume'), fn: () => { togglePause(); closeModal(); }, style: 'primary' },
            { label: t(cfg.lang, 'quit'), fn: () => router.push('/'), style: 'danger' },
          ]}
          onClose={togglePause}
        />
      )}

      {state.modal.open && !state.paused && (
        <Modal title={state.modal.title} body={state.modal.body} actions={state.modal.actions} onClose={closeModal} />
      )}

      {tradeModal && <TradeModal state={state} cfg={cfg} onClose={() => setTradeModal(false)} doTrade={doTrade} addLog={addLog} />}
    </div>
  );
}

function TradeModal({ state, cfg, onClose, doTrade, addLog }: { state: any; cfg: Settings; onClose: () => void; doTrade: any; addLog: any }) {
  const others = state.players.filter((pl: any) => !pl.bankrupt && pl.id !== 0);
  const [selected, setSelected] = useState(others[0]?.id || 0);
  const [give, setGive] = useState<number[]>([]);
  const [get, setGet] = useState<number[]>([]);
  const [giveCash, setGiveCash] = useState(0);
  const [getCash, setGetCash] = useState(0);

  const p = state.players[0];
  const o = state.players.find((pl: any) => pl.id === selected);
  if (!o) return null;

  const toggle = (arr: number[], setArr: any, id: number) => {
    if (arr.includes(id)) setArr(arr.filter((x: number) => x !== id));
    else setArr([...arr, id]);
  };

  const submit = () => {
    if (giveCash > p.money) { addLog('Uang tidak cukup untuk trade.', 'bad'); return; }
    if (getCash > o.money) { addLog('Lawan tidak punya uang cukup.', 'bad'); return; }
    doTrade(selected, give, get, giveCash, getCash);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>{t(cfg.lang, 'trade')}</h2>
        <select value={selected} onChange={(e) => setSelected(parseInt(e.target.value))} style={{ width: '100%', marginBottom: 10, padding: 6, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6 }}>
          {others.map((pl: any) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
        </select>
        <div className="trade-grid">
          <div className="trade-list">
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>You give</div>
            <input type="number" value={giveCash} onChange={e => setGiveCash(parseInt(e.target.value) || 0)} min={0} max={p.money} style={{ width: '100%', marginBottom: 8, padding: 4, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }} />
            {p.properties.map((id: number) => {
              const t = state.tiles[id];
              return (
                <div key={id} className={`trade-item ${give.includes(id) ? 'selected' : ''}`} onClick={() => toggle(give, setGive, id)}>
                  <div className="card-bar" style={{ background: t.color || 'var(--muted)', width: 8, height: 20, borderRadius: 2 }} />
                  <div style={{ fontSize: 11 }}>{t.name}</div>
                </div>
              );
            })}
          </div>
          <div className="trade-mid">
            <div style={{ fontSize: 18 }}>⇄</div>
          </div>
          <div className="trade-list">
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>You receive</div>
            <input type="number" value={getCash} onChange={e => setGetCash(parseInt(e.target.value) || 0)} min={0} max={o.money} style={{ width: '100%', marginBottom: 8, padding: 4, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }} />
            {o.properties.map((id: number) => {
              const t = state.tiles[id];
              return (
                <div key={id} className={`trade-item ${get.includes(id) ? 'selected' : ''}`} onClick={() => toggle(get, setGet, id)}>
                  <div className="card-bar" style={{ background: t.color || 'var(--muted)', width: 8, height: 20, borderRadius: 2 }} />
                  <div style={{ fontSize: 11 }}>{t.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={submit}>{t(cfg.lang, 'confirm')}</button>
          <button className="btn btn-ghost" onClick={onClose}>{t(cfg.lang, 'cancel')}</button>
        </div>
      </div>
    </div>
  );
}
