import { buildScene } from "./scene.js";

const $ = (id) => document.getElementById(id);
const requested = new URLSearchParams(location.search).get("task");
const task = ["puck", "shelf", "reach"].includes(requested)
  ? requested
  : "puck";
const mode = $("mode"),
  play = $("play"),
  scrub = $("time");
let view,
  run,
  t = 0,
  playing = false,
  prev = 0;
const path = () => run[mode.value];

function draw() {
  const p = path();
  let lo = 0,
    hi = p.frames.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((hi + lo) / 2);
    if (p.frames[mid][0] <= t) lo = mid;
    else hi = mid - 1;
  }
  view.pose(p.frames[lo]);
  scrub.value = Math.round((1000 * t) / p.seconds);
  $("clock").value = t.toFixed(2) + " s";
  play.textContent = playing ? "Pause" : t >= p.seconds ? "Replay" : "Play";
}

function stop() {
  playing = false;
  draw();
}
let animation = 0;
function animate(now) {
  if (!playing) return;
  t = Math.min(path().seconds, t + (now - prev) / 1000);
  prev = now;
  playing = t < path().seconds;
  draw();
  if (playing) animation = requestAnimationFrame(animate);
}
function pause() {
  cancelAnimationFrame(animation);
  stop();
}
try {
  const reply = await fetch("./" + task + ".json");
  if (!reply.ok) throw Error("Missing replay");
  run = await reply.json();
  view = await buildScene($("stage"));
  view.setup(run);
  view.showRoute("learned");
  view.paths(false);
  mode.options[0].textContent =
    task === "puck" ? "Learned push" : "Learned route";
  mode.options[1].textContent =
    task === "puck" ? "Straight push" : "Direct reach";
  draw();
  $("loading").hidden = true;
  for (const el of [mode, play, scrub]) el.disabled = false;
  mode.onchange = () => {
    t = 0;
    view.showRoute(mode.value);
    pause();
  };
  scrub.oninput = () => {
    t = (+scrub.value / 1000) * path().seconds;
    pause();
  };
  play.onclick = () => {
    if (playing) {
      pause();
      return;
    }
    if (t >= path().seconds) t = 0;
    playing = true;
    prev = performance.now();
    draw();
    animation = requestAnimationFrame(animate);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting && playing) pause();
  }).observe($("stage"));
} catch {
  const a = document.createElement("a");
  a.href = "../" + task + ".mp4";
  a.textContent = "Watch the recorded comparison";
  $("loading").replaceChildren("3D replay is unavailable on this device. ", a);
}
