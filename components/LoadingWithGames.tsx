'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';

interface LoadingWithGamesProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoadingWithGames({ isOpen, onClose, message = 'Processing...' }: LoadingWithGamesProps) {
  const [currentGame, setCurrentGame] = useState<'tictactoe' | 'memory'>('tictactoe');
  const [gameWins, setGameWins] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[ML] Initializing training pipeline...',
    '[ML] Loading dataset (42,000 samples)...',
  ]);
  const [epoch, setEpoch] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const newLog = `[Epoch ${epoch}/50] loss: ${(0.45 - epoch * 0.006).toFixed(3)} | acc: ${(0.72 + epoch * 0.005).toFixed(2)}`;
      setLogs(prev => [...prev.slice(-6), newLog]);
      setEpoch(e => Math.min(50, e + 1));
    }, 850);
    return () => clearInterval(interval);
  }, [isOpen, epoch]);

  const handleGameWin = () => {
    setGameWins(w => w + 1);
    setTimeout(() => {
      setCurrentGame(currentGame === 'tictactoe' ? 'memory' : 'tictactoe');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-pulse" />
            <span className="font-mono text-sm font-bold tracking-wider text-[var(--accent-orange)]">{message}</span>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-4 border-b border-[var(--border)] bg-black/40 font-mono text-[10px] leading-tight h-28 overflow-hidden">
          <div className="text-[var(--accent-cyan)] mb-1 text-[9px] uppercase tracking-widest">TRAINING LOGS (SIMULATED)</div>
          {logs.map((log, i) => <div key={i} className="text-[var(--text-muted)] opacity-90">{log}</div>)}
          <div className="text-[var(--success)] mt-1">... optimizing weights</div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div><span className="text-sm font-bold">While you wait...</span> <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]">2 QUICK GAMES</span></div>
            <div className="text-xs text-[var(--text-muted)]">Wins: {gameWins}</div>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setCurrentGame('tictactoe')} className={`flex-1 py-1.5 text-xs rounded-xl border transition-all ${currentGame === 'tictactoe' ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)] text-[var(--accent-orange)]' : 'border-[var(--border)]'}`}>Tic-Tac-Toe</button>
            <button onClick={() => setCurrentGame('memory')} className={`flex-1 py-1.5 text-xs rounded-xl border transition-all ${currentGame === 'memory' ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)] text-[var(--accent-orange)]' : 'border-[var(--border)]'}`}>Memory Match</button>
          </div>

          <div className="bg-[var(--bg-elevated)] rounded-xl p-3 border border-[var(--border)] min-h-[170px] flex items-center justify-center">
            {currentGame === 'tictactoe' ? <TicTacToe onWin={handleGameWin} /> : <MemoryGame onWin={handleGameWin} />}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[var(--border)] text-[10px] text-center text-[var(--text-muted)]">
          Powered by Dev-ToolsBox • AI is thinking hard...
        </div>
      </motion.div>
    </div>
  );
}

function TicTacToe({ onWin }: { onWin: (winner: string) => void }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let line of lines) {
      const [a,b,c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    const w = calculateWinner(newBoard);
    if (w) { setWinner(w); onWin(w); }
    else if (!newBoard.includes(null)) { setWinner('Draw'); onWin('Draw'); }
    else setXIsNext(!xIsNext);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setXIsNext(true); setWinner(null); };

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-1 w-48 mx-auto mb-3">
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)} className="w-14 h-14 bg-[var(--bg-elevated)] border border-[var(--border)] text-2xl font-bold flex items-center justify-center" disabled={!!cell || !!winner}>{cell}</button>
        ))}
      </div>
      <div className="text-center text-xs text-[var(--text-muted)]">{winner ? `Winner: ${winner}` : `Next: ${xIsNext ? 'X' : 'O'}`}</div>
      <button onClick={reset} className="mt-2 text-xs flex items-center gap-1 mx-auto text-[var(--accent-cyan)]"><RefreshCw size={12} /> Reset</button>
    </div>
  );
}

function MemoryGame({ onWin }: { onWin: () => void }) {
  const emojis = ['🍕','🚀','🐱','🌟','🎮','🔥','🍔','🎸'];
  const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || matched.includes(index) || flipped.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (cards[a] === cards[b]) {
        const newMatched = [...matched, a, b];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) setTimeout(() => onWin(), 600);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  return (
    <div>
      <div className="text-center text-xs mb-2 text-[var(--text-muted)]">Moves: {moves}</div>
      <div className="grid grid-cols-4 gap-1 w-52 mx-auto">
        {cards.map((emoji, i) => (
          <button key={i} onClick={() => handleFlip(i)} className={`w-12 h-12 text-2xl flex items-center justify-center rounded-lg border transition-all ${flipped.includes(i) || matched.includes(i) ? 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)]' : 'bg-[var(--bg-elevated)] border-[var(--border)]'}`}>
            {flipped.includes(i) || matched.includes(i) ? emoji : '❓'}
          </button>
        ))}
      </div>
      <div className="text-center text-[10px] mt-2 text-[var(--text-muted)]">Match all pairs!</div>
    </div>
  );
}
