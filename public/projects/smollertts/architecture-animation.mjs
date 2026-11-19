import {mountArchitecture} from './architecture-renderer.mjs?h=41a51497074d';

// Load independently of the speech editor and model worker.
const host = document.getElementById('architecture-animation');
if (host) {
  try {
    const response = await fetch(new URL('./architecture-peaks.json?h=41a51497074d', import.meta.url));
    if (!response.ok) throw new Error(`Architecture waveform ${response.status}`);
    const peaks = await response.json();
    mountArchitecture(host, peaks, {theme: 'light'});
  } catch (error) {
    console.error('Could not load the architecture animation', error);
    host.hidden = true;
    const full = document.querySelector('.architecture-full');
    if (full) full.querySelector('summary').click();
  }
}
