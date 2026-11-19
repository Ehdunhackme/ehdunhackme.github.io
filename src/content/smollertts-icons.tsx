import {ARROW_PATHS, type ArrowDirection} from '../../public/projects/smollertts/arrows.mjs';
import styles from './smollertts.module.css';

export function ArrowIcon({direction='external'}: {direction?: ArrowDirection}) {
  return <svg className={styles.linkArrow} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={ARROW_PATHS[direction]} /></svg>;
}
