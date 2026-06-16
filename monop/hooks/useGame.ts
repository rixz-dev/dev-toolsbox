'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  TileData, Settings, TILES, GROUPS, RAILROADS, UTILITIES,
  CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffle, PLAYER_COLORS, BOT_NAMES,
} from '@/lib/data';
import {
  shouldBuyHard, shouldBuyMedium, shouldBuyEasy, botAuctionBid, shouldPayJail, botAcceptTrade,
} from '@/lib/ai';

export interface Player {
  id: number;
  name: string;
  isBot: boolean;
  money: number;
  pos: number;
  jailed: number;
  getOutCards: number;
  properties: number[];
  bankrupt: boolean;
}

export interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'money' | 'bad' | 'actor';
}

export interface ModalAction {
  label: string;
  style?: 'primary' | 'secondary' | 'danger';
  fn: () => void;
}

export interface GameState {
  players: Player[];
  turn: number;
  round: number;
  doublesCount: number;
  gameOver: boolean;
  freeParkingPot: number;
  tiles: TileData[];
  chanceDeck: typeof CHANCE_CARDS;
  communityDeck: typeof COMMUNITY_CHEST_CARDS;
  paused: boolean;
  waiting: boolean;
  dice: [number, number];
  modal: {
    open: boolean;
    title: string;
    body: React.ReactNode;
    actions: ModalAction[];
  };
  log: LogEntry[];
  animating: boolean;
}

