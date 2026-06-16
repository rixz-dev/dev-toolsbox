const BOARD = document.getElementById('board');
const ACTIONS = document.getElementById('actions');
const LOG = document.getElementById('log');
const MODAL_OVERLAY = document.getElementById('modal-overlay');
const MODAL = document.getElementById('modal');
const MODAL_TITLE = document.getElementById('modal-title');
const MODAL_BODY = document.getElementById('modal-body');
const MODAL_ACTIONS = document.getElementById('modal-actions');

function buildBoard() {
  BOARD.innerHTML = '';
  const order = [
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
    10,9,8,7,6,5,4,3,2,1,0
  ];
  order.forEach((tid, idx) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
      if (tid === -1) tile.classList.add('center');
      else if ([0,10,20,30].includes(tid)) tile.classList.add('corner');
      if (tid >= 0) {
      const t = TILES[tid];
      tile.dataset.id = tid;
      if (t.type === 'street' || t.type === 'railroad' || t.type === 'utility') {
        tile.classList.remove('corner');
        if (t.type === 'street') {
          const bar = document.createElement('div'); bar.className = 'bar'; bar.style.background = t.color; tile.appendChild(bar);
        }
        const name = document.createElement('div'); name.className = 'tile-name'; name.textContent = shortName(t.name); tile.appendChild(name);
        const price = document.createElement('div'); price.className = 'price'; price.textContent = '$'+t.price; tile.appendChild(price);
        const owners = document.createElement('div'); owners.className = 'owners'; tile.appendChild(owners);
        const houses = document.createElement('div'); houses.className = 'houses'; tile.appendChild(houses);
      } else {
        tile.classList.remove('corner');
        tile.classList.add('corner');
        tile.textContent = shortName(t.name);
        if (t.type === 'gotojail') tile.style.color = 'var(--danger)';
        if (t.type === 'go') tile.style.color = 'var(--success)';
      }
    } else {
      tile.classList.remove('corner');
      tile.style.background = 'rgba(0,0,0,0.2)';
      tile.style.border = 'none';
    }
    tile.style.gridColumn = (idx % 11) + 1;
    tile.style.gridRow = Math.floor(idx / 11) + 1;
    BOARD.appendChild(tile);
  });
}

function shortName(n) {
  const map = {
    "Mediterranean Avenue":"Mediterranean","Baltic Avenue":"Baltic","Oriental Avenue":"Oriental","Vermont Avenue":"Vermont","Connecticut Avenue":"Connecticut",
    "St. Charles Place":"St. Charles","States Avenue":"States","Virginia Avenue":"Virginia","St. James Place":"St. James","Tennessee Avenue":"Tennessee","New York Avenue":"New York",
    "Kentucky Avenue":"Kentucky","Indiana Avenue":"Indiana","Illinois Avenue":"Illinois","Atlantic Avenue":"Atlantic","Ventnor Avenue":"Ventnor","Marvin Gardens":"Marvin",
    "Pacific Avenue":"Pacific","North Carolina Avenue":"N. Carolina","Pennsylvania Avenue":"Penn Ave","Park Place":"Park Place","Boardwalk":"Boardwalk",
    "Reading Railroad":"Reading RR","Pennsylvania Railroad":"Penn RR","B. & O. Railroad":"B&O RR","Short Line":"Short Line",
    "Electric Company":"Electric","Water Works":"Water Works","Income Tax":"Income Tax","Luxury Tax":"Luxury Tax",
    "Community Chest":"Community","Chance":"Chance","Free Parking":"Parking","Go to Jail":"→ Jail","Jail / Just Visiting":"Jail"
  };
  return map[n] || n;
}

function tileElement(tid) { return BOARD.querySelector(`.tile[data-id="${tid}"]`); }

function placeToken(pid, tid) {
  let t = document.getElementById('token-'+pid);
  if (!t) { t = document.createElement('div'); t.className = 'token p'+pid; t.id='token-'+pid; BOARD.appendChild(t); }
  const el = tileElement(tid);
  if (!el) return;
  const r = BOARD.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  const offset = (pid * 4) % 12;
  t.style.left = (er.left - r.left + 6 + offset) + 'px';
  t.style.top = (er.top - r.top + 6 + offset) + 'px';
  t.style.width = (er.width / 2.2) + 'px';
  t.style.height = (er.width / 2.2) + 'px';
}

