module.exports = {
  'functions/src/**/*.{js,ts}': ['npm --prefix functions run lint'],
  '*.{js,jsx,ts,tsx,mjs,cjs}': [
    'pnpm exec eslint --max-warnings=0 --no-warn-ignored --ignore-pattern functions/**',
  ],
};
