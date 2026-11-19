"use client";

import { useEffect, useId, useRef } from "react";
import { mountBenchmarkChart, type ChartModel, type ChartOptions } from "../../public/projects/smollertts/benchmark-renderer.mjs";
import "../../public/projects/smollertts/benchmark-embed.css";
import styles from "./smollertts.module.css";

export function BenchmarkChart({models, metric, smallOnly, spread}: ChartOptions & {models: ChartModel[]}) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<ReturnType<typeof mountBenchmarkChart> | null>(null);
  const tooltipId = useId();
  useEffect(() => {
    if (!host.current) return;
    const instance = mountBenchmarkChart(host.current, models);
    renderer.current = instance;
    return () => {instance.destroy(); renderer.current = null;};
  }, [models]);
  useEffect(() => {renderer.current?.update({metric, smallOnly, spread});}, [models, metric, smallOnly, spread]);
  return <div data-benchmark-chart ref={host}>
    <div className="chart-metric" data-chart-metric>{metric === 'utmos' ? 'UTMOS' : 'WER'}</div>
    <div className="chart" data-chart role="group" aria-label={`Interactive chart of ${metric === 'utmos' ? 'UTMOS' : 'WER'} against reported model parameter count`}>
      <svg data-chart-grid aria-hidden="true" />
      <div data-chart-points />
      <div data-chart-labels aria-hidden="true" />
      <div data-chart-tooltip id={tooltipId} role="tooltip" hidden />
    </div>
    <div className="chart-axis">Parameters <span>· log scale</span></div>
    <div data-chart-selection className={styles.srOnly} role="status" aria-live="polite" />
  </div>;
}
