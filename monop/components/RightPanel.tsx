'use client';
import { GameState, Settings, PLAYER_COLORS } from '@/lib/data';
import { t } from '@/lib/i18n';

export function RightPanel({ state, cfg }: { state: GameState; cfg: Settings }) {
  return (
    <aside className="sidebar right">
      <div className="panel">
        <h3 className="panel-title">{t(cfg.lang, 'ai')}</h3>
        <div>
          {state.players.slice(1).map(pl => (
            <div key={pl.id} className="player-chip" style={{ opacity: pl.bankrupt ? 0.4 : 1 }}>
              <div className="chip-color" style={{ background: PLAYER_COLORS[pl.id] }} />
              <div className="chip-info">
                <div className="chip-name">{pl.name}</div>
                <div className="chip-cash">${pl.money} · {pl.properties.length} props</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3 className="panel-title">{t(cfg.lang, 'freeParkingSpace')}</h3>
        <div style={{ fontFamily: 'var(--pixel)', fontSize: 14, color: 'var(--accent1)', textAlign: 'center' }}>
          ${state.freeParkingPot}
        </div>
      </div>
    </aside>
  );
}
