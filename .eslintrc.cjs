module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  },
  overrides: [
    {
      files: ['src/lib/scoring.ts'],
      rules: {
        'no-eval': 'error',
      },
    },
  ]
};
