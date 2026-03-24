import $ from 'jquery';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'subte_theme';

function getPreferredTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  $('#themeToggle').text(theme === 'dark' ? '\u2600' : '\u263D');
}

export const ThemeToggle = {
  init(): void {
    applyTheme(getPreferredTheme());

    $('#themeToggle').on('click', () => {
      const current = document.documentElement.getAttribute('data-theme') as Theme;
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  },
};
