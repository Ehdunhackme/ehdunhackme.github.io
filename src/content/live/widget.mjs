import {
  FEEDS,
  normalizeRollup,
  acceptUpdate,
  validateSnapshot,
  summarize,
} from "./core.mjs";

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const number = (value) =>
  Number.isFinite(value) ? value.toFixed(2) : "Not available";
const time = (value) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
const checkedTime = (value) =>
  new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
const labels = {
  DEM: "Democrats",
  REP: "Republicans",
  IND: "Independent",
  NOL: "No Labels",
  OTHER: "Other",
  Uncalled: "Uncalled",
};
const css = `
:host{display:block;width:100%;max-width:100%;color:var(--strong,#e6e6e6);font:inherit;margin:40px 0;line-height:1.6;color-scheme:dark}
*{box-sizing:border-box}h3{font-size:20px;line-height:1.4;margin:0 0 8px;font-weight:600}p{margin:8px 0;font-size:13px;color:var(--muted,#aaa9a6)}
button,input,select{font:inherit;color:inherit}button{cursor:pointer}button:disabled{cursor:default;opacity:.5}a{color:inherit;text-underline-offset:3px}button:focus-visible,input:focus-visible,select:focus-visible,[tabindex]:focus-visible{outline:2px solid #8ab4ff;outline-offset:4px}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;margin:16px 0 12px}.tabs{display:flex;gap:24px}.tabs button{padding:8px 0;border:0;border-bottom:2px solid transparent;background:none;font-size:14px;min-height:44px}.tabs button[aria-pressed=true]{border-bottom-color:#e6e6e6}
.refresh{background:none;border:0;text-decoration:underline;text-underline-offset:4px;padding:8px 0;font-size:12px;min-height:44px}.status{font-size:12px;line-height:1.5;min-height:20px;margin:0 0 20px}.notice{color:#e1be88}
.seat-row{margin:16px 0}.seat-label{font-size:13px;margin-bottom:8px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.seat-counts{display:flex;gap:16px;flex-wrap:wrap}.bar{height:12px;display:flex;background:#454545;width:100%;overflow:hidden}.bar span{height:100%;display:block}.DEM{color:#8ab4ff}.REP{color:#df9b88}.IND,.NOL,.OTHER{color:#c5b271}.Uncalled{color:#aaa9a6}.bar .DEM{background:#8ab4ff}.bar .REP{background:#df9b88}.bar .IND,.bar .NOL,.bar .OTHER{background:#c5b271}.bar .Uncalled{background:#62615e}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:24px 0 12px}.metrics dt{font-size:12px;color:var(--muted,#aaa9a6)}.metrics dd{font-size:24px;margin:4px 0;font-variant-numeric:tabular-nums;line-height:1.3}.metrics small{display:block;color:var(--muted,#aaa9a6);font-size:12px}.scope{font-size:12px;line-height:1.6}
.filters{display:flex;gap:12px;align-items:end;margin:24px 0 12px}.filters label{display:flex;flex-direction:column;gap:4px;font-size:12px;flex:1;min-width:0}.filters label:last-child{flex:0 0 160px}input,select{background:transparent;border:1px solid #565656;border-radius:4px;padding:8px 12px;font-size:14px;width:100%;min-height:44px}select option{background:#1a1a1a}
.table-scroll{overflow:auto;width:100%;max-width:100%}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:13px;font-variant-numeric:tabular-nums}th,td{padding:12px 8px;text-align:left;vertical-align:top;overflow-wrap:break-word}thead th{border-bottom:1px solid #454545;font-size:12px;font-weight:500;color:var(--muted,#aaa9a6)}th:first-child{padding-left:0;width:17%}th:nth-child(2){width:27%}th:nth-child(3){width:31%}td:last-child,th:last-child{text-align:right;padding-right:0;width:25%}tbody th{font-weight:500}td small,th small{display:block;font-weight:400;font-size:11px;color:var(--muted,#aaa9a6);margin-top:4px}td small:empty{display:none}.miss{color:#e1be88}.pages{display:flex;align-items:center;gap:20px;font-size:12px;margin:8px 0 16px}.pages span{margin-right:auto;color:var(--muted,#aaa9a6)}.pages button{border:0;background:none;padding:12px 0;min-height:44px;text-decoration:underline;text-underline-offset:4px}
.footer{font-size:12px;margin-top:12px}details{margin-top:12px}summary{cursor:pointer;font-size:13px;padding:12px 0}details p{font-size:12px}.roster-note:empty{display:none}
@media(max-width:560px){.metrics{grid-template-columns:1fr 1fr;gap:16px}.metrics dd{font-size:22px}.metrics>div:last-child{grid-column:1/-1}.filters{align-items:stretch;flex-direction:column;gap:12px}.filters label:last-child{flex:auto}.seat-counts{gap:12px}.tabs{gap:16px}.tabs button{font-size:13px}th,td{padding:12px 4px}table{font-size:12px}.status{min-height:36px}}
`;

