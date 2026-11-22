"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./arcbench.module.css";

export type LossSample = {
  update: number;
  training: number;
  validation: number;
};
export function TrainingCurve({ samples }: { samples: LossSample[] }) {
  const last = samples.length - 1;
  const [index, setIndex] = useState(last);
  const [zoomed, setZoomed] = useState(false);
  const [visible, setVisible] = useState(false);
  const plot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    if (plot.current) observer.observe(plot.current);
    return () => observer.disconnect();
  }, []);
  const point = samples[index];
  const xMax = samples[last].update;
  const first = zoomed ? samples.findIndex((row) => row.update >= 500) : 0;
  const xMin = samples[first].update;
  const yMax = zoomed ? 0.1 : 0.75;
  const yTicks = zoomed ? [0, 0.025, 0.05, 0.075, 0.1] : [0, 0.2, 0.4, 0.6];
  const x = (step: number) => (100 * (step - xMin)) / (xMax - xMin) + "%";
  const y = (loss: number) => 100 * (1 - loss / yMax) + "%";
  const valueText = `Update ${point.update}, training ${point.training.toFixed(4)}, validation ${point.validation.toFixed(4)}`;
  return (
    <figure
      className={styles.curve}
      aria-label="Reach classifier training and validation loss"
    >
      <div className={styles.curveStats}>
        <div>
          Update <strong>{point.update.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <i data-series="training" />
          Training <strong>{point.training.toFixed(4)}</strong>
        </div>
        <div>
          <i data-series="validation" />
          Validation <strong>{point.validation.toFixed(4)}</strong>
        </div>
      </div>
      <div className={styles.yTitle}>
        Collision loss (BCE)
        <button
          type="button"
          aria-pressed={zoomed}
          onClick={() => {
            if (!zoomed)
              setIndex(
                Math.max(
                  index,
                  samples.findIndex((row) => row.update >= 500),
                ),
              );
            setZoomed(!zoomed);
          }}
        >
          {zoomed ? "Show full run" : "Zoom to last 500"}
        </button>
      </div>
      <div ref={plot} className={styles.curvePlot} data-visible={visible}>
        {yTicks.map((tick) => (
          <div key={tick} className={styles.yTick} style={{ top: y(tick) }}>
            <span>{tick.toFixed(zoomed ? 3 : 1)}</span>
          </div>
        ))}
        <svg
          viewBox={`${xMin} 0 ${xMax - xMin} 1000`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {(["training", "validation"] as const).map((key) => (
            <polyline
              key={key}
              data-series={key}
              vectorEffect="non-scaling-stroke"
              points={samples
                .slice(first)
                .map((row) => row.update + "," + 1000 * (1 - row[key] / yMax))
                .join(" ")}
            />
          ))}
        </svg>
        <div className={styles.cursor} style={{ left: x(point.update) }} />
        {(["training", "validation"] as const).map((key) => (
          <i
            key={key}
            data-series={key}
            className={styles.curveDot}
            style={{ left: x(point.update), top: y(point[key]) }}
          />
        ))}
        {(zoomed ? [500, 625, 750, 875, 1000] : [0, 250, 500, 750, 1000]).map(
          (step) => (
            <span className={styles.xTick} key={step} style={{ left: x(step) }}>
              {step}
            </span>
          ),
        )}
        <input
          type="range"
          min={first}
          max={last}
          value={index}
          aria-label="Inspect training update"
          aria-valuetext={valueText}
          onChange={(e) => setIndex(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key !== "Home" && e.key !== "End") return;
            e.preventDefault();
            setIndex(e.key === "Home" ? first : last);
          }}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse" || (!e.movementX && !e.movementY)) return;
            const box = e.currentTarget.getBoundingClientRect();
            setIndex(
              Math.max(
                first,
                Math.min(
                  last,
                  first +
                    Math.round(
                      ((last - first) * (e.clientX - box.left)) / box.width,
                    ),
                ),
              ),
            );
          }}
        />
      </div>
      <div className={styles.xTitle}>Optimizer update</div>
    </figure>
  );
}
