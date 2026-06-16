function changeMoney(p, delta) {
  p.money += delta;
  if (p.id === 0) updatePlayerPanel();
  updateBotsPanel();
}

function canBuildEvenly(id) {
  const t = TILES[id]; const g = t.group; const groupTiles = TILES.filter(x => x.group === g);
  const min = Math.min(...groupTiles.map(x => x.owner === t.owner ? x.houses : 99));
  return t.houses === min || (t.houses === min + 1 && groupTiles.every(x => x.owner !== t.owner || x.houses >= min));
}

function botTurn() {
  const p = players[turn];
  if (p.jailed > 0) {
    if (p.getOutCards > 0) { useJailCard(); return; }
    if (shouldPayJail(p)) { payJail(50); return; }
    rollDice(); return;
  }
  setTimeout(() => rollDice(), speedMs(400));
}

function botDecideBuy(tile, canRollAgain) {
  const p = players[turn];
  const diff = CFG.diff;
  let want = false;
  if (diff === 'easy') { want = Math.random() < 0.55 && p.money > tile.price + 150; }
  else if (diff === 'medium') { want = shouldBuyMedium(p, tile); }
  else { want = shouldBuyHard(p, tile); }

  if (want && p.money >= tile.price) { buyProperty(tile); }
  else if (CFG.auction !== 'off') {
    if (diff === 'hard') { setTimeout(() => { auctionState.bids[turn].bid = Math.min(p.money, Math.floor(tile.price * 1.2 + Math.random()*80)); log(`${p.name} menawar $${auctionState.bids[turn].bid}`); nextAuctionBid(); }, speedMs(350)); }
    else if (diff === 'medium') { setTimeout(() => { auctionState.bids[turn].bid = Math.min(p.money, Math.floor(tile.price * 0.9 + Math.random()*60)); if (auctionState.bids[turn].bid < tile.price * 0.6) auctionState.bids[turn].bid = -1; log(`${p.name} ${auctionState.bids[turn].bid>0?'menawar $'+auctionState.bids[turn].bid:'mundur'}`); nextAuctionBid(); }, speedMs(350)); }
    else { setTimeout(() => { auctionState.bids[turn].bid = Math.random() < 0.4 ? Math.min(p.money, Math.floor(tile.price * 0.75)) : -1; log(`${p.name} ${auctionState.bids[turn].bid>0?'menawar $'+auctionState.bids[turn].bid:'mundur'}`); nextAuctionBid(); }, speedMs(350)); }
  } else { endTurn(); }
}

function shouldBuyMedium(p, tile) {
  if (p.money < tile.price + 100) return false;
  if (tile.type === 'street') { const g = tile.group; const needed = GROUPS[g]; const have = p.properties.filter(id => TILES[id].group === g).length; return have >= needed - 1 || tile.price <= 200; }
  if (tile.type === 'railroad') return true;
  if (tile.type === 'utility') return p.money > tile.price + 300;
  return false;
}

function shouldBuyHard(p, tile) {
  if (p.money < tile.price + 80) return false;
  if (tile.type === 'railroad') return true;
  if (tile.type === 'utility') return p.money > tile.price + 250;
  if (tile.type === 'street') {
    const hotGroups = [3,4,5,6]; // pink, orange, red, yellow
    const have = p.properties.filter(id => TILES[id].group === tile.group).length;
    if (hotGroups.includes(tile.group) && have >= 1) return true;
    if (have >= 1) return true;
    if (tile.price <= 180) return true;
    return p.money > tile.price + 300;
  }
  return true;
}

function shouldPayJail(p) {
  if (CFG.diff === 'hard') {
    const developed = p.properties.some(id => TILES[id].houses > 0);
    if (round > 20 && developed) return true;
    if (p.money > 300) return true;
  }
  if (CFG.diff === 'medium') return p.money > 400 || p.jailed >= 2;
  return Math.random() < 0.3;
}

