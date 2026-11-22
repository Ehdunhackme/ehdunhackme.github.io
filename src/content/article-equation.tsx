import { renderToString } from "katex";
import "katex/dist/katex.min.css";
import styles from "./smollertts.module.css";

export function Equation({latex, label}: {latex: string; label: string}) {
  return <div className={styles.equation} role="group" aria-label={label} dangerouslySetInnerHTML={{__html: renderToString(latex, {displayMode: true, throwOnError: true, trust: false, output: 'htmlAndMathml'})}} />;
}
