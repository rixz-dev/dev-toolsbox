import { TileData, Settings, CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffle, GROUPS, RAILROADS, UTILITIES } from './data';

export function shouldBuyHard(p: { money: number; properties: number[] }, tile: TileData): boolean {
  if (p.money < (tile.price || 0) + 80) return false;
  if (tile.type === 'railroad') return true;
  if (tile.type === 'utility') return p.money > (tile.price || 0) + 250;
  if (tile.type === 'street' && tile.group != null) {
    const hot = [3, 4, 5, 6];
    if (hot.includes(tile.group) && p.properties.some(id => id === tile.group)) return true;
    if (tile.price != null && tile.price <= 180) return true;
    return p.money > (tile.price || 0) + 300;
  }
  return true;
}

export function shouldBuyMedium(p: { money: number; properties: number[] }, tile: TileData): boolean {
  if (p.money < (tile.price || 0) + 100) return false;
  if (tile.type === 'railroad') return true;
  if (tile.type === 'utility') return p.money > (tile.price || 0) + 300;
  if (tile.type === 'street' && tile.group != null) {
    const have = p.properties.filter(id => id === tile.group).length;
    return have >= (GROUPS[tile.group] || 0) - 1 || (tile.price || 0) <= 200;
  }
  return false;
}

export function shouldBuyEasy(): boolean {
  return Math.random() < 0.55;
}

export function botAuctionBid(
  diff: Settings['diff'],
  p: { money: number; properties: number[] },
  tile: TileData,
  highest: number
): number {
  const price = tile.price || 0;
  if (diff === 'hard') {
    const max = Math.min(p.money, price * 1.35);
    if (max > highest + 10) return Math.floor(max);
  }
  if (diff === 'medium') {
    const max = Math.min(p.money, price * 1.05);
    if (max > highest + 10 && Math.random() < 0.75) return Math.floor(max - Math.random() * 30);
  }
  if (diff === 'easy') {
    if (Math.random() < 0.45) return Math.min(p.money, Math.floor(price * 0.8));
  }
  return -1;
}

export function shouldPayJail(diff: Settings['diff'], round: number, p: { money: number; properties: { houses: number }[] }): boolean {
  if (diff === 'hard') {
    const developed = p.properties.some((prop: any) => prop.houses > 0);
    if (round > 20 && developed) return true;
    if (p.money > 300) return true;
  }
  if (diff === 'medium') return p.money > 400 || false;
  return Math.random() < 0.3;
}

export function botAcceptTrade(
  diff: Settings['diff'],
  bot: { properties: { price: number; houses: number; houseCost?: number }[] },
  give: { price: number; houses: number; houseCost?: number }[],
  get: { price: number; houses: number; houseCost?: number }[],
  giveCash: number,
  getCash: number,
  givesMono: boolean
): boolean {
  const valGive = give.reduce((s, t) => s + t.price + (t.houses ? t.houses * (t.houseCost || 0) : 0), 0) + giveCash;
  const valGet = get.reduce((s, t) => s + t.price + (t.houses ? t.houses * (t.houseCost || 0) : 0), 0) + getCash;
  if (diff === 'easy') return Math.random() < 0.6;
  if (diff === 'medium') return valGet >= valGive * 0.85;
  return valGet > valGive || (valGet >= valGive * 0.9 && givesMono);
}

export { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffle, GROUPS, RAILROADS, UTILITIES };
