'use client';
import { GameState, PLAYER_COLORS, Settings, TileData } from '@/lib/data';
import { t } from '@/lib/i18n';

export function Sidebar({ state, cfg }: { state: GameState; cfg: Settings }) {
  const p = state.players[0];
  if (!p) return null;

  const netW = p.money + p.properties.reduce((s, id) => {
    const t = state.tiles[id];
    return s + (t.mortgaged ? 0 : t.price || 0) + (t.houses || 0) * (t.houseCost || 0);
  }, 0);

  return (
    <aside className="sidebar left">
      <div className="panel">
        <h3 className="panel-title">{t(cfg.lang, 'player')}</h3>
        <div className="player-chip">
          <div className="chip-color" style={{ background: PLAYER_COLORS[0] }} />
          <div className="chip-info">
            <div className="chip-name">{p.name}</div>
            <div className="chip-cash">${p.money}</div>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <span>{t(cfg.lang, 'netWorth')}</span>
            <b>${netW}</b>
          </div>
          <div className="stat">
            <span>{t(cfg.lang, 'properties')}</span>
            <b>{p.properties.length}</b>
          </div>
        </div>
        <div className="player-cards">
          {p.properties.map(id => {
            const t = state.tiles[id];
            return (
              <div
                key={id}
                className={`deed-mini ${t.mortgaged ? 'mortgaged' : ''}`}
                style={{ borderTop: `4px solid ${t.color || 'var(--muted)'}` }}
                title={`${t.name}${t.mortgaged ? ' (Mortgaged)' : ''}`}
                data-lvl={t.houses && t.houses >= 5 ? 'H' : t.houses || ''}
              />
            );
          })}
        </div>
      </div>
      <div className="panel log-panel">
        <h3 className="panel-title">{t(cfg.lang, 'log')}</h3>
        <div className="log-scroll">
          {state.log.map((entry, i) => (
            <div key={i} className="log-entry">
              <span className="time">{entry.time}</span>
              <span className={entry.type}>{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
