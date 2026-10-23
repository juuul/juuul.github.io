(() => {
  const key = 'juliaan.prive-geopend';
  const qr = document.getElementById('deel-site');
  // Alleen een weergavevoorkeur: dit geeft nergens toegang of beheerdersrechten.
  function bijwerken() {
    try { qr.hidden = localStorage.getItem(key) === '1'; } catch (_) {}
  }
  document.getElementById('inloggen').addEventListener('click', () => {
    try { localStorage.setItem(key, '1'); } catch (_) {}
    qr.hidden = true;
  });
  window.addEventListener('pageshow', bijwerken);
  window.addEventListener('storage', bijwerken);
  bijwerken();
})();
