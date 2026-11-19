export type ChartModel = {
  id: string;
  name: string;
  parameters_m: number;
  utmos: number | null;
  wer: number | null;
  local: boolean;
  runtime: string;
  approximate?: boolean;
  n?: number;
  per_prompt?: {utmos?: string | number | null; wer?: string | number | null}[];
};
export type ChartOptions = {metric: "utmos" | "wer"; smallOnly: boolean; spread: boolean};
export function mountBenchmarkChart(host: HTMLElement, models: ChartModel[]): {
  update(options: ChartOptions): void;
  destroy(): void;
};
