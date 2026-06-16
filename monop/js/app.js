document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  bindSettings();

  const menu = document.querySelector('.menu');
  const diffPanel = document.getElementById('difficulty-panel');
  let selectedDiff = CFG.diff;

  document.getElementById('btn-newgame')?.addEventListener('click', () => {
    menu.classList.add('hidden');
    diffPanel.classList.remove('hidden');
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === selectedDiff));
  });

  document.getElementById('btn-back')?.addEventListener('click', () => {
    diffPanel.classList.add('hidden');
    menu.classList.remove('hidden');
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDiff = btn.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('btn-start')?.addEventListener('click', () => {
    CFG.diff = selectedDiff;
    saveSettings();
    window.location.href = 'game.html';
  });
});
