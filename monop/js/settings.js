const DEFAULTS = {
  lang: 'id',
  theme: 'dark',
  diff: 'medium',
  speed: 'normal',
  sound: 'off',
  animDice: 'on',
  freeParking: 'off',
  auction: 'on',
  startMoney: 1500
};

let CFG = JSON.parse(JSON.stringify(DEFAULTS));

function loadSettings() {
  try { const raw = localStorage.getItem('monop_settings'); if (raw) CFG = { ...CFG, ...JSON.parse(raw) }; } catch(e) {}
  applySettingsUI();
  applyTheme();
  setLanguage(CFG.lang);
}

function saveSettings() {
  localStorage.setItem('monop_settings', JSON.stringify(CFG));
}

function applySettingsUI() {
  const map = {
    'set-lang': CFG.lang,
    'set-theme': CFG.theme,
    'set-diff': CFG.diff,
    'set-speed': CFG.speed,
    'set-sound': CFG.sound,
    'set-anim-dice': CFG.animDice,
    'set-fp': CFG.freeParking,
    'set-auction': CFG.auction,
    'set-startmoney': String(CFG.startMoney)
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', CFG.theme);
}

function bindSettings() {
  document.getElementById('set-lang')?.addEventListener('change', e => { CFG.lang = e.target.value; setLanguage(CFG.lang); applyTheme(); saveSettings(); });
  document.getElementById('set-theme')?.addEventListener('change', e => { CFG.theme = e.target.value; applyTheme(); saveSettings(); });
  document.getElementById('set-diff')?.addEventListener('change', e => { CFG.diff = e.target.value; saveSettings(); });
  document.getElementById('set-speed')?.addEventListener('change', e => { CFG.speed = e.target.value; saveSettings(); });
  document.getElementById('set-sound')?.addEventListener('change', e => { CFG.sound = e.target.value; saveSettings(); });
  document.getElementById('set-anim-dice')?.addEventListener('change', e => { CFG.animDice = e.target.value; saveSettings(); });
  document.getElementById('set-fp')?.addEventListener('change', e => { CFG.freeParking = e.target.value; saveSettings(); });
  document.getElementById('set-auction')?.addEventListener('change', e => { CFG.auction = e.target.value; saveSettings(); });
  document.getElementById('set-startmoney')?.addEventListener('change', e => { CFG.startMoney = parseInt(e.target.value); saveSettings(); });

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    document.getElementById('settings-overlay').classList.remove('hidden');
  });
  document.getElementById('btn-settings-close')?.addEventListener('click', () => {
    document.getElementById('settings-overlay').classList.add('hidden');
  });
  document.getElementById('settings-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('settings-overlay')) document.getElementById('settings-overlay').classList.add('hidden');
  });
}

loadSettings();