function timeNow() {
  return new Date().toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function createInitialPlayers(cfg: Settings): Player[] {
  const botCount = 2 + (cfg.diff === 'hard' ? 1 : 0);
  const players: Player[] = [{
    id: 0, name: 'You', isBot: false, money: cfg.startMoney,
    pos: 0, jailed: 0, getOutCards: 0, properties: [], bankrupt: false,
  }];
  for (let i = 1; i <= botCount; i++) {
    players.push({
      id: i, name: BOT_NAMES[i - 1], isBot: true, money: cfg.startMoney,
      pos: 0, jailed: 0, getOutCards: 0, properties: [], bankrupt: false,
    });
  }
  return players;
}

export function initGameState(cfg: Settings): GameState {
  return {
    players: createInitialPlayers(cfg),
    turn: 0,
    round: 1,
    doublesCount: 0,
    gameOver: false,
    freeParkingPot: 0,
    tiles: JSON.parse(JSON.stringify(TILES)) as TileData[],
    chanceDeck: shuffle(CHANCE_CARDS),
    communityDeck: shuffle(COMMUNITY_CHEST_CARDS),
    paused: false,
    waiting: false,
    dice: [1, 1] as [number, number],
    modal: { open: false, title: '', body: null, actions: [] },
    log: [{ time: timeNow(), msg: 'Game dimulai. ' + (2 + (cfg.diff === 'hard' ? 1 : 0) + 1) + ' pemain.', type: 'actor' }],
    animating: false,
  };
}

export function useGame(cfg: Settings) {
  const [state, setState] = useState<GameState>(() => initGameState(cfg));
  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  const updateState = useCallback((fn: (prev: GameState) => GameState) => {
    setState(prev => fn(prev));
  }, []);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      log: [...prev.log, { time: timeNow(), msg, type }].slice(-200),
    }));
  }, []);

  const speedMs = useCallback((base: number) => {
    const speed = cfgRef.current.speed;
    if (speed === 'fast') return base * 0.5;
    if (speed === 'slow') return base * 1.5;
    return base;
  }, []);

  // ===== CORE GAME LOGIC =====
  // These are wrapped in a ref to avoid stale closures in recursive calls
  const logicRef = useRef<any>({});

  useEffect(() => {
    const isMono = (group: number, ownerId: number, tiles: TileData[]) => {
      const needed = GROUPS[group] || 0;
      return tiles.filter(t => t.group === group && t.owner === ownerId).length === needed;
    };

    const canBuildEven = (id: number, tiles: TileData[]) => {
      const t = tiles[id]; if (!t.group) return false;
      const groupTiles = tiles.filter(x => x.group === t.group);
      const min = Math.min(...groupTiles.map(x => x.owner === t.owner ? (x.houses || 0) : 99));
      const h = t.houses || 0;
      return h === min || (h === min + 1 && groupTiles.every(x => x.owner !== t.owner || (x.houses || 0) >= min));
    };

    const netW = (p: Player, tiles: TileData[]) => {
      let w = p.money;
      p.properties.forEach(id => {
        const t = tiles[id];
        if (!t.mortgaged) w += t.price || 0;
        w += (t.houses || 0) * (t.houseCost || 0);
      });
      return w;
    };

    const addFree = (s: GameState, amt: number) => {
      if (cfgRef.current.freeParking === 'on') return { ...s, freeParkingPot: s.freeParkingPot + amt };
      return s;
    };

    const closeM = (s: GameState) => ({ ...s, modal: { ...s.modal, open: false } });

    const openM = (s: GameState, title: string, body: React.ReactNode, actions: ModalAction[]) => ({
      ...s, modal: { open: true, title, body, actions }, waiting: true,
    });

    const bankrupt = (s: GameState, pid: number, creditorId: number | null): GameState => {
      const p = s.players[pid];
      addLog(`${p.name} dinyatakan BANKRUPT!`, 'bad');
      const tiles = s.tiles.map(t => t.owner === pid ? { ...t, owner: null, houses: 0, mortgaged: false } as TileData : t);
      let players = s.players.map(pl => {
        if (pl.id === pid) return { ...pl, bankrupt: true, properties: [], money: 0 };
        if (creditorId != null && pl.id === creditorId) return { ...pl, money: pl.money + p.money };
        return pl;
      });
      const alive = players.filter(pl => !pl.bankrupt);
      if (alive.length <= 1) {
        return { ...s, players, tiles, gameOver: true, modal: { open: true, title: 'Game Over', body: null, actions: [] } };
      }
      return { ...s, players, tiles };
    };

    const advance = (s: GameState): GameState => {
      let next = (s.turn + 1) % s.players.length;
      while (s.players[next].bankrupt) next = (next + 1) % s.players.length;
      return { ...s, turn: next, round: next === 0 ? s.round + 1 : s.round, doublesCount: 0 };
    };

    const payRent = (s: GameState, pid: number, ownerId: number, tid: number): GameState => {
      const tile = s.tiles[tid]; const p = s.players[pid]; const owner = s.players[ownerId];
      if (!tile || !owner) return s;
      let rent = 0;
      if (tile.type === 'street') {
        const hasMono = isMono(tile.group || 0, ownerId, s.tiles);
        rent = tile.rent?.[tile.houses || 0] || 0;
        if ((tile.houses || 0) === 0 && hasMono) rent *= 2;
      } else if (tile.type === 'railroad') {
        const count = owner.properties.filter(id => s.tiles[id].type === 'railroad').length;
        rent = tile.rent?.[Math.min(count, 4) - 1] || 25;
      } else if (tile.type === 'utility') {
        const count = owner.properties.filter(id => s.tiles[id].type === 'utility').length;
        const mult = count === 2 ? 10 : 4;
        rent = (Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2) * mult;
      }
      if (owner.jailed > 0) { addLog(`${owner.name} di penjara, tidak menerima sewa.`); return s; }
      addLog(`${p.name} membayar sewa $${rent} ke ${owner.name} untuk ${tile.name}`, 'bad');
      let players = s.players.map(pl => {
        if (pl.id === pid) return { ...pl, money: pl.money - rent };
        if (pl.id === ownerId) return { ...pl, money: pl.money + rent };
        return pl;
      });
      let ns = { ...s, players };
      if (ns.players[pid].money < 0) ns = bankrupt(ns, pid, ownerId);
      return ns;
    };

    const buyProp = (s: GameState, pid: number, tid: number): GameState => {
      const tile = s.tiles[tid]; const p = s.players[pid];
      if (!tile || tile.owner != null || !tile.price || p.money < tile.price) return s;
      addLog(`${p.name} membeli ${tile.name} seharga $${tile.price}`, 'money');
      const tiles = s.tiles.map(t => t.id === tid ? { ...t, owner: pid } as TileData : t);
      const players = s.players.map(pl => pl.id === pid ? { ...pl, money: pl.money - tile.price, properties: [...pl.properties, tid] } : pl);
      return { ...s, tiles, players };
    };

    const build = (s: GameState, pid: number, tid: number): GameState => {
      const t = s.tiles[tid]; const p = s.players[pid];
      if (!t || t.owner !== pid || t.mortgaged || !t.houseCost || !t.group) return s;
      if (p.money < t.houseCost) return s;
      const needed = GROUPS[t.group] || 0;
      const have = p.properties.filter(id => s.tiles[id].group === t.group && !s.tiles[id].mortgaged).length;
      if (have !== needed) return s;
      if (!canBuildEven(tid, s.tiles)) return s;
      if ((t.houses || 0) >= 5) return s;
      const nextH = (t.houses || 0) + 1;
      const isHotel = nextH === 5;
      const tiles = s.tiles.map(tile => tile.id === tid ? { ...tile, houses: nextH } as TileData : tile);
      const players = s.players.map(pl => pl.id === pid ? { ...pl, money: pl.money - t.houseCost } : pl);
      addLog(`${p.name} membangun ${isHotel ? 'HOTEL' : 'rumah'} di ${t.name}`, 'money');
      return { ...s, tiles, players };
    };

    const mortg = (s: GameState, pid: number, tid: number): GameState => {
      const t = s.tiles[tid]; const p = s.players[pid];
      if (!t || t.owner !== pid || t.mortgaged || (t.houses || 0) > 0 || !t.mortgage) return s;
      const tiles = s.tiles.map(tile => tile.id === tid ? { ...tile, mortgaged: true } as TileData : tile);
      const players = s.players.map(pl => pl.id === pid ? { ...pl, money: pl.money + t.mortgage } : pl);
      addLog(`${p.name} menggadaikan ${t.name} +$${t.mortgage}`, 'money');
      return { ...s, tiles, players };
    };

    const unmortg = (s: GameState, pid: number, tid: number): GameState => {
      const t = s.tiles[tid]; const p = s.players[pid];
      if (!t || t.owner !== pid || !t.mortgaged || !t.mortgage) return s;
      const cost = Math.ceil(t.mortgage * 1.1);
      if (p.money < cost) return s;
      const tiles = s.tiles.map(tile => tile.id === tid ? { ...tile, mortgaged: false } as TileData : tile);
      const players = s.players.map(pl => pl.id === pid ? { ...pl, money: pl.money - cost } : pl);
      addLog(`${p.name} menebus ${t.name} -$${cost}`, 'bad');
      return { ...s, tiles, players };
    };

    const execTrade = (s: GameState, pid: number, oid: number, giveIds: number[], getIds: number[], giveCash: number, getCash: number): GameState => {
      const tiles = s.tiles.map(t => {
        if (giveIds.includes(t.id)) return { ...t, owner: oid } as TileData;
        if (getIds.includes(t.id)) return { ...t, owner: pid } as TileData;
        return t;
      });
      const players = s.players.map(pl => {
        if (pl.id === pid) return { ...pl, money: pl.money - giveCash + getCash, properties: [...pl.properties.filter(id => !giveIds.includes(id)), ...getIds] };
        if (pl.id === oid) return { ...pl, money: pl.money + giveCash - getCash, properties: [...pl.properties.filter(id => !getIds.includes(id)), ...giveIds] };
        return pl;
      });
      addLog('Perdagangan berhasil!', 'money');
      return { ...s, tiles, players };
    };

    const landOnTile = (s: GameState, pid: number, tid: number, canRollAgain: boolean): GameState => {
      const tile = s.tiles[tid]; const p = s.players[pid];
      if (!tile) return s;
      if (tile.type === 'gotojail') {
        addLog(`${p.name} masuk penjara!`, 'bad');
        const players = s.players.map(pl => pl.id === pid ? { ...pl, pos: 10, jailed: 1 } : pl);
        return { ...s, players };
      }
      if (tile.type === 'jail') { addLog(`${p.name} sedang berkunjung.`); return s; }
      if (tile.type === 'parking') {
        if (cfgRef.current.freeParking === 'on' && s.freeParkingPot > 0) {
          addLog(`${p.name} mengambil Free Parking $${s.freeParkingPot}!`, 'money');
          const players = s.players.map(pl => pl.id === pid ? { ...pl, money: pl.money + s.freeParkingPot } : pl);
          return { ...s, players, freeParkingPot: 0 };
        }
        addLog('Free Parking.'); return s;
      }
      if (tile.type === 'tax') {
        let due = tile.amount || 0;
        if (tile.percent) due = Math.min(200, Math.floor(netW(s.players[pid], s.tiles) * tile.percent));
        addLog(`${p.name} membayar pajak $${due}`, 'bad');
        const players = s.players.map(pl => pl.id === pid ? { ...pl, money: pl.money - due } : pl);
        return addFree({ ...s, players }, due);
      }
      if (tile.type === 'chance') return drawCard(s, pid, 'chance', canRollAgain);
      if (tile.type === 'community') return drawCard(s, pid, 'community', canRollAgain);
      if (tile.type === 'street' || tile.type === 'railroad' || tile.type === 'utility') {
        if (tile.owner == null) {
          if (p.isBot) return botDecideBuy(s, pid, tid, canRollAgain);
          return s;
        }
        if (tile.owner !== pid && !tile.mortgaged) return payRent(s, pid, tile.owner, tid);
      }
      return s;
    };

    const drawCard = (s: GameState, pid: number, deck: 'chance' | 'community', canRollAgain: boolean): GameState => {
      const isChance = deck === 'chance';
      const cards = isChance ? s.chanceDeck : s.communityDeck;
      const card = cards[0];
      const newDeck = [...cards.slice(1), card];
      addLog(`${isChance ? 'Chance' : 'Community Chest'}: ${card.text}`, 'actor');
      let ns: GameState = { ...s, [isChance ? 'chanceDeck' : 'communityDeck']: newDeck } as GameState;
      const p = ns.players[pid];
      if (card.getOut) {
        const players = ns.players.map(pl => pl.id === pid ? { ...pl, getOutCards: pl.getOutCards + 1 } : pl);
        addLog(`${p.name} mendapat kartu bebas penjara!`, 'money');
        return { ...ns, players };
      }
      if (card.t === 'money') {
        if (card.each) {
          const players = ns.players.map(pl => {
            if (pl.id === pid) return { ...pl, money: pl.money + (card.each || 0) * (ns.players.filter(x => !x.bankrupt && x.id !== pid).length) };
            if (!pl.bankrupt && pl.id !== pid) return { ...pl, money: pl.money - (card.each || 0) };
            return pl;
          });
          return { ...ns, players };
        }
        const delta = card.amount || 0;
        const players = ns.players.map(pl => pl.id === pid ? { ...pl, money: pl.money + delta } : pl);
        return { ...ns, players };
      }
      if (card.t === 'repair') {
        let cost = 0;
        p.properties.forEach(id => {
          const t = ns.tiles[id];
          if ((t.houses || 0) >= 5) cost += card.hotel || 0;
          else cost += (t.houses || 0) * (card.house || 0);
        });
        addLog(`Biaya perbaikan $${cost}`, 'bad');
        const players = ns.players.map(pl => pl.id === pid ? { ...pl, money: pl.money - cost } : pl);
        return addFree({ ...ns, players }, cost);
      }
      if (card.t === 'move') {
        if (card.jail) {
          addLog(`${p.name} masuk penjara!`, 'bad');
          const players = ns.players.map(pl => pl.id === pid ? { ...pl, pos: 10, jailed: 1 } : pl);
          return { ...ns, players };
        }
        if (card.to != null) {
          const passed = card.to < p.pos && card.to !== 10;
          let money = 0;
          if (passed && card.collect !== false) { money = 200; addLog('Lewat GO +$200', 'money'); }
          const players = ns.players.map(pl => pl.id === pid ? { ...pl, pos: card.to, money: pl.money + money } : pl);
          ns = { ...ns, players };
          return landOnTile(ns, pid, card.to, canRollAgain);
        }
        if (card.nearest) {
          const targets = card.nearest === 'railroad' ? RAILROADS : UTILITIES;
          let nearest = targets[0];
          for (const t of targets) { if (t > p.pos) { nearest = t; break; } }
          let money = 0;
          if (nearest <= p.pos) { money = 200; addLog('Lewat GO +$200', 'money'); }
          const players = ns.players.map(pl => pl.id === pid ? { ...pl, pos: nearest, money: pl.money + money } : pl);
          ns = { ...ns, players };
          return landOnTile(ns, pid, nearest, canRollAgain);
        }
        if (card.by) {
          const pos = (p.pos + card.by + 40) % 40;
          const players = ns.players.map(pl => pl.id === pid ? { ...pl, pos } : pl);
          ns = { ...ns, players };
          return landOnTile(ns, pid, pos, canRollAgain);
        }
      }
      return ns;
    };

    const movePlayer = (s: GameState, pid: number, steps: number, canRollAgain: boolean): GameState => {
      const p = s.players[pid];
      let pos = p.pos; let passedGo = false;
      for (let i = 0; i < steps; i++) {
        pos = (pos + 1) % 40;
        if (pos === 0) passedGo = true;
      }
      let players = s.players.map(pl => pl.id === pid ? { ...pl, pos } : pl);
      if (passedGo) {
        addLog(`${s.players[pid].name} melewati GO +$200`, 'money');
        players = players.map(pl => pl.id === pid ? { ...pl, money: pl.money + 200 } : pl);
      }
      return landOnTile({ ...s, players }, pid, pos, canRollAgain);
    };

    const botDecideBuy = (s: GameState, pid: number, tid: number, canRollAgain: boolean): GameState => {
      const tile = s.tiles[tid]; const p = s.players[pid]; const diff = cfgRef.current.diff;
      if (!tile || !tile.price) return s;
      let want = false;
      if (diff === 'hard') want = shouldBuyHard(p, tile);
      else if (diff === 'medium') want = shouldBuyMedium(p, tile);
      else want = shouldBuyEasy();
      if (want && p.money >= tile.price) return buyProp(s, pid, tid);
      if (cfgRef.current.auction !== 'off') return s; // auction not auto for simplicity
      return s;
    };

    const rollDice = (s: GameState, pid: number): [GameState, [number, number]] => {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      const p = s.players[pid];
      const isDouble = d1 === d2;
      addLog(`${p.name} melempar ${d1}+${d2}${isDouble ? ' (kembar!)' : ''}`, 'actor');
      if (p.jailed > 0) {
        if (isDouble) {
          addLog(`${p.name} bebas dari penjara dengan dadu kembar!`, 'money');
          const players = s.players.map(pl => pl.id === pid ? { ...pl, jailed: 0 } : pl);
          return [movePlayer({ ...s, players }, pid, d1 + d2, false), [d1, d2]];
        }
        const jailed = p.jailed + 1;
        if (jailed >= 3) {
          addLog(`${p.name} harus bayar $50 untuk keluar.`, 'bad');
          const players = s.players.map(pl => pl.id === pid ? { ...pl, jailed: 0, money: pl.money - 50 } : pl);
          return [movePlayer({ ...s, players }, pid, d1 + d2, false), [d1, d2]];
        }
        addLog('Gagal keluar penjara.', 'bad');
        const players = s.players.map(pl => pl.id === pid ? { ...pl, jailed } : pl);
        return [{ ...s, players }, [d1, d2]];
      }
      let doublesCount = isDouble ? s.doublesCount + 1 : 0;
      if (doublesCount >= 3) {
        addLog('3x kembar! Langsung ke penjara.', 'bad');
        const players = s.players.map(pl => pl.id === pid ? { ...pl, pos: 10, jailed: 1 } : pl);
        return [{ ...s, players, doublesCount: 0 }, [d1, d2]];
      }
      return [movePlayer({ ...s, doublesCount }, pid, d1 + d2, isDouble && doublesCount < 3), [d1, d2]];
    };

    logicRef.current = {
      isMono, canBuildEven, netW, addFree, closeM, openM, bankrupt, advance,
      payRent, buyProp, build, mortg, unmortg, execTrade, landOnTile, drawCard,
      movePlayer, botDecideBuy, rollDice,
    };
  }, [addLog]);

  // Expose game actions
  const doRollDice = useCallback(() => {
    const { rollDice } = logicRef.current;
    if (!rollDice) return;
    setState(prev => {
      const [ns, dice] = rollDice(prev, prev.turn);
      return { ...ns, dice, animating: true };
    });
    setTimeout(() => setState(prev => ({ ...prev, animating: false })), 800);
  }, []);

  const doPayJail = useCallback(() => {
    setState(prev => {
      const p = prev.players[prev.turn];
      addLog(`${p.name} bayar $50 dan bebas.`);
      const players = prev.players.map(pl => pl.id === prev.turn ? { ...pl, jailed: 0, money: pl.money - 50 } : pl);
      return { ...prev, players };
    });
  }, [addLog]);

  const doUseJailCard = useCallback(() => {
    setState(prev => {
      const p = prev.players[prev.turn];
      addLog(`${p.name} pakai kartu bebas penjara.`);
      const players = prev.players.map(pl => pl.id === prev.turn ? { ...pl, jailed: 0, getOutCards: pl.getOutCards - 1 } : pl);
      return { ...prev, players };
    });
  }, [addLog]);

  const doEndTurn = useCallback(() => {
    setState(prev => {
      const { advance } = logicRef.current;
      if (!advance) return prev;
      return advance(prev);
    });
  }, []);

  const doBuy = useCallback(() => {
    const { buyProp } = logicRef.current;
    if (!buyProp) return;
    setState(prev => {
      const tid = prev.players[prev.turn].pos;
      return buyProp(prev, prev.turn, tid);
    });
  }, []);

  const doBuild = useCallback((tid: number) => {
    const { build } = logicRef.current;
    if (!build) return;
    setState(prev => build(prev, prev.turn, tid));
  }, []);

  const doMortgage = useCallback((tid: number) => {
    const { mortg } = logicRef.current;
    if (!mortg) return;
    setState(prev => mortg(prev, prev.turn, tid));
  }, []);

  const doUnmortgage = useCallback((tid: number) => {
    const { unmortg } = logicRef.current;
    if (!unmortg) return;
    setState(prev => unmortg(prev, prev.turn, tid));
  }, []);

  const doTrade = useCallback((oid: number, giveIds: number[], getIds: number[], giveCash: number, getCash: number) => {
    const { execTrade } = logicRef.current;
    if (!execTrade) return;
    setState(prev => execTrade(prev, prev.turn, oid, giveIds, getIds, giveCash, getCash));
  }, []);

  const closeModal = useCallback(() => {
    setState(prev => ({ ...prev, modal: { ...prev.modal, open: false }, waiting: false }));
  }, []);

  const openModal = useCallback((title: string, body: React.ReactNode, actions: ModalAction[]) => {
    setState(prev => ({ ...prev, modal: { open: true, title, body, actions }, waiting: true }));
  }, []);

  const resetGame = useCallback(() => {
    setState(initGameState(cfgRef.current));
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, paused: !prev.paused }));
  }, []);

  // Bot turn automation
  useEffect(() => {
    if (state.gameOver || state.paused || state.waiting || state.animating) return;
    const p = state.players[state.turn];
    if (!p || !p.isBot || p.bankrupt) return;
    const timer = setTimeout(() => {
      const { rollDice } = logicRef.current;
      if (!rollDice) return;
      setState(prev => {
        if (prev.gameOver || prev.paused || prev.waiting) return prev;
        const [ns, dice] = rollDice(prev, prev.turn);
        return { ...ns, dice };
      });
    }, speedMs(600));
    return () => clearTimeout(timer);
  }, [state.turn, state.gameOver, state.paused, state.waiting, state.animating, speedMs]);

  return {
    state, setState,
    doRollDice, doPayJail, doUseJailCard, doEndTurn,
    doBuy, doBuild, doMortgage, doUnmortgage, doTrade,
    closeModal, openModal, resetGame, togglePause,
    addLog, speedMs,
  };
}