function updateTiles() {
  TILES.forEach(tile => {
    const el = tileElement(tile.id);
    if (!el) return;
    const owners = el.querySelector('.owners');
    const houses = el.querySelector('.houses');
    if (owners) owners.innerHTML = '';
    if (houses) houses.innerHTML = '';
    if (tile.owner != null) {
      const o = document.createElement('div'); o.className = 'o'; o.style.background = PLAYER_COLORS[tile.owner]; owners.appendChild(o);
    }
    if (tile.houses > 0 && tile.houses < 5) {
      for (let i=0;i<tile.houses;i++){ const h=document.createElement('div'); h.className='h'; houses.appendChild(h); }
    } else if (tile.houses >= 5) {
      const h=document.createElement('div'); h.className='h hotel'; houses.appendChild(h);
    }
  });
}

function showActions(list) {
  ACTIONS.innerHTML = '';
  list.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn btn-primary'; b.textContent = a.label; b.onclick = a.fn;
    if (a.style === 'secondary') b.className = 'btn btn-secondary';
    if (a.style === 'danger') b.className = 'btn btn-support';
    ACTIONS.appendChild(b);
  });
}

function clearActions() { ACTIONS.innerHTML = ''; }

function log(msg, type='info') {
  const e = document.createElement('div'); e.className = 'log-entry';
  const time = new Date().toLocaleTimeString('id',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const cls = type==='bad'?'bad':type==='money'?'money':type==='actor'?'actor':'';
  e.innerHTML = `<span class="time">${time}</span> <span class="${cls}">${msg}</span>`;
  LOG.appendChild(e); LOG.scrollTop = LOG.scrollHeight;
}

function showModal(title, body, actions) {
  MODAL_TITLE.textContent = title;
  MODAL_BODY.innerHTML = '';
  if (typeof body === 'string') MODAL_BODY.innerHTML = body; else MODAL_BODY.appendChild(body);
  MODAL_ACTIONS.innerHTML = '';
  actions.forEach(a => {
    const b = document.createElement('button'); b.className='btn btn-primary'; b.textContent=a.label; b.onclick = () => { a.fn(); if(a.close!==false) closeModal(); };
    if (a.style === 'secondary') b.className = 'btn btn-secondary';
    if (a.style === 'danger') b.className = 'btn btn-support';
    MODAL_ACTIONS.appendChild(b);
  });
  MODAL_OVERLAY.classList.remove('hidden');
}
function closeModal() { MODAL_OVERLAY.classList.add('hidden'); }

function updatePlayerPanel() {
  const p = players[0];
  document.getElementById('p-cash').textContent = '$'+p.money;
  document.getElementById('p-net').textContent = '$'+netWorth(p);
  document.getElementById('p-props').textContent = p.properties.length;
  const box = document.getElementById('p-deeds'); box.innerHTML = '';
  p.properties.forEach(id => {
    const t = TILES[id];
    const d = document.createElement('div'); d.className='deed-mini'; d.style.borderTopColor = t.color || 'var(--muted)';
    if (t.mortgaged) d.classList.add('mortgaged');
    d.style.borderTopWidth = '4px';
    d.style.background = t.color || 'var(--card)';
    d.setAttribute('data-lvl', t.houses >= 5 ? 'H' : t.houses || '');
    d.title = t.name + (t.mortgaged ? ' (Mortgaged)' : '');
    box.appendChild(d);
  });
}

function updateBotsPanel() {
  const box = document.getElementById('bots-list'); box.innerHTML = '';
  for (let i=1;i<players.length;i++) {
    const p = players[i];
    const row = document.createElement('div'); row.className='player-chip';
    row.innerHTML = `<div class="chip-color" style="background:${PLAYER_COLORS[i]}"></div><div class="chip-info"><div class="chip-name">${p.name}</div><div class="chip-cash">$${p.money} · ${p.properties.length} props</div></div>`;
    box.appendChild(row);
  }
}

function updateTurnBadge() {
  const p = players[turn];
  document.getElementById('turn-dot').style.background = PLAYER_COLORS[turn];
  document.getElementById('turn-text').textContent = p.isBot ? t('botTurn') + ' — ' + p.name : t('yourTurn');
}

function animateDice(d1, d2, cb) {
  const die1 = document.getElementById('die1');
  const die2 = document.getElementById('die2');
  if (CFG.animDice === 'off') { die1.textContent = face(d1); die2.textContent = face(d2); cb(); return; }
  die1.classList.add('rolling'); die2.classList.add('rolling');
  let c = 0;
  const iv = setInterval(() => { die1.textContent = face(1+Math.floor(Math.random()*6)); die2.textContent = face(1+Math.floor(Math.random()*6)); c++; if (c>12) { clearInterval(iv); die1.classList.remove('rolling'); die2.classList.remove('rolling'); die1.textContent = face(d1); die2.textContent = face(d2); cb(); } }, 80);
}
function face(n) { return ['⚀','⚁','⚂','⚃','⚄','⚅'][n-1]; }

function updateFreeParking() { document.getElementById('fp-pot').textContent = '$'+freeParkingPot; }
