(() => {
  // Ruim de oude voorkeur op: de QR-code blijft voortaan altijd zichtbaar.
  try { localStorage.removeItem('juliaan.prive-geopend'); } catch (_) {}
})();
