'use client';
import { useRef, useEffect } from 'react';
import { GameState, PLAYER_COLORS, TileData } from '@/lib/data';

const ORDER = [
  20,21,22,23,24,25,26,27,28,29,30,
  19,-1,-1,-1,-1,-1,-1,-1,-1,-1,31,
  18,-1,-1,-1,-1,-1,-1,-1,-1,-1,32,
  17,-1,-1,-1,-1,-1,-1,-1,-1,-1,33,
  16,-1,-1,-1,-1,-1,-1,-1,-1,-1,34,
  15,-1,-1,-1,-1,-1,-1,-1,-1,-1,35,
  14,-1,-1,-1,-1,-1,-1,-1,-1,-1,36,
  13,-1,-1,-1,-1,-1,-1,-1,-1,-1,37,
  12,-1,-1,-1,-1,-1,-1,-1,-1,-1,38,
  11,-1,-1,-1,-1,-1,-1,-1,-1,-1,39,
  10,9,8,7,6,5,4,3,2,1,0,
];

function shortName(n: string) {
  const map: Record<string, string> = {
    'Mediterranean Avenue': 'Mediterranean', 'Baltic Avenue': 'Baltic', 'Oriental Avenue': 'Oriental',
    'Vermont Avenue': 'Vermont', 'Connecticut Avenue': 'Connecticut', "St. Charles Place": 'St. Charles',
    'States Avenue': 'States', 'Virginia Avenue': 'Virginia', 'St. James Place': 'St. James',
    'Tennessee Avenue': 'Tennessee', 'New York Avenue': 'New York', 'Kentucky Avenue': 'Kentucky',
    'Indiana Avenue': 'Indiana', 'Illinois Avenue': 'Illinois', 'Atlantic Avenue': 'Atlantic',
    'Ventnor Avenue': 'Ventnor', 'Marvin Gardens': 'Marvin', 'Pacific Avenue': 'Pacific',
    'North Carolina Avenue': 'N. Carolina', 'Pennsylvania Avenue': 'Penn Ave', 'Park Place': 'Park Place',
    'Boardwalk': 'Boardwalk', 'Reading Railroad': 'Reading RR', 'Pennsylvania Railroad': 'Penn RR',
    'B. & O. Railroad': 'B&O RR', 'Short Line': 'Short Line', 'Electric Company': 'Electric',
    'Water Works': 'Water Works', 'Income Tax': 'Income Tax', 'Luxury Tax': 'Luxury Tax',
    'Community Chest': 'Community', 'Chance': 'Chance', 'Free Parking': 'Parking',
    'Go to Jail': '→ Jail', 'Jail / Just Visiting': 'Jail', 'Go': 'GO',
  };
  return map[n] || n;
}

export function GameBoard({ state }: { state: GameState }) {
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boardRef.current) return;
    const r = boardRef.current.getBoundingClientRect();
    state.players.forEach((p, i) => {
      const el = document.getElementById(`token-${i}`);
      const tileEl = boardRef.current?.querySelector<HTMLElement>(`.tile[data-id="${p.pos}"]`);
      if (!el || !tileEl) return;
      const tr = tileEl.getBoundingClientRect();
      const offset = (i * 4) % 12;
      el.style.left = (tr.left - r.left + 6 + offset) + 'px';
      el.style.top = (tr.top - r.top + 6 + offset) + 'px';
      el.style.width = (tr.width / 2.2) + 'px';
      el.style.height = (tr.width / 2.2) + 'px';
    });
  }, [state.players]);

  return (
    <div className="monopoly-board" ref={boardRef}>
      {ORDER.map((tid, idx) => {
        const col = (idx % 11) + 1;
        const row = Math.floor(idx / 11) + 1;
        if (tid === -1) {
          return <div key={idx} style={{ gridColumn: col, gridRow: row, background: 'rgba(0,0,0,0.2)', border: 'none' }} />;
        }
        const t = state.tiles[tid];
        const isCorner = [0, 10, 20, 30].includes(tid);
        return (
          <div
            key={tid}
            className={`tile ${isCorner ? 'corner' : ''}`}
            data-id={tid}
            style={{ gridColumn: col, gridRow: row }}
          >
            {t.type === 'street' && (
              <div className="bar" style={{ background: t.color }} />
            )}
            <div className="tile-name">{shortName(t.name)}</div>
            {(t.type === 'street' || t.type === 'railroad' || t.type === 'utility') && (
              <div className="price">${t.price}</div>
            )}
            <div className="owners">
              {t.owner != null && (
                <div className="o" style={{ background: PLAYER_COLORS[t.owner] }} />
              )}
            </div>
            <div className="houses">
              {t.houses != null && t.houses > 0 && t.houses < 5 && Array.from({ length: t.houses }).map((_, i) => (
                <div key={i} className="h" />
              ))}
              {t.houses != null && t.houses >= 5 && (
                <div className="h hotel" />
              )}
            </div>
          </div>
        );
      })}
      {state.players.map((p, i) => (
        <div key={i} id={`token-${i}`} className={`token p${i}`} />
      ))}
    </div>
  );
}
