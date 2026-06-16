export type TileType = 'go' | 'street' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community' | 'jail' | 'gotojail' | 'parking';

export interface TileData {
  id: number;
  name: string;
  type: TileType;
  color?: string;
  group?: number;
  price?: number;
  rent?: number[];
  houseCost?: number;
  mortgage?: number;
  amount?: number;
  percent?: number;
}

export const TILES: TileData[] = [
  { id: 0, name: 'Go', type: 'go' },
  { id: 1, name: 'Mediterranean Avenue', type: 'street', color: '#8B4513', group: 1, price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30 },
  { id: 2, name: 'Community Chest', type: 'community' },
  { id: 3, name: 'Baltic Avenue', type: 'street', color: '#8B4513', group: 1, price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30 },
  { id: 4, name: 'Income Tax', type: 'tax', amount: 200, percent: 0.1 },
  { id: 5, name: 'Reading Railroad', type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 6, name: 'Oriental Avenue', type: 'street', color: '#87CEEB', group: 2, price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50 },
  { id: 7, name: 'Chance', type: 'chance' },
  { id: 8, name: 'Vermont Avenue', type: 'street', color: '#87CEEB', group: 2, price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50 },
  { id: 9, name: 'Connecticut Avenue', type: 'street', color: '#87CEEB', group: 2, price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60 },
  { id: 10, name: 'Jail / Just Visiting', type: 'jail' },
  { id: 11, name: "St. Charles Place", type: 'street', color: '#FF1493', group: 3, price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70 },
  { id: 12, name: 'Electric Company', type: 'utility', price: 150, mortgage: 75 },
  { id: 13, name: 'States Avenue', type: 'street', color: '#FF1493', group: 3, price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70 },
  { id: 14, name: 'Virginia Avenue', type: 'street', color: '#FF1493', group: 3, price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80 },
  { id: 15, name: 'Pennsylvania Railroad', type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 16, name: 'St. James Place', type: 'street', color: '#FFA500', group: 4, price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90 },
  { id: 17, name: 'Community Chest', type: 'community' },
  { id: 18, name: 'Tennessee Avenue', type: 'street', color: '#FFA500', group: 4, price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90 },
  { id: 19, name: 'New York Avenue', type: 'street', color: '#FFA500', group: 4, price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100 },
  { id: 20, name: 'Free Parking', type: 'parking' },
  { id: 21, name: 'Kentucky Avenue', type: 'street', color: '#FF0000', group: 5, price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110 },
  { id: 22, name: 'Chance', type: 'chance' },
  { id: 23, name: 'Indiana Avenue', type: 'street', color: '#FF0000', group: 5, price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110 },
  { id: 24, name: 'Illinois Avenue', type: 'street', color: '#FF0000', group: 5, price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120 },
  { id: 25, name: 'B. & O. Railroad', type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 26, name: 'Atlantic Avenue', type: 'street', color: '#FFD700', group: 6, price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130 },
  { id: 27, name: 'Ventnor Avenue', type: 'street', color: '#FFD700', group: 6, price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130 },
  { id: 28, name: 'Water Works', type: 'utility', price: 150, mortgage: 75 },
  { id: 29, name: 'Marvin Gardens', type: 'street', color: '#FFD700', group: 6, price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140 },
  { id: 30, name: 'Go to Jail', type: 'gotojail' },
  { id: 31, name: 'Pacific Avenue', type: 'street', color: '#32CD32', group: 7, price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150 },
  { id: 32, name: 'North Carolina Avenue', type: 'street', color: '#32CD32', group: 7, price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150 },
  { id: 33, name: 'Community Chest', type: 'community' },
  { id: 34, name: 'Pennsylvania Avenue', type: 'street', color: '#32CD32', group: 7, price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160 },
  { id: 35, name: 'Short Line', type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 36, name: 'Chance', type: 'chance' },
  { id: 37, name: 'Park Place', type: 'street', color: '#0000FF', group: 8, price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175 },
  { id: 38, name: 'Luxury Tax', type: 'tax', amount: 100 },
  { id: 39, name: 'Boardwalk', type: 'street', color: '#0000FF', group: 8, price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200 },
];

