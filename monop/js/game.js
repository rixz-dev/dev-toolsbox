let players = [];
let turn = 0;
let round = 1;
let doublesCount = 0;
let gameOver = false;
let freeParkingPot = 0;
let auctionState = null;
let tradeState = null;
let waiting = false;
let pendingAction = null;

const PLAYER_COLORS = ['#f0c040','#40d0c0','#e85555','#7b7bff'];
const BOT_NAMES = ['Alpha','Beta','Gamma','Delta'];

function initGame() {
  loadSettings();
  applyI18n();
  buildBoard();
  const botCount = 2 + (CFG.diff === 'hard' ? 1 : 0);
  players = [{
    id:0, name:t('player'), isBot:false, money: CFG.startMoney, pos:0, jailed:0, getOutCards:0, properties:[], bankrupt:false
  }];
  for (let i=1;i<=botCount;i++) {
    players.push({ id:i, name:BOT_NAMES[i-1], isBot:true, money: CFG.startMoney, pos:0, jailed:0, getOutCards:0, properties:[], bankrupt:false });
  }
  chanceDeck = shuffle([...CHANCE_CARDS]);
  communityDeck = shuffle([...COMMUNITY_CHEST_CARDS]);
  TILES.forEach(t => { t.owner = null; t.houses = 0; t.mortgaged = false; });
  turn = 0; round = 1; doublesCount = 0; gameOver = false; freeParkingPot = 0;
  updatePlayerPanel(); updateBotsPanel(); updateFreeParking(); updateTurnBadge();
  players.forEach((p,i)=>placeToken(i,0));
  log('Game dimulai. '+players.length+' pemain.','actor');
  startTurn();
}

function startTurn() {
  if (gameOver) return;
  while (players[turn].bankrupt) { nextTurn(); }
  const p = players[turn];
  updateTurnBadge(); updateTiles(); updatePlayerPanel(); updateBotsPanel(); updateFreeParking();
  if (p.isBot) { setTimeout(()=>botTurn(), speedMs(600)); }
  else { humanTurn(); }
}

function speedMs(base) { return CFG.speed==='fast'? base*0.5 : CFG.speed==='slow'? base*1.5 : base; }

function humanTurn() {
  const p = players[turn];
  if (p.jailed > 0) {
    showActions([
      { label: t('pay50') + ' ($50)', fn: () => payJail(50) },
      ...(p.getOutCards > 0 ? [{ label: t('useCard'), fn: () => useJailCard() }] : []),
      { label: t('tryDouble'), fn: () => rollJailDice() },
    ]);
  } else {
    showActions([{ label: t('roll'), fn: () => rollDice() }]);
  }
}

function rollDice() {
  if (waiting) return;
  const d1 = 1+Math.floor(Math.random()*6);
  const d2 = 1+Math.floor(Math.random()*6);
  animateDice(d1,d2,()=>onRoll(d1,d2));
}

function onRoll(d1,d2) {
  if (gameOver) return;
  const p = players[turn];
  const isDouble = d1 === d2;
  log(`${p.name} melempar ${d1}+${d2}${isDouble?' (kembar)':''}`, 'actor');
  if (p.jailed > 0) {
    if (isDouble) { log(`${p.name} bebas dari penjara dengan dadu kembar!`, 'success'); p.jailed = 0; movePlayer(d1+d2); }
    else { p.jailed++; if (p.jailed >= 3) { log(`${p.name} harus bayar $50 untuk keluar.`,'bad'); changeMoney(p, -50); p.jailed = 0; movePlayer(d1+d2); } else { log('Gagal keluar penjara.','bad'); endTurn(); } }
    return;
  }
  if (isDouble) doublesCount++; else doublesCount = 0;
  if (doublesCount === 3) { log('3x kembar! Langsung ke penjara.', 'bad'); goToJail(); doublesCount = 0; endTurn(); return; }
  movePlayer(d1+d2, isDouble);
}

function movePlayer(steps, canRollAgain=false) {
  const p = players[turn];
  const old = p.pos;
  let passedGo = false;
  for (let i=1;i<=steps;i++) {
    p.pos = (p.pos + 1) % 40;
    if (p.pos === 0) passedGo = true;
  }
  if (passedGo) { changeMoney(p, 200); log(`${p.name} melewati GO +$200`, 'money'); }
  placeToken(turn, p.pos);
  landOnTile(p.pos, canRollAgain);
}