export function mountComparison(host, config) {
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  const forecasts = config.predictions.races;
  const cacheKey = `midterm-results-v1-${config.predictions.sha256}`;
  const snapshots = { ...config.snapshot };
  const status = {
    house: "Saved snapshot. Checking for updates.",
    senate: "Saved snapshot. Checking for updates.",
  };
  let chamber = "house",
    page = 0,
    busy = false,
    disposed = false,
    timer,
    controller;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    for (const c of ["house", "senate"]) {
      if (
        validateSnapshot(cached?.[c], c, forecasts) &&
        (!snapshots[c] ||
          Date.parse(cached[c].updatedAt) >= Date.parse(snapshots[c].updatedAt))
      )
        snapshots[c] = cached[c];
    }
  } catch {
    /* Storage is optional, including in file previews and private windows. */
  }
  for (const c of ["house", "senate"])
    if (!validateSnapshot(snapshots[c], c, forecasts)) delete snapshots[c];
  root.innerHTML = `<style>${css}</style><section aria-labelledby="comparison-heading">
<h3 id="comparison-heading">Live results</h3><p>Fixed predictions, updated results. Refreshes every minute.</p>
<div class="toolbar"><div class="tabs" role="group" aria-label="Chamber"><button type="button" data-chamber="house" aria-pressed="true">House · 435 seats</button><button type="button" data-chamber="senate" aria-pressed="false">Senate · 35 contests</button></div><button class="refresh" type="button">Refresh results</button></div>
<p class="status" role="status" aria-live="polite"></p><div class="seats"></div><dl class="metrics"></dl><p class="scope"></p>
<div class="filters"><label>Find a race<input type="search" placeholder="State, district or candidate" aria-label="Find a race"></label><label>Show<select aria-label="Filter races"><option value="all">All races</option><option value="misses">Called misses</option><option value="uncalled">Still uncalled</option></select></label></div>
<div class="table-scroll" role="region" tabindex="0" aria-label="Prediction and reported result by race"><table><thead><tr><th scope="col">Race</th><th scope="col">Model</th><th scope="col">Reported</th><th scope="col">D-share error</th></tr></thead><tbody></tbody></table></div>
<div class="pages"><span></span><button type="button" class="previous">Previous</button><button type="button" class="next">Next</button></div>
<details><summary>Scoring notes</summary><p>Party accuracy uses called races only. A lead is not a call; counts can still change. Senate totals cover the 35 contested seats.</p><p class="roster-note"></p><p>Vote-share error uses called D/R races with votes for both parties: Democratic votes divided by Democratic plus Republican votes. Positive errors mean the model underestimated Democratic support. The baseline uses the same races.</p><p>Ranked-choice proxies, independent and minor-party transfers, same-party races and party aggregates are excluded from vote-share error. The model was recorded after Election Day using reconstructed November 2 inputs.</p></details>
<p class="footer">Results from <a href="https://civicapi.org" target="_blank" rel="noopener noreferrer">civicAPI</a></p></section>`;
  const el = (selector) => root.querySelector(selector);
  const query = el("input"),
    filter = el("select"),
    refreshButton = el(".refresh");
  function bars(label, counts, total) {
    const parts = Object.entries(counts).filter(([, count]) => count);
    const text = parts.map(([p, count]) => `${labels[p]} ${count}`).join(", ");
    return `<div class="seat-row"><div class="seat-label"><span>${label}</span><span class="seat-counts">${parts.map(([p, count]) => `<span class="${p}">${count} ${p === "Uncalled" ? "uncalled" : p === "DEM" ? "D" : p === "REP" ? "R" : labels[p]}</span>`).join("")}</span></div><div class="bar" role="img" aria-label="${escape(label + ": " + text)}">${parts.map(([p, count]) => `<span class="${p}" style="width:${(100 * count) / total}%"></span>`).join("")}</div></div>`;
  }
  function renderRows(rows) {
    const q = query.value.toLowerCase().trim();
    const filtered = rows.filter(
      (r) =>
        `${r.label} ${r.state} ${r.left} ${r.right} ${r.result?.name || ""} ${r.result?.calledName || ""}`
          .toLowerCase()
          .includes(q) &&
        (filter.value === "all" ||
          (filter.value === "misses"
            ? r.correct === false
            : r.correct === null)),
    );
    const limit = 10,
      pages = Math.max(1, Math.ceil(filtered.length / limit));
    page = Math.min(page, pages - 1);
    el("tbody").innerHTML =
      filtered
        .slice(page * limit, (page + 1) * limit)
        .map((r) => {
          const report = r.result;
          const share =
            r.kind === "D/R" && Number.isFinite(r.share)
              ? `D share ${r.share.toFixed(1)}%`
              : r.fixed
                ? "From roster"
                : "Special ballot";
          const actual =
            r.actual === null ? "" : `D share ${r.actual.toFixed(1)}%`;
          const reporting =
            report?.reporting == null
              ? ""
              : `${report.reporting.toFixed(1)}% counted`;
          return `<tr><th scope="row">${escape(r.label)}${r.correct === false ? '<small class="miss">Called miss</small>' : ""}</th><td><span class="${escape(r.party)}">${escape(r.party)}</span><small>${share}</small></td><td>${report?.calledParty ? `<span class="${report.calledParty}">${escape(report.calledParty)} called</span>` : "Uncalled"}<small>${actual}</small><small>${reporting}</small></td><td>${r.error === null ? "Not scored" : `${r.error > 0 ? "+" : ""}${r.error.toFixed(1)} pp`}${r.error !== null && !report.calledParty ? "<small>Count so far</small>" : ""}</td></tr>`;
        })
        .join("") ||
      '<tr><td colspan="4">No races match this search.</td></tr>';
    el(".pages span").textContent =
      `${filtered.length ? page * limit + 1 : 0}–${Math.min((page + 1) * limit, filtered.length)} of ${filtered.length} races`;
    el(".previous").disabled = page === 0;
    el(".next").disabled = page >= pages - 1;
  }
  function render() {
    if (disposed) return;
    const snapshot = snapshots[chamber],
      s = summarize(forecasts, snapshot, chamber);
    el(".status").textContent =
      `${status[chamber]} ${snapshot ? `Source updated ${time(snapshot.updatedAt)}.` : "No verified results available yet."}`;
    el(".status").classList.toggle(
      "notice",
      status[chamber].startsWith("Refresh failed"),
    );
    el(".seats").innerHTML =
      bars("Model", s.predicted, s.rows.length) +
      bars("Reported", s.reported, s.rows.length);
    const matches = s.called ? `${s.matched} / ${s.called}` : "Not available";
    el(".metrics").innerHTML =
      `<div><dt>Party matches</dt><dd>${matches}</dd><small>${s.called ? `${((100 * s.matched) / s.called).toFixed(1)}% of called races` : "Awaiting calls"}</small></div><div><dt>Mean absolute error</dt><dd>${number(s.mae)}${s.mae === null ? "" : " pp"}</dd><small>${s.scored} called D/R races</small></div><div><dt>Average bias</dt><dd>${s.bias > 0 ? "+" : ""}${number(s.bias)}${s.bias === null ? "" : " pp"}</dd><small>${s.bias === null ? "Awaiting comparable counts" : s.bias >= 0 ? "Underestimated D share" : "Overestimated D share"}</small></div>`;
    el(".scope").textContent =
      `${s.rows.length - s.called} uncalled. ${s.baselineMae === null ? "" : `Baseline error: ${number(s.baselineMae)} pp on the same ${s.scored} D/R races.`}`;
    el(".roster-note").textContent = s.fixed
      ? `${s.fixed} called seats were assigned from the candidate roster and count toward party matches.`
      : "";
    root
      .querySelectorAll("[data-chamber]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.chamber === chamber),
        ),
      );
    refreshButton.disabled = busy;
    refreshButton.textContent = busy ? "Checking results…" : "Refresh results";
    renderRows(s.rows);
  }
  async function refresh() {
    if (busy || disposed || document.hidden) return;
    clearTimeout(timer);
    busy = true;
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    render();
    await Promise.allSettled(
      Object.entries(FEEDS).map(async ([c, url]) => {
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            credentials: "omit",
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
          if (!response.ok) throw Error(`HTTP ${response.status}`);
          const incoming = normalizeRollup(await response.json(), c, forecasts);
          if (disposed) return;
          snapshots[c] = acceptUpdate(snapshots[c], incoming);
          status[c] = `Checked ${checkedTime(incoming.receivedAt)}.`;
        } catch {
          if (!disposed)
            status[c] =
              "Refresh failed. Showing saved results; retrying automatically.";
        }
      }),
    );
    clearTimeout(timeout);
    if (disposed) return;
    busy = false;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(snapshots));
    } catch {
      /* Keep the in-memory result if storage is full or disabled. */
    }
    render();
    timer = setTimeout(refresh, 60000);
  }
  root.querySelectorAll("[data-chamber]").forEach((button) =>
    button.addEventListener("click", () => {
      chamber = button.dataset.chamber;
      page = 0;
      render();
    }),
  );
  query.addEventListener("input", () => {
    page = 0;
    renderRows(summarize(forecasts, snapshots[chamber], chamber).rows);
  });
  filter.addEventListener("change", () => {
    page = 0;
    render();
  });
  el(".previous").addEventListener("click", () => {
    page--;
    render();
  });
  el(".next").addEventListener("click", () => {
    page++;
    render();
  });
  refreshButton.addEventListener("click", refresh);
  const visibility = () => {
    if (document.hidden) clearTimeout(timer);
    else refresh();
  };
  document.addEventListener("visibilitychange", visibility);
  render();
  refresh();
  return () => {
    disposed = true;
    clearTimeout(timer);
    controller?.abort();
    document.removeEventListener("visibilitychange", visibility);
    root.innerHTML = "";
  };
}
