"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import "../../public/assets/writings/arcbench/player.css";
import styles from "./arcbench.module.css";

const assets = "/assets/writings/arcbench";
const taskNames = {
  reach: "Obstacle reach", shelf: "Shelf inspection", pickup: "Handle pickup", placement: "Peg placement",
} as const;
const taskGroups = [
  { name: "Supervised path scoring", tasks: ["reach", "shelf"] },
  { name: "Supervised pose estimation", tasks: ["pickup", "placement"] },
] as const;
type Task = keyof typeof taskNames;

const comparisons: Record<Task, readonly [string, string]> = {
  reach: ["Direct reach", "Learned route"],
  shelf: ["Direct reach", "Learned route"],
  pickup: ["Fixed grasp", "Predicted grasp"],
  placement: ["Fixed peg pose", "Predicted peg pose"],
};

function ComparisonFilm({ task }: { task: Task }) {
  const file = assets + "/" + task;
  const video = useRef<HTMLVideoElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const wantsPlay = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const media = video.current;
    if (!media) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    wantsPlay.current = !motion.matches;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && wantsPlay.current)
        void media.play().catch(() => {});
      else media.pause();
    };
    const onMotion = () => {
      if (motion.matches) {
        wantsPlay.current = false;
        media.pause();
      }
    };
    const onFull = () => setFull(document.fullscreenElement === player.current);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(media);
    setCanExpand(
      Boolean(document.fullscreenEnabled && player.current?.requestFullscreen),
    );
    document.addEventListener("fullscreenchange", onFull);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", onMotion);
    return () => {
      observer.disconnect();
      media.pause();
      document.removeEventListener("fullscreenchange", onFull);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  function toggle() {
    const media = video.current;
    if (!media) return;
    wantsPlay.current = media.paused;
    if (!media.paused) media.pause();
    else {
      if (media.ended) media.currentTime = 0;
      void media.play().catch(() => {});
    }
  }

  // Each recorded reach scene is 83 frames at 20 fps, including the end holds.
  const fixture =
    task === "reach"
      ? ["Low fence", "Tall post", "Overhead zone"][
          Math.min(2, Math.floor(time / 4.15))
        ]
      : "";
  const title = taskNames[task] + " comparison";
  return (
    <div className={styles.filmPlayer} ref={player}>
      <div className={styles.filmLabels}>
        {comparisons[task].map((label) => (
          <div key={label}>
            {label}
            {fixture && <span>{fixture}</span>}
          </div>
        ))}
      </div>
      <div className={styles.filmWindow} data-task={task}>
        <video
          className={styles.film}
          ref={video}
          muted
          playsInline
          preload="metadata"
          poster={file + ".webp"}
          aria-label={title}
          onClick={toggle}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            wantsPlay.current = false;
            setPlaying(false);
          }}
          onError={() => setFailed(true)}
        >
          <source
            src={file + ".mp4"}
            type="video/mp4"
            onError={() => setFailed(true)}
          />
        </video>
      </div>
      <div className="so-playerbar">
        <button
          type="button"
          className="so-play"
          aria-label={(playing ? "Pause " : "Play ") + title}
          data-playing={playing}
          disabled={failed}
          onClick={toggle}
        />
        <input
          className="so-seek"
          type="range"
          min={0}
          max={duration || 1}
          step="0.01"
          value={time}
          disabled={!duration || failed}
          aria-label="Video position"
          aria-valuetext={
            time.toFixed(2) + " of " + duration.toFixed(2) + " seconds"
          }
          style={
            {
              "--played": (duration ? (100 * time) / duration : 0) + "%",
            } as CSSProperties
          }
          onChange={(e) => {
            if (video.current) {
              const t = Number(e.target.value);
              video.current.currentTime = t;
              setTime(t);
            }
          }}
        />
        <output>{time.toFixed(2)} s</output>
        <select
          defaultValue="1"
          aria-label="Video speed"
          onChange={(e) => {
            if (video.current)
              video.current.playbackRate = Number(e.target.value);
          }}
        >
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
        </select>
        {canExpand && (
          <button
            className={styles.expand}
            type="button"
            aria-label={full ? "Exit full screen" : "Full screen"}
            onClick={() => {
              const action = full
                ? document.exitFullscreen()
                : player.current?.requestFullscreen();
              void action?.catch(() => {});
            }}
          >
            <svg
              viewBox="0 0 20 20"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d={
                  full
                    ? "M2 7h5V2m11 5h-5V2M2 13h5v5m11-5h-5v5"
                    : "M2 7V2h5m11 5V2h-5M2 13v5h5m11-5v5h-5"
                }
              />
            </svg>
          </button>
        )}
      </div>
      {failed && (
        <p role="status">
          The video couldn’t load.{" "}
          <a href={file + ".mp4"}>Open the comparison film</a>.
        </p>
      )}
    </div>
  );
}

export function Replays() {
  const [task, setTask] = useState<Task>("reach");
  const [orbit, setOrbit] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("task");
    if (requested && Object.prototype.hasOwnProperty.call(taskNames, requested)) {
      setTask(requested as Task);
    } else if (requested) {
      url.searchParams.delete("task");
    }
    if (["#gripper-courses", "#assembly", "#pushing", "#learning", "#surface"].includes(url.hash)) {
      url.hash = "replays";
      document.getElementById("replays")?.scrollIntoView();
    }
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);
  function chooseTask(value: Task) {
    setTask(value);
    const url = new URL(window.location.href);
    url.searchParams.set("task", value);
    window.history.replaceState(window.history.state, "", url);
  }
  return (
    <figure
      className={styles.figure}
      id="replays"
      aria-label="SO-101 path simulator"
    >
      <div className={styles.simulator}>
        <div className={styles.simHeader}>
          <label className={styles.task}>
            <span>Task</span>
            <select value={task} onChange={(e) => chooseTask(e.target.value as Task)}>
              {taskGroups.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.tasks.map((id) => <option key={id} value={id}>{taskNames[id]}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <div
            className={styles.switches}
            role="group"
            aria-label="Simulation view"
          >
            <button
              type="button"
              aria-pressed={orbit}
              onClick={() => setOrbit(true)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 14 5v6L8 14.5 2 11V5L8 1.5ZM2 5l6 3.5L14 5M8 8.5v6" /></svg>
              Explore in 3D
            </button>
            <button
              type="button"
              aria-pressed={!orbit}
              onClick={() => setOrbit(false)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="2"/><path d="m6.5 5.5 4 2.5-4 2.5z" /></svg>
              Video
            </button>
          </div>
        </div>
        <div hidden={!orbit}>
          <iframe
            key={task}
            src={assets + "/replay/viewer.html?task=" + task}
            title={taskNames[task] + " interactive 3D simulator"}
            className={styles.frame}
          />
        </div>
        {!orbit && <ComparisonFilm key={task} task={task} />}
      </div>
    </figure>
  );
}