function landOnTile(tid, canRollAgain) {
  const tile = TILES[tid];
  const p = players[turn];
  if (tile.type === 'gotojail') { goToJail(); endTurn(); return; }
  if (tile.type === 'jail') { log(`${p.name} sedang berkunjung.`,'info'); endTurn(); return; }
  if (tile.type === 'parking') {
    if (CFG.freeParking === 'on' && freeParkingPot > 0) { log(`${p.name} mengambil Free Parking $${freeParkingPot}!`, 'money'); changeMoney(p, freeParkingPot); freeParkingPot = 0; updateFreeParking(); }
    else { log('Free Parking.','info'); } endTurn(); return;
  }
  if (tile.type === 'tax') {
    let due = tile.amount || 0;
    if (tile.percent) { due = Math.min(200, Math.floor(netWorth(p)*tile.percent)); }
    log(`${p.name} membayar pajak $${due}`, 'bad'); changeMoney(p, -due); addFreeParking(due); endTurn(); return;
  }
  if (tile.type === 'chance') { drawChance(canRollAgain); return; }
  if (tile.type === 'community') { drawCommunity(canRollAgain); return; }
  if (tile.type === 'street' || tile.type === 'railroad' || tile.type === 'utility') {
    if (tile.owner == null) { offerBuy(tile, canRollAgain); }
    else if (tile.owner !== p.id && !tile.mortgaged) { payRent(tile, canRollAgain); }
    else { endTurn(); }
  }
}

function offerBuy(tile, canRollAgain) {
  const p = players[turn];
  if (p.isBot) { botDecideBuy(tile, canRollAgain); return; }
  if (p.money < tile.price) { log('Uang tidak cukup untuk membeli.','bad'); if (CFG.auction !== 'off') startAuction(tile, canRollAgain); else endTurn(); return; }
  const body = document.createElement('div');
  body.innerHTML = `<div class="card-preview"><div class="card-bar" style="background:${tile.color||'var(--muted)'};width:12px;height:60px;border-radius:4px;"></div><div><div style="font-weight:700">${tile.name}</div><div style="color:var(--muted);font-size:12px">$${tile.price}</div><div style="margin-top:4px;font-size:12px">${tile.type==='street'?'Rent: $'+tile.rent[0]+' | Houses: $'+tile.houseCost:'Rent depends on dice'}</div></div></div>`;
  showModal(tile.name, body, [
    { label: t('buy')+' ($'+tile.price+')', fn: () => { buyProperty(tile); endTurn(); } },
    ...(CFG.auction !== 'off' ? [{ label: t('auction'), style:'secondary', fn: () => { startAuction(tile, canRollAgain); } }] : []),
    { label: t('pass'), style:'secondary', fn: () => { if (CFG.auction !== 'off') startAuction(tile, canRollAgain); else endTurn(); } }
  ]);
}

function buyProperty(tile) {
  const p = players[turn];
  if (tile.owner != null) return;
  if (p.money < tile.price) return;
  changeMoney(p, -tile.price);
  tile.owner = p.id; p.properties.push(tile.id);
  log(`${p.name} membeli ${tile.name} seharga $${tile.price}`, 'money');
  updateTiles(); updatePlayerPanel(); updateBotsPanel();
}

function startAuction(tile, canRollAgain) {
  if (CFG.auction === 'off') { endTurn(); return; }
  auctionState = { tile, canRollAgain, bids: players.map((pl,i)=>({i,bid:0})), round:0, current:0 };
  log(`Lelang dimulai untuk ${tile.name}.`);
  runAuctionRound();
}

function runAuctionRound() {
  if (!auctionState) return;
  const { tile, bids, current } = auctionState;
  const active = bids.filter(b => !players[b.i].bankrupt);
  if (active.length <= 1 && auctionState.round > 0) { finishAuction(); return; }
  const b = bids[current];
  if (players[b.i].bankrupt) { nextAuctionBid(); return; }
  if (players[b.i].isBot) { botAuctionBid(); }
  else { humanAuctionBid(); }
}

