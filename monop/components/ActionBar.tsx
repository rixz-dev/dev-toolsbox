'use client';
import { useEffect, useState } from 'react';

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function ActionBar({ dice, animating, actions }: { dice: [number, number]; animating: boolean; actions: { label: string; fn: () => void; style: 'primary' | 'secondary' | 'danger' }[] }) {
  const [display, setDisplay] = useState<[number, number]>([1, 1]);
  
  useEffect(() => {
    if (!animating) { setDisplay(dice); return; }
    let c = 0;
    const iv = setInterval(() => {
      setDisplay([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
      c++;
      if (c > 12) { clearInterval(iv); setDisplay(dice); }
    }, 80);
    return () => clearInterval(iv);
  }, [animating, dice]);

  return (
    <div className="action-bar">
      <div className="dice-box">
        <div className={`die ${animating ? 'rolling' : ''}`}>{FACES[display[0] - 1]}</div>
        <div className={`die ${animating ? 'rolling' : ''}`}>{FACES[display[1] - 1]}</div>
      </div>
      <div className="action-btns">
        {actions.map((a, i) => (
          <button key={i} className={`btn btn-${a.style}`} onClick={a.fn}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
