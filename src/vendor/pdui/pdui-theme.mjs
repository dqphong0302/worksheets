/**
 * PhongDang UI — ESM theme adapter for framework apps (React/Vite).
 *
 * The canonical implementation stays in `pdui.js` (`window.PDUI.Theme`); this
 * module only adds a subscribe/getSnapshot pair so a component tree can render
 * from the same state instead of keeping its own copy. Import `pdui.js` for its
 * side effect before using this.
 */
const noop = () => {};

/** Subscribe to theme changes. Returns an unsubscribe function. */
export function subscribe(onChange) {
  if (typeof document === 'undefined') return noop;
  document.addEventListener('pdui:themechange', onChange);
  return () => document.removeEventListener('pdui:themechange', onChange);
}

/** Current theme: 'dark' | 'light'. Safe during SSR/prerender. */
export function getTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function setTheme(theme) {
  window.PDUI?.Theme?.set(theme);
}

export function toggleTheme() {
  window.PDUI?.Theme?.toggle();
}

/** Toast passthrough so apps never roll their own. */
export function toast(message, type = 'success', duration) {
  window.PDUI?.Toast?.show(message, type, duration);
}
