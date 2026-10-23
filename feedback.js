(() => {
  const query = new URLSearchParams(location.search);
  const test = query.get('omgeving') === 'test' || location.pathname.includes('/test/api/feedback/voorbeeld/');
  const english = query.get('lang') === 'en';
  const api = 'https://serverbot.taild1b3c5.ts.net' + (test ? '/test' : '');
  const texts = {
    title: 'Share your feedback', intro: 'An idea, a bug or something else? Send Juliaan a message. No account needed.',
    app: 'What is your feedback about?', message: 'Your message', messageHelp: 'Up to 5000 characters. Do not include passwords or financial information.',
    name: 'Name', optional: '(optional)', email: 'Email address', emailHelp: 'Enter your email to receive a confirmation and, if applicable, a reply.',
    privacy: 'Only Juliaan can view your message and contact details and uses them to handle your feedback. Leave name and email blank to submit anonymously. Technical server logs may contain your IP address. Your message is not public.',
    send: 'Send feedback', thanks: 'Thank you for your feedback!', received: 'Juliaan has received your message.',
    confirmation: 'You will also receive a confirmation email. You receive at most one confirmation per day.', home: 'Go to juliaan.eu',
  };
  if (english) {
    document.documentElement.lang = 'en';
    document.querySelectorAll('[data-text]').forEach(node => { if (texts[node.dataset.text]) node.textContent = texts[node.dataset.text]; });
  }
  document.getElementById('test-mode').hidden = !test;
  const form = document.getElementById('feedback-form');
  const chosen = query.get('app');
  if (['website', 'hockey', 'finance', 'finance-web'].includes(chosen)) form.elements.app.value = chosen;
  let inzending = crypto.randomUUID();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    const error = document.getElementById('error');
    button.disabled = true;
    error.hidden = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      body.inzending = inzending;
      const response = await fetch(api + '/api/feedback/inzenden', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error(english ? 'Too many messages. Please try again later.' : 'Er zijn te veel berichten verstuurd. Probeer het later nog eens.');
        const data = await response.json().catch(() => ({}));
        throw new Error(english ? 'Please check your entries and try again.' : (data.message || 'Versturen is niet gelukt. Probeer het opnieuw.'));
      }
      document.getElementById('confirmation-note').hidden = !body.email.trim();
      form.hidden = true;
      const success = document.getElementById('success');
      success.hidden = false;
      success.focus();
    } catch (failure) {
      error.textContent = failure instanceof TypeError || failure.name === 'TimeoutError'
        ? (english ? 'No connection. Try again; your text is still here.' : 'Geen verbinding. Probeer opnieuw; je tekst blijft staan.') : failure.message;
      error.hidden = false;
    } finally { button.disabled = false; }
  });
})();
