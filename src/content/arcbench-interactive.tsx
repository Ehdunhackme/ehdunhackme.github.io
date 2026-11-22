"use client";

import { useState } from "react";
import data from "./arcbench-data.json";
import styles from "./arcbench.module.css";

const assets = "/assets/writings/arcbench";
const clips = {
  puck: [
    "Puck push",
    "The puck starts 60 mm from the target in both runs. Watch where it settles after the paddle lifts.",
  ],
  shelf: [
    "Shelf inspection",
    "The direct reach stops at the right wall. The learned route reaches inside the 110 mm opening, holds, then withdraws.",
  ],
  reach: [
    "Obstacle reach",
    "The film compares three fixtures. The 3D replay opens the low-fence example.",
  ],
} as const;
type Task = keyof typeof clips;

function ComparisonFilm({ task }: { task: Task }) {
  const [started, setStarted] = useState(false);
  const file = assets + "/" + task;
  if (started)
    return (
      <video
        className={styles.film}
        controls
        autoPlay
        muted
        playsInline
        poster={file + ".webp"}
        aria-label={clips[task][0] + " side-by-side comparison"}
      >
        <source src={file + ".mp4"} type="video/mp4" />
        <a href={file + ".mp4"}>Download the film</a>
      </video>
    );
  return (
    <>
      <button
        type="button"
        className={styles.poster}
        onClick={() => setStarted(true)}
        aria-label={"Play " + clips[task][0] + " comparison"}
      >
        <img
          src={file + ".webp"}
          width="1280"
          height={task === "puck" ? 464 : task === "shelf" ? 584 : 580}
          alt=""
        />
        <span>Play comparison</span>
      </button>
      <noscript>
        <a href={file + ".mp4"}>Watch the film</a>
      </noscript>
    </>
  );
}

export function Replays() {
  const [task, setTask] = useState<Task>("puck");
  const [orbit, setOrbit] = useState(false);
  return (
    <figure
      className={styles.figure}
      id="replays"
      aria-label="Recorded SO-101 simulations"
    >
      <div className={styles.toolbar}>
        <label>
          Task{" "}
          <select
            value={task}
            onChange={(e) => setTask(e.target.value as Task)}
          >
            {Object.entries(clips).map(([k, [name]]) => (
              <option value={k} key={k}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.switches} role="group" aria-label="Replay view">
          <button
            type="button"
            aria-pressed={!orbit}
            onClick={() => setOrbit(false)}
          >
            Comparison
          </button>
          <button
            type="button"
            aria-pressed={orbit}
            onClick={() => setOrbit(true)}
          >
            Explore in 3D
          </button>
        </div>
      </div>
      {orbit ? (
        <iframe
          key={task}
          src={assets + "/replay/viewer.html?task=" + task}
          title={clips[task][0] + " interactive 3D replay"}
          className={styles.frame}
        />
      ) : (
        <ComparisonFilm key={task} task={task} />
      )}
      <figcaption>
        {orbit
          ? "Drag the scene to orbit. Select a controller and scrub the recorded motion."
          : clips[task][1]}
      </figcaption>
    </figure>
  );
}

const px = (x: number) => 58 + 4.25 * x;
const py = (y: number) => 113 - 4.25 * y;
const points = (coords: number[][]) =>
  coords.map(([x, y]) => px(x).toFixed(1) + "," + py(y).toFixed(1)).join(" ");
const signed = (value: number) =>
  value > 0 ? "+" + value : String(value).replace("-", "−");

export function PushPaths() {
  const [selected, setSelected] = useState(data.selected);
  const path = data.paths.find((p) => p.offset === selected)!;
  const end = path.xy[path.xy.length - 1],
    [gx, gy] = data.goal;
  return (
    <figure className={styles.figure} aria-label="Puck trajectories from above">
      <div className={styles.toolbar}>
        <label>
          Paddle offset{" "}
          <select
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {data.paths.map((p) => (
              <option key={p.offset} value={p.offset}>
                {signed(p.offset)} mm
                {p.offset === data.selected
                  ? " (learned)"
                  : p.offset === 0
                    ? " (straight)"
                    : ""}
              </option>
            ))}
          </select>
        </label>
        <output className={styles.readout} aria-live="polite">
          {path.mm.toFixed(2)} mm from center
        </output>
      </div>
      <svg
        viewBox="0 0 440 325"
        className={styles.plot}
        role="img"
        aria-label={
          "Top view of the puck center for a " +
          selected +
          " millimeter paddle offset. Final error " +
          path.mm.toFixed(2) +
          " millimeters."
        }
      >
        <circle cx={px(gx)} cy={py(gy)} r="42.5" className={styles.target} />
        {data.paths.map((p) => (
          <polyline
            key={p.offset}
            points={points(p.xy)}
            className={styles.otherPath}
          />
        ))}
        <polyline points={points(path.xy)} className={styles.chosenPath} />
        <circle cx={px(0)} cy={py(0)} r="4" fill="currentColor" />
        <text x={px(0) - 4} y={py(0) - 13} textAnchor="end">
          Start
        </text>
        <path
          d={`M${px(gx) - 5} ${py(gy)}h10 M${px(gx)} ${py(gy) - 5}v10`}
          className={styles.cross}
        />
        <text x={px(gx)} y={py(gy) + 61} textAnchor="middle">
          Target
        </text>
        <circle cx={px(end[0])} cy={py(end[1])} r="5" className={styles.end} />
        <path d="M28 304h42.5m-42.5 -3v6m42.5 -6v6" className={styles.cross} />
        <text x="81" y="308">
          10 mm
        </text>
      </svg>
      <figcaption>
        Each line follows the puck’s center in the same layout. The dot marks
        where the selected push ends. The target accepts any center inside the
        dashed circle.
      </figcaption>
    </figure>
  );
}

const categories = [
  "Both succeeded",
  "Learned only",
  "Straight only",
  "Both missed",
];
export function SurfaceTrials() {
  const [idx, setIdx] = useState(1);
  const group = data.surfaces[idx];
  const counts = [0, 0, 0, 0];
  const outcomes = group.trials.map(([seed, , , straight, learned]) => {
    const category = straight ? (learned ? 0 : 2) : learned ? 1 : 3;
    counts[category]++;
    return { seed, category };
  });
  return (
    <figure
      className={styles.figure}
      aria-label="Paired outcomes by surface friction"
    >
      <div className={styles.toolbar}>
        <label>
          Sliding friction{" "}
          <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
            {data.surfaces.map((s, i) => (
              <option key={s.friction} value={i}>
                {s.friction.toFixed(2)}
                {i === 1 ? " (training)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.outcomes}>
        <div className={styles.grid} aria-hidden="true">
          {outcomes.map(({ seed, category }) => (
            <span
              key={seed}
              className={styles.cell}
              data-result={category}
              title={"Layout " + seed + " · " + categories[category]}
            />
          ))}
        </div>
        <ul className={styles.legend} aria-live="polite">
          {categories.map((name, i) => (
            <li key={name}>
              <i className={styles.cell} data-result={i} />
              {name}
              <b>{counts[i]}</b>
            </li>
          ))}
        </ul>
      </div>
      <figcaption>
        One square per layout, in the same order on every surface. Both
        controllers get the same puck and target positions.
      </figcaption>
    </figure>
  );
}
