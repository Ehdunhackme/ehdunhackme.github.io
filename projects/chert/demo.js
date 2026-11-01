const origin = 'https://chert.dunlichan.com';
const join = document.querySelector('#join');
const status = document.querySelector('#status');
join.addEventListener('click', async () => {
  join.disabled = true;
  status.textContent = 'Checking the demo…';
  try {
    const response = await fetch(`${origin}/ready`, { signal: AbortSignal.timeout(8000), credentials: 'omit' });
    if (!response.ok) throw new Error('offline');
    const result = await response.json();
    if (!result.ready) {
      status.textContent = 'The avatar is warming up. Please try again in a few minutes.';
      return;
    }
    if (result.busy) {
      status.textContent = 'Someone is on a call. Please try again shortly.';
      return;
    }
    document.querySelector('#welcome').hidden = true;
    const frame = document.querySelector('#call');
    frame.src = origin;
    frame.hidden = false;
    frame.focus();
  } catch {
    status.textContent = 'The demo is offline right now. Please try again later.';
  } finally {
    join.disabled = false;
  }
});
