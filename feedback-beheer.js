(() => {
  const test = new URLSearchParams(location.search).get('omgeving') === 'test' || location.pathname.includes('/test/api/feedback/voorbeeld/');
  const api = 'https://serverbot.taild1b3c5.ts.net' + (test ? '/test' : '');
  const key = 'juliaan.feedback.' + (test ? 'test' : 'live');
  const apps = { website: 'juliaan.eu', hockey: 'Hockey', finance: 'Finance Planner', 'finance-web': 'Finance Planner web-app' };
  const statuses = { wacht: 'Wacht op verzending', bezig: 'Wordt verstuurd', verzonden: 'Verstuurd', fout: 'Mislukt; wordt opnieuw geprobeerd' };
  let token = '', pagina = 1, totaal = 0, loading = false;
  try { token = sessionStorage.getItem(key) || ''; } catch (_) {}
  const notice = document.getElementById('notice');
  document.getElementById('test-mode').hidden = !test;
  function melding(text, error = false) { notice.textContent = text; notice.classList.toggle('error', error); notice.setAttribute('role', error ? 'alert' : 'status'); }
  function uitloggen() {
    token = '';
    try { sessionStorage.removeItem(key); } catch (_) {}
    document.getElementById('login').hidden = false;
    document.getElementById('portal').hidden = true;
    document.getElementById('logout').hidden = true;
    document.getElementById('items').replaceChildren();
    document.getElementById('login').reset();
  }
  async function request(path, options = {}) {
    const response = await fetch(api + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: token, ...options.headers }, signal: AbortSignal.timeout(20000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) { uitloggen(); throw new Error('Log in met je eigenaarsaccount om feedback te beheren.'); }
      throw new Error(data.message || 'Dit is niet gelukt. Probeer het opnieuw.');
    }
    return data;
  }
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function toon(item) {
    const card = node('article', '', 'card');
    card.append(node('h2', apps[item.app] + (item.afgehandeld ? ' · Afgehandeld' : ' · Nieuw')));
    card.append(node('p', new Date(item.created.replace(' ', 'T')).toLocaleString('nl-NL'), 'meta'));
    card.append(node('p', item.bericht, 'message'));
    const contact = node('p', item.naam || (item.email ? '' : 'Anoniem'), 'meta');
    if (item.email) {
      const mail = node('a', item.email);
      mail.href = 'mailto:' + encodeURIComponent(item.email);
      contact.append(document.createTextNode(item.naam ? ' · ' : ''), mail);
    }
    card.append(contact);
    for (const mail of item.mails) card.append(node('p', (mail.soort === 'melding' ? 'Melding aan jou: ' : 'Bevestiging inzender: ') + statuses[mail.status], 'meta'));
    const actions = node('div', '', 'actions');
    const toggle = node('button', item.afgehandeld ? 'Opnieuw openen' : 'Afhandelen');
    const remove = node('button', 'Verwijderen', 'danger');
    async function actie(button, path, options) {
      button.disabled = true;
      try { await request(path, options); await laden(); }
      catch (error) { melding(error.message, true); }
      finally { button.disabled = false; }
    }
    toggle.addEventListener('click', () => actie(toggle, '/api/feedback/beheer/' + item.id, { method: 'PATCH', body: JSON.stringify({ afgehandeld: !item.afgehandeld }) }));
    remove.addEventListener('click', () => {
      if (confirm('Dit feedbackbericht definitief verwijderen? Reeds verstuurde mails en bestaande back-ups blijven bewaard.')) actie(remove, '/api/feedback/beheer/' + item.id, { method: 'DELETE' });
    });
    actions.append(toggle, remove); card.append(actions); return card;
  }
  async function laden() {
    if (loading) return;
    loading = true;
    document.getElementById('refresh').disabled = true;
    try {
      const query = new URLSearchParams({ pagina: String(pagina), app: document.getElementById('app-filter').value, status: document.getElementById('status-filter').value });
      const data = await request('/api/feedback/beheer?' + query);
      totaal = data.totaal;
      if (!data.items.length && pagina > 1) { pagina--; loading = false; return laden(); }
      document.getElementById('items').replaceChildren(...(data.items.length ? data.items.map(toon) : [node('p', 'Geen feedbackberichten gevonden.')]));
      document.getElementById('login').hidden = true;
      document.getElementById('portal').hidden = false;
      document.getElementById('logout').hidden = false;
      document.getElementById('page').textContent = `Pagina ${pagina} · ${totaal} berichten`;
      document.getElementById('previous').disabled = pagina === 1;
      document.getElementById('next').disabled = pagina * 25 >= totaal;
      melding('');
    } catch (error) { melding(error.message, true); }
    finally { loading = false; document.getElementById('refresh').disabled = false; }
  }
  document.getElementById('login').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch(api + '/api/collections/users/auth-with-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: form.elements.email.value.trim(), password: form.elements.password.value }), signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Inloggen is niet gelukt. Controleer je e-mailadres en wachtwoord.');
      token = data.token;
      // Sla uitsluitend het token van een daadwerkelijk toegelaten eigenaar op.
      await request('/api/feedback/beheer?pagina=1');
      try { sessionStorage.setItem(key, token); } catch (_) {}
      form.elements.password.value = '';
      await laden();
    } catch (error) { token = ''; melding(error.message, true); }
    finally { button.disabled = false; }
  });
  document.getElementById('logout').addEventListener('click', () => { uitloggen(); melding('Je bent uitgelogd uit het feedbackbeheer.'); });
  document.getElementById('refresh').addEventListener('click', laden);
  for (const id of ['app-filter', 'status-filter']) document.getElementById(id).addEventListener('change', () => { pagina = 1; laden(); });
  document.getElementById('previous').addEventListener('click', () => { if (pagina > 1) { pagina--; laden(); } });
  document.getElementById('next').addEventListener('click', () => { if (pagina * 25 < totaal) { pagina++; laden(); } });
  if (token) laden();
})();