function humanAuctionBid() {
  const { tile, bids, current } = auctionState;
  const b = bids[current];
  const highest = Math.max(...bids.map(x=>x.bid));
  const min = highest > 0 ? highest + 10 : (tile.price > 0 ? Math.floor(tile.price * 0.6) : 10);
  const body = document.createElement('div');
  body.innerHTML = `<div style="margin-bottom:8px">Tawaran minimum: $${min}</div><div class="bid-row"><input type="range" id="bid-range" min="${min}" max="${players[0].money}" value="${min}"><div class="bid-val" id="bid-val">$${min}</div></div>`;
  const range = body.querySelector('#bid-range');
  const val = body.querySelector('#bid-val');
  range.addEventListener('input', () => val.textContent = '$'+range.value);
  showModal('Lelang: '+tile.name, body, [
    { label: 'BID', fn: () => { b.bid = parseInt(range.value); log(`${players[0].name} menawar $${b.bid}`); nextAuctionBid(); } },
    { label: 'MUNDUR', style:'danger', fn: () => { b.bid = -1; log(`${players[0].name} mundur dari lelang.`); nextAuctionBid(); } }
  ]);
}

function nextAuctionBid() {
  auctionState.current = (auctionState.current + 1) % players.length;
  if (auctionState.current === 0) auctionState.round++;
  const alive = auctionState.bids.filter(b => b.bid !== -1 && !players[b.i].bankrupt);
  if (alive.length <= 1 && auctionState.round > 1) { finishAuction(); return; }
  runAuctionRound();
}

function finishAuction() {
  const { tile, bids } = auctionState;
  const valid = bids.filter(b => b.bid > 0 && !players[b.i].bankrupt).sort((a,b)=>b.bid-a.bid);
  if (valid.length > 0) {
    const winner = valid[0];
    const p = players[winner.i];
    changeMoney(p, -winner.bid);
    tile.owner = p.id; p.properties.push(tile.id);
    log(`${p.name} memenangkan lelang ${tile.name} dengan $${winner.bid}`, 'money');
  } else { log(`Tidak ada yang menawar ${tile.name}.`); }
  auctionState = null;
  updateTiles(); updatePlayerPanel(); updateBotsPanel(); endTurn();
}

function payRent(tile, canRollAgain) {
  const p = players[turn];
  const owner = players[tile.owner];
  let rent = 0;
  if (tile.type === 'street') {
    const hasMono = isMonopoly(tile.group, tile.owner);
    rent = tile.rent[tile.houses || 0] || 0;
    if (tile.houses === 0 && hasMono) rent *= 2;
  } else if (tile.type === 'railroad') {
    const count = owner.properties.filter(id => TILES[id].type === 'railroad').length;
    rent = tile.rent[Math.min(count,4)-1] || 25;
  } else if (tile.type === 'utility') {
    const count = owner.properties.filter(id => TILES[id].type === 'utility').length;
    const mult = count === 2 ? 10 : 4;
    rent = (Math.floor(Math.random()*6)+Math.floor(Math.random()*6)+2) * mult;
  }
  if (owner.jailed > 0) { log(`${owner.name} di penjara, tidak menerima sewa.`); endTurn(); return; }
  log(`${p.name} membayar sewa $${rent} ke ${owner.name} untuk ${tile.name}`, 'bad');
  changeMoney(p, -rent); changeMoney(owner, rent);
  if (p.money < 0) handleBankruptcy(p, owner);
  else endTurn();
}

function isMonopoly(group, ownerId) {
  const needed = GROUPS[group] || 0;
  const have = TILES.filter(t => t.group === group && t.owner === ownerId).length;
  return have === needed;
}

function netWorth(p) {
  let w = p.money;
  p.properties.forEach(id => { const t=TILES[id]; if (!t.mortgaged) w += t.price; w += (t.houses||0)*(t.houseCost||0); });
  return w;
}

function addFreeParking(amt) {
  if (CFG.freeParking === 'on') { freeParkingPot += amt; updateFreeParking(); }
}

function payJail(amount) {
  const p = players[turn]; changeMoney(p, -amount); p.jailed = 0; log(`${p.name} bayar $${amount} dan bebas.`); startTurn();
}
function useJailCard() {
  const p = players[turn]; p.getOutCards--; p.jailed = 0; log(`${p.name} pakai kartu bebas penjara.`); startTurn();
}
function rollJailDice() { rollDice(); }