export const GROUPS: Record<number, number> = { 1: 2, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2 };
export const RAILROADS = [5, 15, 25, 35];
export const UTILITIES = [12, 28];
export const PLAYER_COLORS = ['#f0c040', '#40d0c0', '#e85555', '#7b7bff'];
export const BOT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

export interface Card {
  t: 'move' | 'money' | 'repair' | 'jail';
  text: string;
  to?: number;
  collect?: boolean;
  amount?: number;
  each?: number;
  house?: number;
  hotel?: number;
  getOut?: boolean;
  jail?: boolean;
  nearest?: 'railroad' | 'utility';
  by?: number;
}

export const CHANCE_CARDS: Card[] = [
  { t: 'move', text: 'Advance to Boardwalk', to: 39 },
  { t: 'move', text: 'Advance to Go', to: 0, collect: true },
  { t: 'move', text: 'Advance to Illinois Avenue', to: 24 },
  { t: 'move', text: 'Advance to St. Charles Place', to: 11 },
  { t: 'move', text: 'Advance to nearest Railroad', nearest: 'railroad' },
  { t: 'move', text: 'Advance to nearest Utility', nearest: 'utility' },
  { t: 'move', text: 'Go Back 3 Spaces', by: -3 },
  { t: 'move', text: 'Go to Jail', to: 10, jail: true },
  { t: 'money', text: 'Bank pays you dividend of $50', amount: 50 },
  { t: 'money', text: 'Pay poor tax of $15', amount: -15 },
  { t: 'money', text: 'Your building loan matures — collect $150', amount: 150 },
  { t: 'money', text: 'You have won a crossword competition — collect $100', amount: 100 },
  { t: 'money', text: 'Speeding fine $15', amount: -15 },
  { t: 'money', text: 'Pay each player $50', each: -50 },
  { t: 'repair', text: 'Make general repairs — $25 per house, $100 per hotel', house: 25, hotel: 100 },
  { t: 'jail', text: 'Get Out of Jail Free', getOut: true },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  { t: 'move', text: 'Advance to Go', to: 0, collect: true },
  { t: 'money', text: 'Bank error in your favor — collect $200', amount: 200 },
  { t: 'money', text: "Doctor's fees — pay $50", amount: -50 },
  { t: 'money', text: 'From sale of stock you get $50', amount: 50 },
  { t: 'jail', text: 'Get Out of Jail Free', getOut: true },
  { t: 'move', text: 'Go to Jail', to: 10, jail: true },
  { t: 'money', text: 'Grand Opera Night — collect $50 from every player', each: 50 },
  { t: 'money', text: 'Holiday Fund matures — receive $100', amount: 100 },
  { t: 'money', text: 'Income tax refund — collect $20', amount: 20 },
  { t: 'money', text: 'Life insurance matures — collect $100', amount: 100 },
  { t: 'money', text: 'Pay hospital fees of $100', amount: -100 },
  { t: 'money', text: 'Pay school fees of $150', amount: -150 },
  { t: 'money', text: 'Receive $25 consultancy fee', amount: 25 },
  { t: 'repair', text: 'You are assessed for street repairs — $40 per house, $115 per hotel', house: 40, hotel: 115 },
  { t: 'money', text: 'You have won second prize in a beauty contest — collect $10', amount: 10 },
  { t: 'money', text: 'You inherit $100', amount: 100 },
];

export function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface Settings {
  lang: 'id' | 'en';
  theme: 'dark' | 'light';
  diff: 'easy' | 'medium' | 'hard';
  speed: 'slow' | 'normal' | 'fast';
  sound: 'on' | 'off';
  animDice: 'on' | 'off';
  freeParking: 'on' | 'off';
  auction: 'on' | 'off';
  startMoney: number;
}

export const DEFAULTS: Settings = {
  lang: 'id',
  theme: 'dark',
  diff: 'medium',
  speed: 'normal',
  sound: 'off',
  animDice: 'on',
  freeParking: 'off',
  auction: 'on',
  startMoney: 1500,
};

export function loadSettings(): Settings {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('monop_settings') : null;
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem('monop_settings', JSON.stringify(s)); } catch { /* noop */ }
}
