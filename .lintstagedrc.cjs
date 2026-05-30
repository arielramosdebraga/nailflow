module.exports = {
  'functions/src/**/*.{js,ts}': ['npm --prefix functions run lint'],
  '*.{js,jsx,ts,tsx,mjs,cjs}': ['pnpm exec expo lint --max-warnings=0 --ignore-pattern functions/**'],
};