function drawChance(canRollAgain) {
  const card = drawCard(chanceDeck, 'chance');
  log(`Chance: ${card.text}`, 'actor');
  handleCard(card, canRollAgain);
}
function drawCommunity(canRollAgain) {
  const card = drawCard(communityDeck, 'community');
  log(`Community Chest: ${card.text}`, 'actor');
  handleCard(card, canRollAgain);
}
function handleCard(card, canRollAgain) {
  const p = players[turn];
  if (card.getOut) { p.getOutCards++; log(`${p.name} mendapat kartu bebas penjara!`, 'money'); endTurn(); return; }
  if (card.t === 'money') {
    if (card.each) { players.forEach(pl => { if (pl.id !== p.id && !pl.bankrupt) { changeMoney(p, card.each); changeMoney(pl, -card.each); } }); }
    else { changeMoney(p, card.amount); }
    endTurn(); return;
  }
  if (card.t === 'repair') {
    let cost = 0;
    p.properties.forEach(id => { const t=TILES[id]; if (t.houses >= 5) cost += card.hotel; else cost += (t.houses||0)*card.house; });
    changeMoney(p, -cost); addFreeParking(cost); log(`Biaya perbaikan $${cost}`, 'bad'); endTurn(); return;
  }
  if (card.t === 'move') {
    if (card.jail) { goToJail(); endTurn(); return; }
    if (card.to != null) {
      const passed = card.to < p.pos && card.to !== 10;
      if (passed && card.collect !== false) { changeMoney(p,200); log('Lewat GO +$200','money'); }
      p.pos = card.to; placeToken(turn, p.pos); landOnTile(p.pos, canRollAgain); return;
    }
    if (card.nearest) {
      const targets = card.nearest === 'railroad' ? RAILROADS : UTILITIES;
      let nearest = targets[0];
      for (let t of targets) { if (t > p.pos) { nearest = t; break; } }
      if (nearest <= p.pos) { changeMoney(p,200); log('Lewat GO +$200','money'); }
      p.pos = nearest; placeToken(turn, p.pos); landOnTile(p.pos, canRollAgain); return;
    }
    if (card.by) { p.pos = (p.pos + card.by + 40) % 40; placeToken(turn, p.pos); landOnTile(p.pos, canRollAgain); return; }
  }
  endTurn();
}

function endTurn() {
  if (gameOver) return;
  checkBankruptcy(players[turn]);
  if (!canRollAgain()) doublesCount = 0;
  if (canRollAgain() && !players[turn].bankrupt && !players[turn].isBot) {
    showActions([{ label: t('roll')+' (Kembar!)', fn: () => rollDice() }]);
    return;
  }
  doublesCount = 0;
  if (players[turn].isBot) { botPostTurn(); setTimeout(() => nextTurn(), speedMs(300)); }
  else { humanPostTurn(); }
}

function humanPostTurn() {
  const p = players[turn];
  const canBuild = p.properties.some(id => TILES[id].group && isMonopoly(TILES[id].group, p.id) && !TILES[id].mortgaged && TILES[id].houses < 5 && canBuildEvenly(id) && p.money >= TILES[id].houseCost);
  const canMort = p.properties.some(id => !TILES[id].mortgaged && TILES[id].houses === 0);
  const canUnmort = p.properties.some(id => TILES[id].mortgaged);
  const acts = [];
  if (canBuild) acts.push({ label: t('build'), fn: openBuild });
  if (canMort) acts.push({ label: t('mortgage'), style:'secondary', fn: openMortgage });
  if (canUnmort) acts.push({ label: t('unmortgage'), style:'secondary', fn: openUnmortgage });
  acts.push({ label: t('trade'), style:'secondary', fn: openTrade });
  acts.push({ label: t('endTurn'), fn: () => { clearActions(); nextTurn(); } });
  showActions(acts);
}

function canRollAgain() {
  const p = players[turn]; return doublesCount > 0 && doublesCount < 3 && p.jailed === 0;
}

function nextTurn() {
  turn = (turn + 1) % players.length;
  if (turn === 0) round++;
  startTurn();
}

function checkBankruptcy(p) {
  if (p.money >= 0) return false;
  const assets = p.properties.reduce((s,id)=>s+TILES[id].mortgage,0);
  if (p.money + assets >= 0) { log(`${p.name} kehabisan uang tapi masih punya aset.`,'bad'); return false; }
  handleBankruptcy(p, null);
  return true;
}

function handleBankruptcy(p, creditor) {
  log(`${p.name} dinyatakan BANKRUPT!`, 'bad');
  p.bankrupt = true;
  p.properties.forEach(id => {
    const t = TILES[id]; t.owner = null; t.houses = 0; t.mortgaged = false;
  });
  p.properties = [];
  if (creditor) { changeMoney(creditor, p.money); }
  updateTiles(); updatePlayerPanel(); updateBotsPanel();
  const alive = players.filter(pl => !pl.bankrupt);
  if (alive.length <= 1) { endGame(alive[0]); }
}