function botAuctionBid() {
  const p = players[turn];
  const diff = CFG.diff;
  const { tile, bids } = auctionState;
  const highest = Math.max(...bids.map(x=>x.bid));
  let my = -1;
  if (diff === 'hard') { const maxVal = Math.min(p.money, tile.price * 1.35); if (maxVal > highest + 10) my = Math.floor(maxVal); }
  else if (diff === 'medium') { const maxVal = Math.min(p.money, tile.price * 1.05); if (maxVal > highest + 10 && Math.random() < 0.75) my = Math.floor(maxVal - Math.random()*30); }
  else { if (Math.random() < 0.45) my = Math.min(p.money, Math.floor(tile.price * 0.8)); }
  auctionState.bids[turn].bid = my;
  log(`${p.name} ${my>0?'menawar $'+my:'mundur'}`);
  setTimeout(() => nextAuctionBid(), speedMs(250));
}

// AI post-turn actions: build, mortgage, trade
function botPostTurn() {
  const p = players[turn];
  if (p.bankrupt) return;
  // build
  const groups = {};
  p.properties.forEach(id => { const t=TILES[id]; if (!t.mortgaged && t.group) { groups[t.group] = (groups[t.group]||0)+1; } });
  Object.entries(groups).forEach(([g,c]) => {
    if (c === GROUPS[g]) {
      const ids = p.properties.filter(id => TILES[id].group == g && !TILES[id].mortgaged).sort((a,b)=>TILES[a].houses-TILES[b].houses);
      if (CFG.diff === 'hard') {
        ids.forEach(id => { if (p.money > TILES[id].houseCost + 100 && TILES[id].houses < 5 && canBuildEvenly(id)) { buildHouse(id); } });
      } else if (CFG.diff === 'medium') {
        if (ids.length && p.money > TILES[ids[0]].houseCost + 150 && TILES[ids[0]].houses < 5 && canBuildEvenly(ids[0])) buildHouse(ids[0]);
      } else {
        if (ids.length && Math.random() < 0.25 && p.money > TILES[ids[0]].houseCost + 200 && TILES[ids[0]].houses < 5 && canBuildEvenly(ids[0])) buildHouse(ids[0]);
      }
    }
  });
  // mortgage if low cash
  if (p.money < 150) {
    const candidates = p.properties.filter(id => !TILES[id].mortgaged && TILES[id].houses === 0).sort((a,b)=>TILES[b].mortgage - TILES[a].mortgage);
    if (candidates.length) { mortgageProperty(candidates[0]); }
  }
}

function canBuildEvenly(id) {
  const t = TILES[id]; const g = t.group; const groupTiles = TILES.filter(x => x.group === g);
  const min = Math.min(...groupTiles.map(x => x.owner === t.owner ? x.houses : 99));
  return t.houses === min || (t.houses === min + 1 && groupTiles.every(x => x.owner !== t.owner || x.houses >= min));
}

function buildHouse(id) {
  const p = players[turn]; const t = TILES[id];
  if (!t || t.owner !== p.id || t.mortgaged) return;
  const needed = GROUPS[t.group] || 0;
  const have = p.properties.filter(x => TILES[x].group === t.group && !TILES[x].mortgaged).length;
  if (have !== needed) return;
  if (!canBuildEvenly(id)) return;
  if (p.money < t.houseCost) return;
  if (t.houses >= 5) return;
  changeMoney(p, -t.houseCost);
  if (t.houses === 4) { t.houses = 5; log(`${p.name} membangun HOTEL di ${t.name}!`); }
  else { t.houses++; log(`${p.name} membangun rumah di ${t.name} ($${t.houseCost})`); }
  updateTiles(); updatePlayerPanel(); updateBotsPanel();
}

function mortgageProperty(id) {
  const p = players[turn]; const t = TILES[id];
  if (!t || t.owner !== p.id || t.mortgaged || t.houses > 0) return;
  changeMoney(p, t.mortgage); t.mortgaged = true;
  log(`${p.name} menggadaikan ${t.name} +$${t.mortgage}`); updateTiles(); updatePlayerPanel(); updateBotsPanel();
}

function unmortgageProperty(id) {
  const p = players[turn]; const t = TILES[id];
  if (!t || t.owner !== p.id || !t.mortgaged) return;
  const cost = Math.ceil(t.mortgage * 1.1);
  if (p.money < cost) return;
  changeMoney(p, -cost); t.mortgaged = false;
  log(`${p.name} menebus ${t.name} -$${cost}`); updateTiles(); updatePlayerPanel(); updateBotsPanel();
}
