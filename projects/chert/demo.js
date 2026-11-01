// Load the call immediately. Readiness only controls an offline notice; it never
// gates the interface, starts a call or requests microphone/camera permission.
const notice = document.querySelector('#connection-notice');
fetch('https://chert.dunlichan.com/ready', {
  signal: AbortSignal.timeout(10000),
  credentials: 'omit',
}).then((response) => {
  notice.hidden = response.ok;
}).catch(() => {
  notice.hidden = false;
});