function endGame(winner) {
  gameOver = true;
  showModal('Game Over', `<div style="text-align:center;font-family:var(--pixel);font-size:18px;color:var(--accent1)">${winner ? winner.name : '???'} MENANG!</div>`, [
    { label: t('playAgain'), fn: () => { closeModal(); initGame(); } },
    { label: t('quit'), style:'secondary', fn: () => window.location='index.html' }
  ]);
}

// Pause
let paused = false;
document.getElementById('btn-pause').addEventListener('click', () => {
  paused = !paused;
  if (paused) showModal(t('paused'), '<div>Permainan dijeda.</div>', [{label:t('resume'),fn:()=>{paused=false;closeModal();}},{label:t('quit'),style:'danger',fn:()=>window.location='index.html'}]);
});

function goToJail() { const p=players[turn]; p.pos=10; p.jailed=1; placeToken(turn,10); log(`${p.name} masuk penjara!`,'bad'); }

function openBuild() {
  const p = players[turn];
  const candidates = p.properties.filter(id => {
    const t=TILES[id]; return t.group && isMonopoly(t.group, p.id) && !t.mortgaged && t.houses < 5 && canBuildEvenly(id) && p.money >= t.houseCost;
  }).sort((a,b) => TILES[a].group - TILES[b].group);
  const body = document.createElement('div');
  candidates.forEach(id => {
    const t=TILES[id];
    const row = document.createElement('div');
    row.className='trade-item';
    row.innerHTML = `<div class="card-bar" style="background:${t.color};width:10px;height:24px;border-radius:3px;"></div><div style="flex:1"><div style="font-weight:600">${t.name}</div><div style="font-size:11px;color:var(--muted)">${t.houses} houses · $${t.houseCost} to build</div></div>`;
    row.onclick = () => { buildHouse(id); closeModal(); humanPostTurn(); };
    body.appendChild(row);
  });
  showModal(t('build'), body, [{label:t('cancel'),style:'secondary',fn:closeModal}]);
}
function openMortgage() {
  const p = players[turn];
  const candidates = p.properties.filter(id => !TILES[id].mortgaged && TILES[id].houses === 0).sort((a,b)=>TILES[b].mortgage - TILES[a].mortgage);
  const body = document.createElement('div');
  candidates.forEach(id => {
    const t=TILES[id];
    const row = document.createElement('div'); row.className='trade-item';
    row.innerHTML = `<div class="card-bar" style="background:${t.color||'var(--muted)'};width:10px;height:24px;border-radius:3px;"></div><div style="flex:1"><div style="font-weight:600">${t.name}</div><div style="font-size:11px;color:var(--muted)">Mortgage value: $${t.mortgage}</div></div>`;
    row.onclick = () => { mortgageProperty(id); closeModal(); humanPostTurn(); };
    body.appendChild(row);
  });
  showModal(t('mortgage'), body, [{label:t('cancel'),style:'secondary',fn:closeModal}]);
}
function openUnmortgage() {
  const p = players[turn];
  const candidates = p.properties.filter(id => TILES[id].mortgaged).sort((a,b)=>TILES[a].mortgage - TILES[b].mortgage);
  const body = document.createElement('div');
  candidates.forEach(id => {
    const t=TILES[id];
    const cost = Math.ceil(t.mortgage * 1.1);
    const row = document.createElement('div'); row.className='trade-item';
    row.innerHTML = `<div class="card-bar" style="background:${t.color||'var(--muted)'};width:10px;height:24px;border-radius:3px;"></div><div style="flex:1"><div style="font-weight:600">${t.name}</div><div style="font-size:11px;color:var(--muted)">Cost: $${cost}</div></div>`;
    row.onclick = () => { unmortgageProperty(id); closeModal(); humanPostTurn(); };
    body.appendChild(row);
  });
  showModal(t('unmortgage'), body, [{label:t('cancel'),style:'secondary',fn:closeModal}]);
}
function openTrade() {
  const p = players[turn];
  const others = players.filter(pl => !pl.bankrupt && pl.id !== p.id);
  const body = document.createElement('div');
  const select = document.createElement('select');
  select.style='background:var(--bg);color:var(--text);border:1px solid var(--border);padding:6px;border-radius:6px;width:100%;margin-bottom:10px;';
  others.forEach(pl => { const o=document.createElement('option'); o.value=pl.id; o.textContent=pl.name; select.appendChild(o); });
  body.appendChild(select);
  const grid = document.createElement('div'); grid.className='trade-grid';
  const left = document.createElement('div'); left.className='trade-list'; left.id='trade-left';
  const right = document.createElement('div'); right.className='trade-list'; right.id='trade-right';
  const mid = document.createElement('div'); mid.className='trade-mid';
  const cashIn = document.createElement('input'); cashIn.type='number'; cashIn.value=0; cashIn.min=0; cashIn.max=p.money;
  const cashOut = document.createElement('input'); cashOut.type='number'; cashOut.value=0; cashOut.min=0;
  mid.innerHTML = '<div style="font-size:10px;color:var(--muted)">You give</div>'; mid.appendChild(cashIn);
  mid.innerHTML += '<div style="font-size:18px">⇄</div><div style="font-size:10px;color:var(--muted)">You receive</div>'; mid.appendChild(cashOut);
  grid.appendChild(left); grid.appendChild(mid); grid.appendChild(right);
  body.appendChild(grid);

  function refreshLists() {
    const oid = parseInt(select.value);
    const o = players[oid];
    left.innerHTML = '';
    p.properties.forEach(id => {
      const t=TILES[id];
      const it = document.createElement('div'); it.className='trade-item'; it.dataset.id=id; it.dataset.side='left';
      it.innerHTML = `<div class="card-bar" style="background:${t.color||'var(--muted)'};width:8px;height:20px;border-radius:2px;"></div><div style="font-size:11px">${t.name}</div>`;
      it.onclick = () => it.classList.toggle('selected');
      left.appendChild(it);
    });
    right.innerHTML = '';
    o.properties.forEach(id => {
      const t=TILES[id];
      const it = document.createElement('div'); it.className='trade-item'; it.dataset.id=id; it.dataset.side='right';
      it.innerHTML = `<div class="card-bar" style="background:${t.color||'var(--muted)'};width:8px;height:20px;border-radius:2px;"></div><div style="font-size:11px">${t.name}</div>`;
      it.onclick = () => it.classList.toggle('selected');
      right.appendChild(it);
    });
  }
  select.addEventListener('change', refreshLists);
  refreshLists();
  showModal(t('trade'), body, [
    { label: t('confirm'), fn: () => {
      const oid = parseInt(select.value);
      const o = players[oid];
      const give = Array.from(left.querySelectorAll('.selected')).map(el => parseInt(el.dataset.id));
      const get = Array.from(right.querySelectorAll('.selected')).map(el => parseInt(el.dataset.id));
      const giveCash = parseInt(cashIn.value) || 0;
      const getCash = parseInt(cashOut.value) || 0;
      if (giveCash > p.money) { log('Uang tidak cukup untuk trade.','bad'); return; }
      if (getCash > o.money) { log('Lawan tidak punya uang cukup.','bad'); return; }
      // simple accept if not bot, else bot logic
      if (o.isBot) { if (!botAcceptTrade(o, p, give, get, giveCash, getCash)) { log(`${o.name} menolak tawaran.`,'bad'); closeModal(); return; } }
      give.forEach(id => { TILES[id].owner = oid; p.properties.splice(p.properties.indexOf(id),1); o.properties.push(id); });
      get.forEach(id => { TILES[id].owner = p.id; o.properties.splice(o.properties.indexOf(id),1); p.properties.push(id); });
      changeMoney(p, getCash - giveCash); changeMoney(o, giveCash - getCash);
      log('Trade berhasil!','money'); updateTiles(); updatePlayerPanel(); updateBotsPanel(); closeModal(); humanPostTurn();
    } },
    { label: t('cancel'), style:'secondary', fn: closeModal }
  ]);
}
function botAcceptTrade(bot, human, give, get, giveCash, getCash) {
  const diff = CFG.diff;
  const valueGive = give.reduce((s,id) => s + TILES[id].price + (TILES[id].houses?TILES[id].houses*TILES[id].houseCost:0), 0) + giveCash;
  const valueGet = get.reduce((s,id) => s + TILES[id].price + (TILES[id].houses?TILES[id].houses*TILES[id].houseCost:0), 0) + getCash;
  if (diff === 'easy') return Math.random() < 0.6;
  if (diff === 'medium') return valueGet >= valueGive * 0.85;
  return valueGet > valueGive || (valueGet >= valueGive * 0.9 && get.some(id => isMonopolyAdvantage(bot, id)));
}
function isMonopolyAdvantage(pl, id) {
  const t = TILES[id]; if (!t.group) return false;
  const have = pl.properties.filter(x => TILES[x].group === t.group).length + 1;
  return have === GROUPS[t.group];
}

// Init
if (document.getElementById('board')) initGame();
